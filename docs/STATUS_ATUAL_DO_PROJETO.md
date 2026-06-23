# Status Atual do Projeto — Studio de Pilates

> Última atualização: trabalho de preparação para produção (Etapas 0–10 do plano de production readiness).
> Este é o documento de referência sobre o estado **real** do sistema — os documentos antigos em versões anteriores do projeto (Fase 1/2 iniciais) foram removidos por estarem desatualizados.

## 1. Arquitetura

Monólito modular: `Frontend React` → `Axios` → `API Fastify (/api/v1)` → `Controller → Service → Repository → Prisma ORM` → `MySQL`.

```
backend/src/
├── modules/          15 módulos (ver seção 3)
├── shared/           errors, middlewares (auth, RBAC), utils, schemas
├── events/           event-bus.ts (EventEmitter nativo)
├── jobs/             aulas-vencidas.job.ts, mensalidades-vencidas.job.ts
├── database/         prisma.client.ts
└── app.ts / server.ts

frontend/src/
├── features/admin/   15 features (espelham os módulos do backend)
├── features/aluno/   portal do aluno
├── components/       ErrorBoundary, UI (shadcn)
├── contexts/         AuthContext
└── routes/           ProtectedAdminRoute, ProtectedAlunoRoute

packages/shared/schemas/   Zod compartilhado entre frontend e backend
```

## 2. Tecnologias

**Backend**: Node.js, Fastify, TypeScript, Prisma ORM, MySQL, JWT (`@fastify/jwt`), Bcrypt, Zod, Pino, **Swagger/OpenAPI** (`@fastify/swagger` + `@fastify/swagger-ui`), Helmet, CORS, Rate Limit.

**Frontend**: React 19, TypeScript, Tailwind CSS, Shadcn/UI, React Router, React Query, Axios, React Hook Form, Zod, Recharts, Sonner.

**Testes**: Vitest (backend e frontend), Supertest-style via `fastify.inject()`, React Testing Library, MSW (mock de API no frontend). Playwright **adiado** (ver `docs/DECISOES_TECNICAS.md`).

**Infraestrutura**: Docker + Docker Compose (dev e produção separados), Nginx (reverse proxy + TLS em produção), GitHub Actions (CI).

## 3. Módulos implementados (15)

`auth, alunos, professores, planos, agenda, presenca, financeiro, notificacoes, auditoria, relatorios, configuracao, estornos, modalidades, termos, acompanhamento`

Todos com controller, service, repository, routes e testes (`__tests__/*.spec.ts`). RBAC aplicado via middleware `authorize(recurso, ação)` em todas as rotas protegidas.

## 4. Status real por fase (roadmap original)

| Fase | Status |
|---|---|
| 0 — Setup e qualidade | ✅ Concluída (ESLint + Prettier + Husky + lint-staged + npm scripts padronizados) |
| 1 — Modelagem | ✅ Concluída (DER, schema Prisma, migrations) |
| 2 — Backend base | ✅ Concluída (Fastify, Prisma, JWT, RBAC) |
| 3 — CRUD base | ✅ Concluída e expandida (15 módulos, não só os 3 originais) |
| 4 — Agenda | ✅ Concluída |
| 5 — Financeiro | ✅ Concluída |
| 6 — Dashboard/Auditoria | ✅ Concluída |
| 7 — Deploy | ✅ Infraestrutura pronta (Docker prod, Nginx+TLS, backup, CI) — falta apenas a emissão real do certificado Let's Encrypt em servidor com domínio público (não executável neste ambiente de desenvolvimento) |

## 5. Funcionalidades concluídas

- Autenticação JWT (access 15min / refresh 7d com rotação) + RBAC por papel (ADMIN, PROFESSOR, RECEPCIONISTA, FINANCEIRO, ALUNO).
- CRUD completo de alunos, professores, planos, modalidades.
- Agenda com conflito de horário, matrícula, presença, reposição.
- Financeiro: mensalidades, pagamentos, comprovantes, estornos com cálculo proporcional por presença.
- Auditoria de ações sensíveis, notificações (in-app, orientadas a eventos), relatórios com exportação Excel.
- Termos de uso com aceite rastreado.
- Portal do aluno (dashboard, agenda, presença, financeiro, perfil, notificações, termos).
- Documentação interativa da API em `/documentation` (Swagger UI).

## 6. Pendências técnicas conhecidas

