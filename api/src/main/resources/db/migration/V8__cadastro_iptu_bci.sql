-- Enriquece o cadastro IPTU com o Boletim de Cadastro Imobiliario (BCI) da
-- prefeitura: infraestrutura da rua, servicos na unidade, area construida
-- oficial e ficha construtiva. A tabela cadastro_iptu ja existe (V6/dev
-- criou via ddl-auto) — aqui so acrescentamos colunas, todas nulaveis, para
-- nao invalidar as linhas ja importadas do CSV IPTU_2014.
--
-- Chave de casamento: inscricao (mesma coluna, mesmo valor). O importer
-- roda depois da importacao IPTU_2014 e faz UPDATE por inscricao.

ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS caracterizacao         VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tipo_construcao        VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS estado_conservacao     VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS cobertura              VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS revestimento           VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS piso                   VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS forro                  VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS posicao                VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS instalacao_sanitaria   VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS instalacao_eletrica    VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS situacao_terreno       VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS topografia             VARCHAR(64);
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS pedologia              VARCHAR(64);

ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS area_construida        DOUBLE PRECISION;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS testada                DOUBLE PRECISION;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS numero_pavimentos      INTEGER;

ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_esgoto             BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_agua               BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_iluminacao_publica BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_calcamento         BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_galeria_pluvial    BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_coleta_lixo        BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_limpeza_urbana     BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_rede_telefonica    BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_guias_sarjetas     BOOLEAN;

ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS esgoto_na_unidade      BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS agua_na_unidade        BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS poco_na_unidade        BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS fossa_na_unidade       BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_piscina            BOOLEAN;
ALTER TABLE cadastro_iptu ADD COLUMN IF NOT EXISTS tem_sauna              BOOLEAN;
