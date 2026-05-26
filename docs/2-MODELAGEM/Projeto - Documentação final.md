# Documentação do Sistema — Studio de Pilates

---

# 1. Visão Geral do Sistema

Sistema web completo para gerenciamento de um studio de pilates, contendo:

- Cadastro de alunos
- Controle financeiro
- Controle de mensalidades
- Agenda de aulas
- Controle de presença
- Dashboard administrativo
- Relatórios
- Controle de usuários e permissões
- Auditoria e logs
- Notificações
- Backup automático

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

---

## Teste

- Vitest (unitários e integração)
- Supertest (testes de rotas da API)
- Playwright (E2E — fase futura)

---

## Infraestrutura

- VPS Hostinger
- Docker + Docker Compose _(substitui PM2 — ver seção 21)_
- Nginx
- SSL Let's Encrypt
- GitHub
- GitHub Actions (futuro)
- Redis (futuro)
- BullMQ (futuro)

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
    ├── modules/
    │   ├── auth/
    │   ├── alunos/
    │   ├── agenda/
    │   ├── pagamentos/
    │   ├── financeiro/
    │   ├── professores/
    │   ├── relatorios/
    │   ├── notificacoes/
    │   └── auditoria/
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
    ├── jobs/
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
├── alunos/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── schemas/
│   ├── pages/
│   └── types/
```

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

- Usuários
- Roles
- Permissions
- Alunos
- Professores
- Planos
- Mensalidades
- Pagamentos
- Agenda
- Aulas
- Presença
- Caixa
- Movimentações Financeiras
- Logs
- Auditoria
- Notificações

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

## Exemplos de eventos

|Evento|Gatilho|
|---|---|
|`aluno.criado`|Novo cadastro de aluno|
|`pagamento.realizado`|Pagamento confirmado|
|`aula.cancelada`|Cancelamento de aula|
|`mensalidade.vencida`|Job diário de vencimento|

## Evolução futura

Quando Redis/BullMQ estiver disponível, substituir o EventEmitter para eventos pesados (email, PDF, relatórios), mantendo o EventEmitter para eventos síncronos internos.

---

# 20. Jobs e Filas

## Uso futuro

BullMQ + Redis

## Casos de uso

- Envio de e-mails
- Notificações
- Geração de PDF
- Exportação Excel
- Backups
- Relatórios

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

## ✅ Fase 0 — Setup e Qualidade _(nova fase)_

- [ ] Configurar ESLint + Prettier
- [ ] Configurar Husky (pre-commit hooks)
- [ ] Configurar Vitest
- [ ] Criar estrutura de schemas compartilhados (Zod)
- [ ] Definir `.env.example` com todas as variáveis necessárias
- [ ] Configurar npm workspaces (monorepo leve)
- [ ] Configurar Docker Compose de desenvolvimento

---

## Fase 1 — Modelagem

- [ ] DER completo
- [ ] Wireframes
- [ ] Fluxos operacionais

---

## Fase 2 — Estrutura Backend

- [ ] Setup Fastify + TypeScript
- [ ] Prisma + MySQL
- [ ] Auth (JWT + Refresh Token)
- [ ] RBAC

---

## Fase 3 — CRUD Base

- [ ] Alunos
- [ ] Professores
- [ ] Planos

---

## Fase 4 — Agenda

- [ ] Agenda
- [ ] Presença
- [ ] Reposição

---

## Fase 5 — Financeiro

- [ ] Caixa
- [ ] Mensalidades
- [ ] Relatórios

---

## Fase 6 — Dashboard e Auditoria

- [ ] Dashboard
- [ ] Logs
- [ ] Auditoria

---

## Fase 7 — Deploy

- [ ] Docker Compose produção
- [ ] Nginx + SSL
- [ ] Backup automático
- [ ] Monitoramento

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