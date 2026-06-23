# Deploy em Produção — Studio de Pilates

Guia passo a passo para colocar o sistema em produção em uma VPS própria.

## 1. Pré-requisitos do servidor

- Docker Engine + Docker Compose v2 instalados.
- Domínio próprio com DNS apontando para o IP do servidor (ver seção 2).
- Portas `80` e `443` liberadas no firewall.
- Pelo menos 2 vCPUs / 2GB RAM recomendado (MySQL + backend + frontend + Nginx rodando simultaneamente).
- Acesso SSH ao servidor.

## 2. Domínio e DNS

1. Registre um domínio (ou subdomínio) para o sistema, ex.: `pilates.seudominio.com`.
2. Crie um registro DNS tipo `A` apontando para o IP público do servidor.
3. Aguarde a propagação do DNS antes de tentar emitir o certificado SSL (`dig pilates.seudominio.com` deve retornar o IP correto).

## 3. Variáveis de ambiente

```bash
cp .env.production.example .env.production
```

Preencha **todos** os campos de `.env.production` (nunca commitar este arquivo — já está no `.gitignore`):

- `JWT_SECRET` e `JWT_REFRESH_SECRET`: gere com `openssl rand -base64 32` (use valores **diferentes** para cada um).
- `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`: senhas fortes, únicas para este ambiente.
- `DATABASE_URL`: deve ser consistente com as credenciais MySQL acima (`mysql://usuario:senha@mysql:3306/database`).
- `CORS_ORIGIN`: o domínio real do frontend em produção (com `https://`).
- `DOMAIN` e `SSL_EMAIL`: usados na emissão do certificado (seção 6).

## 4. Build e subida dos containers

```bash
./scripts/deploy.sh .env.production
```

O script:
1. Valida que as variáveis obrigatórias estão preenchidas.
2. Builda as imagens de produção (`docker-compose.prod.yml`).
3. Sobe os containers (`mysql`, `migrate`, `backend`, `frontend`, `nginx`).
4. Aguarda os healthchecks ficarem saudáveis.
5. Roda `scripts/healthcheck.sh` para confirmar que a stack está respondendo.

Para rodar manualmente (sem o script):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

> **Nunca** use `docker-compose.yml` (sem o `.prod`) em produção — esse é o compose de desenvolvimento (hot reload, `npm run dev`).

## 5. Migrations

As migrations rodam automaticamente em um serviço dedicado (`migrate`) que executa `npx prisma migrate deploy` **uma única vez** antes do backend subir — evita concorrência entre múltiplos containers de backend aplicando migrations simultaneamente. O backend sobe com `SKIP_MIGRATE=1` e não tenta reaplicar.

Para rodar uma migration manualmente (ex.: após adicionar uma nova migration ao repositório):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate
```

## 6. SSL — Let's Encrypt

Ver guia completo em `docs/SSL_LETSENCRYPT.md`. Resumo:

1. Suba a stack primeiro (Nginx já serve HTTP normalmente, com a rota `/.well-known/acme-challenge/` preparada).
2. Emita o certificado via Certbot em modo webroot.
3. Copie `fullchain.pem` e `privkey.pem` para `nginx/ssl/`.
4. Recarregue o Nginx: `docker compose -f docker-compose.prod.yml exec nginx nginx -s reload`.
5. Configure a renovação automática via cron (exemplo no guia).

**Sem certificado válido, a stack de produção não deve ser exposta publicamente** — o bloco HTTPS do Nginx (`nginx/conf.d/default.prod.conf`) exige `nginx/ssl/fullchain.pem` e `nginx/ssl/privkey.pem` para iniciar.

## 7. Backup

Configure o backup automático via cron no servidor (exemplo em `database/scripts/README.md`):

```cron
0 3 * * * . /etc/studio-pilates/backup.env && /caminho/para/database/scripts/backup-mysql.sh >> /var/log/studio-pilates/backup.log 2>&1
```

Valide manualmente pelo menos uma vez após o primeiro deploy:

```bash
MYSQL_USER=... MYSQL_PASSWORD=... MYSQL_DATABASE=... ./database/scripts/backup-mysql.sh
./database/scripts/verify-backup.sh database/backups/studio-pilates_<data>.sql.gz
```

## 8. Logs

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f nginx
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f mysql
```

Logs do backend são estruturados (Pino, JSON) — cada linha inclui `requestId` para rastrear uma requisição específica.

## 9. Rollback

1. **Aplicação**: faça checkout da tag/commit anterior e rode `./scripts/deploy.sh .env.production` novamente — o Docker reconstrói as imagens com o código revertido.
2. **Banco de dados**: se uma migration causou problema, restaure o backup mais recente anterior ao deploy (ver `database/scripts/README.md`, seção "Procedimento de recuperação de desastre") — Prisma não reverte migrations automaticamente em produção.
3. **Certificado SSL**: mantenha sempre uma cópia de `nginx/ssl/` fora do servidor; em caso de falha na renovação, restaure a cópia anterior enquanto investiga.

## 10. Validação pós-deploy

Checklist mínimo após cada deploy:

- [ ] `curl https://seu-dominio.com/api/v1/health` retorna `{"success":true,...}`.
- [ ] `https://seu-dominio.com` carrega a tela de login.
- [ ] Login administrativo funciona (token emitido, redirecionamento correto por role).
- [ ] `https://seu-dominio.com/documentation` carrega o Swagger UI.
- [ ] HTTP redireciona para HTTPS (`curl -I http://seu-dominio.com` deve retornar 301).
- [ ] Headers de segurança presentes (`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`).
- [ ] `docker compose -f docker-compose.prod.yml ps` mostra todos os serviços `healthy`.
- [ ] Backup de pós-deploy gerado e verificado.
