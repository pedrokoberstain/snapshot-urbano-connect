package br.com.urbanoconnect.api.domain.model;

/**
 * Estado da parte de um profissional dentro da avaliação.
 *
 * AGUARDANDO   — atribuída a alguém, ainda sem nenhuma resposta.
 * EM_ANDAMENTO — já tem respostas, mas o profissional não deu por encerrado.
 * FINALIZADA   — o profissional assinou. A partir daqui a parte fica travada
 *                para edição; reabrir é ato explícito e registrado, porque é a
 *                assinatura dele que está no laudo.
 */
public enum StatusParteIqc {
    AGUARDANDO,
    EM_ANDAMENTO,
    FINALIZADA
}
