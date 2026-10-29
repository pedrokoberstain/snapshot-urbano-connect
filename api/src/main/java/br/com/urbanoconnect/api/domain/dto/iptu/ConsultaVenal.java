package br.com.urbanoconnect.api.domain.dto.iptu;

import java.math.BigDecimal;

/**
 * Resultado da consulta de valor venal para auxiliar o cadastro de um imóvel.
 * {@code fonte} indica o método usado:
 * <ul>
 *   <li>{@code INSCRICAO} — valor venal exato registrado para a inscrição;</li>
 *   <li>{@code BAIRRO_MEDIA} — média simples do venal do bairro (sem áreas);</li>
 *   <li>{@code PGV_INSCRICAO} — estimativa por PGV usando o R$/m² de terreno da própria inscrição;</li>
 *   <li>{@code PGV_BAIRRO} — estimativa por PGV usando o R$/m² de terreno médio do bairro.</li>
 * </ul>
 * Os campos de detalhamento ({@code valorM2Terreno}, {@code valorTerreno}, {@code valorConstrucao})
 * são preenchidos apenas nas estimativas por PGV; nos demais casos vêm nulos.
 */
public record ConsultaVenal(
        boolean encontrado,
        BigDecimal valorVenal,
        String fonte,
        String bairro,
        int amostras,
        String mensagem,
        // ── Detalhamento PGV (pode ser null) ──
        Double valorM2Terreno,
        BigDecimal valorTerreno,
        BigDecimal valorConstrucao
) {
    /** Atalho para as respostas sem detalhamento (consulta simples por inscrição/bairro). */
    public ConsultaVenal(boolean encontrado, BigDecimal valorVenal, String fonte,
                         String bairro, int amostras, String mensagem) {
        this(encontrado, valorVenal, fonte, bairro, amostras, mensagem, null, null, null);
    }
}
