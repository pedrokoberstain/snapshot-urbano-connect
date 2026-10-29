-- Separa notícia de artigo e cria o agrupamento temático dentro das séries.
--
-- Todas as colunas entram com DEFAULT ou nulas: as 142 publicações existentes
-- continuam válidas sem nenhum UPDATE. O ddl-auto=update não consegue adicionar
-- NOT NULL a tabela populada, por isso o DEFAULT em tipo é obrigatório aqui.

ALTER TABLE noticias
    ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'NOTICIA';

-- Bloco temático dentro de uma série (ex.: "Diagnóstico e Contaminação").
-- Espelha o par serie/parte_numero que já existe: nome livre + ordem.
ALTER TABLE noticias
    ADD COLUMN IF NOT EXISTS bloco VARCHAR(160);

ALTER TABLE noticias
    ADD COLUMN IF NOT EXISTS bloco_numero INTEGER;

-- O portal filtra o feed por tipo em toda listagem pública.
CREATE INDEX IF NOT EXISTS idx_noticias_tipo_publicado
    ON noticias (tipo, publicado, data_publicacao DESC);

-- A página da série agrupa por bloco e ordena dentro dele.
CREATE INDEX IF NOT EXISTS idx_noticias_serie_bloco
    ON noticias (serie_slug, bloco_numero, parte_numero);
