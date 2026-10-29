-- Rodar uma vez no banco de produção para promover os 2 admins.
-- Substitua pelos e-mails reais antes de executar.

UPDATE usuarios SET tipo = 'ADMIN' WHERE email IN (
    'seu@email.com',
    'emaildogestor@email.com'
);
