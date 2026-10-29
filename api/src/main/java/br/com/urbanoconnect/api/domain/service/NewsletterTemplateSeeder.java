package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.TemplateNewsletter;
import br.com.urbanoconnect.api.domain.repository.TemplateNewsletterRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class NewsletterTemplateSeeder {

    @Autowired
    private TemplateNewsletterRepository repository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        // Always replace padrao templates so content stays up to date
        repository.deleteAllByPadraoTrue();

        repository.saveAll(List.of(
            criarTemplate(
                "Nova Notícia / Artigo",
                "📰 Nova publicação: [TÍTULO]",
                """
                <h2>📰 Nova publicação no portal</h2>
                <p>Acabamos de publicar um novo conteúdo sobre o mercado imobiliário e agronegócio de Mato Grosso.</p>
                <h3>[TÍTULO DA NOTÍCIA]</h3>
                <p>[COLE AQUI O RESUMO DA NOTÍCIA]</p>
                """
            ),
            criarTemplate(
                "Promoção — Plano PRO",
                "🚀 Condição especial: Plano PRO com desconto",
                """
                <h2>🚀 Eleve sua análise de mercado com o Plano PRO</h2>
                <p>Aproveite nossa condição especial e tenha acesso a todas as ferramentas da plataforma.</p>
                <h3>O que você ganha com o PRO:</h3>
                <ul>
                  <li>Acesso a todos os leads e contatos dos seus imóveis</li>
                  <li>Motor de precificação hedônica por IA</li>
                  <li>Análises exclusivas de mercado por cidade</li>
                  <li>Suporte prioritário</li>
                </ul>
                <p><strong>Plano Mensal: R$ 29,90/mês &nbsp;|&nbsp; Plano Anual: R$ 299,00/ano</strong></p>
                """
            ),
            criarTemplate(
                "Resumo Semanal de Mercado",
                "📊 Análise semanal: mercado de MT — Semana [N]",
                """
                <h2>📊 Análise semanal — Semana [N]</h2>
                <p>Confira os principais movimentos do mercado imobiliário e do agronegócio em Mato Grosso nesta semana.</p>
                <h3>🏘️ Mercado Urbano</h3>
                <p>[COLE AQUI O RESUMO DO MERCADO URBANO]</p>
                <h3>🌾 Agronegócio e Fazendas</h3>
                <p>[COLE AQUI O RESUMO DO AGRONEGÓCIO]</p>
                <h3>📈 Destaques da semana</h3>
                <ul>
                  <li>[DESTAQUE 1]</li>
                  <li>[DESTAQUE 2]</li>
                  <li>[DESTAQUE 3]</li>
                </ul>
                """
            ),
            criarTemplate(
                "Comunicado Geral",
                "📢 Comunicado da Urbano Connect",
                """
                <h2>📢 [TÍTULO DO COMUNICADO]</h2>
                <p>[PARÁGRAFO DE INTRODUÇÃO — descreva brevemente o assunto]</p>
                <p>[CORPO PRINCIPAL — detalhe o comunicado]</p>
                <p>[ENCERRAMENTO / CHAMADA PARA AÇÃO]</p>
                """
            )
        ));
    }

    private TemplateNewsletter criarTemplate(String nome, String assunto, String conteudo) {
        TemplateNewsletter t = new TemplateNewsletter();
        t.setNome(nome);
        t.setAssunto(assunto);
        t.setConteudo(conteudo.strip());
        t.setPadrao(true);
        return t;
    }
}
