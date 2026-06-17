# 🧘 Sistema Pilates — Gerenciamento de Studio de Pilates

> Sistema web completo para gestão de studios de pilates: agenda de aulas, controle de presença, financeiro, alunos, professores, planos, relatórios, notificações, termos de uso e um portal de autoatendimento para o aluno.

[![Docker](https://img.shields.io/badge/Docker-20.10+-blue?logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-4-black?logo=fastify)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📌 Status

Backend e frontend implementados e funcionais em ambiente de desenvolvimento (Docker). Deploy em produção (VPS Hostinger) ainda pendente — ver seção [Deploy em Produção](#-deploy-em-produção-vps-hostinger).

| Área | Status |
|------|--------|
| Backend (API Fastify + Prisma + MySQL) | ✅ Implementado |
| Frontend administrativo (React) | ✅ Implementado |
| Portal do aluno (autoatendimento) | ✅ Implementado |
| Autenticação JWT + RBAC (4 perfis) | ✅ Implementado |
| Termos de uso e aceite eletrônico | ✅ Implementado |
| Deploy em produção (VPS Hostinger) | ⏳ Pendente |

---

## ✨ Funcionalidades

### Painel administrativo
- **Dashboard** — visão geral com indicadores do studio.
- **Alunos** — cadastro, edição, status e histórico.
- **Professores** — cadastro e gestão de professores.
- **Planos** — planos de aula e regras de contratação.
- **Modalidades** — modalidades oferecidas pelo studio.
- **Agenda** — criação de aulas, matrícula de alunos nas aulas e controle de capacidade.
- **Presença** — registro de presença restrito aos alunos matriculados na aula.
- **Acompanhamento** — evolução e frequência dos alunos.
- **Financeiro** — mensalidades, pagamentos, caixa e estornos.
- **Relatórios** — geração e exportação de dados (inclui exportação em Excel).
- **Notificações** — comunicação com alunos.
- **Termos de Uso** — versionamento de termos, publicação e registro de aceite eletrônico.
- **Usuários** — gestão de usuários e perfis de acesso.
- **Auditoria** — log de ações sensíveis no sistema.

### Portal do aluno (autoatendimento)
- **Dashboard** pessoal do aluno.
- **Agenda** — aulas do dia e próximas aulas.
- **Presença** — visualização do próprio histórico.
- **Financeiro** — mensalidades e pagamentos.
- **Notificações** recebidas.
- **Perfil** — dados pessoais.
- **Termos** — leitura e aceite da versão vigente do termo de uso.

---

## 🧰 Stack Tecnológico

**Frontend**
- React 19 + TypeScript
- Vite (build/dev server)
- Tailwind CSS + componentes Radix UI (padrão Shadcn/UI)
- React Router 7
- TanStack Query (React Query) + Axios
- React Hook Form + Zod
- Recharts (gráficos), jsPDF (PDF), Sonner (toasts), Lucide (ícones)

**Backend**
- Node.js 20 + TypeScript
- Fastify 4
- Prisma ORM 5 + MySQL 8
- JWT (`@fastify/jwt`) com refresh token + Bcrypt
- Zod (validação), ExcelJS (relatórios), Pino (logs)
- Vitest + Supertest (testes)
- Segurança: `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`, Swagger/OpenAPI

**Compartilhado**
- `packages/shared` — schemas/contratos (`@pilates/shared`) usados por backend e frontend.

**Infraestrutura**
- Docker + Docker Compose
- Nginx (proxy reverso)
- MySQL 8 (`utf8mb4`, timezone UTC)

---

## 🏛️ Arquitetura

Padrão em camadas no backend:

```
Request → Controller → Service → Repository → Prisma → MySQL
```

- **Controller:** recebe a requisição, valida e chama o service.
- **Service:** regra de negócio e orquestração das operações.
- **Repository:** acesso ao banco via Prisma.

Cada feature do backend é um módulo isolado em `backend/src/modules/`.

### Perfis de acesso (RBAC)

| Perfil | Descrição |
|--------|-----------|
| `ADMIN` | Acesso total ao sistema |
| `PROFESSOR` | Agenda, presença e acompanhamento |
| `RECEPCIONISTA` | Alunos, agenda e operação do dia a dia |
| `FINANCEIRO` | Mensalidades, pagamentos, caixa e estornos |

Alunos acessam o **portal do aluno** com login próprio (autoatendimento), separado dos usuários administrativos.

---

## 📁 Estrutura do Projeto

```
Sistema-pilates/
├── docker-compose.yml          → Orquestra os containers
├── .env.example                → Template de variáveis de ambiente
│
├── backend/                    → API Node.js + Fastify
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma        → 20 modelos (MySQL)
│   │   ├── migrations/          → Migrações versionadas
│   │   └── seed.ts              → Usuários e dados iniciais
│   └── src/
│       ├── modules/             → auth, alunos, professores, planos,
│       │                          modalidades, agenda, presenca,
│       │                          acompanhamento, financeiro, estornos,
│       │                          relatorios, notificacoes, configuracao,
│       │                          auditoria, termos
│       └── shared/              → utilitários, errors, middlewares
│
├── frontend/                   → React + Vite
│   ├── Dockerfile
│   └── src/
│       └── features/
│           ├── admin/           → painel administrativo
│           └── aluno/           → portal do aluno
│
├── packages/
│   └── shared/                 → schemas/contratos (@pilates/shared)
│
├── nginx/                      → proxy reverso (nginx.conf, conf.d, ssl)
└── docs/                       → documentação (modelagem, análise, planos)
```

---

## ✅ Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop) 20.10+
- Docker Compose (incluso no Docker Desktop)

> Tudo roda em containers — não é necessário instalar Node.js ou MySQL na máquina para desenvolver.

---

## 🚀 Como Executar (Docker)

### 1. Clonar o repositório

```bash
git clone https://github.com/AleckDevv/Sistema-pilates.git
cd Sistema-pilates
```

### 2. Configurar as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e, no mínimo, **troque os secrets de JWT** antes de usar em qualquer ambiente exposto:

```bash
# Gerar um secret seguro
openssl rand -base64 32
```

| Variável | Descrição |
|----------|-----------|
| `NODE_ENV` | `development` ou `production` |
| `MYSQL_ROOT_PASSWORD` | Senha root do MySQL |
| `MYSQL_USER` / `MYSQL_PASSWORD` | Credenciais da aplicação |
| `MYSQL_DATABASE` | Nome do banco (padrão `pilates_db`) |
| `JWT_SECRET` | Secret de assinatura do access token (**trocar**) |
| `JWT_REFRESH_SECRET` | Secret do refresh token (**trocar**) |
| `BACKEND_PORT` / `FRONTEND_PORT` | Portas expostas |
| `VITE_API_URL` | URL da API consumida pelo frontend |

### 3. Subir os containers

```bash
docker compose up --build -d
```

Na primeira subida o backend executa automaticamente `prisma generate` e `prisma migrate deploy`. Para popular usuários e dados iniciais, rode o seed:

```bash
docker compose exec backend npm run prisma:seed
```

### 4. Acessar

| Serviço | URL |
|---------|-----|
| Frontend (app React) | http://localhost:5173 |
| API v1 | http://localhost:3000/api/v1 |
| Health check | http://localhost:3000/api/v1/health |
| Swagger / OpenAPI | http://localhost:3000/documentation |
| Nginx (proxy reverso) | http://localhost |
| MySQL | localhost:3306 |

### 5. Credenciais padrão (após o seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | `admin@pilates.local` | `admin123` |
| Professora | `professora@pilates.local` | `prof123` |
| Recepcionista | `recep@pilates.local` | `rec123` |
| Financeiro | `financeiro@pilates.local` | `fin123` |

> ⚠️ Credenciais apenas para desenvolvimento. **Altere-as antes de qualquer uso real.**

---

## 🔧 Comandos Úteis

```bash
# Subir / parar
docker compose up -d
docker compose down

# Status e logs
docker compose ps
docker compose logs -f backend

# Acessar o container do backend
docker compose exec backend sh

# Rebuild apenas do backend
docker compose up -d --build backend

# Remover tudo (inclui volume do banco)
docker compose down -v
```

### Banco de dados (Prisma)

```bash
# Aplicar migrações
docker compose exec backend npm run prisma:migrate

# Popular dados iniciais
docker compose exec backend npm run prisma:seed

# Abrir o Prisma Studio
docker compose exec backend npm run prisma:studio

# Resetar o banco (cuidado: apaga dados)
docker compose exec backend npm run prisma:reset

# Acessar o MySQL via CLI
docker compose exec mysql mysql -u pilates_user -p pilates_db
```

---

## 🧪 Testes

```bash
# Rodar todos os testes
docker compose exec backend npm test

# Modo watch
docker compose exec backend npm run test:watch

# Cobertura
docker compose exec backend npm run test:coverage
```

---

## 💾 Banco de Dados

- **Motor:** MySQL 8.0 (`utf8mb4` / `utf8mb4_unicode_ci`, timezone UTC)
- **ORM:** Prisma 5
- **Modelos:** 20 (usuários, alunos, professores, planos, modalidades, aulas, presenças, inscrições, reposições, caixa, mensalidades, pagamentos, relatórios, notificações, auditoria, comprovantes, configuração do studio, estornos, termos de uso e aceites)
- **Migrações:** versionadas em `backend/prisma/migrations/` (aplicadas manualmente / via `prisma migrate deploy`)

---

## 🌐 Deploy em Produção (VPS Hostinger)

> ⏳ **Seção em construção.** O deploy em VPS da Hostinger ainda não foi configurado.

Planejado para esta etapa:
- Provisionamento da VPS e instalação do Docker / Docker Compose.
- Configuração de domínio e DNS.
- HTTPS via certificado SSL no Nginx (volume `nginx/ssl`).
- Variáveis de ambiente de produção (`NODE_ENV=production`, secrets JWT fortes, `VITE_API_URL` apontando para o domínio).
- Build de produção do frontend e do backend.
- Estratégia de backup do MySQL.

_As instruções detalhadas serão adicionadas aqui assim que o ambiente de produção for configurado._

---

## 🐛 Troubleshooting

**Porta já em uso** — ajuste as portas no `docker-compose.yml` (ex.: backend para `3001:3000`).

**MySQL não conecta** — aguarde a inicialização e confira os logs:
```bash
docker compose logs mysql   # procure por "ready for connections"
```

**Frontend em branco** — abra o DevTools (F12), veja o console e teste a API:
```bash
curl http://localhost:3000/api/v1/health
```

---

## 🤝 Contribuindo

Padrão de commits (Conventional Commits):

```bash
git commit -m "feat: adiciona matrícula de alunos na agenda"
git commit -m "fix: corrige fuso horário das aulas de hoje"
git commit -m "test: adiciona testes do TermosService"
git commit -m "chore: atualiza dependências"
```

---

## 👨‍💻 Desenvolvedor

Projeto desenvolvido por **[AleckDevv](https://github.com/AleckDevv)**

---

## 📄 Licença

Distribuído sob a licença MIT — veja [LICENSE](LICENSE) para detalhes.
