package br.com.urbanoconnect.api.domain.service;

import br.com.urbanoconnect.api.domain.model.DimensaoIqc;
import br.com.urbanoconnect.api.domain.model.PerguntaMorador;

import java.util.List;

/**
 * ══════════════════════════════════════════════════════════════
 *  QUESTIONÁRIO DO MORADOR — 16 perguntas
 * ══════════════════════════════════════════════════════════════
 *
 *  Princípio: o laudo técnico mede o que existe; o morador mede se funciona.
 *  O engenheiro visita um dia e vê que há academia, portaria 24h e três
 *  elevadores. Só quem mora sabe que a academia vive fechada, que o porteiro
 *  da madrugada dorme e que um elevador está parado há dois meses. É essa
 *  informação — invisível na vistoria — que justifica os 10%.
 *
 *  Por isso as perguntas são sobre experiência concreta e recente, não sobre
 *  abstrações. "Quantas vezes faltou água este ano" tem resposta; "avalie a
 *  sustentabilidade" não tem.
 *
 *  Toda escala corre no mesmo sentido: 0 é ruim, 10 é bom. Inverter o sentido
 *  de algumas perguntas confunde quem responde e contamina o dado.
 */
public final class CatalogoOpiniaoMorador {

    private CatalogoOpiniaoMorador() {}

    public static final String TELA_APARTAMENTO   = "Dentro do seu apartamento";
    public static final String TELA_LAZER         = "Áreas comuns e lazer";
    public static final String TELA_SEGURANCA     = "Segurança";
    public static final String TELA_DIA_A_DIA     = "Dia a dia";
    public static final String TELA_ADMINISTRACAO = "Dinheiro e administração";

    private static final List<String> FREQ_OCORRENCIAS =
            List.of("NUNCA", "UMA_VEZ", "DUAS_A_TRES", "MAIS_DE_TRES");

    private static final List<String> FREQ_RATEIOS =
            List.of("NENHUM", "UM_NO_ANO", "DOIS_A_TRES", "VARIOS");

    public static final List<PerguntaMorador> PERGUNTAS = List.of(

            // ── Dentro do seu apartamento — Produto & Estrutura (12%) ──
            PerguntaMorador.escala("ruido_entre_unidades", DimensaoIqc.PRODUTO, TELA_APARTAMENTO,
                    "Você escuta o vizinho de cima ou do lado no dia a dia?",
                    "Escuto tudo, atrapalha", "Não escuto nada", false),

            PerguntaMorador.escala("problemas_construtivos", DimensaoIqc.PRODUTO, TELA_APARTAMENTO,
                    "Infiltração, mofo, rachadura ou acabamento com defeito — no seu apartamento ou nas áreas comuns",
                    "Vários problemas", "Nenhum problema", false),

            PerguntaMorador.escala("agua_e_energia", DimensaoIqc.PRODUTO, TELA_APARTAMENTO,
                    "Pressão do chuveiro, falta d'água e queda de energia nos últimos 12 meses",
                    "Falta com frequência", "Nunca faltou", false),

            // ── Áreas comuns e lazer — Amenidades (18%, maior peso) ──
            PerguntaMorador.escala("lazer_disponibilidade", DimensaoIqc.AMENIDADES, TELA_LAZER,
                    "Quando você quer usar a piscina, a academia ou a churrasqueira, elas estão disponíveis e funcionando?",
                    "Quase nunca dá para usar", "Sempre disponíveis", true),

            PerguntaMorador.escala("lazer_capacidade", DimensaoIqc.AMENIDADES, TELA_LAZER,
                    "O lazer dá conta do número de moradores, ou vive lotado e com lista de espera?",
                    "Vive lotado", "Sobra espaço", true),

            // ── Segurança ──
            PerguntaMorador.frequencia("ocorrencias_seguranca", DimensaoIqc.SEGURANCA, TELA_SEGURANCA,
                    "Nos últimos 12 meses houve furto, invasão ou tentativa dentro do condomínio?",
                    FREQ_OCORRENCIAS),

            PerguntaMorador.escala("controle_de_acesso", DimensaoIqc.SEGURANCA, TELA_SEGURANCA,
                    "A portaria realmente controla quem entra — confere visitante, não libera entregador direto, câmera funcionando?",
                    "Entra qualquer um", "Controle rigoroso", false),

            PerguntaMorador.escala("seguranca_da_rua", DimensaoIqc.LOCALIZACAO, TELA_SEGURANCA,
                    "Voltando à noite, você se sente seguro na rua do condomínio?",
                    "Evito chegar à noite", "Totalmente seguro", false),

            // ── Dia a dia ──
            PerguntaMorador.escala("garagem", DimensaoIqc.MOBILIDADE, TELA_DIA_A_DIA,
                    "Garagem: seu carro cabe, dá para manobrar, e existe vaga de visitante de verdade?",
                    "Um transtorno diário", "Sem nenhum problema", true),

            PerguntaMorador.escala("elevador", DimensaoIqc.MOBILIDADE, TELA_DIA_A_DIA,
                    "Elevador: espera no horário de pico e frequência de parada para manutenção",
                    "Espera muito e vive quebrado", "Rápido e confiável", true),

            PerguntaMorador.escala("internet_e_sinal", DimensaoIqc.MOBILIDADE, TELA_DIA_A_DIA,
                    "Internet e sinal de celular no apartamento e nas áreas comuns",
                    "Não pega quase nada", "Funciona em todo lugar", false),

            PerguntaMorador.escala("entorno", DimensaoIqc.LOCALIZACAO, TELA_DIA_A_DIA,
                    "O entorno atrapalha? Barulho de avenida ou bar, alagamento na chuva forte, dificuldade de acesso",
                    "Atrapalha muito", "Não atrapalha nada", false),

            // ── Dinheiro e administração ──
            PerguntaMorador.escala("custo_beneficio_taxa", DimensaoIqc.ECONOMICA, TELA_ADMINISTRACAO,
                    "A taxa condominial vale o que o condomínio entrega?",
                    "Cara demais pelo que oferece", "Vale cada centavo", false),

            PerguntaMorador.frequencia("rateios_extras", DimensaoIqc.ECONOMICA, TELA_ADMINISTRACAO,
                    "Rateios e cobranças extras além da taxa, nos últimos 12 meses",
                    FREQ_RATEIOS),

            PerguntaMorador.escala("resposta_da_administracao", DimensaoIqc.SERVICOS, TELA_ADMINISTRACAO,
                    "Quando você abre um chamado, resolvem? E a prestação de contas é clara?",
                    "Nunca resolvem, contas obscuras", "Resolvem rápido, contas claras", false),

            PerguntaMorador.escala("sustentabilidade_na_pratica", DimensaoIqc.SUSTENTABILIDADE, TELA_ADMINISTRACAO,
                    "Coleta seletiva, descarte de lixo e desperdício de água e energia funcionam na prática?",
                    "Não funciona nada", "Funciona bem", false)
    );

    /** Ordem em que as telas aparecem para o morador. */
    public static final List<String> TELAS = List.of(
            TELA_APARTAMENTO, TELA_LAZER, TELA_SEGURANCA, TELA_DIA_A_DIA, TELA_ADMINISTRACAO);

    public static PerguntaMorador porChave(String chave) {
        return PERGUNTAS.stream().filter(p -> p.chave().equals(chave)).findFirst().orElse(null);
    }
}
