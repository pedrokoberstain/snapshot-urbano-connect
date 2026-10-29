package br.com.urbanoconnect.api.domain.repository;

import br.com.urbanoconnect.api.domain.model.Imovel;
import br.com.urbanoconnect.api.domain.model.TipoImovel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImovelRepository extends JpaRepository<Imovel, Long> {

    // Busca exata pelo tipo (URBANO ou RURAL)
    List<Imovel> findByTipo(TipoImovel tipo);

    // Busca pela cidade (o 'Containing' acha partes da palavra e o 'IgnoreCase' ignora maiúsculas/minúsculas)
    List<Imovel> findByCidadeContainingIgnoreCase(String cidade);

    // 1. Calcula a média do m² URBANO na cidade solicitada (AGORA MAIS INTELIGENTE)
    @Query("SELECT AVG(i.preco / i.areaTotal) FROM Imovel i WHERE i.cidade = :cidade AND i.tipo IN ('CASA', 'APARTAMENTO', 'TERRENO', 'COMERCIAL', 'URBANO') AND i.ativo = true AND i.areaTotal > 0")
    java.math.BigDecimal calcularPrecoMedioUrbanoPorCidade(@org.springframework.data.repository.query.Param("cidade") String cidade);

    // 2. Calcula a média do hectare RURAL na cidade solicitada
    @Query("SELECT AVG(i.preco / i.areaTotal) FROM Imovel i WHERE i.cidade = :cidade AND i.tipo = 'RURAL' AND i.ativo = true AND i.areaTotal > 0")
    java.math.BigDecimal calcularPrecoMedioRuralPorCidade(@org.springframework.data.repository.query.Param("cidade") String cidade);

    // 3. Conta quantos imóveis ativos tem numa cidade para saber a demanda base
    @Query("SELECT COUNT(i) FROM Imovel i WHERE i.cidade = :cidade AND i.ativo = true")
    Long contarImoveisAtivosPorCidade(@org.springframework.data.repository.query.Param("cidade") String cidade);

    List<Imovel> findByVendidoTrueOrderByDataVendaDesc();

    long countByVendidoTrue();

    long countByAtivoTrue();

}