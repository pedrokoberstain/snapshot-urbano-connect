-- Coleta organica de correspondencia endereco → inscricao imobiliaria.
--
-- Toda vez que um corretor cadastra ou edita um imovel informando cidade,
-- logradouro, numero E inscricao, gravamos um upsert nesta tabela. Assim,
-- o proximo corretor que cadastrar um imovel no mesmo endereco (mesmo sem
-- ter a inscricao em maos) recebe a ficha exata do cadastro municipal sem
-- passar pelo match textual fragil da base IPTU 2014.
--
-- A base cresce sozinha com o uso do sistema. Nao substitui os endpoints
-- anteriores (/ficha, /buscar, /perfil-bairro) — vira o passo 1.5 na
-- cascata: mais preciso que /buscar (que erra falso positivo) e mais
-- acessivel que /ficha (nao exige o carne do IPTU do dono).
--
-- Chave: cidade + logradouro_norm + numero_norm. O ultimo cadastro vence.
-- CEP e o proprio imovel_id sao guardados apenas para auditoria/exibicao;
-- nao entram no lookup.

CREATE TABLE IF NOT EXISTS endereco_conhecido (
    id                BIGSERIAL PRIMARY KEY,
    cidade            VARCHAR(120) NOT NULL,
    cep               VARCHAR(9),
    logradouro        VARCHAR(255) NOT NULL,
    logradouro_norm   VARCHAR(255) NOT NULL,
    numero            VARCHAR(32)  NOT NULL,
    numero_norm       VARCHAR(32)  NOT NULL,
    inscricao         VARCHAR(32)  NOT NULL,
    imovel_id         BIGINT,
    data_criacao      TIMESTAMP    NOT NULL,
    data_atualizacao  TIMESTAMP    NOT NULL,
    CONSTRAINT uk_endereco_conhecido UNIQUE (cidade, logradouro_norm, numero_norm)
);

CREATE INDEX IF NOT EXISTS idx_endereco_conhecido_cep
    ON endereco_conhecido (cidade, cep) WHERE cep IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_endereco_conhecido_inscricao
    ON endereco_conhecido (cidade, inscricao);
