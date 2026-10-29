# Deploy na VPS Hostinger (Ubuntu) — Urbano Connect API

Migração da API + banco para uma VPS única usando **Docker Compose**
(`app + PostgreSQL + Caddy`), com **HTTPS automático** e **backup diário**.

> Banco novo do zero: o Hibernate (`ddl-auto=update`) cria todas as tabelas
> no primeiro boot. Depois é só re-semear os dados (admins, notícias, imóveis).

---

## Pré-requisitos

- VPS Ubuntu com acesso `ssh` (IP + usuário).
- Um subdomínio para a API (ex.: `api.seudominio.com`) que você consiga
  apontar no DNS da Hostinger.

---

## 1. Primeiro acesso e segurança básica

```bash
ssh root@SEU_IP_DA_VPS

# Atualiza o sistema
apt update && apt upgrade -y

# Cria um usuário não-root (troque "kober")
adduser kober
usermod -aG sudo kober

# Firewall: só SSH, HTTP e HTTPS
apt install -y ufw
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

Reconecte como o novo usuário: `ssh kober@SEU_IP_DA_VPS`.

## 2. Instalar Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# saia e entre de novo no SSH para o grupo docker valer
exit
```

## 3. Subir o código na VPS

```bash
ssh kober@SEU_IP_DA_VPS
git clone <URL_DO_SEU_REPO> urbano-connect-api
cd urbano-connect-api
```

> Se o repositório for privado, use um deploy key ou `gh auth login`.

## 4. Configurar o `.env`

```bash
cp .env.example .env
nano .env          # preencha TODOS os segredos com valores reais
```

Gere segredos fortes:
```bash
openssl rand -base64 24   # DB_PASSWORD
openssl rand -base64 48   # JWT_SECRET
```

> **Mercado Pago:** gere um token NOVO no painel (o antigo foi exposto).

## 5. Apontar o DNS

No painel de DNS da Hostinger, crie um registro **A**:

| Tipo | Nome  | Valor         |
|------|-------|---------------|
| A    | `api` | `SEU_IP_DA_VPS` |

Edite o `Caddyfile` e troque `api.seudominio.com` pelo nome real.
Espere o DNS propagar (`ping api.seudominio.com` deve responder o IP da VPS)
antes do próximo passo — o Caddy só emite o certificado quando o DNS já resolve.

## 6. Subir tudo

```bash
docker compose up -d --build
docker compose logs -f app     # acompanhe o boot; Ctrl+C para sair
```

Teste: `https://api.seudominio.com/swagger-ui.html` (ou uma rota pública como
`GET /cotacoes`). O HTTPS deve estar verde automaticamente.

## 7. Re-semear os dados (banco veio vazio)

```bash
# Admins
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" < scripts/criar_admins.sql

# Notícias, imóveis (IPTU) e cotações: pelos fluxos já existentes da aplicação.
```

## 8. Backup automático diário

```bash
chmod +x deploy/backup.sh
crontab -e
# adicione a linha (troque o caminho):
0 3 * * * /home/kober/urbano-connect-api/deploy/backup.sh >> /var/log/uc-backup.log 2>&1
```

> **Importante:** configure um destino externo dentro do `backup.sh`
> (rclone/scp). Backup que fica só na VPS não protege contra perder a VPS —
> foi exatamente o que aconteceu na Azure.

---

## Ajustes de "comunicação" (o que muda ao trocar de servidor)

- `ALLOWED_ORIGINS` / `FRONTEND_URL` no `.env` → domínio do frontend.
- **Frontend (Vercel):** apontar a URL base da API para `https://api.seudominio.com`.
- **Webhook do Mercado Pago:** atualizar a URL no painel do MP para
  `https://api.seudominio.com/webhooks/mercadopago`.

## Comandos do dia a dia

```bash
docker compose ps                 # status
docker compose logs -f app        # logs da API
docker compose restart app        # reiniciar só a API
git pull && docker compose up -d --build   # publicar nova versão
docker compose down               # parar tudo (dados do banco ficam no volume)
```

## Restaurar um backup

```bash
gunzip -c deploy/backups/ARQUIVO.sql.gz | docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME"
```

## Alterações no banco (Flyway)

O schema deixou de ser adivinhado pelo Hibernate. Antes era
`ddl-auto=update`, que nunca removia coluna, não migrava dado, não deixava
histórico e **falhava em silêncio**: um `ALTER TABLE ADD COLUMN NOT NULL` em
tabela populada é recusado pelo banco, o Hibernate desiste sem interromper o
boot, e a aplicação sobe verde para quebrar com 500 na primeira consulta.

Agora toda alteração é um arquivo em `src/main/resources/db/migration`,
aplicado pelo Flyway no start da aplicação, antes do Hibernate. O
`ddl-auto=validate` não altera nada: só recusa subir se o schema divergir das
entidades — vira erro de boot o que antes viraria erro em produção.

**Para mudar o banco:** crie `V{n}__descricao.sql` com o número seguinte.
Nunca edite uma migração já aplicada — o Flyway guarda o checksum e recusa
subir se ele mudar. Corrija sempre com uma migração nova.

```bash
# o que já foi aplicado
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" \
  -c "SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank;"
```

**Se a aplicação não subir depois de um deploy**, o log dirá qual das duas
coisas foi:

- `FlywayException` / `Migration ... failed` — o SQL da migração quebrou. O
  Flyway roda cada migração em transação, então o banco não fica pela metade:
  corrija o arquivo e publique de novo.
- `SchemaManagementException: missing table/column` — alguém alterou a
  entidade e esqueceu a migração. É exatamente o erro que o `validate` existe
  para dar, e ele aparece no start, não na primeira requisição do usuário.

**Banco que já existia antes do Flyway** (o caso da produção em 06/08/2026): o
`baseline-on-migrate` marca o banco como já estando na V1 — o retrato do
schema herdado do `ddl-auto` — e aplica só da V2 em diante. Um banco vazio roda
V1 e V2 e chega no mesmo lugar. Ambos os caminhos foram ensaiados localmente e
produzem schemas idênticos.

Se você tiver um banco de **desenvolvimento** anterior ao Flyway, ele está num
terceiro estado: já tem as tabelas novas, mas sem histórico. Nesse caso o mais
simples é recriar o banco do zero e deixar as migrações montarem tudo.
