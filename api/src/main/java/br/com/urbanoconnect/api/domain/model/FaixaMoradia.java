package br.com.urbanoconnect.api.domain.model;

/**
 * Tempo de moradia em faixa, para as opiniões anônimas.
 *
 * O laudo precisa saber há quanto tempo a pessoa mora — quem chegou ontem
 * pesa diferente de quem está há dez anos. Mas o número exato de meses,
 * combinado com "proprietário" ou "inquilino", identifica o respondente num
 * condomínio pequeno: o síndico sabe quem se mudou em cada mês. A faixa
 * preserva o que o laudo usa e descarta o que denuncia.
 *
 * Quem escolhe assinar a opinião vê o tempo exato — aí não há o que proteger.
 */
public enum FaixaMoradia {

    MENOS_DE_6_MESES  ("Menos de 6 meses"),
    DE_6_MESES_A_1_ANO("De 6 meses a 1 ano"),
    DE_1_A_3_ANOS     ("De 1 a 3 anos"),
    DE_3_A_5_ANOS     ("De 3 a 5 anos"),
    MAIS_DE_5_ANOS    ("Mais de 5 anos");

    private final String rotulo;

    FaixaMoradia(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }

    public static FaixaMoradia de(Long meses) {
        if (meses == null)  return null;
        if (meses < 6)      return MENOS_DE_6_MESES;
        if (meses < 12)     return DE_6_MESES_A_1_ANO;
        if (meses < 36)     return DE_1_A_3_ANOS;
        if (meses < 60)     return DE_3_A_5_ANOS;
        return MAIS_DE_5_ANOS;
    }
}
