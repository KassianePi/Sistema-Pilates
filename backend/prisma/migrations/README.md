# Migrações do banco (Prisma Migrate)

A partir de **2026-06-13** o projeto usa o **fluxo padrão do Prisma Migrate**.
O histórico de migrações é a fonte de verdade do schema em homologação e produção.

## Histórico

| Migração | Conteúdo |
|----------|----------|
| `0_init` | **Baseline** — schema completo que já existia nos bancos (17 tabelas) antes da adoção do Migrate. |
| `20260613120000_agenda_acoes_e_caixa_opcional` | Ações de agenda com justificativa (`SUSPENSA`/`EXCLUIDA`, `justificativa`, `status_alterado_em/por_id`, `data_hora_anterior`) e `pagamentos.caixaId` opcional. |

O baseline foi gerado de forma offline a partir do schema:

```bash
npx prisma migrate diff --from-empty \
  --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
```

## Baseline de um banco JÁ EXISTENTE (rodar UMA única vez por ambiente)

Bancos que já tinham o schema (dev/homologação/produção) **não devem** reexecutar o `0_init`
(as tabelas já existem). Marque-o como aplicado e então aplique as migrações pendentes:

```bash
# dentro da rede do Docker (host do banco = mysql:3306)
docker compose run --rm backend npx prisma migrate resolve --applied 0_init
docker compose run --rm backend npx prisma migrate deploy
```

Em um banco **novo/vazio**, nada disso é necessário: `prisma migrate deploy` cria tudo do zero.

## Criando novas migrações (daqui pra frente)

1. Edite `prisma/schema.prisma`.
2. Gere a migração (rodar dentro do container para alcançar `mysql:3306`):
   ```bash
   docker compose exec backend npx prisma migrate dev --name <descricao_curta>
   ```
3. Commite a pasta gerada em `prisma/migrations/`.
4. Deploy aplica automaticamente via `prisma migrate deploy` (ver `backend/entrypoint.sh` e o `command` do serviço backend no `docker-compose.yml`).

> Não usar mais `prisma db push` para evoluir o schema — ele não gera arquivos de migração e faz o histórico divergir.
