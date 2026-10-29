package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.repository.ImovelRepository;
import br.com.urbanoconnect.api.domain.dto.estatistica.DadosEstatisticasMercado;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class EstatisticaService {

    @Autowired
    private ImovelRepository repository;

    public DadosEstatisticasMercado obterEstatisticasPorCidade(String cidade) {

        // 1. Dispara as queries no banco de dados
        BigDecimal mediaUrbano = repository.calcularPrecoMedioUrbanoPorCidade(cidade);
        BigDecimal mediaRural = repository.calcularPrecoMedioRuralPorCidade(cidade);

        // 2. Tratamento de segurança: se a cidade não tiver imóveis, o banco retorna null
        if (mediaUrbano == null) {
            mediaUrbano = BigDecimal.ZERO;
        } else {
            mediaUrbano = mediaUrbano.setScale(2, RoundingMode.HALF_UP); // Arredonda para 2 casas decimais
        }

        if (mediaRural == null) {
            mediaRural = BigDecimal.ZERO;
        } else {
            mediaRural = mediaRural.setScale(2, RoundingMode.HALF_UP);
        }

        // 3. Variação estática temporária (até termos dados históricos no BD)
        Double variacaoUrbano = mediaUrbano.compareTo(BigDecimal.ZERO) > 0 ? 12.0 : 0.0;
        Double variacaoRural = mediaRural.compareTo(BigDecimal.ZERO) > 0 ? 8.5 : 0.0;

        // 4. Inteligência simples: define o texto de demanda baseado em qual lado é mais forte na cidade
        String imovelMaisBuscado = "Casas e Apartamentos";
        if (mediaRural.compareTo(mediaUrbano) > 0) {
            imovelMaisBuscado = "Fazendas com Dupla Aptidão";
        }

        // 5. Devolve a caixinha (Record) montada pro Front-end!
        return new DadosEstatisticasMercado(
                cidade,
                mediaUrbano,
                variacaoUrbano,
                mediaRural,
                variacaoRural,
                imovelMaisBuscado
        );
    }
}