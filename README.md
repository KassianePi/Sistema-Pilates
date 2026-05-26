# 🎯 Sistema Pilates — Gerenciamento de Studio de Pilates

> Sistema web completo para gerenciamento de studios de pilates com agenda, financeiro, controle de alunos e muito mais.

[![Docker](https://img.shields.io/badge/Docker-20.10+-blue?logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue?logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📊 Status

| Fase | Status | Descrição |
|------|--------|-----------|
| **Fase 0** | ✅ Completa | Documentação, Arquitetura, Docker Setup |
| **Fase 1** | ✅ Completa | Modelagem (DER, Wireframes) |
| **Fase 2** | ⏳ Próxima | Backend Fastify + Autenticação |
| **Fase 3+** | ⏳ Planejada | Frontend React, Features, Deploy |

---

## 🚀 Quick Start

### 1. Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (versão 20.10+)
- Docker Compose (vem junto)

### 2. Iniciar em 3 comandos

```bash
# Entrar no diretório
cd ~/Sistema-pilates

# Copiar configuração
cp .env.example .env

# Iniciar tudo
docker compose up --build -d
```

### 3. Acessar

```
Frontend:  http://localhost:5173
API:       http://localhost:3000/api/v1/
Swagger:   http://localhost:3000/documentation
```

---

## 📦 Serviços

```
┌─────────────────────────────────────────┐
│         NGINX (Proxy Reverso)           │
│            localhost:80                 │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────────┐  ┌─────────────┐
│  Frontend   │  │   Backend   │
│   React     │  │  Fastify    │
│ :5173       │  │  :3000      │
└─────────────┘  └──────┬──────┘
                        │
                   ┌────▼────┐
                   │  MySQL   │
                   │  :3306   │
                   └──────────┘
```

---

## 📚 Documentação

### Começar Agora

- **[QUICKSTART.md](QUICKSTART.md)** — 5 passos para rodar (3-5 min)
- **[COMO_RODAR.txt](COMO_RODAR.txt)** — Visual com passo a passo

### Guias Completos

- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** — Guia completo de Docker (11 seções)
- **[STATUS_PROJETO.md](STATUS_PROJETO.md)** — Status + Roadmap + Checklist
- **[RESUMO_EXECUTIVO.md](RESUMO_EXECUTIVO.md)** — Resumo visual

### Desenvolvimento Futuro

- **[PLANO_EXECUCAO_FASE_2.md](PLANO_EXECUCAO_FASE_2.md)** — Como implementar Backend (19h em 10 partes)
- **[ANALISE_FASE_2.md](ANALISE_FASE_2.md)** — Análise técnica detalhada

---

## 🎯 Arquitetura

### Stack Tecnológico

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS + Shadcn/UI
- Vite (build rápido)
- React Query + Axios
- React Hook Form + Zod

**Backend:**
- Node.js 20 + TypeScript
- Fastify (framework web rápido)
- Prisma ORM + MySQL 8
- JWT (autenticação)
- Vitest + Supertest (testes)

**Infraestrutura:**
- Docker + Docker Compose
- Nginx (proxy reverso)
- MySQL (banco de dados)

### Padrão de Arquitetura

```
Request → Controller → Service → Repository → Prisma → MySQL
```

**Camadas:**
- **Controller:** Recebe request, valida, chama service
- **Service:** Lógica de negócio, orquestra operações
- **Repository:** Acesso ao banco de dados (Prisma)

---

## 📁 Estrutura

```
Sistema-pilates/
├── docker-compose.yml          ← Orquestra containers
├── .env                        ← Variáveis (desenvolvimento)
├── .env.example                ← Template
│
├── backend/                    ← Node.js + Fastify
│   ├── Dockerfile
│   ├── src/
│   │   ├── modules/            ← Features (auth, alunos, etc)
│   │   ├── shared/             ← Utilitários, errors, middlewares
│   │   └── database/           ← Prisma ORM
│   └── package.json
│
├── frontend/                   ← React + Vite
│   ├── Dockerfile
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── features/
│   └── package.json
│
├── nginx/                      ← Configuração proxy
│   ├── nginx.conf
│   └── conf.d/
│
└── docs/                       ← Documentação
    └── (modelagem, análise, planos)
```

---

## 🔧 Comandos Principais

```bash
# Iniciar
docker compose up -d

# Parar
docker compose down

# Ver status
docker compose ps

# Ver logs
docker compose logs -f backend

# Entrar no container
docker compose exec backend sh

# Banco de dados
docker compose exec mysql mysql -u pilates_user -p

# Rebuild
docker compose up -d --build backend

# Limpar tudo
docker compose down -v
```

---

## 🔐 Segurança

- ✅ CORS configurado
- ✅ Helmet headers
- ✅ Rate limiting (100 req/15min)
- ✅ Validação Zod em entradas
- ✅ JWT com refresh token rotation
- ✅ Bcrypt para senhas
- ✅ Sanitização de inputs

---

## 📊 Roadmap

### Fase 2: Backend Fastify + Auth (19h)
- [ ] Setup Fastify + TypeScript
- [ ] Prisma + MySQL
- [ ] Autenticação JWT
- [ ] RBAC (4 roles)
- [ ] Testes unitários
- [ ] Swagger/OpenAPI

### Fase 3: Frontend React (15h)
- [ ] Componentes base
- [ ] Páginas principais
- [ ] Integração com API
- [ ] Sistema de temas

### Fase 4-7: Features Completas
- [ ] Agenda + Presença
- [ ] Financeiro + Mensalidades
- [ ] Dashboard
- [ ] Deploy em produção

---

## 🧪 Testes

### Rodando testes

```bash
# Todos os testes
docker compose exec backend npm test

# Watch mode
docker compose exec backend npm run test:watch

# Cobertura
docker compose exec backend npm run test:coverage
```

### Metas

- Services: 80%+ cobertura
- Rotas críticas: 90%+ cobertura
- Utilitários: 100% cobertura

---

## 🌐 URLs Locais

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:5173 | App React |
| API v1 | http://localhost:3000/api/v1 | Endpoints REST |
| Health | http://localhost:3000/api/v1/health | Status API |
| Swagger | http://localhost:3000/documentation | Docs OpenAPI |
| MySQL | localhost:3306 | Banco de dados |
| Nginx | http://localhost | Proxy reverso |

---

## 💾 Banco de Dados

- **Motor:** MySQL 8.0
- **Driver:** Prisma ORM
- **Tabelas:** 13 (usuarios, alunos, professores, aulas, etc)
- **Migrations:** Automáticas

### Acessar MySQL

```bash
docker compose exec mysql mysql -u pilates_user -p pilates_db

# Senha: pilates_pass (padrão em dev)
```

---

## 🐛 Troubleshooting

### Porta já em uso

```bash
# Mudar porta em docker-compose.yml
# Exemplo: backend porta 3001 em vez de 3000
```

### MySQL não conecta

```bash
# Aguardar 30s
docker compose logs mysql
# Procure por "ready for connections"
```

### Frontend em branco

```bash
# Abrir DevTools (F12)
# Ver console para erros
# Testar API: curl http://localhost:3000/api/v1/health
```

Mais detalhes: Ver `DOCKER_SETUP.md` seção "Troubleshooting"

---

## 📞 Suporte

| Questão | Resposta |
|---------|----------|
| Como rodar? | `docker compose up --build -d` |
| Como parar? | `docker compose down` |
| Logs do backend? | `docker compose logs -f backend` |
| Ver status? | `docker compose ps` |
| Banco de dados? | `docker compose exec mysql mysql -u pilates_user -p` |

---

## 📖 Leitura Recomendada

1. **[QUICKSTART.md](QUICKSTART.md)** (5 min) — Rodar rápido
2. **[DOCKER_SETUP.md](DOCKER_SETUP.md)** (20 min) — Entender arquitetura
3. **[STATUS_PROJETO.md](STATUS_PROJETO.md)** (20 min) — Status + roadmap
4. **[PLANO_EXECUCAO_FASE_2.md](PLANO_EXECUCAO_FASE_2.md)** (40 min) — Próxima implementação

---

## 🤝 Contribuindo

Este é um projeto em desenvolvimento. Siga `PLANO_EXECUCAO_FASE_2.md` para implementar novas features.

### Commit padrão (Conventional Commits)

```bash
git commit -m "feat: adiciona autenticação JWT"
git commit -m "fix: corrige login com email duplicado"
git commit -m "test: adiciona testes do AuthService"
git commit -m "chore: atualiza dependências"
```

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes

---

## 👨‍💻 Desenvolvedor

Projeto desenvolvido com ❤️ para gerenciamento de studios de pilates

**Contato:** [as3434126@gmail.com](mailto:as3434126@gmail.com)

---

## 🎉 Começar Agora

```bash
docker compose up --build -d
sleep 30
docker compose ps

# Abra: http://localhost:5173
```

**Status:** ✅ **PRONTO PARA DESENVOLVIMENTO**

Qualquer dúvida, consulte a documentação ou abra uma issue!
