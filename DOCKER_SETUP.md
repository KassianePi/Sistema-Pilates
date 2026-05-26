# 🐳 Sistema Pilates — Setup com Docker

**Status:** ✅ Pronto para rodar em containers  
**Versão:** 1.0.0  
**Última atualização:** 26 de Maio de 2026

---

## 📋 Sumário

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Rodar](#como-rodar)
- [Serviços](#serviços)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema está estruturado em **4 containers Docker** que trabalham juntos:

```
┌─────────────────────────────────────────┐
│         NGINX (Proxy Reverso)           │
│         Porta: 80, 443                  │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────────┐  ┌─────────────┐
│  Frontend   │  │   Backend   │
│   React     │  │  Fastify    │
│ Porta: 5173 │  │ Porta: 3000 │
└─────────────┘  └──────┬──────┘
                        │
                   ┌────▼────┐
                   │  MySQL   │
                   │3306      │
                   └──────────┘
```

---

## 📦 Pré-requisitos

### Windows / Mac / Linux

1. **Docker Desktop** (versão 20.10+)
   - [Download](https://www.docker.com/products/docker-desktop)
   - Instalar e iniciar

2. **Docker Compose** (normalmente vem com Docker Desktop)
   ```bash
   docker compose version
   ```

3. **Git** (opcional, para clonar repositório)

### Verificar instalação

```bash
# Verificar Docker
docker --version
# Output: Docker version 20.10.x, build ...

# Verificar Docker Compose
docker compose version
# Output: Docker Compose version v2.x.x

# Verificar se Docker está rodando
docker ps
# Sem erros = OK
```

---

## 📁 Estrutura do Projeto

```
Sistema-pilates/
├── backend/                    # Node.js + Fastify
│   ├── src/
│   │   ├── modules/
│   │   ├── shared/
│   │   ├── events/
│   │   ├── database/
│   │   └── ...
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React + Vite
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── database/                   # Inicialização do MySQL
│   └── init.sql
│
├── nginx/                      # Configuração do Nginx
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
│
├── docker-compose.yml          # Orquestração dos containers
├── .env                        # Variáveis de ambiente
├── .env.example                # Template de .env
└── README.md
```

---

## 🚀 Como Rodar

### 1️⃣ Clonar/Preparar o repositório

```bash
cd ~/seu-diretorio/Sistema-pilates
```

### 2️⃣ Configurar variáveis de ambiente

```bash
# Copiar template
cp .env.example .env

# Editar .env com suas configurações (opcional para desenvolvimento)
# Linux/Mac:
nano .env

# Windows (Notepad):
# Abrir Sistema-pilates\.env e editar
```

### 3️⃣ Construir e iniciar os containers

```bash
# Construir imagens (primeira vez)
docker compose build

# Ou: Build + Start em um comando
docker compose up --build

# Modo background (recomendado)
docker compose up -d --build
```

### 4️⃣ Verificar status

```bash
# Ver containers rodando
docker compose ps

# Output esperado:
# NAME              STATUS          PORTS
# pilates_mysql     Up (healthy)    3306/tcp
# pilates_backend   Up (healthy)    0.0.0.0:3000->3000/tcp
# pilates_frontend  Up              0.0.0.0:5173->5173/tcp
# pilates_nginx     Up              0.0.0.0:80->80/tcp
```

### 5️⃣ Testar endpoints

```bash
# Health check do backend
curl http://localhost:3000/api/v1/health
# Output: {"success":true,"data":{"status":"ok",...}}

# Frontend
# Abrir em browser: http://localhost:5173

# Swagger da API
# Abrir em browser: http://localhost:3000/documentation
```

---

## 📍 Acessar Serviços

| Serviço | URL | Porta |
|---------|-----|-------|
| Frontend React | http://localhost:5173 | 5173 |
| Backend API | http://localhost:3000 | 3000 |
| API v1 | http://localhost:3000/api/v1/ | 3000 |
| Swagger | http://localhost:3000/documentation | 3000 |
| MySQL | localhost:3306 | 3306 |
| Nginx | http://localhost:80 | 80 |

---

## 🔧 Comandos Úteis

### Gerenciar containers

```bash
# Iniciar containers em background
docker compose up -d

# Parar containers (mantém volumes)
docker compose down

# Parar e remover volumes (CUIDADO!)
docker compose down -v

# Reiniciar um serviço específico
docker compose restart backend

# Ver logs de um serviço
docker compose logs backend
docker compose logs backend -f  # Follow mode

# Ver logs de todos
docker compose logs -f

# Executar comando em um container
docker compose exec backend sh
docker compose exec mysql mysql -u pilates_user -p pilates_db
```

### Build e rebuild

```bash
# Build de uma imagem específica
docker compose build backend

# Build sem cache
docker compose build --no-cache

# Build e start
docker compose up -d --build
```

### Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não usadas
docker image prune

# Remover volumes não usados
docker volume prune

# Limpeza completa (CUIDADO!)
docker system prune -a
```

---

## 🌍 Variáveis de Ambiente

### Backend (.env)

```env
# Node environment
NODE_ENV=development              # development | production

# Database
DATABASE_URL=mysql://...          # URL de conexão MySQL
MYSQL_USER=pilates_user           # Usuário do MySQL
MYSQL_PASSWORD=pilates_pass       # Senha do MySQL
MYSQL_DATABASE=pilates_db         # Nome do banco

# JWT
JWT_SECRET=...                    # Secret para access token (mínimo 32 chars)
JWT_REFRESH_SECRET=...            # Secret para refresh token (mínimo 32 chars)

# Server
PORT=3000                         # Porta do Fastify
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api/v1  # URL da API
```

### Gerar JWT Secrets seguros

```bash
# Linux/Mac:
openssl rand -base64 32

# Ou com Python:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Windows (PowerShell):
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(([Guid]::NewGuid().ToString() + [Guid]::NewGuid().ToString())))
```

---

## 📊 Serviços

### MySQL (Banco de Dados)

```yaml
- Container: pilates_mysql
- Imagem: mysql:8.0
- Porta: 3306
- Usuário: pilates_user
- Senha: pilates_pass
- Banco: pilates_db
- Volumes: mysql_data (persistente)
```

**Conectar ao MySQL:**

```bash
# Via Docker
docker compose exec mysql mysql -u pilates_user -p

# Via DBeaver / MySQL Workbench
Host: localhost
Port: 3306
User: pilates_user
Password: pilates_pass
Database: pilates_db
```

### Backend (API Fastify)

```yaml
- Container: pilates_backend
- Imagem: Node.js 20 Alpine
- Porta: 3000
- ENV: /api/v1
- Health: GET /api/v1/health
- Swagger: GET /documentation
```

**Logs:**

```bash
docker compose logs backend -f
```

### Frontend (React)

```yaml
- Container: pilates_frontend
- Imagem: Node.js 20 Alpine
- Porta: 5173
- Framework: React + Vite
- Type: Development server
```

### Nginx (Proxy Reverso)

```yaml
- Container: pilates_nginx
- Imagem: nginx:alpine
- Porta: 80 (e 443 para HTTPS futuro)
- Função: Rotear requisições
```

---

## 🔐 Segurança

### Em Desenvolvimento

- Headers CORS habilitados para localhost
- Rate limiting: 100 req/15min
- JWT com secrets no .env
- Helmet ativo
- HTTPS desabilitado (usar Let's Encrypt em produção)

### Em Produção

⚠️ **IMPORTANTE:** Antes de fazer deploy:

1. Gerar JWT Secrets forte
2. Trocar MYSQL_PASSWORD
3. Habilitar HTTPS (Let's Encrypt)
4. Configurar CORS restritivo
5. Definir NODE_ENV=production
6. Remover mode desenvolvimento (npm run dev)

---

## 📈 Performance

### Otimizações implementadas

- **Gzip compression** no Nginx
- **Cache headers** para assets estáticos
- **Multi-stage Docker builds** (menor tamanho de imagem)
- **Alpine images** (menor footprint)
- **Worker threads** no backend
- **Connection pooling** no Prisma

### Monitoramento

```bash
# Uso de CPU/Memória dos containers
docker stats

# Tamanho das imagens
docker images

# Histórico de eventos
docker events --filter type=container
```

---

## 🐛 Troubleshooting

### "Docker daemon não está rodando"

```bash
# Windows/Mac: Abrir Docker Desktop
# Linux:
sudo systemctl start docker
```

### "Porta 3000 já está em uso"

```bash
# Mudar porta em docker-compose.yml:
backend:
  ports:
    - "3001:3000"  # Host:Container

# Ou: Matar processo na porta
# Linux/Mac:
lsof -i :3000 | awk 'NR!=1 {print $2}' | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "MySQL connection refused"

```bash
# Verificar se MySQL está healthy
docker compose ps

# Ver logs do MySQL
docker compose logs mysql

# Aguardar health check passar (até 30s)
docker compose up -d
sleep 30
docker compose logs mysql
```

### "Build failed: dependency not found"

```bash
# Limpar node_modules e reinstalar
docker compose down
docker volume prune -f
docker compose build --no-cache backend
docker compose up -d
```

### "API retorna 500 Internal Error"

```bash
# Ver logs detalhados
docker compose logs backend -f

# Entrar no container
docker compose exec backend sh

# Checar variáveis de ambiente
env | grep DATABASE_URL
```

### "Frontend não consegue conectar na API"

```bash
# Verificar VITE_API_URL
docker compose logs frontend | grep VITE_API_URL

# Verificar response da API
curl -v http://localhost:3000/api/v1/health

# Browser console (F12):
# Checar erro de CORS / Network
```

---

## 📚 Próximas Etapas

### Desenvolvimento

1. ✅ Fase 0: Setup Docker
2. ⏳ Fase 1: Modelagem (DER, Wireframes)
3. ⏳ Fase 2: Backend Fastify + Auth
4. ⏳ Fase 3: Frontend React + Componentes
5. ⏳ Fase 4: Integração completa

### Deploy em Produção

```bash
# Preparar para produção
NODE_ENV=production
docker compose -f docker-compose.yml up -d

# Com Docker Compose para produção (criar docker-compose.prod.yml)
docker compose -f docker-compose.prod.yml up -d
```

---

## 📞 Suporte

| Questão | Resposta |
|---------|----------|
| **Onde estão os logs?** | `docker compose logs [serviço] -f` |
| **Como resetar banco?** | `docker compose down -v && docker compose up -d` |
| **Backend não inicia?** | Verificar logs: `docker compose logs backend` |
| **Frontend em branco?** | Console do browser (F12) para erros |
| **Como acessar MySQL?** | `docker compose exec mysql mysql -u pilates_user -p` |

---

## 🎓 Referências

- **Docker Compose:** https://docs.docker.com/compose/
- **Docker Best Practices:** https://docs.docker.com/develop/dev-best-practices/
- **Fastify Docs:** https://www.fastify.io/docs/
- **React Docs:** https://react.dev/
- **Nginx Docs:** https://nginx.org/

---

**Pronto para começar? Execute:**

```bash
docker compose up -d --build
echo "🚀 Sistema rodando em http://localhost"
```

✅ **Tudo funcionando!**
