# Backup e Restauração — MySQL (Studio de Pilates)

Scripts para backup, restauração e verificação de integridade do banco de produção. Nenhum script contém credenciais — todas as variáveis vêm do ambiente.

## Scripts

| Script | Função |
|---|---|
| `backup-mysql.sh` | Gera dump compactado (`.sql.gz`), aplica retenção, loga sucesso/falha |
| `restore-mysql.sh` | Restaura um backup (`.sql` ou `.sql.gz`) com confirmação interativa |
| `verify-backup.sh` | Valida integridade do `.gz` e presença de conteúdo SQL esperado |

## Variáveis de ambiente

```env
MYSQL_HOST=localhost        # opcional, default: localhost
MYSQL_PORT=3306              # opcional, default: 3306
MYSQL_USER=pilates_user      # obrigatório
MYSQL_PASSWORD=...           # obrigatório
MYSQL_DATABASE=pilates_db    # obrigatório
BACKUP_DIR=database/backups  # opcional (só backup-mysql.sh)
RETENTION_DAYS=7              # opcional (só backup-mysql.sh)
```

## Uso

```bash
# Backup
MYSQL_USER=pilates_user MYSQL_PASSWORD=*** MYSQL_DATABASE=pilates_db \
  ./database/scripts/backup-mysql.sh

# Verificação
./database/scripts/verify-backup.sh database/backups/studio-pilates_2026-06-23_10-00-00.sql.gz

# Restauração (pede confirmação "CONFIRMO")
MYSQL_USER=pilates_user MYSQL_PASSWORD=*** MYSQL_DATABASE=pilates_db \
  ./database/scripts/restore-mysql.sh database/backups/studio-pilates_2026-06-23_10-00-00.sql.gz
```

## Agendamento (cron) — exemplo

Os scripts **não configuram cron automaticamente** (depende do servidor de produção definido). Exemplo de agendamento diário às 3h, com log e variáveis carregadas de um arquivo de ambiente do servidor:

```cron
0 3 * * * . /etc/studio-pilates/backup.env && /caminho/para/database/scripts/backup-mysql.sh >> /var/log/studio-pilates/backup.log 2>&1
```

Onde `/etc/studio-pilates/backup.env` contém `export MYSQL_USER=...`, `export MYSQL_PASSWORD=...` etc. (arquivo com permissão restrita, fora do controle de versão).

## Procedimento de recuperação de desastre

1. **Localizar o backup**: backups ficam em `database/backups/` (ou no `BACKUP_DIR` configurado) com nome `studio-pilates_YYYY-MM-DD_HH-MM-SS.sql.gz`. Escolha o mais recente anterior ao incidente.
2. **Verificar integridade**: rode `verify-backup.sh <arquivo>` antes de restaurar — nunca restaure um backup não verificado.
3. **Restaurar**: rode `restore-mysql.sh <arquivo>` apontando para o banco de destino. Em um incidente real, restaure primeiro em um banco/ambiente temporário para validar antes de apontar a aplicação para ele.
4. **Validar dados restaurados**: confira pelo menos — contagem de tabelas principais (`alunos`, `usuarios`, `mensalidades`, `pagamentos`), um registro recente conhecido, e suba o backend apontando para o banco restaurado e confira `GET /api/v1/health`.
5. **Registrar o incidente**: documentar data/hora do incidente, causa raiz (se conhecida), backup utilizado, horário de início/fim da recuperação, e qualquer dado perdido entre o último backup e o incidente (RPO real).
6. **Tempo estimado de recuperação (RTO)**: para um dump de porte atual do projeto (banco pequeno/médio), restauração local tipicamente leva poucos minutos; o tempo total do incidente depende principalmente da etapa de validação manual (passo 4) e da reconfiguração da aplicação para apontar ao banco restaurado — estime 15–30 minutos ponta a ponta em condições normais.
