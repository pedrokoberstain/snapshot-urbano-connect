package br.com.urbanoconnect.api.domain.model;

import java.util.List;

/**
 * Uma pergunta do questionário do morador.
 *
 * {@code tela} agrupa para a interface por tema que o morador reconhece
 * ("Dinheiro e administração"), não pelo nome interno da dimensão
 * ("Econômica & Liquidez") — vocabulário nosso não é vocabulário dele.
 *
 * {@code dimensao} é o que liga a resposta ao motor de cálculo: as perguntas
 * são ponderadas pelos mesmos pesos das 8 dimensões técnicas, e por isso
 * "90/10 no total" e "90/10 dentro de cada dimensão" dão o mesmo número.
 */
public record PerguntaMorador(
        String chave,
        DimensaoIqc dimensao,
        String tela,
        String enunciado,
        TipoPerguntaMorador tipo,
        /** Âncoras da escala, para a interface não deixar dúvida do sentido. */
        String ancoraZero,
        String ancoraDez,
        /** Opções da frequência, da melhor para a pior. Vazio nas de escala. */
        List<String> opcoes,
        /** Elevador não existe em condomínio horizontal — e isso não é "não sei". */
        boolean permiteNaoSeAplica
) {

    public static PerguntaMorador escala(String chave, DimensaoIqc dimensao, String tela,
                                         String enunciado, String ancoraZero, String ancoraDez,
                                         boolean permiteNaoSeAplica) {
        return new PerguntaMorador(chave, dimensao, tela, enunciado, TipoPerguntaMorador.ESCALA,
                ancoraZero, ancoraDez, List.of(), permiteNaoSeAplica);
    }

    public static PerguntaMorador frequencia(String chave, DimensaoIqc dimensao, String tela,
                                             String enunciado, List<String> opcoes) {
        return new PerguntaMorador(chave, dimensao, tela, enunciado, TipoPerguntaMorador.FREQUENCIA,
                null, null, opcoes, false);
    }

    /**
     * Converte a resposta bruta em nota de 0 a 100, ou null quando ela não
     * deve pesar — ausente, "não sei", "não se aplica" ou fora do domínio.
     *
     * Diferente do motor técnico, aqui a ausência NUNCA vira zero: no laudo
     * técnico a falta de uma amenidade é informação ("não tem piscina"), mas
     * morador que pulou pergunta não disse nada sobre o condomínio, e punir
     * por isso premiaria quem responde menos.
     */
    public Double normalizar(Object resposta) {
        if (resposta == null) return null;

        String texto = String.valueOf(resposta).trim();
        if (texto.isEmpty()
                || texto.equalsIgnoreCase("NAO_SEI")
                || texto.equalsIgnoreCase("NAO_SE_APLICA")) {
            return null;
        }

        if (tipo == TipoPerguntaMorador.FREQUENCIA) {
            int indice = opcoes.indexOf(texto);
            if (indice < 0 || opcoes.size() < 2) return null;
            // Melhor opção primeiro: a primeira vale 100, a última vale 0.
            return 100.0 * (opcoes.size() - 1 - indice) / (opcoes.size() - 1);
        }

        try {
            double nota = Double.parseDouble(texto.replace(",", "."));
            if (nota < 0 || nota > 10) return null;
            return nota * 10.0;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
