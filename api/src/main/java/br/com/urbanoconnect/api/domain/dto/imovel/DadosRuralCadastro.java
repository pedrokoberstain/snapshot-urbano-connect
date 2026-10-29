package br.com.urbanoconnect.api.domain.dto.imovel;

import java.math.BigDecimal;

public record DadosRuralCadastro(

        // Solo
        String tipoSolo,
        BigDecimal percentualArgila,
        BigDecimal fertilidadeSolo,
        BigDecimal nivelNutrientes,
        BigDecimal necessidadeCorrecaoSolo,

        // Uso da terra
        BigDecimal areaUtil,
        BigDecimal areaReservaLegal,
        BigDecimal areaApp,
        BigDecimal areaDegradada,
        String usoAtual,
        String usoPotencial,
        String coberturaVegetal,
        Integer estadoConservacao,

        // Produtividade
        BigDecimal produtividadeSoja,
        BigDecimal produtividadeMilho,
        BigDecimal produtividadePastagem,
        Integer aptidaoAgricola,
        Integer aptidaoPecuaria,

        // Água
        Boolean disponibilidadeAgua,
        String tipoFonteAgua,
        BigDecimal volumeAgua,
        Boolean perenidadeAgua,
        Boolean irrigacao,

        // Logística
        BigDecimal distanciaRodovia,
        BigDecimal distanciaPorto,
        BigDecimal distanciaCentroConsumidor,
        Integer qualidadeAcesso,

        // Infraestrutura
        Boolean sede,
        Boolean energiaEletrica,
        Boolean mecanizacaoViavel,
        Boolean casaFuncionarios,
        Boolean curral,
        Boolean galpao,

        // Documentação
        Boolean matriculaRegular,
        Boolean georreferenciamento,
        Boolean car,
        Boolean ccir,
        Boolean itrRegular,
        Boolean existenciaOnus
) {}