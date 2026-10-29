package br.com.urbanoconnect.api.domain.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * ══════════════════════════════════════════════════════════════
 *  DOCUMENTO PRIVADO — guarda, entrega e destrói
 * ══════════════════════════════════════════════════════════════
 *
 *  Guarda os documentos que a plataforma pede como prova e depois descarta:
 *  conta de luz do morador, carteira do CREA ou do CAU do profissional.
 *
 *  Todos carregam nome e dados pessoais, e por isso nenhum vai para o
 *  Cloudinary do projeto: o upload de lá é não-assinado e produz URL pública e
 *  permanente — quem descobre o link lê o documento para sempre, sem
 *  autenticação.
 *
 *  Aqui o arquivo fica num diretório fora da aplicação web (volume do Docker),
 *  com nome aleatório, e só sai por endpoint autenticado. É apagado assim que
 *  a análise termina: o dado existe pelo tempo da finalidade e não mais.
 */
@Service
public class DocumentoPrivadoService {

    private static final Logger log = LoggerFactory.getLogger(DocumentoPrivadoService.class);

    /** 10 MB. Foto de documento não passa disso; o limite global de 80 MB é para as planilhas do IPTU. */
    public static final long TAMANHO_MAXIMO = 10L * 1024 * 1024;

    /** Nome gerado por nós: UUID + extensão. Serve de guarda contra path traversal na leitura. */
    private static final Pattern NOME_INTERNO = Pattern.compile("^[a-f0-9\\-]{36}\\.(jpg|png|pdf)$");

    @Value("${uc.documentos.diretorio:./uploads/documentos}")
    private String diretorioConfigurado;

    private Path base;

    @PostConstruct
    void prepararDiretorio() throws IOException {
        base = Paths.get(diretorioConfigurado).toAbsolutePath().normalize();
        Files.createDirectories(base);
        log.info("Comprovantes de residência em: {}", base);
    }

    /**
     * Grava o arquivo e devolve o nome interno gerado.
     *
     * O tipo é decidido pelos bytes iniciais, não pelo Content-Type nem pela
     * extensão — os dois vêm do cliente e mentem. SVG fica de fora de
     * propósito: é XML, aceita script embutido, e um comprovante "aprovado"
     * servido ao admin viraria XSS armazenado.
     */
    public String guardar(MultipartFile arquivo) throws IOException {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new DocumentoInvalidoException("Envie o comprovante de residência.");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO) {
            throw new DocumentoInvalidoException("O comprovante deve ter no máximo 10 MB.");
        }

        byte[] conteudo = arquivo.getBytes();
        String extensao = detectarPorAssinatura(conteudo);
        if (extensao == null) {
            throw new DocumentoInvalidoException(
                    "Formato não aceito. Envie o documento em JPG, PNG ou PDF.");
        }

        String nomeInterno = UUID.randomUUID() + "." + extensao;
        Path destino = resolverDentroDaBase(nomeInterno);
        Files.write(destino, conteudo, StandardOpenOption.CREATE_NEW);
        return nomeInterno;
    }

    public byte[] ler(String nomeInterno) throws IOException {
        return Files.readAllBytes(resolverDentroDaBase(nomeInterno));
    }

    /**
     * Apaga o arquivo. Não propaga falha: a análise do acesso não pode ser
     * revertida porque o disco recusou o unlink — a varredura periódica
     * ({@code comprovantesPendentesDeExclusao}) recolhe o que sobrar.
     */
    public boolean apagar(String nomeInterno) {
        if (nomeInterno == null) return false;
        try {
            return Files.deleteIfExists(resolverDentroDaBase(nomeInterno));
        } catch (Exception e) {
            log.warn("Falha ao apagar comprovante {}: {}", nomeInterno, e.getMessage());
            return false;
        }
    }

    public String contentType(String nomeInterno) {
        if (nomeInterno == null) return "application/octet-stream";
        if (nomeInterno.endsWith(".pdf")) return "application/pdf";
        if (nomeInterno.endsWith(".png")) return "image/png";
        return "image/jpeg";
    }

    // ── Internos ────────────────────────────────────────────

    /**
     * Só aceita nome no formato que nós geramos e confere que o caminho
     * resolvido continua dentro do diretório base — duas barreiras contra
     * "../../etc/passwd" caso um nome vindo do banco algum dia não seja nosso.
     */
    private Path resolverDentroDaBase(String nomeInterno) {
        if (nomeInterno == null || !NOME_INTERNO.matcher(nomeInterno).matches()) {
            throw new DocumentoInvalidoException("Referência de comprovante inválida.");
        }
        Path destino = base.resolve(nomeInterno).normalize();
        if (!destino.startsWith(base)) {
            throw new DocumentoInvalidoException("Referência de comprovante inválida.");
        }
        return destino;
    }

    /** JPEG, PNG e PDF pelos bytes mágicos. Devolve a extensão ou null. */
    private String detectarPorAssinatura(byte[] b) {
        if (b.length < 8) return null;

        if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
        if (Arrays.equals(Arrays.copyOfRange(b, 0, 8), png)) {
            return "png";
        }
        if (b[0] == '%' && b[1] == 'P' && b[2] == 'D' && b[3] == 'F' && b[4] == '-') {
            return "pdf";
        }
        return null;
    }

    /** Sanitiza o nome original só para exibição na fila de análise. */
    public static String nomeParaExibicao(String nomeOriginal) {
        if (nomeOriginal == null || nomeOriginal.isBlank()) return "comprovante";
        String limpo = Paths.get(nomeOriginal).getFileName().toString()
                .replaceAll("[^A-Za-z0-9._\\- ]", "_")
                .toLowerCase(Locale.ROOT);
        return limpo.length() > 80 ? limpo.substring(0, 80) : limpo;
    }

    /** Recusa do upload — o controller traduz em 400. */
    public static class DocumentoInvalidoException extends RuntimeException {
        public DocumentoInvalidoException(String msg) { super(msg); }
    }
}
