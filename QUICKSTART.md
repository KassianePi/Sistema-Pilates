# ⚡ Quick Start — Sistema Pilates em Docker

## 🚀 3 minutos para rodar tudo

### Passo 1: Clone ou entre no diretório

```bash
cd ~/caminho/para/Sistema-pilates
```

### Passo 2: Copie o arquivo de ambiente

```bash
cp .env.example .env
# (Não precisa editar para desenvolvimento)
```

### Passo 3: Inicie os containers

```bash
# Primeira vez: Build + Start (pode levar 2-3 min)
docker compose up --build -d

# Ou sem --build se já buildou antes:
docker compose up -d
```

### Passo 4: Aguarde os serviços ficarem healthy

```bash
# Verificar status
docker compose ps

# Aguarde até ver "healthy" para mysql e backend
# Leva uns 10-20 segundos
```

### Passo 5: Acesse a aplicação

| Serviço | URL | O que é |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | App React |
| **API** | http://localhost:3000/api/v1/ | Endpoints da API |
| **Swagger** | http://localhost:3000/documentation | Documentação da API |
| **DB** | localhost:3306 | MySQL (via DBeaver/Workbench) |

---

## ✅ Verificar se está tudo OK

```bash
# 1. Verificar containers
docker compose ps
# Deve mostrar mysql, backend, frontend, nginx como UP

# 2. Testar health check
curl http://localhost:3000/api/v1/health
# Deve retornar: {"success":true,"data":{"status":"ok",...}}

# 3. Verificar logs
docker compose logs -f backend
# Deve mostrar "Server rodando em..."
```

---

## 🛑 Parar os containers

```bash
# Parar (mantém dados)
docker compose down

# Parar E remover volumes (LIMPA TUDO)
docker compose down -v
```

---

## 🔄 Reiniciar um serviço

```bash
# Reiniciar backend
docker compose restart backend

# Rebuild + restart backend
docker compose up -d --build backend
```

---

## 📊 Ver logs

```bash
# Backend
docker compose logs backend -f

# MySQL
docker compose logs mysql -f

# Frontend
docker compose logs frontend -f

# Todos
docker compose logs -f
```

---

## 🐛 Problemas comuns

### ❌ "Porta 3000 em uso"

```bash
# Mudar em docker-compose.yml:
# backend:
#   ports:
#     - "3001:3000"  ← Mudar primeiro número
```

### ❌ "MySQL não conecta"

```bash
# Aguarde mais 30s e tente novamente
docker compose logs mysql
# Procure por "ready for connections"
```

### ❌ "Frontend em branco"

```bash
# Abrir DevTools (F12)
# Ver console para erros de CORS/Network
# Testar API: curl http://localhost:3000/api/v1/health
```

---

## 📝 Estrutura criada

```
✅ docker-compose.yml      — Orquestra 4 containers
✅ backend/Dockerfile      — Build Node.js backend
✅ frontend/Dockerfile     — Build React frontend
✅ nginx/*.conf            — Proxy reverso
✅ .env                    — Variáveis de ambiente
✅ .env.example            — Template
```

---

## 🎯 Próximos passos

1. **Implementar Fase 2:** Backend Fastify + Auth
   - Seguir: `ANALISE_FASE_2.md` e `PLANO_EXECUCAO_FASE_2.md`

2. **Implementar Frontend:** React components
   - Seguir: Documentação de componentes

3. **Deploy:** Ir para produção
   - Usar: `DOCKER_SETUP.md` seção "Deploy em Produção"

---

## 💡 Dicas

- **Editar código?** Não precisa rebuild. Vite (frontend) e tsx/nodemon (backend) recarregam automaticamente
- **Adicionar dependência?** `npm install` dentro do container ou editar package.json + `docker compose up -d --build`
- **Acessar MySQL?** `docker compose exec mysql mysql -u pilates_user -p`
- **Ver tamanho das imagens?** `docker images | grep pilates`

---

**Pronto? Execute:**

```bash
docker compose up --build -d && sleep 30 && docker compose ps
```

**Abra o navegador:** http://localhost:5173

✅ **Tudo rodando!**
