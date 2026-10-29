package br.com.urbanoconnect.api.domain.dto.iptu;

import br.com.urbanoconnect.api.domain.model.CadastroIptu;

import java.math.BigDecimal;

/**
 * Ficha consolidada de um imóvel no cadastro municipal (IPTU + BCI).
 * Consumida pelo frontend quando o corretor informa a inscrição imobiliária
 * durante o cadastro do anúncio, para auto-preencher os campos técnicos.
 *
 * <p>Campos vindos do BCI podem estar nulos se a inscrição só existia no
 * IPTU 2014 (isso acontece com ~150 imóveis); campos vindos do IPTU podem
 * estar nulos se a inscrição só apareceu no BCI. O front deve tratar
 * qualquer combinação de nulos.</p>
 */
public record FichaImovel(
        String inscricao,
        String bairro,
        String endereco,

        // ── Financeiro (IPTU 2014) ──
        BigDecimal valorVenal,
        BigDecimal imposto,
        Double aliquota,
        Integer exercicio,
        Double valorM2Terreno,
        Double valorTerreno,
        Double valorEdificacao,

        // ── Medidas oficiais ──
        Double areaTerreno,
        Double areaConstruida,
        Double testada,
        Integer numeroPavimentos,

        // ── Ficha construtiva (BCI) ──
        String caracterizacao,
        String tipoConstrucao,
        String estadoConservacao,
        String cobertura,
        String revestimento,
        String piso,
        String forro,
        String posicao,
        String instalacaoSanitaria,
        String instalacaoEletrica,

        // ── Terreno (BCI) ──
        String situacaoTerreno,
        String topografia,
        String pedologia,

        // ── Infraestrutura disponível na rua (BCI) ──
        Boolean temEsgoto,
        Boolean temAgua,
        Boolean temIluminacaoPublica,
        Boolean temCalcamento,
        Boolean temGaleriaPluvial,
        Boolean temColetaLixo,
        Boolean temLimpezaUrbana,
        Boolean temRedeTelefonica,
        Boolean temGuiasSarjetas,

        // ── Serviços e amenidades na unidade (BCI) ──
        Boolean esgotoNaUnidade,
        Boolean aguaNaUnidade,
        Boolean pocoNaUnidade,
        Boolean fossaNaUnidade,
        Boolean temPiscina,
        Boolean temSauna,

        // ── Metadados ──
        String fonte
) {
    public static FichaImovel de(CadastroIptu c) {
        return new FichaImovel(
                c.getInscricao(),
                c.getBairro(),
                c.getEndereco(),

                c.getValorVenal(),
                c.getImposto(),
                c.getAliquota(),
                c.getExercicio(),
                c.getValorM2Terreno(),
                c.getValorTerreno(),
                c.getValorEdificacao(),

                c.getAreaTerreno(),
                c.getAreaConstruida(),
                c.getTestada(),
                c.getNumeroPavimentos(),

                c.getCaracterizacao(),
                c.getTipoConstrucao(),
                c.getEstadoConservacao(),
                c.getCobertura(),
                c.getRevestimento(),
                c.getPiso(),
                c.getForro(),
                c.getPosicao(),
                c.getInstalacaoSanitaria(),
                c.getInstalacaoEletrica(),

                c.getSituacaoTerreno(),
                c.getTopografia(),
                c.getPedologia(),

                c.getTemEsgoto(),
                c.getTemAgua(),
                c.getTemIluminacaoPublica(),
                c.getTemCalcamento(),
                c.getTemGaleriaPluvial(),
                c.getTemColetaLixo(),
                c.getTemLimpezaUrbana(),
                c.getTemRedeTelefonica(),
                c.getTemGuiasSarjetas(),

                c.getEsgotoNaUnidade(),
                c.getAguaNaUnidade(),
                c.getPocoNaUnidade(),
                c.getFossaNaUnidade(),
                c.getTemPiscina(),
                c.getTemSauna(),

                c.getFonte()
        );
    }
}
