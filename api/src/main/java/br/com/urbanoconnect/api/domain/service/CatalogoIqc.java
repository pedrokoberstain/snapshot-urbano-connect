package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.VariavelIqc;

import java.util.List;

import static br.com.urbanoconnect.api.domain.model.DimensaoIqc.*;
import static br.com.urbanoconnect.api.domain.model.VariavelIqc.*;

/**
 * Catálogo completo de variáveis do IQC usado pelo motor de cálculo e exposto
 * ao front via GET /iqc/catalogo. Cobre as 8 dimensões da metodologia v1.0.
 *
 * ⚠️ CALIBRAÇÃO A VALIDAR: as faixas Min-Max das variáveis contínuas, a ordem
 * das categóricas e os níveis das ordinais são uma proposta inicial para o
 * mercado do Mato Grosso e devem ser revisados com o time.
 *
 * ── VARIÁVEIS DO DICIONÁRIO EXCLUÍDAS DO SCORE (descritivas / ambíguas) ──────
 *  zona, cluster_urbano ....... categóricas nominais (sem ordem de qualidade)
 *  incorporadora_id ........... identificador
 *  ano_entrega ................ temporal (redundante com idade_imovel)
 *  tipo_condominio ............ já é campo da avaliação; nominal
 *  total_unidades ............. tamanho ≠ qualidade
 *  preco_m2, valor_venal, IPTU, media_preco_bairro, vgv_lancamento,
 *  valor_condominio_mensal .... valores absolutos de preço (nível ≠ qualidade)
 *  desvio_preco ............... sinal ambíguo
 *  numero_vagas_garagem (D8), sala_motorista (D8) .. duplicadas (contam em D2/D5)
 */
public final class CatalogoIqc {

    private CatalogoIqc() {}

