package br.com.urbanoconnect.api.domain.dto.imovel;

import java.math.BigDecimal;

/**
 * Resultado retornado pelo Motor de Precificação Hedônica.
 */
public record ResultadoPrecificacao(

        /** Preço estimado pelo modelo hedônico (R$). */
        BigDecimal precoEstimado,

        /** Preço cadastrado pelo corretor (R$). */
        BigDecimal precoCadastrado,

        /**
         * Score de oportunidade: precoCadastrado / precoEstimado.
         * < 0.90  → 🔥 Oportunidade clara (abaixo do mercado)
         * 0.90–1.10 → ✅ Preço justo de mercado
         * > 1.10  → ⚠️ Acima do mercado
         */
        Double scoreOportunidade,

        /** Classificação textual do score. */
        String classificacao,

        /** Padrão de acabamento calculado (0 a 3). */
        Integer padraoAcabamento,

        /** Índice de sprawl calculado (0.0 a 3.0). */
        Double sprawl,

        /** Faixa de confiança inferior (–8%). */
        BigDecimal faixaMinima,

        /** Faixa de confiança superior (+8%). */
        BigDecimal faixaMaxima,

        /** Descrição do padrão de acabamento. */
        String descricaoPadrao,

        /** Descrição do sprawl. */
        String descricaoSprawl
) {}