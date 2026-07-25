# Documentação do Sistema — Studio de Pilates

---

# 1. Visão Geral do Sistema

Sistema web completo para gerenciamento de um studio de pilates, contendo:

- Cadastro de alunos, professores e planos
- Controle financeiro (mensalidades, pagamentos, comprovantes, estornos)
- **Geração automática de mensalidades** (job recorrente + gatilho imediato após pagamento)
- **Cobrança via PIX** (gateway Mercado Pago) com sincronização e expiração automática
- Agenda de aulas com matrícula, conflito de horário, cancelamento/reagendamento com justificativa
- Controle de presença (individual e em lote) e reposição de aula (restrita ao mesmo mês)
- Avaliação corporal do aluno (com fotos) e evolução por aula
- Painel de acompanhamento 360º de risco do aluno
- Dashboard administrativo
- Relatórios com exportação Excel
- Controle de usuários e permissões (RBAC)
- Auditoria e logs
- Notificações (in-app, orientadas a eventos)
- Termos de uso com aceite rastreado
- Portal de autoatendimento do aluno (dashboard, agenda, presença, financeiro, PIX, avaliações, notificações, perfil, termos)
- Backup automático

> Status geral: sistema em produção funcional em ambiente de desenvolvimento (Docker), com infraestrutura de produção pronta (ver [seção 36](#36-status-atual-do-projeto)). Falta apenas a emissão do certificado SSL real em servidor com domínio público.

Arquitetura planejada para:

- Fácil manutenção
- Escalabilidade gradual
- Segurança
- Deploy simplificado
- Operação em VPS própria

---

# 2. Arquitetura Geral

## Modelo Arquitetural

**Arquitetura Monolítica Modular.** Motivos da escolha:

- Menor complexidade operacional
- Deploy simples
- Melhor produtividade
- Facilidade de manutenção
- Melhor consistência transacional
- Escalabilidade suficiente para o projeto

## Estrutura preparada para futura extração de serviços específicos.

# 3. Stack Tecnológica

## Frontend

- React
- TypeScript
- Tailwind CSS
- Shadcn/UI
- React Router
- React Query (TanStack Query)
- Axios
- React Hook Form
- Zod
- Recharts
- Sonner
- Lucide Icons

---

## Backend

- Node.js
- Fastify
- TypeScript
- Prisma ORM
- MySQL
- JWT
- Bcrypt
- Zod
- Pino Logger
- Swagger/OpenAPI
- Helmet
- **node-cron** — agendamento dos jobs recorrentes (geração automática de mensalidades)
- **mercadopago** (SDK oficial) — gateway de cobrança PIX

---

## Teste

- Vitest (unitários e integração)
- Testes de rota via `fastify.inject()` (padrão Supertest)
- React Testing Library + MSW (frontend)
- Playwright (E2E — fase futura, adiado por decisão explícita — ver [seção 39](#39-decisões-técnicas))

---

## Infraestrutura

- VPS Hostinger
- Docker + Docker Compose _(substitui PM2 — ver seção 21)_
- Nginx (com config de produção + TLS)
- SSL Let's Encrypt (guia completo na [seção 40](#40-deploy-em-produção))
- GitHub
- GitHub Actions ✅ CI implementado (`.github/workflows/ci.yml`); CD ainda placeholder (ver [seção 36](#36-status-atual-do-projeto))
- Redis (futuro — ainda não implementado)
- BullMQ (futuro — ainda não implementado; jobs recorrentes hoje usam `node-cron` nativo)

---

# 4. Estrutura da Arquitetura

## Fluxo Geral

```
Frontend React
  ↓ Axios Client
API Fastify (/api/v1)
  ↓ Controller
  ↓ Service
  ↓ Repository
  ↓ Prisma ORM
  ↓ MySQL
```

---

# 5. Estrutura Backend

```
backend/
└── src/
    ├── modules/              20 módulos implementados (ver seção 36)
    │   ├── auth/
    │   ├── alunos/
    │   ├── professores/
    │   ├── planos/
    │   ├── modalidades/
    │   ├── agenda/
    │   ├── presenca/
    │   ├── reposicoes/
    │   ├── financeiro/         (comprovantes e estornos como sub-rotas)
    │   ├── estornos/
    │   ├── pagamentos-pix/     ← gateway Mercado Pago
    │   ├── mensalidades-automaticas/
    │   ├── avaliacoes/         ← avaliação corporal do aluno
    │   ├── evolucoes/          ← evolução por aula
    │   ├── acompanhamento/     ← visão 360º de risco do aluno
    │   ├── notificacoes/
    │   ├── auditoria/
    │   ├── relatorios/
    │   ├── configuracao/       (dados do studio, PIX, geração automática)
    │   └── termos/             (termos de uso + aceite)
    │
    ├── shared/
    │   ├── errors/
    │   ├── middlewares/
    │   ├── utils/
    │   ├── constants/
    │   └── types/
    │
    ├── events/
    │   └── event-bus.ts        ← EventEmitter nativo do Node.js
    │
    ├── jobs/                    4 jobs (ver seção 20)
    │
    ├── database/
    │   ├── prisma/
    │   ├── migrations/
    │   └── prisma.client.ts
    │
    ├── config/
    ├── middlewares/
    ├── app.ts
    └── server.ts
```

---

# 6. Estrutura dos Módulos

## Exemplo: módulo alunos

```
alunos/
├── dto/
│   ├── create-aluno.dto.ts
│   └── update-aluno.dto.ts
│
├── aluno.controller.ts
├── aluno.service.ts
├── aluno.repository.ts
├── aluno.routes.ts
├── aluno.schema.ts
├── aluno.types.ts
└── aluno.constants.ts
```

---

# 7. Responsabilidade das Camadas

## Controller

Responsável por:

- Receber request
- Retornar response
- Validar entrada
- Chamar services Não deve conter regra de negócio.

## Service

Responsável por:

- Regras de negócio
- Validações operacionais
- Fluxos internos
- Coordenação entre módulos

## Repository

Responsável por:

- Acesso ao banco
- Queries Prisma
- Persistência

## DTO

Responsável por:

- Padronização de payloads
- Transformação de dados
- Separação entre domínio e entrada

---

# 8. Estrutura Frontend

```
frontend/
└── src/
    ├── pages/
    ├── components/
    │   └── ErrorBoundary.tsx   ← obrigatório para produção
    ├── services/
    ├── hooks/
    ├── contexts/
    ├── layouts/
    ├── routes/
    ├── lib/
    ├── types/
    ├── schemas/
    └── features/
```

---

# 9. Organização Frontend por Features

```
features/
├── admin/            16 features (espelham os módulos do backend)
│   ├── dashboard/
│   ├── alunos/
│   ├── professores/
│   ├── planos/
│   ├── modalidades/
│   ├── agenda/
│   ├── financeiro/
│   ├── avaliacoes/
│   ├── evolucoes/
│   ├── reposicoes/
│   ├── acompanhamento/
│   ├── notificacoes/
│   ├── relatorios/
│   ├── usuarios/
│   ├── termos/
│   └── perfil/        (professor — também concentra config do studio/PIX)
│
└── aluno/            portal de autoatendimento
    ├── dashboard/
    ├── agenda/
    ├── presenca/
    ├── financeiro/     (mensalidades, comprovantes, PIX, estorno)
    ├── avaliacoes/     (somente leitura)
    ├── notificacoes/
    ├── perfil/
    ├── termos/         (aceite + PDF)
    ├── components/
    ├── hooks/
    ├── constants/
    └── utils/
```

Cada feature segue internamente a mesma organização (`components/`, `hooks/`, `services/`, `schemas/`, `pages/`, `types/`), aplicada com a profundidade que o domínio exigir.

Objetivo:

- Isolamento de domínio
- Escalabilidade
- Redução de acoplamento

---

# 10. Schemas Compartilhados (Zod)

Schemas Zod são definidos **uma única vez** e reutilizados nos dois lados da aplicação.

## Estrutura

```
packages/
└── shared/
    └── schemas/
        ├── aluno.schema.ts
        ├── pagamento.schema.ts
        ├── agenda.schema.ts
        └── auth.schema.ts
```

## Exemplo de uso

```typescript
// packages/shared/schemas/aluno.schema.ts
import { z } from 'zod'

export const createAlunoSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  telefone: z.string().min(10),
  planoId: z.string().uuid(),
})

export type CreateAlunoDTO = z.infer<typeof createAlunoSchema>
```

```typescript
// backend: aluno.controller.ts
import { createAlunoSchema } from '@shared/schemas/aluno.schema'

// frontend: AlunoForm.tsx
import { createAlunoSchema } from '@shared/schemas/aluno.schema'
```

## Configuração (npm workspaces)

```json
// package.json raiz
{
  "workspaces": ["frontend", "backend", "packages/shared"]
}
```

---

# 11. Gerenciamento de Estado

## React Query

Responsável por:

- Cache
- Sincronização
- Invalidação
- Loading states
- Refetch automático

## Context API

Usar apenas para:

- Autenticação
- Sessão
- Tema Evitar Context para dados de API.

---

# 12. Segurança

## Implementações Obrigatórias

- HTTPS
- JWT
- Refresh Token
- Bcrypt
- Helmet
- CORS
- Rate Limit
- Validação Zod (schemas compartilhados)
- Sanitização de inputs
- Logs de acesso
- Middleware de autenticação
- RBAC
- Proteção SQL Injection
- Variáveis de ambiente
- Backup automático

---

# 13. Estratégia JWT

## Access Token

- Curta duração (15 minutos)
- Armazenado em memória (variável JS)

## Refresh Token

- Longa duração (7 dias)
- Armazenado em cookie httpOnly
- Rotação obrigatória a cada uso
- Invalidado no logout

---

# 14. RBAC (Role Based Access Control)

Entidades: `Role`, `Permission`, `UserRole`, `RolePermission`

## Perfis iniciais

|Perfil|Acesso|
|---|---|
|Admin|Total|
|Recepcionista|Agenda, Alunos, Presença|
|Professor|Agenda própria, Presença|
|Financeiro|Financeiro, Relatórios|

---

# 15. Banco de Dados

## Entidades Principais

Schema atual: **27 models, 24 enums** (`backend/prisma/schema.prisma`).

- Usuário (RBAC por campo `funcao`, não por tabelas `Role`/`Permission` separadas — ver nota abaixo)
- Aluno, Professor, Plano, Modalidade
- Aula, InscricaoAula, Presença, Reposição
- Caixa, Movimentação Financeira
- Mensalidade, Pagamento, ComprovantePagamento, Estorno
- **CobrancaPix, WebhookMercadoPago** — cobrança e conciliação PIX (gateway Mercado Pago)
- **JobLock, ExecucaoJobMensalidades** — controle de concorrência e auditoria da geração automática de mensalidades
- **AvaliacaoCorporal, AvaliacaoFoto** — avaliação corporal do aluno
- **EvolucaoAula** — evolução do aluno por aula
- **ConfiguracaoStudio** — dados do studio, chave PIX, parâmetros de geração automática
- **TermoUso, TermoAceite** — termos de uso versionados + aceite rastreado
- Relatório
- Notificação
- LogAuditoria

> Nota: o RBAC descrito na seção 14 (`Role`/`Permission`/`UserRole`/`RolePermission`) foi simplificado na implementação real para um enum `FuncaoUsuario` (`ADMIN`, `PROFESSOR`, `RECEPCIONISTA`, `FINANCEIRO`, `ALUNO`) direto no model `Usuario`, checado pelo middleware `authorize(recurso, ação)` — sem tabelas de permissão dinâmica. Simplificação válida enquanto os perfis forem fixos; migrar para tabelas dinâmicas só se surgir necessidade real de perfis customizáveis.

---

# 16. Modelagem do Sistema

## Documentos obrigatórios

- DER
- Fluxo operacional
- Casos de uso
- Fluxo financeiro
- Fluxo matrícula
- Fluxo agenda
- Fluxo inadimplência **Ferramenta:** [Draw.io / Diagrams.net](https://app.diagrams.net/)

---

# 17. Fluxos Críticos do Sistema

## Agenda

Regras importantes:

- Conflito de horários
- Recorrência
- Limite de vagas
- Cancelamento
- Reposição
- Presença
- Professor substituto
- Feriados

## Financeiro

Separar:

- Contas a pagar
- Contas a receber
- Fluxo de caixa
- Categorias
- Métodos de pagamento
- Inadimplência
- Relatórios

---

# 18. Auditoria e Logs

## Registrar:

- Login / logout
- Alteração financeira
- Exclusões
- Alterações críticas
- Permissões
- Erros internos

---

# 19. Sistema de Eventos

## Objetivo

Desacoplar regras internas sem adicionar complexidade prematura.

## Implementação atual (Node.js nativo)

```typescript
// src/events/event-bus.ts
import { EventEmitter } from 'node:events'

export const eventBus = new EventEmitter()
```

```typescript
// Emitir evento (ex: dentro do AlunoService)
eventBus.emit('aluno.criado', { id: aluno.id, nome: aluno.nome })

// Ouvir evento (ex: módulo de auditoria)
eventBus.on('aluno.criado', async (aluno) => {
  await auditoriaService.registrar('ALUNO_CRIADO', aluno)
})

// Ouvir evento (ex: módulo de notificações)
eventBus.on('aluno.criado', async (aluno) => {
  await notificacaoService.boasVindas(aluno)
})
```

## Eventos implementados

|Evento|Gatilho|Listener|
|---|---|---|
|`aluno.criado`|Novo cadastro de aluno|reservado (sem consumidor ainda)|
|`aula.criada`|Nova aula cadastrada|reservado (sem consumidor ainda)|
|`aula.cancelada`|Cancelamento de aula|reservado (sem consumidor ainda)|
|`aula.realizada`|Aula marcada como realizada|`reposicoes` — fecha o ciclo da reposição vinculada|
|`presenca.registrada`|Presença individual ou em lote registrada|`notificacoes` — cria notificação `PRESENCA_REGISTRADA` (mensagem varia por status)|
|`pagamento.realizado`|Pagamento confirmado (manual, comprovante ou PIX)|`notificacoes`|
|`mensalidade.vencida`|Job diário de vencimento|`notificacoes`|
|`mensalidade.gerada`|Mensalidade automática criada (job ou gatilho pós-pagamento)|reservado (sem consumidor ainda)|
|`mensalidade-automatica.execucao-finalizada`|Job de geração automática termina uma rodada|reservado — usado para auditoria/observabilidade futura|
|`mensalidade-automatica.aluno-ignorado`|Aluno elegível pulado na geração (sem baseline, limite atingido)|reservado|

> Eventos "reservados" são emitidos mas não têm listener hoje — não é bug, é espaço reservado para uso futuro (ex.: auditoria automática, e-mail).

## Evolução futura

Quando Redis/BullMQ estiver disponível, substituir o EventEmitter para eventos pesados (email, PDF, relatórios), mantendo o EventEmitter para eventos síncronos internos.

---

# 20. Jobs e Filas

## Implementação atual (`node-cron`, sem fila externa)

Os 4 jobs recorrentes do sistema rodam hoje via **`node-cron`** (agendado no processo do próprio backend, timezone `America/Sao_Paulo`), não BullMQ/Redis:

|Job|Frequência|Responsabilidade|
|---|---|---|
|`aulas-vencidas.job.ts`|A cada 1h|Marca aulas passadas sem lançamento de presença como `REALIZADA`|
|`mensalidades-vencidas.job.ts`|A cada 6h|Marca mensalidades vencidas e emite `mensalidade.vencida`|
|`mensalidades-automaticas.job.ts`|Configurável via `ConfiguracaoStudio.cronGeracaoMensalidades` (padrão `0 0,6,12,18 * * *`)|Gera a próxima mensalidade de alunos elegíveis — ver [seção 38](#38-geração-automática-de-mensalidades)|
|`cobrancas-pix-expiradas.job.ts`|Periódico|Marca cobranças PIX vencidas como expiradas junto ao gateway|

Todos com lock/idempotência própria (a geração automática usa a tabela `JobLock` para nunca rodar duas instâncias em paralelo) e try/catch isolado por job — uma falha não derruba o processo nem os outros jobs.

> A expressão cron da geração automática é lida do banco **só no boot** do processo — alterar pela UI/API persiste imediatamente, mas só passa a valer após reiniciar o backend.

## Uso futuro (BullMQ + Redis)

Ainda não implementado. Candidatos a migrar quando o volume justificar fila externa com retry/observabilidade dedicados:

- Envio de e-mails
- Geração de PDF
- Exportação Excel pesada
- Backups

---

# 21. Estratégia de Testes

## Camadas de teste

|Tipo|Ferramenta|O que testar|
|---|---|---|
|Unitário|Vitest|Services, utils, schemas Zod, regras de negócio|
|Integração|Vitest + Supertest|Rotas da API, fluxos completos|
|E2E (futuro)|Playwright|Fluxos críticos do frontend|

## Estrutura de pastas

```
backend/
└── src/
    └── modules/
        └── alunos/
            ├── aluno.service.ts
            └── __tests__/
                ├── aluno.service.spec.ts
                └── aluno.routes.spec.ts
```

## Exemplo de teste unitário

```typescript
// aluno.service.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { AlunoService } from '../aluno.service'

describe('AlunoService', () => {
  it('deve lançar erro ao cadastrar aluno com email duplicado', async () => {
    const repo = { findByEmail: vi.fn().mockResolvedValue({ id: '123' }) }
    const service = new AlunoService(repo as any)

    await expect(
      service.criar({ email: 'existente@email.com', nome: 'João' })
    ).rejects.toThrow('Email já cadastrado')
  })
})
```

## Metas de cobertura mínima

|Módulo|Cobertura alvo|
|---|---|
|Services|80%|
|Rotas críticas (financeiro, auth)|90%|
|Utilitários|100%|

## Estado atual da suíte

- **Backend**: 42 arquivos de spec em `backend/src/`, cobrindo os 20 módulos + middlewares (`auth`, `rbac`) + `app.spec.ts` de integração. Testes de rota conectam a um MySQL real via `fastify.inject()` (não usam mocks) — nunca rodar contra o banco de desenvolvimento pessoal.
- **Frontend**: 14 arquivos de teste com Vitest + React Testing Library + MSW (`frontend/src/test/` concentra setup, handlers e utilitários).
- **Gap conhecido**: os módulos `acompanhamento` e `termos` têm apenas `*.service.spec.ts` — sem teste de rota HTTP ainda.
- `test:coverage` configurado em ambos os projetos (provider v8), threshold de 80% no backend.

---

# 22. Deploy

## Estrutura recomendada

```
Nginx (porta 80/443)
  ↓
Frontend React (container Docker)
  ↓
API Fastify (container Docker — /api/v1)
  ↓
MySQL (container Docker)
```

---

# 23. Dockerização

## Containers

- `frontend` — React buildado (servido pelo Nginx)
- `backend` — API Fastify
- `mysql` — Banco de dados
- `redis` — Cache e filas (futuro)

## Exemplo de configuração

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    restart: unless-stopped   # ← substitui o PM2
    environment:
      - NODE_ENV=production
    depends_on:
      - mysql

  mysql:
    image: mysql:8
    restart: unless-stopped
    volumes:
      - mysql_data:/var/lib/mysql
```

---

# 24. Observabilidade

## Implementar

- Logs estruturados (Pino)
- Rastreamento de erros
- Monitoramento de uptime
- Métricas básicas

---

# 25. Estratégia de Backup

## Obrigatório

- Backup diário automatizado
- Backup externo (fora da VPS)
- Retenção mínima de 7 dias

---

# 26. Convenções do Projeto

## Commits

Padrão **Conventional Commits**:

```
feat: adiciona cadastro de alunos
fix: corrige cálculo financeiro
refactor: reorganiza módulo agenda
test: adiciona testes do AlunoService
chore: atualiza dependências
```

---

# 27. Padrão REST API

## Versionamento de Rotas

> 🆕 **Todas as rotas devem ter prefixo `/api/v1/`** para permitir breaking changes futuros sem impacto imediato nos clientes.

```
GET    /api/v1/alunos
GET    /api/v1/alunos/:id
POST   /api/v1/alunos
PUT    /api/v1/alunos/:id
DELETE /api/v1/alunos/:id
```

---

# 28. Padrão de Resposta da API

## Sucesso

```json
{
  "success": true,
  "data": {}
}
```

## Erro

```json
{
  "success": false,
  "message": "Erro interno",
  "code": "INTERNAL_ERROR"
}
```

---

# 29. Error Boundaries no Frontend

> 🆕 **Obrigatório para produção.** Captura erros inesperados em componentes React e exibe UI de fallback ao invés de quebrar a aplicação inteira.

```tsx
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p className="text-red-500">Algo deu errado. Recarregue a página.</p>
        </div>
      )
    }
    return this.props.children
  }
}
```

```tsx
// src/App.tsx
<ErrorBoundary>
  <RotasProtegidas />
</ErrorBoundary>
```

---

# 30. Roadmap de Desenvolvimento

## ✅ Fase 0 — Setup e Qualidade

- [x] Configurar ESLint + Prettier
- [x] Configurar Husky (pre-commit hooks) + lint-staged
- [x] Configurar Vitest
- [x] Criar estrutura de schemas compartilhados (Zod) — _criada, mas ainda não consumida pelo frontend, ver [seção 36](#36-status-atual-do-projeto)_
- [x] Definir `.env.example` com todas as variáveis necessárias
- [ ] Configurar npm workspaces (monorepo leve) — **decisão: não migrar**, ver [seção 39](#39-decisões-técnicas)
- [x] Configurar Docker Compose de desenvolvimento

---

## ✅ Fase 1 — Modelagem

- [x] DER completo (schema Prisma — 27 models, 24 enums)
- [ ] Wireframes — não formalizados como artefato separado (UI evoluiu direto em código)
- [x] Fluxos operacionais

---

## ✅ Fase 2 — Estrutura Backend

- [x] Setup Fastify + TypeScript
- [x] Prisma + MySQL
- [x] Auth (JWT + Refresh Token, com checagem de usuário ativo a cada request)
- [x] RBAC (`authorize`/`requireRole`)

---

## ✅ Fase 3 — CRUD Base (expandida)

- [x] Alunos
- [x] Professores
- [x] Planos
- [x] Modalidades (+ valor informativo)

---

## ✅ Fase 4 — Agenda

- [x] Agenda (conflito de horário, matrícula)
- [x] Presença (individual e em lote)
- [x] Reposição (restrita ao mesmo mês da aula original)

---

## ✅ Fase 5 — Financeiro

- [x] Caixa
- [x] Mensalidades (+ comprovantes + estornos com cálculo proporcional)
- [x] Relatórios (com exportação Excel)
- [x] **Geração automática de mensalidades** (job + gatilho pós-pagamento)
- [x] **Cobrança PIX** (gateway Mercado Pago, webhook, expiração automática)

---

## ✅ Fase 6 — Dashboard e Auditoria

- [x] Dashboard
- [x] Logs
- [x] Auditoria

---

## ✅ Fase 7 — Portal do Aluno e Acompanhamento _(fase adicionada — não estava no roadmap original)_

- [x] Portal de autoatendimento do aluno (dashboard, agenda, presença, financeiro, PIX, perfil, notificações, termos)
- [x] Termos de uso com aceite rastreado
- [x] Avaliação corporal do aluno (com fotos)
- [x] Evolução do aluno por aula
- [x] Painel de acompanhamento 360º de risco

---

## Fase 8 — Deploy

- [x] Docker Compose produção
- [x] Nginx + SSL — infraestrutura pronta, **certificado real pendente** de servidor com domínio público (não executável em ambiente de dev)
- [x] Backup automático (scripts validados: backup, verify, restore)
- [x] CI (GitHub Actions) — build/lint/test/typecheck
- [ ] CD automático — `.github/workflows/deploy.yml` ainda é placeholder documentado, sem lógica real de deploy
- [ ] Monitoramento — não implementado (logs estruturados existem via Pino, sem dashboard de métricas)

> Ver [seção 36](#36-status-atual-do-projeto) para o detalhamento completo do estado de cada fase e pendências reais.

---

# 31. Boas Práticas

## Backend

- Services sem acesso direto ao request
- Repository isolado
- Validação em todas as entradas (schemas Zod compartilhados)
- Logs estruturados com Pino
- Erros centralizados
- Testes unitários nos services
- Rotas versionadas (`/api/v1/`)

---

## Frontend

- Componentes pequenos e focados
- Hooks reutilizáveis
- Evitar lógica em páginas
- Evitar prop drilling excessivo
- Cache inteligente com React Query
- Error Boundaries em rotas protegidas
- Schemas Zod importados do pacote compartilhado

---

# 32. Escalabilidade Futura

Possíveis extrações futuras:

- Notificações
- Agenda
- Relatórios
- Financeiro

---

# 33. Ferramentas Recomendadas

## Desenvolvimento

- VSCode
- Postman / Insomnia
- Docker Desktop
- DBeaver
- GitHub Desktop

---

# 34. Objetivo Final da Arquitetura

Construir um sistema:

- Escalável
- Seguro
- Organizado
- Modular
- Profissional
- Sustentável
- Preparado para evolução futura
- Com baixo custo operacional inicialmente

---

# 35. Identidade Visual

## Paleta de Cores

Todas as cores do sistema estão definidas como variáveis CSS no arquivo `tailwind.config.ts` e no `globals.css`. **Nunca use valores hexadecimais diretamente no código** — sempre referencie pelas variáveis.

### Definição das Variáveis (CSS)

```css
/* src/styles/globals.css */
:root {
  /* — Cores de Destaque — */
  --rosa-vibrante:       #D8385E;  /* botões de ação, alertas, badges de status */
  --lilas-claro:         #F0E0FF;  /* fundos de cards, hover suave */
  --roxo-profundo:       #5B4191;  /* sidebar, cabeçalhos de seção */
  --lilas-medio:         #A880FF;  /* links ativos, indicadores de progresso */
  --azul-link:           #0000EE;  /* links externos, âncoras */

  /* — Neutros de Interface — */
  --cinza-escuro-suave:  #1D1D1F;  /* texto principal */
  --creme-fundo:         #FBF8EC;  /* fundo geral da aplicação */
  --bege-cartao:         #ECE0CD;  /* fundo de cards e painéis secundários */
  --cinza-medio:         #A8A094;  /* texto secundário, placeholders */
  --bege-suave:          #F6EDDF;  /* fundo alternativo, zebra em tabelas */
  --cinza-texto:         #625E59;  /* labels, descrições de campos */
  --cinza-forte:         #403E3C;  /* texto de peso médio, subtítulos */

  /* — Preto e Branco — */
  --preto-puro:          #000000;  /* bordas fortes, ícones de contraste máximo */
  --preto-suave:         #101010;  /* fundo escuro alternativo (modo dark futuro) */
  --branco-puro:         #FFFFFF;  /* fundo de modais, áreas de entrada */
}
```

### Integração com Tailwind CSS

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cores de Destaque
        'rosa-vibrante':      'var(--rosa-vibrante)',
        'lilas-claro':        'var(--lilas-claro)',
        'roxo-profundo':      'var(--roxo-profundo)',
        'lilas-medio':        'var(--lilas-medio)',
        'azul-link':          'var(--azul-link)',

        // Neutros de Interface
        'cinza-escuro-suave': 'var(--cinza-escuro-suave)',
        'creme-fundo':        'var(--creme-fundo)',
        'bege-cartao':        'var(--bege-cartao)',
        'cinza-medio':        'var(--cinza-medio)',
        'bege-suave':         'var(--bege-suave)',
        'cinza-texto':        'var(--cinza-texto)',
        'cinza-forte':        'var(--cinza-forte)',

        // Preto e Branco
        'preto-puro':         'var(--preto-puro)',
        'preto-suave':        'var(--preto-suave)',
        'branco-puro':        'var(--branco-puro)',
      },
    },
  },
  plugins: [],
}

export default config
```

### Uso no JSX/TSX

```tsx
// ✅ CORRETO — usando as variáveis nomeadas
<button className="bg-rosa-vibrante text-branco-puro hover:bg-roxo-profundo">
  Salvar
</button>

<div className="bg-creme-fundo text-cinza-escuro-suave">
  Conteúdo principal
</div>

// ❌ ERRADO — nunca use hex diretamente no código
<button className="bg-[#D8385E]">Salvar</button>
```

---

## Guia de Uso das Cores por Contexto

|Elemento|Variável|
|---|---|
|Fundo geral da aplicação|`creme-fundo`|
|Fundo de cards / painéis|`bege-cartao`|
|Fundo alternativo / zebra|`bege-suave`|
|Fundo de modais e inputs|`branco-puro`|
|Texto principal|`cinza-escuro-suave`|
|Texto secundário / placeholder|`cinza-medio`|
|Labels e descrições|`cinza-texto`|
|Subtítulos e peso médio|`cinza-forte`|
|Botão primário / ação principal|`rosa-vibrante`|
|Sidebar e cabeçalhos|`roxo-profundo`|
|Links e itens ativos|`lilas-medio`|
|Hover suave e destaques leves|`lilas-claro`|
|Links externos|`azul-link`|
|Bordas de alto contraste|`preto-puro`|

---

## Regras Obrigatórias de Estilo

- **Nunca use valores hexadecimais diretamente** no JSX, TSX ou em arquivos CSS avulsos.
- **Nunca duplique** a definição de cores — o único local de verdade é o `globals.css`.
- **Nunca crie variáveis novas** sem antes verificar se uma existente atende o caso de uso.
- Para adicionar uma nova cor ao sistema, ela deve ser inserida no `globals.css` **e** no `tailwind.config.ts` simultaneamente, com nome em português descritivo.
- Componentes Shadcn/UI devem ter seus tokens (`--primary`, `--background`, etc.) mapeados para as variáveis deste sistema no `globals.css`.

---

## Mapeamento Shadcn/UI → Sistema de Cores

```css
/* src/styles/globals.css — continuação */
:root {
  /* Mapeamento dos tokens Shadcn para as variáveis do projeto */
  --background:   var(--creme-fundo);
  --foreground:   var(--cinza-escuro-suave);
  --card:         var(--bege-cartao);
  --primary:      var(--rosa-vibrante);
  --primary-foreground: var(--branco-puro);
  --secondary:    var(--lilas-claro);
  --secondary-foreground: var(--roxo-profundo);
  --muted:        var(--bege-suave);
  --muted-foreground: var(--cinza-medio);
  --accent:       var(--lilas-medio);
  --border:       var(--cinza-medio);
  --input:        var(--branco-puro);
  --ring:         var(--lilas-medio);
}
```

---

# 36. Status Atual do Projeto

> Consolida o que antes vivia em `docs/STATUS_ATUAL_DO_PROJETO.md` (removido — este documento passou a ser a fonte única de verdade sobre arquitetura e status).

## Status real por fase

| Fase | Status |
|---|---|
| 0 — Setup e qualidade | ✅ Concluída |
| 1 — Modelagem | ✅ Concluída |
| 2 — Backend base | ✅ Concluída |
| 3 — CRUD base | ✅ Concluída e expandida |
| 4 — Agenda | ✅ Concluída |
| 5 — Financeiro | ✅ Concluída, incluindo PIX e geração automática de mensalidades |
| 6 — Dashboard/Auditoria | ✅ Concluída |
| 7 — Portal do aluno e acompanhamento | ✅ Concluída |
| 8 — Deploy | ⏳ Infraestrutura pronta — falta certificado SSL real e CD automático |

## Módulos implementados (20)

`auth, alunos, professores, planos, modalidades, agenda, presenca, reposicoes, financeiro, estornos, pagamentos-pix, mensalidades-automaticas, avaliacoes, evolucoes, acompanhamento, notificacoes, auditoria, relatorios, configuracao, termos`

Todos registrados em `app.ts`, com controller/service/repository/routes/types. Inconsistências conhecidas de padronização (não são bugs funcionais):

- Sem `dto/`: `acompanhamento`, `auditoria`, `configuracao`, `estornos`, `modalidades`, `pagamentos-pix`, `termos`
- Sem `constants.ts`: `auditoria`, `configuracao`, `estornos`, `modalidades`, `notificacoes`, `relatorios`
- Sem `index.ts`: `modalidades`, `mensalidades-automaticas`

## Funcionalidades concluídas

- Autenticação JWT (access 15min / refresh 7d com rotação) + verificação de usuário ainda ativo a cada request + RBAC por papel (ADMIN, PROFESSOR, RECEPCIONISTA, FINANCEIRO, ALUNO).
- CRUD completo de alunos, professores, planos, modalidades.
- Agenda com conflito de horário, matrícula, presença (individual e em lote), reposição.
- Financeiro: mensalidades (com geração automática), pagamentos, comprovantes, estornos com cálculo proporcional, cobrança PIX via Mercado Pago.
- Avaliação corporal (com fotos), evolução por aula, painel de acompanhamento 360º de risco.
- Auditoria de ações sensíveis, notificações in-app orientadas a eventos, relatórios com exportação Excel.
- Termos de uso com aceite rastreado.
- Portal do aluno completo (dashboard, agenda, presença, financeiro, PIX, avaliações, perfil, notificações, termos).
- Documentação interativa da API em `/documentation` (Swagger UI).

## Pendências reais conhecidas

1. **Certificado SSL real** — requer domínio público + servidor de produção (seção 40); não pode ser emitido em ambiente de desenvolvimento.
2. **Deploy automático (CD)** — `.github/workflows/deploy.yml` é um placeholder documentado (`workflow_dispatch` manual, sem credenciais nem lógica real).
3. **Frontend não consome `packages/shared/schemas`** — mantém tipos próprios em `frontend/src/types/domain.types.ts`, causando drift real confirmado: o enum `MetodoPagamento` do backend inclui `CHEQUE`, mas o tipo do frontend não — `CHEQUE` nunca aparece como opção na UI mesmo sendo aceito pela API.
4. **Cobertura de teste**: módulos `acompanhamento` e `termos` só têm teste de service, sem teste de rota HTTP.
5. **Padronização incompleta** de `dto/`/`constants.ts`/`index.ts` em alguns módulos (ver lista acima).
6. **`any` residual no frontend** (~20 ocorrências, principalmente em integrações com react-hook-form) — rebaixado a aviso no ESLint, não bloqueia build/CI, mas é débito técnico.
7. **npm workspaces não migrado** — decisão explícita, ver seção 39.
8. **Monitoramento/observabilidade** — logs estruturados via Pino existem; sem dashboard de métricas ou rastreamento de erros dedicado.

---

# 37. Sistema de Pagamento PIX

## Arquitetura

Módulo `pagamentos-pix`, com abstração de gateway para permitir trocar de provedor sem reescrever regra de negócio:

```
backend/src/modules/pagamentos-pix/
├── gateway/
│   ├── payment-gateway-pix.interface.ts   ← contrato do gateway
│   └── mercado-pago-gateway.service.ts    ← implementação atual (SDK `mercadopago`)
├── pagamentos-pix.service.ts
├── pagamentos-pix.repository.ts
├── pagamentos-pix.controller.ts
└── pagamentos-pix.routes.ts
```

## Fluxo

1. Aluno solicita cobrança de uma mensalidade existente (`POST /api/v1/aluno/mensalidades/:mensalidadeId/pix`) — exige que a mensalidade já exista (criada manualmente ou pela geração automática).
2. Gateway Mercado Pago gera o QR Code/copia-e-cola; registro persistido em `CobrancaPix`.
3. Confirmação chega por dois caminhos:
   - **Webhook** (`POST /api/v1/webhooks/mercadopago`, rota pública, fora de `authenticateToken` — validada por assinatura `x-signature`, registrado em grupo de rate limit próprio, análogo ao de login);
   - **Sincronização manual** (`POST .../pix/sincronizar`), para quando o webhook atrasa ou falha.
4. Job `cobrancas-pix-expiradas.job.ts` marca cobranças vencidas como expiradas junto ao gateway, periodicamente.
5. Ao confirmar o pagamento, dispara `pagamento.realizado` e o gatilho de geração imediata da próxima mensalidade (seção 38).

## Modelos relacionados

`CobrancaPix` (status: `StatusCobrancaPix`), `WebhookMercadoPago` (log de eventos recebidos, para auditoria/replay).

---

# 38. Geração Automática de Mensalidades

## Por que existe

Até 2026-07-20, a única forma de criar uma `Mensalidade` era manualmente (uma de cada vez, pelo admin) ou automaticamente uma única vez na matrícula do aluno — não havia geração recorrente do mês seguinte. Isso bloqueava o fluxo de PIX, que exige uma mensalidade já existente para gerar cobrança. O módulo `mensalidades-automaticas` resolve essa lacuna.

## Como funciona

- **Ponto único de regra de negócio**: `MensalidadesAutomaticasService.executarGeracao(origem, opções)`, chamado tanto pelo job agendado (`origem: 'CRON'`) quanto por um endpoint manual (`origem: 'MANUAL'`) — sem duplicação de lógica entre os dois caminhos.
- **Lock otimista**: usa a tabela `JobLock` (`adquirirLock`/`liberarLock`) para garantir que nunca haja duas execuções concorrentes.
- **Processamento em lote com cursor**: percorre alunos elegíveis em páginas (`TAMANHO_LOTE`), evitando carregar a base inteira em memória.
- **Elegibilidade**: aluno `ATIVO`, com plano atual e mensalidade-base existente; a competência alvo nunca "recupera" o passado — se o aluno ficou tempo sem gerar (suspensão/gap), a próxima geração ancora na competência atual, não na esperada.
- **Configurável** via `ConfiguracaoStudio`: `geracaoAutomaticaAtiva` (liga/desliga), `diasAntesGeracao` (quantos dias antes do vencimento gerar), `maximoMensalidadesFuturas` (teto de mensalidades futuras por aluno), `cronGeracaoMensalidades` (expressão cron, lida só no boot do processo).
- **Gatilho imediato**: `gerarProximaAposPagamento(mensalidadeId)` cria a mensalidade do mês seguinte assim que uma mensalidade é confirmada como paga, sem esperar a janela do job periódico — idempotente via `criarSeNaoExiste`, então não duplica se o cron já tiver gerado a mesma competência.
- **Preço sempre lido ao vivo** do plano atual do aluno (nunca copiado da mensalidade anterior) — troca de plano vale a partir da próxima competência gerada, sem tocar nas mensalidades já existentes.
- **Auditoria de execução**: cada rodada (cron ou manual) grava um registro em `ExecucaoJobMensalidades` (status `SUCESSO`/`PARCIAL`/`ERRO`, contadores, detalhes de alunos ignorados e erros por aluno) — consultável via `buscarStatusExecucaoAtual()`.

## Job (`node-cron`)

`backend/src/jobs/mensalidades-automaticas.job.ts`: agenda via `node-cron`, expressão padrão `0 0,6,12,18 * * *` (4x ao dia), timezone `America/Sao_Paulo`. Falha na execução agendada é logada e não derruba o processo.

---

# 39. Decisões Técnicas

> Consolida `docs/DECISOES_TECNICAS.md` (removido).

## Testes E2E (Playwright) — adiados

**Decisão**: não instalar/configurar Playwright ainda. Cobertura atual é só unitária + integração de componente (Vitest + RTL + MSW).

**Por quê**: Playwright adiciona ~300MB de browsers, tempo de execução maior em CI, e mais um framework para manter. Faz mais sentido introduzi-lo quando já existir ambiente de homologação estável, CI consolidado e banco de testes previsível.

**Plano futuro**: cobrir o fluxo dourado completo (login admin → cadastro de aluno → matrícula em plano → agendamento de aula → presença → cobrança → pagamento/estorno → reflexo no dashboard) como um teste E2E de fumaça, em job de CI separado e não-bloqueante.

## npm workspaces — não migrado

**Decisão**: manter o esquema atual (`file:../packages/shared` no `package.json` do backend, alias `@shared` no Vite/tsconfig do frontend, `COPY packages/shared` manual nos Dockerfiles) em vez de migrar para npm workspaces reais.

**Como funciona hoje**: cada pacote (`backend`, `frontend`, `packages/shared`) tem lockfile e `node_modules` próprios; não há `"workspaces"` declarado no `package.json` raiz.

**Riscos de migrar agora**: lockfiles precisariam ser regenerados na raiz (risco de drift de versão); Dockerfiles precisariam mudar de contexto de build; CI precisaria instalar a partir da raiz. Nenhum problema real está sendo causado pelo esquema atual.

**Plano de migração recomendado** (quando houver janela dedicada): criar `package.json` raiz com `"workspaces"`, regenerar lockfile único validando `npm ls` antes/depois, atualizar os Dockerfiles para contexto de build na raiz do monorepo, revalidar aliases de Vite/Vitest, validar build+testes+`docker compose build` de ponta a ponta antes de remover o esquema antigo.

## Husky hospedado por um `package.json` raiz mínimo

A raiz não tinha `package.json` antes da preparação para produção. Foi criado um `package.json` raiz **mínimo**, só para hospedar Husky + lint-staged (`prepare`, hooks `pre-commit`/`pre-push`). Isso **não é** migração para workspaces — é apenas o host dos git hooks, sem `"workspaces"` declarado.

## Erro de validação Zod não tratado — rede de segurança global

Padrão identificado: vários controllers tinham `try/catch` próprio que capturava qualquer erro genericamente e retornava `500`, mesmo quando o erro real era uma falha de validação Zod (deveria ser `400`). Cada ocorrência foi corrigida pontualmente, e foi adicionada uma rede de segurança no error handler global do Fastify (`app.ts`) que converte qualquer `ZodError` não tratado em resposta `400` no formato `{success, message, code}` — cobrindo módulos sem tratamento explícito.

## Backend em CommonJS (não ESM) em produção

**Decisão**: rodar o backend compilado como CommonJS (`tsconfig.json`, `package.json` sem `"type": "module"`, `server.ts` ajustado), não ESM nativo.

**Por quê**: `moduleResolution: "bundler"` + imports sem extensão funcionava via `tsx` em desenvolvimento, mas quebrava com `node dist/server.js` puro em produção (`Cannot find module`). Migrar para CommonJS resolveu sem tocar nos imports existentes do código-fonte.

**Efeito colateral**: `eslint.config.js` (ESM) parou de funcionar com `"type": "commonjs"` no `package.json` — renomeado para `eslint.config.mjs` para forçar ESM independentemente do `type` do pacote.

## `@pilates/shared` compilado só dentro da imagem Docker de produção

O pacote compartilhado aponta para `.ts` fonte no `package.json` — funciona com ferramentas que transpilam on-the-fly (tsx/Vite/Vitest), mas não com `node` puro. Solução: passo de compilação CJS (`packages/shared/tsconfig.build.json`) + patch no `backend/Dockerfile`, **só dentro da imagem de produção** — dev/testes continuam usando `.ts` direto, sem mudança.

> Risco conhecido: se o `Dockerfile` for alterado no futuro sem entender esse passo, o build pode voltar a quebrar silenciosamente só em produção (não em dev/testes). Está comentado no próprio `Dockerfile`.

---

# 40. Deploy em Produção

> Consolida `docs/DEPLOY_PRODUCAO.md` e `docs/SSL_LETSENCRYPT.md` (removidos).

## Pré-requisitos do servidor

- Docker Engine + Docker Compose v2.
- Domínio próprio com DNS tipo `A` apontando para o IP do servidor.
- Portas `80` e `443` liberadas no firewall.
- Mínimo recomendado: 2 vCPUs / 2GB RAM (MySQL + backend + frontend + Nginx simultâneos).
- Acesso SSH ao servidor.

## Variáveis de ambiente

```bash
cp .env.production.example .env.production
```

Preencher **todos** os campos (nunca commitar este arquivo):

- `JWT_SECRET` / `JWT_REFRESH_SECRET`: gerar com `openssl rand -base64 32` (valores **diferentes** entre si).
- `MYSQL_ROOT_PASSWORD`, `MYSQL_USER`, `MYSQL_PASSWORD`: senhas fortes e únicas.
- `DATABASE_URL`: consistente com as credenciais MySQL acima.
- `CORS_ORIGIN`: domínio real do frontend em produção (`https://`).
- `DOMAIN` e `SSL_EMAIL`: usados na emissão do certificado.

## Build e subida

```bash
./scripts/deploy.sh .env.production
```

O script valida variáveis obrigatórias, builda as imagens de produção, sobe os containers (`mysql`, `migrate`, `backend`, `frontend`, `nginx`), aguarda os healthchecks e roda `scripts/healthcheck.sh`.

Manualmente (sem o script):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

> **Nunca** usar `docker-compose.yml` (sem `.prod`) em produção — é o compose de desenvolvimento (hot reload, `npm run dev`).

## Migrations

Rodam automaticamente em um serviço dedicado (`migrate`) que executa `npx prisma migrate deploy` **uma única vez** antes do backend subir, evitando concorrência entre múltiplos containers de backend aplicando migrations simultaneamente. O backend sobe com `SKIP_MIGRATE=1`.

Para rodar manualmente:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate
```

## SSL — Let's Encrypt

1. Suba a stack primeiro (Nginx já serve HTTP, com `/.well-known/acme-challenge/` preparado).
2. Emita o certificado via Certbot em **modo webroot** (não `--standalone`, que exigiria parar o Nginx):

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

3. Copie os arquivos gerados para `nginx/ssl/fullchain.pem` e `nginx/ssl/privkey.pem`.
4. Recarregue o Nginx: `docker compose -f docker-compose.prod.yml exec nginx nginx -s reload`.

**Sem certificado válido, a stack não deve ser exposta publicamente** — o bloco HTTPS do Nginx exige `nginx/ssl/fullchain.pem` e `nginx/ssl/privkey.pem` para iniciar.

### Renovação automática (certificados expiram em 90 dias)

```cron
0 3,15 * * * docker run --rm -v studio-pilates_certbot_webroot:/var/www/certbot -v /caminho/para/nginx/ssl:/etc/letsencrypt/live/seu-dominio.com certbot/certbot renew --webroot --webroot-path=/var/www/certbot --quiet && docker compose -f /caminho/para/docker-compose.prod.yml exec nginx nginx -s reload
```

### Validação

```bash
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates -issuer
curl -vI https://seu-dominio.com/api/v1/health
```

Confirmar também: redirecionamento 301 de HTTP→HTTPS, ausência de aviso de certificado inválido, headers `Strict-Transport-Security`/`X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy` presentes.

## Logs

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f backend
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f nginx
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f mysql
```

Logs do backend são estruturados (Pino, JSON), cada linha com `requestId` para rastrear uma requisição específica.

## Rollback

1. **Aplicação**: checkout da tag/commit anterior + `./scripts/deploy.sh .env.production` novamente.
2. **Banco de dados**: se uma migration causou problema, restaurar o backup mais recente anterior ao deploy (seção 41) — Prisma não reverte migrations automaticamente em produção.
3. **SSL**: manter sempre uma cópia de `nginx/ssl/` fora do servidor; se a renovação falhar, restaurar a cópia anterior enquanto investiga, ou reemitir (Certbot permite até 5 emissões por domínio a cada 7 dias).

## Validação pós-deploy (checklist mínimo)

- [ ] `GET /api/v1/health` retorna `{"success":true,...}`.
- [ ] Tela de login carrega e login administrativo funciona (token emitido, redirecionamento correto por role).
- [ ] `/documentation` carrega o Swagger UI.
- [ ] HTTP redireciona para HTTPS (301).
- [ ] Headers de segurança presentes.
- [ ] `docker compose -f docker-compose.prod.yml ps` mostra todos os serviços `healthy`.
- [ ] Backup pós-deploy gerado e verificado.

---

# 41. Backup e Restauração

Scripts em `database/scripts/`: `backup-mysql.sh`, `restore-mysql.sh`, `verify-backup.sh`, com procedimento de disaster recovery documentado em `database/scripts/README.md`.

## Uso manual

```bash
MYSQL_USER=... MYSQL_PASSWORD=... MYSQL_DATABASE=... ./database/scripts/backup-mysql.sh
./database/scripts/verify-backup.sh database/backups/studio-pilates_<data>.sql.gz
```

## Cron de produção (exemplo)

```cron
0 3 * * * . /etc/studio-pilates/backup.env && /caminho/para/database/scripts/backup-mysql.sh >> /var/log/studio-pilates/backup.log 2>&1
```

## Validação já realizada

Fluxo completo validado manualmente pelo menos uma vez: backup → verificação de integridade (gzip válido, contém `CREATE TABLE`/`INSERT INTO`) → restauração em banco descartável (nunca o banco de desenvolvimento pessoal) → conferência dos dados restaurados → remoção do banco descartável.