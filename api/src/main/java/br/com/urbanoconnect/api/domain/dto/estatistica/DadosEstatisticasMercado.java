package br.com.urbanoconnect.api.domain.dto.estatistica;

import java.math.BigDecimal;

public record DadosEstatisticasMercado(
        String cidade,
        BigDecimal precoMedioUrbano,
        Double variacaoUrbano,
        BigDecimal precoMedioRural,
        Double variacaoRural,
        String imovelMaisBuscado
) {
}