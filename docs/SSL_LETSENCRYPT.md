# SSL/HTTPS com Let's Encrypt — Studio de Pilates

Guia para emitir e renovar o certificado TLS usado pelo Nginx em produção (`nginx/conf.d/default.prod.conf`). A emissão real só deve ocorrer no servidor de produção, com domínio configurado e DNS já apontando para ele — **nunca gere certificados autoassinados ou falsos para produção**.

## 1. Pré-requisitos

- Um domínio próprio (ex.: `pilates.seudominio.com`), com registro DNS tipo `A` (ou `AAAA`) apontando para o IP público do servidor.
- Portas `80` e `443` liberadas no firewall do servidor e expostas pelo `docker-compose.prod.yml` (já configurado).
- `DOMAIN` e `SSL_EMAIL` preenchidos no `.env.production` (usados apenas para referência/documentação do processo; o Certbot é executado manualmente conforme abaixo).
- A stack de produção (`docker compose -f docker-compose.prod.yml up -d`) já rodando, servindo HTTP normalmente na porta 80 (o Nginx atual já tem a rota `/.well-known/acme-challenge/` preparada para o desafio do Certbot).

## 2. Emissão do certificado (modo webroot)

Como o Nginx do projeto já ocupa a porta 80, use o modo **webroot** do Certbot (não o `--standalone`, que exigiria parar o Nginx).

```bash
docker run --rm \
  -v studio-pilates_certbot_webroot:/var/www/certbot \
  -v "$(pwd)/nginx/ssl:/etc/letsencrypt/live/seu-dominio.com" \
  certbot/certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email admin@seu-dominio.com \
  --agree-tos --no-eff-email \
  -d seu-dominio.com
```

> Ajuste o nome do volume (`studio-pilates_certbot_webroot`) conforme o prefixo real gerado pelo Docker Compose — confira com `docker volume ls`.

Após a emissão, copie (ou monte) os arquivos gerados para os nomes esperados pelo Nginx:

```text
nginx/ssl/fullchain.pem
nginx/ssl/privkey.pem
```

Recarregue o Nginx para aplicar:

```bash
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## 3. Renovação automática

Certificados Let's Encrypt expiram em 90 dias. Exemplo de cron para renovação automática (rodando no host, fora do container, checando duas vezes ao dia conforme recomendação oficial do Certbot):

```cron
0 3,15 * * * docker run --rm -v studio-pilates_certbot_webroot:/var/www/certbot -v /caminho/para/nginx/ssl:/etc/letsencrypt/live/seu-dominio.com certbot/certbot renew --webroot --webroot-path=/var/www/certbot --quiet && docker compose -f /caminho/para/docker-compose.prod.yml exec nginx nginx -s reload
```

O Certbot só renova de fato quando o certificado está a ≤30 dias do vencimento — rodar o comando com mais frequência não tem efeito colateral.

## 4. Validação do certificado

```bash
# Verifica data de expiração e cadeia
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates -issuer

# Testa a resposta HTTPS real
curl -vI https://seu-dominio.com/api/v1/health
```

Confirme também:
- `http://seu-dominio.com` redireciona (301) para `https://`.
- O navegador não exibe aviso de certificado inválido/autoassinado.
- `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy` aparecem nos headers de resposta.

## 5. Rollback em caso de falha

Se a renovação ou uma nova emissão falhar e o Nginx não conseguir subir (certificado ausente/corrompido):

1. Restaure o backup mais recente de `nginx/ssl/fullchain.pem` e `nginx/ssl/privkey.pem` (mantenha sempre uma cópia fora do servidor antes de renovar).
2. Rode `docker compose -f docker-compose.prod.yml exec nginx nginx -t` para validar a configuração antes de recarregar.
3. Caso não haja backup utilizável, repita o passo 2 (emissão) — o Certbot é idempotente e pode reemitir sem custo adicional dentro dos limites de rate da Let's Encrypt (5 emissões por domínio a cada 7 dias).
4. Enquanto o certificado não é restabelecido, a stack pode ser temporariamente revertida para servir apenas HTTP removendo o redirecionamento 301 do bloco `:80` — **use apenas como medida emergencial de curtíssimo prazo**, nunca como configuração permanente.