    public static final List<VariavelIqc> VARIAVEIS = List.of(

            // ══════════ D1 · LOCALIZAÇÃO (15%) · Analista ══════════
            continua("distancia_centro",   LOCALIZACAO, "Distância do centro",   "km", 0, 15, true),
            continua("distancia_escola",   LOCALIZACAO, "Distância de escola",   "km", 0, 5,  true),
            continua("distancia_hospital", LOCALIZACAO, "Distância de hospital", "km", 0, 10, true),
            continua("distancia_comercio", LOCALIZACAO, "Distância de comércio", "km", 0, 5,  true),
            indice  ("indice_localizacao", LOCALIZACAO, "Índice de localização"),
            ordinal ("zona_valor",         LOCALIZACAO, "Zona de valor", 4),
            ordinal ("pavimentacao",       LOCALIZACAO, "Pavimentação da via", 3),
            indice  ("acesso_transporte",  LOCALIZACAO, "Acesso a transporte"),

            // ══════════ D2 · PRODUTO & ESTRUTURA (12%) · Engenheiro ══════════
            continua("area_construida",      PRODUTO, "Área construída média", "m²",   40, 400, false),
            continua("numero_quartos",       PRODUTO, "Nº de quartos",         "un",   1, 5,    false),
            continua("numero_suites",        PRODUTO, "Nº de suítes",          "un",   0, 4,    false),
            continua("numero_banheiros",     PRODUTO, "Nº de banheiros",       "un",   1, 5,    false),
            continua("numero_vagas_garagem", PRODUTO, "Nº de vagas de garagem","un",   0, 4,    false),
            ordinal ("padrao_construcao",    PRODUTO, "Padrão construtivo", 4),
            ordinal ("qualidade_construcao", PRODUTO, "Qualidade da construção", 4),
            continua("idade_imovel",         PRODUTO, "Idade do imóvel", "anos", 0, 30, true),
            categorica("piso",  PRODUTO, "Piso",  List.of("Cerâmica", "Porcelanato", "Mármore", "Marble importado")),
            categorica("forro", PRODUTO, "Forro / teto", List.of("Laje", "Gesso", "Luminotécnica", "Automação")),
            categorica("telha", PRODUTO, "Telha", List.of("Fibrocimento", "Cerâmica", "Concreto", "Shingle")),
            ordinal ("fase_obra",       PRODUTO, "Fase da obra", 4),
            binaria ("design_assinado", PRODUTO, "Design assinado"),
            categorica("certificacao_construcao", PRODUTO, "Certificação construtiva", List.of("Nenhuma", "AQUA", "LEED")),

            // ══════════ D3 · AMENIDADES & LAZER (18%) · Arquiteto ══════════
            binaria("piscina",          AMENIDADES, "Piscina"),
            binaria("piscina_adulto",   AMENIDADES, "Piscina adulto"),
            binaria("piscina_infantil", AMENIDADES, "Piscina infantil"),
            binaria("piscina_coberta",  AMENIDADES, "Piscina coberta"),
            continua("complexo_aquatico_m2", AMENIDADES, "Complexo aquático", "m²", 0, 2000, false),
            binaria("academia",        AMENIDADES, "Academia"),
            ordinal("academia_nivel",  AMENIDADES, "Nível da academia", 2),
            binaria("spa",             AMENIDADES, "Spa"),
            binaria("sauna",           AMENIDADES, "Sauna"),
            binaria("quadra_poliesportiva", AMENIDADES, "Quadra poliesportiva"),
            binaria("quadra_tenis",    AMENIDADES, "Quadra de tênis"),
            binaria("quadra_squash",   AMENIDADES, "Quadra de squash"),
            binaria("campo_futebol",   AMENIDADES, "Campo de futebol"),
            binaria("campo_golfe",     AMENIDADES, "Campo de golfe"),
            binaria("pista_corrida",   AMENIDADES, "Pista de corrida"),
            binaria("bicicletario",    AMENIDADES, "Bicicletário"),
            binaria("playground",      AMENIDADES, "Playground"),
            binaria("churrasqueira",   AMENIDADES, "Churrasqueira"),
            binaria("espaco_gourmet",  AMENIDADES, "Espaço gourmet"),
            binaria("salao_festas",    AMENIDADES, "Salão de festas"),
            binaria("salao_jogos",     AMENIDADES, "Salão de jogos"),
            binaria("cinema_privativo",AMENIDADES, "Cinema privativo"),
            binaria("espaco_zen_meditacao", AMENIDADES, "Espaço zen / meditação"),
            binaria("espaco_yoga",     AMENIDADES, "Espaço de yoga"),
            binaria("lounge_comum",    AMENIDADES, "Lounge comum"),
            binaria("rooftop",         AMENIDADES, "Rooftop"),
            binaria("jardim_comum",    AMENIDADES, "Jardim comum"),
            binaria("trilha_ecologica",AMENIDADES, "Trilha ecológica"),
            continua("area_verde_m2",  AMENIDADES, "Área verde", "m²", 0, 50000, false),
            binaria("coworking",       AMENIDADES, "Coworking"),
            binaria("sala_reuniao",    AMENIDADES, "Sala de reunião"),
            binaria("wifi_areas_comuns",AMENIDADES, "Wi-Fi nas áreas comuns"),
            continua("velocidade_internet_mbps", AMENIDADES, "Velocidade da internet", "Mbps", 0, 1000, false),
            binaria("infraestrutura_carro_eletrico", AMENIDADES, "Infraestrutura p/ carro elétrico"),
            binaria("pet_place",       AMENIDADES, "Pet place"),

            // ══════════ D4 · SEGURANÇA (12%) · Engenheiro ══════════
            binaria("portao_eletronico",      SEGURANCA, "Portão eletrônico"),
            binaria("cerca_eletrica",         SEGURANCA, "Cerca elétrica"),
            indice ("indice_seguranca",       SEGURANCA, "Índice de segurança"),
            binaria("seguranca_24h",          SEGURANCA, "Segurança 24h"),
            binaria("cftv_hd",                SEGURANCA, "CFTV HD"),
            binaria("controle_acesso_facial", SEGURANCA, "Controle de acesso facial"),
            binaria("biometria",              SEGURANCA, "Biometria"),
            binaria("monitoramento_remoto",   SEGURANCA, "Monitoramento remoto"),
            binaria("guarita_dupla",          SEGURANCA, "Guarita dupla"),
            binaria("muro_perimetral",        SEGURANCA, "Muro perimetral"),
            ordinal("nivel_seguranca_score",  SEGURANCA, "Nível de segurança", 3),

            // ══════════ D5 · SERVIÇOS & HOSPITALIDADE (8%) · Analista ══════════
            binaria("concierge",              SERVICOS, "Concierge"),
            binaria("portaria_virtual",       SERVICOS, "Portaria virtual"),
            binaria("delivery_recepcao",      SERVICOS, "Recepção de delivery"),
            binaria("lavanderia_coletiva",    SERVICOS, "Lavanderia coletiva"),
            binaria("pet_friendly",           SERVICOS, "Pet friendly"),
            binaria("sala_motorista",         SERVICOS, "Sala de motorista"),
            ordinal("servicos_hotelaria_score", SERVICOS, "Serviços de hotelaria", 3),
            binaria("gerador_energia",        SERVICOS, "Gerador de energia"),
            categorica("gerador_cobertura",   SERVICOS, "Cobertura do gerador", List.of("Parcial", "Total")),
            binaria("administracao_profissional", SERVICOS, "Administração profissional"),

            // ══════════ D6 · SUSTENTABILIDADE (5%) · Engenheiro ══════════
            binaria("poco_artesiano",              SUSTENTABILIDADE, "Poço artesiano"),
            binaria("reaproveitamento_agua_pluvial",SUSTENTABILIDADE, "Reaproveitamento de água pluvial"),
            binaria("energia_solar",               SUSTENTABILIDADE, "Energia solar"),
            binaria("coleta_seletiva",             SUSTENTABILIDADE, "Coleta seletiva"),
            categorica("certificacao_sustentavel", SUSTENTABILIDADE, "Certificação sustentável", List.of("Nenhuma", "Fitwel", "AQUA", "LEED")),
            continua("area_verde_percentual",      SUSTENTABILIDADE, "Percentual de área verde", "%", 0, 40, false),
            indice ("sustentabilidade_score",      SUSTENTABILIDADE, "Índice de sustentabilidade"),

            // ══════════ D7 · ECONÔMICA & LIQUIDEZ (15%) · Analista ══════════
            continua("valorizacao_anual",    ECONOMICA, "Valorização anual", "%", 0, 20, false),
            indice  ("liquidez_imovel",      ECONOMICA, "Liquidez do imóvel"),
            continua("taxa_absorcao",        ECONOMICA, "Taxa de absorção", "%", 0, 100, false),
            continua("tempo_venda",          ECONOMICA, "Tempo médio de venda", "meses", 0, 24, true),
            indice  ("indice_hedonico",      ECONOMICA, "Índice hedônico"),
            indice  ("indice_valor_urbano",  ECONOMICA, "Índice de valor urbano"),
            indice  ("potencial_valorizacao",ECONOMICA, "Potencial de valorização"),
            indice  ("fluxo_capital_regional",ECONOMICA, "Fluxo de capital regional"),
            categorica("segmento_produto",   ECONOMICA, "Segmento do produto", List.of("Econômico", "Médio", "Alto", "Luxo")),
            continua("meses_estoque_segmento",ECONOMICA, "Meses de estoque do segmento", "meses", 0, 24, true),
            continua("velocidade_venda_semanas", ECONOMICA, "Velocidade de venda", "semanas", 0, 52, true),
            continua("taxa_absorcao_mensal", ECONOMICA, "Taxa de absorção mensal", "%", 0, 100, false),
            continua("dependencia_financiamento", ECONOMICA, "Dependência de financiamento", "%", 0, 100, true),
            continua("sensibilidade_selic",  ECONOMICA, "Sensibilidade à Selic", "0–100", 0, 100, true),
            continua("percentual_vendido_lancamento", ECONOMICA, "% vendido no lançamento", "%", 0, 100, false),
            continua("percentual_vendido_obra",       ECONOMICA, "% vendido em obra", "%", 0, 100, false),
            continua("percentual_vendido_entrega",    ECONOMICA, "% vendido na entrega", "%", 0, 100, false),
            continua("percentual_vendido_total",      ECONOMICA, "% vendido total", "%", 0, 100, false),
            continua("oferta_competidora_raio_km",    ECONOMICA, "Ofertas concorrentes no raio", "un", 0, 50, true),
            indice  ("indice_liquidez_segmento",      ECONOMICA, "Índice de liquidez do segmento"),
            continua("demanda_reprimida_segmento",    ECONOMICA, "Demanda reprimida do segmento", "0–100", 0, 100, false),

            // ══════════ D8 · MOBILIDADE & CONECTIVIDADE DE ELITE (15%) · Arquiteto ══════════
            // 8.1 Aérea
            binaria("heliponto_condominio",   MOBILIDADE, "Heliponto no condomínio"),
            binaria("heliponto_privativo",    MOBILIDADE, "Heliponto privativo"),
            binaria("pista_pouso_condominio", MOBILIDADE, "Pista de pouso"),
            continua("pista_pouso_metragem_m",MOBILIDADE, "Metragem da pista", "m", 0, 2000, false),
            binaria("pista_homologada_anac",  MOBILIDADE, "Pista homologada ANAC"),
            ordinal("tipo_aeronave_aceita",   MOBILIDADE, "Tipo de aeronave aceita", 3),
            continua("distancia_aeroporto_privado_km",   MOBILIDADE, "Distância a aeroporto privado", "km", 0, 100, true),
            continua("distancia_aeroporto_comercial_km", MOBILIDADE, "Distância a aeroporto comercial", "km", 0, 150, true),
            binaria("hangar_coletivo",  MOBILIDADE, "Hangar coletivo"),
            binaria("hangar_privativo", MOBILIDADE, "Hangar privativo"),
            // 8.2 Aquática
            binaria("marina_condominio",  MOBILIDADE, "Marina"),
            continua("numero_vagas_marina",MOBILIDADE, "Vagas na marina", "un", 0, 100, false),
            binaria("pier_coletivo",      MOBILIDADE, "Píer coletivo"),
            binaria("pier_privativo",     MOBILIDADE, "Píer privativo"),
            ordinal("tipo_embarcacao_aceita", MOBILIDADE, "Porte de embarcação aceita", 3),
            binaria("rampa_lancamento_barcos", MOBILIDADE, "Rampa de lançamento de barcos"),
            binaria("acesso_direto_lago_rio_mar", MOBILIDADE, "Acesso direto a lago / rio / mar"),
            continua("quilometros_navegaveis", MOBILIDADE, "Quilômetros navegáveis", "km", 0, 100, false),
            binaria("pranchetario",  MOBILIDADE, "Pranchetário"),
            binaria("escola_nautica",MOBILIDADE, "Escola náutica"),
            // 8.3 Praia / água
            binaria("praia_natural_lago",     MOBILIDADE, "Praia natural (lago)"),
            binaria("praia_natural_mar",      MOBILIDADE, "Praia natural (mar)"),
            binaria("praia_artificial_interna",MOBILIDADE, "Praia artificial interna"),
            continua("extensao_praia_m",      MOBILIDADE, "Extensão de praia", "m", 0, 1000, false),
            binaria("praia_privativa_lote",   MOBILIDADE, "Praia privativa no lote"),
            binaria("acesso_pe_na_areia",     MOBILIDADE, "Acesso pé na areia"),
            indice ("qualidade_agua_balneabilidade", MOBILIDADE, "Qualidade da água (balneabilidade)"),
            continua("lago_artificial_m2",    MOBILIDADE, "Lago artificial", "m²", 0, 100000, false),
            // 8.4 Terrestre de elite
            binaria("garagem_coberta",        MOBILIDADE, "Garagem coberta"),
            binaria("garagem_extra_visitas",  MOBILIDADE, "Garagem extra p/ visitas"),
            binaria("entrada_social_separada",MOBILIDADE, "Entrada social separada"),
            binaria("entrada_servico_separada",MOBILIDADE, "Entrada de serviço separada"),
            binaria("vias_internas_asfaltadas",MOBILIDADE, "Vias internas asfaltadas"),
            continua("distancia_rodovia_principal_km", MOBILIDADE, "Distância à rodovia principal", "km", 0, 30, true),
            continua("tempo_capital_min",     MOBILIDADE, "Tempo até a capital", "min", 0, 180, true),
            // 8.5 Staff & serviços domésticos
            binaria("dependencia_empregada",  MOBILIDADE, "Dependência de empregada"),
            binaria("banheiro_empregada",     MOBILIDADE, "Banheiro de empregada"),
            continua("numero_quartos_servico",MOBILIDADE, "Quartos de serviço", "un", 0, 3, false),
            binaria("entrada_servico_unidade",MOBILIDADE, "Entrada de serviço na unidade"),
            binaria("casa_caseiro_condominio",MOBILIDADE, "Casa de caseiro (condomínio)"),
            binaria("casa_caseiro_lote",      MOBILIDADE, "Casa de caseiro (lote)"),
            binaria("lavanderia_servico",     MOBILIDADE, "Lavanderia de serviço"),
            binaria("dispensa_almoxarifado",  MOBILIDADE, "Dispensa / almoxarifado"),
            binaria("copa_servico",           MOBILIDADE, "Copa de serviço"),
            // 8.6 Conectividade digital
            binaria("fibra_optica_condominio",MOBILIDADE, "Fibra óptica"),
            binaria("cobertura_5g",           MOBILIDADE, "Cobertura 5G"),
            ordinal("automacao_residencial_score", MOBILIDADE, "Automação residencial", 3),
            continua("potencia_gerador_kva",  MOBILIDADE, "Potência do gerador", "kVA", 0, 500, false)
    );
}
