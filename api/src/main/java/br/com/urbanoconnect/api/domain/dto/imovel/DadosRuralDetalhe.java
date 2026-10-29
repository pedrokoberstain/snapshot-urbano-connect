package br.com.urbanoconnect.api.domain.dto.imovel;

import br.com.urbanoconnect.api.domain.model.ImovelRuralDados;
import java.math.BigDecimal;

public record DadosRuralDetalhe(
        String tipoSolo,
        BigDecimal percentualArgila,
        BigDecimal fertilidadeSolo,
        BigDecimal nivelNutrientes,
        BigDecimal necessidadeCorrecaoSolo,
        BigDecimal areaUtil,
        BigDecimal areaReservaLegal,
        BigDecimal areaApp,
        BigDecimal areaDegradada,
        String usoAtual,
        String usoPotencial,
        String coberturaVegetal,
        Integer estadoConservacao,
        BigDecimal produtividadeSoja,
        BigDecimal produtividadeMilho,
        BigDecimal produtividadePastagem,
        Integer aptidaoAgricola,
        Integer aptidaoPecuaria,
        Boolean disponibilidadeAgua,
        String tipoFonteAgua,
        BigDecimal volumeAgua,
        Boolean perenidadeAgua,
        Boolean irrigacao,
        BigDecimal distanciaRodovia,
        BigDecimal distanciaPorto,
        BigDecimal distanciaCentroConsumidor,
        Integer qualidadeAcesso,
        Boolean sede,
        Boolean energiaEletrica,
        Boolean mecanizacaoViavel,
        Boolean casaFuncionarios,
        Boolean curral,
        Boolean galpao,
        Boolean matriculaRegular,
        Boolean georreferenciamento,
        Boolean car,
        Boolean ccir,
        Boolean itrRegular,
        Boolean existenciaOnus
) {
    // Converte a entidade para o DTO automaticamente
    public static DadosRuralDetalhe from(ImovelRuralDados d) {
        if (d == null) return null;
        return new DadosRuralDetalhe(
                d.getTipoSolo(), d.getPercentualArgila(), d.getFertilidadeSolo(),
                d.getNivelNutrientes(), d.getNecessidadeCorrecaoSolo(),
                d.getAreaUtil(), d.getAreaReservaLegal(), d.getAreaApp(), d.getAreaDegradada(),
                d.getUsoAtual(), d.getUsoPotencial(), d.getCoberturaVegetal(), d.getEstadoConservacao(),
                d.getProdutividadeSoja(), d.getProdutividadeMilho(), d.getProdutividadePastagem(),
                d.getAptidaoAgricola(), d.getAptidaoPecuaria(),
                d.getDisponibilidadeAgua(), d.getTipoffonteAgua(), d.getVolumeAgua(),
                d.getPerenidadeAgua(), d.getIrrigacao(),
                d.getDistanciaRodovia(), d.getDistanciaPorto(), d.getDistanciaCentroConsumidor(),
                d.getQualidadeAcesso(),
                d.getSede(), d.getEnergiaEletrica(), d.getMecanizacaoViavel(),
                d.getCasaFuncionarios(), d.getCurral(), d.getGalpao(),
                d.getMatriculaRegular(), d.getGeorreferenciamento(),
                d.getCar(), d.getCcir(), d.getItrRegular(), d.getExistenciaOnus()
        );
    }
}