package br.com.urbanoconnect.api.config;

import br.com.urbanoconnect.api.domain.service.DocumentoPrivadoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * ══════════════════════════════════════════════════════════════
 *  TRADUÇÃO DOS ERROS DE ENTRADA
 * ══════════════════════════════════════════════════════════════
 *
 *  Produção mascara o corpo de erro por segurança, e com razão: sem isso um
 *  400 devolvia stack trace e estrutura interna de pacotes. O efeito colateral
 *  era que "CNPJ inválido" chegava ao front como um 400 mudo, sem nada para
 *  mostrar ao usuário — em todos os formulários do sistema.
 *
 *  Aqui devolvemos apenas as mensagens que nós mesmos escrevemos nas
 *  anotações de validação, campo a campo. Nada de {@code e.getMessage()} do
 *  Jackson ou do Spring, que citam nomes de classe e caminho de pacote e
 *  entregariam de graça o desenho interno da API.
 *
 *  Formato mantido igual ao que os controllers já devolvem à mão:
 *  <pre>
 *  { "erro": "...", "campos": { "cnpj": "CNPJ inválido." } }
 *  </pre>
 *
 *  Só trata erro de entrada. Exceção inesperada continua caindo no tratamento
 *  padrão do Spring, que responde 500 sem detalhe — não existe captura
 *  genérica de {@code Exception} aqui, de propósito: ela transformaria bug em
 *  400 silencioso e esconderia falha real do log.
 */
@RestControllerAdvice
public class TratadorDeErros {

    private static final Logger log = LoggerFactory.getLogger(TratadorDeErros.class);

    /** Falha nas anotações de validação (@NotBlank, @CNPJ, @AssertTrue...). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> tratarValidacao(MethodArgumentNotValidException e) {
        Map<String, String> campos = new LinkedHashMap<>();

        for (FieldError fe : e.getBindingResult().getFieldErrors()) {
            // Primeira mensagem por campo: repetir a mesma chave só polui a tela.
            campos.putIfAbsent(fe.getField(), fe.getDefaultMessage());
        }
        // Regras que valem para o objeto inteiro, não para um campo específico.
        e.getBindingResult().getGlobalErrors()
                .forEach(ge -> campos.putIfAbsent(ge.getObjectName(), ge.getDefaultMessage()));

        return ResponseEntity.badRequest().body(Map.of(
                "erro", campos.size() == 1
                        ? campos.values().iterator().next()
                        : "Alguns campos precisam de correção.",
                "campos", campos));
    }

    /** Parâmetro obrigatório ausente num formulário (multipart ou query string). */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<?> tratarParametroAusente(MissingServletRequestParameterException e) {
        return ResponseEntity.badRequest().body(Map.of(
                "erro", "O campo \"" + e.getParameterName() + "\" é obrigatório.",
                "campos", Map.of(e.getParameterName(), "Campo obrigatório.")));
    }

    /** Arquivo obrigatório ausente — ex.: solicitar vínculo sem anexar o comprovante. */
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<?> tratarArquivoAusente(MissingServletRequestPartException e) {
        return ResponseEntity.badRequest().body(Map.of(
                "erro", "Anexe o arquivo em \"" + e.getRequestPartName() + "\".",
                "campos", Map.of(e.getRequestPartName(), "Arquivo obrigatório.")));
    }

    /**
     * Valor que não converte para o tipo esperado — tipicamente um enum errado
     * (vinculo=CASEIRO) ou id não numérico.
     *
     * Listamos as opções válidas quando o alvo é enum: é informação que o front
     * já conhece e poupa o usuário de adivinhar. Para os demais tipos ficamos
     * no genérico, sem citar a classe esperada.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<?> tratarTipoInvalido(MethodArgumentTypeMismatchException e) {
        String campo = e.getName();
        Class<?> tipo = e.getRequiredType();
        String detalhe = "Valor inválido.";

        if (tipo != null && tipo.isEnum()) {
            StringBuilder opcoes = new StringBuilder();
            for (Object constante : tipo.getEnumConstants()) {
                if (opcoes.length() > 0) opcoes.append(", ");
                opcoes.append(constante);
            }
            detalhe = "Valor inválido. Use um destes: " + opcoes + ".";
        }

        return ResponseEntity.badRequest().body(Map.of(
                "erro", "O campo \"" + campo + "\" recebeu um valor inválido.",
                "campos", Map.of(campo, detalhe)));
    }

    /**
     * JSON malformado ou incompatível. A mensagem do Jackson traz pacote e
     * nome de classe, então fica no log e não na resposta.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<?> tratarCorpoIlegivel(HttpMessageNotReadableException e) {
        log.debug("Corpo de requisição ilegível: {}", e.getMessage());
        return ResponseEntity.badRequest().body(Map.of(
                "erro", "O conteúdo enviado não pôde ser lido. "
                        + "Confira se o formulário foi preenchido corretamente."));
    }

    /** Estoura o limite do multipart antes mesmo de chegar ao controller. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<?> tratarArquivoGrande(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(Map.of(
                "erro", "O arquivo enviado é grande demais."));
    }

    /** Recusa do comprovante de residência — mensagem nossa, segura de exibir. */
    @ExceptionHandler(DocumentoPrivadoService.DocumentoInvalidoException.class)
    public ResponseEntity<?> tratarComprovanteInvalido(
            DocumentoPrivadoService.DocumentoInvalidoException e) {
        return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
    }
}
