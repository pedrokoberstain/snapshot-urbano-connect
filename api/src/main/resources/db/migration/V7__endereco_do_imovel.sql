-- Endereço do imóvel: até aqui só existiam cidade e bairro.
--
-- Além de ser o básico de um anúncio, o logradouro e o número são a chave que
-- permite achar o lote no cadastro do IPTU — hoje o sistema cai na média do
-- bairro porque ninguém tem a inscrição municipal em mãos.
--
-- Todas as colunas nulas: os imóveis já cadastrados seguem válidos sem UPDATE.

ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS cep         VARCHAR(9);
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS logradouro  VARCHAR(255);
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS numero      VARCHAR(20);
ALTER TABLE imoveis ADD COLUMN IF NOT EXISTS complemento VARCHAR(255);

-- A busca por endereço vai partir de cidade + logradouro.
CREATE INDEX IF NOT EXISTS idx_imoveis_cidade_logradouro
    ON imoveis (cidade, logradouro);
