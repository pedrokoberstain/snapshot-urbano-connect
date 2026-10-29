package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.AcessoCondominio;
import br.com.urbanoconnect.api.domain.repository.AcessoCondominioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Rede de segurança da exclusão do comprovante de residência.
 *
 * O caminho normal apaga o arquivo no instante da análise. Mas o unlink pode
 * falhar — disco cheio, permissão, queda entre gravar o registro e apagar o
 * arquivo — e o efeito de uma falha silenciosa aqui é justamente o que a
 * política quer evitar: documento pessoal guardado além da finalidade.
 *
 * Esta varredura roda de madrugada e recolhe o que escapou. Em operação normal
 * não encontra nada, e é esse o resultado esperado.
 */
@Service
public class FaxinaComprovantesService {

    private static final Logger log = LoggerFactory.getLogger(FaxinaComprovantesService.class);

    @Autowired
    private AcessoCondominioRepository acessoRepository;

    @Autowired
    private DocumentoPrivadoService comprovanteService;

    @Scheduled(cron = "0 15 3 * * *", zone = "America/Sao_Paulo")
    @Transactional
    public void recolherComprovantesOrfaos() {
        List<AcessoCondominio> orfaos = acessoRepository.comprovantesPendentesDeExclusao();
        if (orfaos.isEmpty()) return;

        log.warn("Faxina de comprovantes: {} arquivo(s) sobreviveram à análise e serão apagados agora. "
                + "Isso indica que a exclusão no momento da análise falhou — vale investigar o disco.",
                orfaos.size());

        for (AcessoCondominio a : orfaos) {
            comprovanteService.apagar(a.getComprovanteArquivo());
            a.setComprovanteArquivo(null);
            if (a.getComprovanteRemovidoEm() == null) {
                a.setComprovanteRemovidoEm(LocalDateTime.now());
            }
            acessoRepository.save(a);
        }
    }
}