- **Certificado SSL real**: requer domínio público + servidor de produção (ver `docs/SSL_LETSENCRYPT.md`) — não pode ser emitido neste ambiente.
- **npm workspaces**: não migrado (decisão documentada em `docs/DECISOES_TECNICAS.md`); o monorepo funciona via `file:` dependency + alias, validado e funcional.
- **Playwright (E2E)**: adiado até haver ambiente de homologação estável (decisão documentada em `docs/DECISOES_TECNICAS.md`).
- **`any` residual no frontend**: ~20 ocorrências pré-existentes em pontos de integração com react-hook-form (rebaixadas de erro para aviso no ESLint, não bloqueiam o lint, mas continuam como débito técnico para uma limpeza futura).
- **Deploy automático**: `.github/workflows/deploy.yml` é um placeholder com `workflow_dispatch` — sem credenciais, sem lógica de deploy real ainda.

## 7. Estratégia de testes

| Camada | Ferramenta | Cobertura |
|---|---|---|
| Backend unitário | Vitest (repositório mockado) | Regras de negócio dos 15 módulos |
| Backend integração | Vitest + `fastify.inject()` (app real + MySQL real) | Rotas, RBAC, validação, fluxos completos |
| Frontend unitário/componente | Vitest + React Testing Library + MSW | Login, rotas protegidas, permissões, formulários, ErrorBoundary, estados de loading/vazio, confirmação de ações sensíveis |

Backend: **202 testes**, 25 arquivos. Frontend: **25 testes**, 9 arquivos. Ambos com `test:coverage` configurado (v8 provider).

> Importante: os testes de rota do backend (`*.routes.spec.ts`, `app.spec.ts`) conectam a um MySQL real — não usam mocks. Localmente, use um banco descartável (nunca o banco de desenvolvimento pessoal). O CI sobe um serviço MySQL dedicado para isso.

## 8. Estratégia de deploy

Ver `docs/DEPLOY_PRODUCAO.md` para o passo a passo completo. Resumo:

```
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

- `docker-compose.yml` (raiz) = desenvolvimento (hot reload, `npm run dev`).
- `docker-compose.prod.yml` = produção (build otimizado, migrations em serviço dedicado único, backend roda `node dist/server.js` com usuário não-root, MySQL não exposto publicamente, Nginx com TLS).

## 9. Backup e restauração

Scripts em `database/scripts/`: `backup-mysql.sh`, `restore-mysql.sh`, `verify-backup.sh`. Procedimento de disaster recovery documentado em `database/scripts/README.md`. Validados manualmente: backup → verificação de integridade → restauração em banco temporário → conferência dos dados restaurados.

## 10. Swagger / documentação da API

Registrado em `backend/src/app.ts`. Disponível em `/documentation` (UI) e `/documentation/json` (spec OpenAPI). Tags por módulo, autenticação Bearer JWT documentada, rotas protegidas marcadas com cadeado automaticamente via hook `onRoute`.

## 11. Variáveis de ambiente

| Arquivo | Uso |
|---|---|
| `backend/.env.example` | Desenvolvimento local do backend |
| `.env.production.example` (raiz) | Template para `docker-compose.prod.yml` — copiar para `.env.production` e preencher (nunca commitar com valores reais) |
| `frontend/.env` (se existir) | `VITE_API_URL` e demais variáveis públicas (prefixo `VITE_*` obrigatório — nada sensível) |

## 12. Comandos principais

```bash
# Backend
cd backend
npm run dev              # desenvolvimento (tsx watch)
npm run build             # build de produção (tsc)
npm run test               # testes (requer DATABASE_URL apontando para um MySQL real)
npm run test:coverage
npm run lint / lint:fix
npm run format / format:check
npm run typecheck

# Frontend
cd frontend
npm run dev
npm run build
npm run test
npm run lint / lint:fix
npm run format / format:check
npm run typecheck

# Backup do banco
MYSQL_USER=... MYSQL_PASSWORD=... MYSQL_DATABASE=... ./database/scripts/backup-mysql.sh

# Deploy de produção
./scripts/deploy.sh .env.production
```

## 13. Fluxo de desenvolvimento

```bash
docker compose up -d        # mysql + backend (hot reload) + frontend (vite) + nginx dev
```

Hooks de git (Husky) rodam automaticamente: `pre-commit` formata/lint os arquivos staged; `pre-push` roda typecheck + testes rápidos (testes do backend só rodam no push se `DATABASE_URL` estiver definida no shell — o CI sempre roda a suíte completa).

## 14. Fluxo de produção

Ver `docs/DEPLOY_PRODUCAO.md`.
