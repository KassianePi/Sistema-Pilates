# 🐳 Docker Setup — Sistema Studio de Pilates

**Versão:** 1.0  
**Data:** 26 de Maio de 2026  
**Status:** ✅ Pronto para desenvolvimento

---

## 📋 Pré-requisitos

- **Docker** (v20.0+)
- **Docker Compose** (v1.29+)

Verificar:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start (5 minutos)

### 1️⃣ Copiar variáveis de ambiente

```bash
cd docker
cp .env.example .env
```

### 2️⃣ Subir containers

```bash
# Na pasta docker/ ou raiz do projeto
docker compose up -d
```

### 3️⃣ Aguardar MySQL inicializar (30-60s)

```bash
docker compose logs -f mysql
# Procurar por: "Ready for connections"
```

### 4️⃣ Acessar interfaces

- **Adminer:** http://localhost:8080
  - Server: `mysql`
  - User: `pilates_user`
  - Password: `pilates_pass`
  - Database: `pilates_db`

---

## 📂 Estrutura de Arquivos

```
docker/
├── docker-compose.yml    ← Orquestra containers
├── .env                  ← Variáveis (não commitar!)
├── .env.example          ← Template (commitar)
├── .gitignore           ← Proteger .env
├── config/
│   └── mysql.cnf        ← Configurações MySQL
└── README.md            ← Este arquivo
```

---

## 🔧 Arquivos de Configuração

### docker-compose.yml

Define:
- MySQL 8.0-alpine
- Adminer (interface web)
- Volumes para persistência
- Network para comunicação

**Paths relativos:**
- `../database/scripts/init.sql` → Script de inicialização
- `./config/mysql.cnf` → Configuração MySQL

### .env

Variáveis sensíveis (NUNCA commitar):
- `MYSQL_PASSWORD` → Senha do banco
- `JWT_SECRET` → Chave JWT
- `DATABASE_URL` → Conexão (para backend)

**Importante:** Usar `mysql` como hostname em Docker (não localhost)

### mysql.cnf

Configurações otimizadas:
- UTF8MB4 (suporta emojis e caracteres especiais)
- InnoDB (storage engine)
- Slow query log
- Performance schema

---

## ⚡ Comandos Principais

### Status

```bash
# Ver containers rodando
docker compose ps

# Ver logs do MySQL
docker compose logs -f mysql

# Ver logs do Adminer
docker compose logs -f adminer
```

### Operações

```bash
# Parar (mantém dados)
docker compose stop

# Reiniciar
docker compose restart

# Parar e remover (mantém dados em volume)
docker compose down

# Parar e remover TUDO (apaga dados!)
docker compose down -v
```

### Backup/Restauração

```bash
# Backup da base de dados
docker compose exec mysql mysqldump -u pilates_user -p pilates_db > backup.sql

# Restaurar
docker compose exec -T mysql mysql -u pilates_user -p pilates_db < backup.sql
```

---

## 🔐 Acessar MySQL via CLI

### Via Docker

```bash
docker compose exec mysql mysql -u pilates_user -p pilates_db
# Ou como root
docker compose exec mysql mysql -u root -p
```

### Via MySQL Client Local

```bash
# Instalar (se não tiver)
# macOS: brew install mysql-client
# Ubuntu: sudo apt install mysql-client

mysql -h 127.0.0.1 -u pilates_user -p pilates_db
# Senha: pilates_pass
```

---

## 📊 Dados Iniciais

Ao iniciar, o script `database/scripts/init.sql` executa automaticamente:

- ✅ Cria 13 tabelas
- ✅ Cria 40+ índices
- ✅ Cria 6 stored procedures
- ✅ Cria 3 triggers
- ✅ Cria 2 views
- ✅ Insere 4 usuários de teste
- ✅ Insere 1 professor
- ✅ Insere 1 aluno
- ✅ Insere 1 plano ativo

---

## 🔥 Troubleshooting

### ❌ "Connection refused" ao abrir Adminer

**Causa:** MySQL ainda está iniciando  
**Solução:** Aguardar 30-60 segundos

```bash
docker compose logs mysql | grep "Ready for"
```

### ❌ "Port 3306 already in use"

**Causa:** Outro MySQL/Docker usando porta  
**Solução:** Mudar porta no .env

```env
MYSQL_PORT=3307  # ao invés de 3306
```

Reiniciar:
```bash
docker compose down
docker compose up -d
```

### ❌ "Tables not created"

**Causa:** init.sql não foi executado  
**Solução:** Remover volume e reiniciar

```bash
docker compose down -v
docker compose up -d
# Aguardar 60s
```

### ❌ "Permission denied" em .env

**Causa:** Arquivo sem permissão de leitura  
**Solução:**

```bash
chmod 644 .env
docker compose down
docker compose up -d
```

### ❌ Erro "out of memory"

**Causa:** Docker sem RAM suficiente  
**Solução:** Aumentar alocação de memória Docker

---

## 📚 Variáveis Importantes

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MYSQL_PORT` | 3306 | Porta MySQL |
| `MYSQL_DATABASE` | pilates_db | Nome do banco |
| `MYSQL_USER` | pilates_user | Usuário (não root) |
| `MYSQL_PASSWORD` | pilates_pass | Senha do usuário |
| `MYSQL_ROOT_PASSWORD` | root123 | Senha root |
| `ADMINER_PORT` | 8080 | Porta Adminer |
| `DATABASE_URL` | - | URL conexão (backend) |

**Importante:** Em produção, gerar senhas fortes!

---

## 🔗 Conexão do Backend

### Variável DATABASE_URL

```env
# DESENVOLVIMENTO (Docker)
DATABASE_URL=mysql://pilates_user:pilates_pass@mysql:3306/pilates_db

# PRODUÇÃO
DATABASE_URL=mysql://user:pass@host.com:3306/pilates_db
```

**Nota:** Em Docker, usar nome do container (`mysql`) como hostname

---

## 🎯 Próximas Etapas

1. **Backend (Fase 2):**
   - Setup Node.js + Fastify
   - Conectar ao MySQL via DATABASE_URL

2. **Frontend (Fase 2):**
   - Setup React + TypeScript
   - Conectar à API via VITE_API_URL

3. **Produção (Fase 7):**
   - Usar RDS/CloudSQL ao invés de Docker
   - Nginx como reverse proxy
   - SSL/TLS

---

## 📞 Suporte

### Para mais informações

- `../docs/4-DOCKER/DOCKER_SETUP_COMPLETO.md` — Setup resumido
- `../docs/1-START/README_DOCKER.md` — Guia completo

### Verificação rápida

```bash
# Status
docker compose ps

# Logs
docker compose logs mysql

# Testar conexão
docker compose exec mysql mysqladmin ping
```

---

## ✅ Checklist de Setup

- [ ] Docker instalado
- [ ] Pasta `docker/` existe
- [ ] `.env` criado (cópia de `.env.example`)
- [ ] `docker compose up -d` executado
- [ ] MySQL está "healthy" (`docker compose ps`)
- [ ] Adminer acessível (http://localhost:8080)
- [ ] Consegue fazer login no Adminer
- [ ] Vê as 13 tabelas
- [ ] Consegue executar queries SQL

---

**Status:** ✅ Pronto para usar  
**Versão:** 1.0  
**Última atualização:** 26 de Maio de 2026
