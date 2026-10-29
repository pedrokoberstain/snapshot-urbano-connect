-- ═══════════════════════════════════════════════════════════════
--  V5 — Partes para as avaliacoes que ja existiam
-- ═══════════════════════════════════════════════════════════════
--
--  A V3 criou a tabela de partes e o codigo passou a gerar as tres junto com
--  cada avaliacao nova. As avaliacoes anteriores ficaram sem nenhuma — e uma
--  avaliacao sem partes e um beco sem saida na interface: o painel aparece
--  vazio, ninguem pode ser designado, e o profissional que abre a tela le
--  "voce ainda nao foi designado" sem ter como isso mudar.
--
--  Aqui elas ganham as tres partes vazias, no mesmo estado em que nasceriam
--  hoje: AGUARDANDO, sem responsavel. Nada e assinado nem preenchido.
--
--  O INSERT ... SELECT com NOT EXISTS torna a migracao idempotente por
--  construcao: se uma avaliacao ja tiver a parte, ela nao e duplicada.

INSERT INTO public.partes_avaliacao_iqc
    (avaliacao_id, especialidade, status, data_atribuicao, data_atualizacao)
SELECT a.id, e.especialidade, 'AGUARDANDO', now(), now()
  FROM public.avaliacoes_iqc a
 CROSS JOIN (VALUES ('ENGENHEIRO'), ('ARQUITETO'), ('ANALISTA')) AS e(especialidade)
 WHERE NOT EXISTS (
        SELECT 1 FROM public.partes_avaliacao_iqc p
         WHERE p.avaliacao_id = a.id
           AND p.especialidade = e.especialidade);
