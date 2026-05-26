# 📋 ANÁLISE FASE 2 — Backend Fastify + Prisma + Autenticação

**Data:** 26 de Maio de 2026  
**Status:** ✅ Pronto para iniciar  
**Pré-requisitos:** ✅ Fase 0-1B 100% completa

---

## 🎯 VISÃO GERAL FASE 2

Implementar backend completo com:
- ✅ Fastify + TypeScript
- ✅ Prisma ORM integrado ao MySQL (já rodando)
- ✅ Autenticação JWT (access + refresh token)
- ✅ RBAC (4 roles: Admin, Professor, Recepcionista, Financeiro)
- ✅ Middleware de erro, autenticação, logging
- ✅ EventBus para desacoplamento de eventos
- ✅ Testes unitários + integração (80%+ cobertura)
- ✅ Documentação Swagger/OpenAPI

**Deliverable:** Backend pronto para consumo pelo frontend

---

## ✅ PRÉ-REQUISITOS VERIFICADOS

| Requisito | Status | Detalhes |
|-----------|--------|----------|
| **Node.js 18+** | ✅ | Necessário para Fastify |
| **MySQL rodando** | ✅ | Docker rodando em localhost:3306 |
| **Schema Prisma** | ✅ | Disponível em docs/2-MODELAGEM/ |
| **13 tabelas criadas** | ✅ | init.sql executado automaticamente |
| **Documentação** | ✅ | 88 páginas, DER, procedures, triggers |
| **Estrutura de pastas** | ✅ | backend/, frontend/, database/, docker/ |
| **.env com DATABASE_URL** | ✅ | docker/.env contém credenciais |
| **Git inicializado** | ✅ | Pronto para primeiro commit |

---

## 📐 REQUISITOS TÉCNICOS FASE 2

### 1️⃣ **Stack Obrigatório**

```
Fastify (v4+)          — framework web
TypeScript              — tipagem estática
Prisma (v5+)           — ORM
@fastify/jwt           — autenticação JWT
@fastify/cors          — CORS
@fastify/helmet        — segurança headers
@fastify/rate-limit    — proteção contra brute force
bcryptjs               — hash de senhas
zod                    — validação de schemas
pino                   — logging estruturado
Vitest                 — testes unitários
Supertest              — testes de rotas
```

### 2️⃣ **Arquitetura Obrigatória**

```
Request → Controller → Service → Repository → Prisma → MySQL

Controller:
  - Receber request
  - Validar entrada com Zod
  - Chamar service
  - Retornar response padronizada
  ❌ Nunca: lógica de negócio, acesso direto ao BD

Service:
  - Toda regra de negócio
  - Validações operacionais
  - Coordenação entre módulos
  ✅ Chamar repository para persistência
  ✅ Emitir eventos via eventBus
  ❌ Nunca: conhecer detalhes HTTP

Repository:
  - Única camada que acessa Prisma
  - Queries limpas e reutilizáveis
  - Sem lógica de negócio
```

### 3️⃣ **Padrões Obrigatórios**

#### Rotas
```typescript
// Todas com prefixo /api/v1/
GET    /api/v1/health              // Health check
POST   /api/v1/auth/register       // Registrar
POST   /api/v1/auth/login          // Login
POST   /api/v1/auth/refresh        // Refresh token
POST   /api/v1/auth/logout         // Logout
```

#### Resposta de Sucesso
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@email.com",
    "nomeCompleto": "João Silva"
  }
}
```

#### Resposta de Erro
```json
{
  "success": false,
  "message": "Email ou senha inválidos",
  "code": "INVALID_CREDENTIALS"
}
```

#### JWT Strategy
```
Access Token:   15 minutos (em memória)
Refresh Token:  7 dias (cookie httpOnly)
Rotação:        obrigatória a cada refresh
Algoritmo:      HS256
```

### 4️⃣ **Segurança Obrigatória**

- ✅ Hash Bcrypt para senhas (10 rounds mínimo)
- ✅ JWT com secret forte (mínimo 32 caracteres)
- ✅ Validação Zod em TODA entrada
- ✅ CORS configurado
- ✅ Helmet ativo
- ✅ Rate limit (100 req/15min padrão)
- ✅ RBAC em todas as rotas protegidas
- ✅ Sanitização de inputs
- ✅ Variáveis sensíveis apenas em .env
- ✅ Logs de acesso e erro

### 5️⃣ **Estrutura de Pastas Obrigatória**

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/                    ← INICIAR COM ISSO
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.schema.ts      ← Importado de @shared/schemas
│   │   │   ├── auth.types.ts
│   │   │   ├── auth.constants.ts
│   │   │   └── __tests__/
│   │   │       ├── auth.service.spec.ts
│   │   │       └── auth.routes.spec.ts
│   │   │
│   │   ├── alunos/                  ← Fase 3
│   │   ├── professores/             ← Fase 3
│   │   ├── agenda/                  ← Fase 4
│   │   ├── pagamentos/              ← Fase 5
│   │   ├── financeiro/              ← Fase 5
│   │   ├── relatorios/              ← Fase 6
│   │   ├── notificacoes/            ← Fase 6
│   │   └── auditoria/               ← Fase 6
│   │
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   ├── ValidationError.ts
│   │   │   └── UnauthorizedError.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── logger.middleware.ts
│   │   │   └── rbac.middleware.ts
│   │   ├── utils/
│   │   │   ├── hash.ts              (bcrypt)
│   │   │   ├── jwt.ts               (sign/verify)
│   │   │   ├── validators.ts
│   │   │   └── logger.ts            (pino)
│   │   ├── constants/
│   │   │   └── messages.ts
│   │   └── types/
│   │       ├── index.ts
│   │       └── express.d.ts
│   │
│   ├── events/
│   │   └── event-bus.ts             (EventEmitter)
│   │
│   ├── database/
│   │   ├── prisma/
│   │   │   └── schema.prisma        (copiar da doc)
│   │   ├── migrations/
│   │   └── prisma.client.ts
│   │
│   ├── config/
│   │   └── env.ts
│   │
│   ├── app.ts                       (Fastify setup)
│   └── server.ts                    (entry point)
│
├── packages/shared/
│   └── schemas/
│       ├── auth.schema.ts           (Zod schemas)
│       ├── index.ts
│       └── (outros modelos — Fase 3+)
│
├── Dockerfile
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

## 🛠️ ARTEFATOS A CRIAR — CHECKLIST

### **Passo 1: Estrutura e Configuração** (1-2 horas)

- [ ] Criar pastas `backend/src/{modules,shared,config,database,events}`
- [ ] Criar `backend/package.json` com scripts
- [ ] Criar `backend/tsconfig.json`
- [ ] Criar `backend/vitest.config.ts`
- [ ] Instalar dependências npm
- [ ] Criar `backend/.env` com DATABASE_URL
- [ ] Criar `backend/.env.example`
- [ ] Criar `.gitignore`

### **Passo 2: Prisma Setup** (1 hora)

- [ ] Copiar `schema.prisma` para `backend/prisma/schema.prisma`
- [ ] Executar `npx prisma generate`
- [ ] Executar `npx prisma migrate dev --name init`
- [ ] Criar `src/database/prisma.client.ts`
- [ ] Verificar no DBeaver: 13 tabelas criadas

### **Passo 3: Utilitários Compartilhados** (2 horas)

- [ ] `src/shared/utils/hash.ts` — Bcrypt (hash, compare)
- [ ] `src/shared/utils/jwt.ts` — Sign, verify, decode
- [ ] `src/shared/utils/logger.ts` — Pino logger
- [ ] `src/shared/errors/AppError.ts` — Custom error base
- [ ] `src/shared/errors/ValidationError.ts`
- [ ] `src/shared/errors/UnauthorizedError.ts`
- [ ] `src/shared/constants/messages.ts` — Mensagens padrão

### **Passo 4: Fastify App Setup** (1-2 horas)

- [ ] `src/app.ts` — Fastify instance com plugins
  - Helmet (segurança headers)
  - CORS (configurado)
  - Rate limit (100 req/15min)
  - JWT plugin
  - Error handler global
- [ ] `src/server.ts` — Entry point (listen 3000)
- [ ] `src/config/env.ts` — Validação de variáveis

### **Passo 5: Schemas Zod Compartilhados** (1 hora)

- [ ] `packages/shared/schemas/auth.schema.ts`
  ```typescript
  export const createLoginSchema = z.object({
    email: z.string().email(),
    senha: z.string().min(6)
  })
  
  export const createRegisterSchema = z.object({
    email: z.string().email(),
    senha: z.string().min(8),
    nomeCompleto: z.string().min(3),
    telefone: z.string().min(10)
  })
  
  export type LoginDTO = z.infer<typeof createLoginSchema>
  export type RegisterDTO = z.infer<typeof createRegisterSchema>
  ```

### **Passo 6: Middlewares** (2 horas)

- [ ] `src/shared/middlewares/auth.middleware.ts`
  - Verificar JWT no header `Authorization: Bearer <token>`
  - Anexar `req.user` com dados do token
  - Retornar erro 401 se inválido
- [ ] `src/shared/middlewares/rbac.middleware.ts`
  - Verificar se usuário tem a role permitida
  - Retornar erro 403 se não autorizado
- [ ] `src/shared/middlewares/logger.middleware.ts`
  - Log de request/response
- [ ] `src/shared/middlewares/error.middleware.ts`
  - Já implementado em app.ts

### **Passo 7: Módulo Auth** (4-6 horas)

#### `src/modules/auth/auth.types.ts`
```typescript
export interface User {
  id: string
  email: string
  nomeCompleto: string
  funcao: 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO'
  status: 'ATIVO' | 'INATIVO' | 'SUSPENSO'
  criadoEm: Date
}

export interface JWTPayload {
  id: string
  email: string
  funcao: string
}
```

#### `src/modules/auth/auth.constants.ts`
```typescript
export const AUTH_MESSAGES = {
  USER_CREATED: 'Usuário criado com sucesso',
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  INVALID_CREDENTIALS: 'Email ou senha inválidos',
  EMAIL_EXISTS: 'Email já cadastrado',
  UNAUTHORIZED: 'Não autorizado',
}

export const JWT_CONFIG = {
  ACCESS_DURATION: '15m',
  REFRESH_DURATION: '7d',
}
```

#### `src/modules/auth/auth.repository.ts`
```typescript
export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  async findByEmail(email: string) {
    return this.prisma.usuarios.findUnique({ where: { email } })
  }

  async create(data: CreateUserInput) {
    return this.prisma.usuarios.create({ data })
  }

  async updateLastLogin(userId: string) {
    return this.prisma.usuarios.update({
      where: { id: userId },
      data: { ultimoAcessoEm: new Date() }
    })
  }
}
```

#### `src/modules/auth/auth.service.ts`
```typescript
export class AuthService {
  constructor(private repository: AuthRepository) {}

  async register(input: RegisterDTO) {
    // Validar email já existe
    const existingUser = await this.repository.findByEmail(input.email)
    if (existingUser) {
      throw new AppError('Email já cadastrado', 'EMAIL_ALREADY_EXISTS')
    }

    // Hash senha
    const senhaHash = await hash(input.senha, 10)

    // Criar usuário
    const user = await this.repository.create({
      email: input.email,
      senhaHash,
      nomeCompleto: input.nomeCompleto,
      telefone: input.telefone,
      funcao: 'RECEPCIONISTA', // role padrão
    })

    return {
      id: user.id,
      email: user.email,
      nomeCompleto: user.nomeCompleto
    }
  }

  async login(email: string, senha: string) {
    // Buscar usuário
    const user = await this.repository.findByEmail(email)
    if (!user) {
      throw new AppError(AUTH_MESSAGES.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS')
    }

    // Validar senha
    const senhaValida = await compare(senha, user.senhaHash)
    if (!senhaValida) {
      throw new AppError(AUTH_MESSAGES.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS')
    }

    // Atualizar last_login_at
    await this.repository.updateLastLogin(user.id)

    // Gerar tokens
    const accessToken = sign(
      { id: user.id, email: user.email, funcao: user.funcao },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    )

    const refreshToken = sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    )

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nomeCompleto: user.nomeCompleto,
        funcao: user.funcao
      }
    }
  }
}
```

#### `src/modules/auth/auth.controller.ts`
```typescript
export class AuthController {
  constructor(private service: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    const input = createRegisterSchema.parse(request.body)
    const user = await this.service.register(input)
    
    reply.status(201).send({
      success: true,
      data: user
    })
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const input = createLoginSchema.parse(request.body)
    const { accessToken, refreshToken, user } = await this.service.login(
      input.email,
      input.senha
    )
    
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    
    reply.send({
      success: true,
      data: { accessToken, user }
    })
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie('refreshToken')
    reply.send({
      success: true,
      data: { message: 'Logout realizado' }
    })
  }
}
```

#### `src/modules/auth/auth.routes.ts`
```typescript
export async function authRoutes(fastify: FastifyInstance) {
  const controller = new AuthController(authService)

  fastify.post('/api/v1/auth/register', 
    { schema: { body: createRegisterSchema } },
    (req, reply) => controller.register(req, reply)
  )

  fastify.post('/api/v1/auth/login',
    { schema: { body: createLoginSchema } },
    (req, reply) => controller.login(req, reply)
  )

  fastify.post('/api/v1/auth/logout',
    { onRequest: [fastify.authenticate] },
    (req, reply) => controller.logout(req, reply)
  )
}
```

### **Passo 8: EventBus** (30 min)

- [ ] `src/events/event-bus.ts`
```typescript
import { EventEmitter } from 'node:events'
export const eventBus = new EventEmitter()
```

### **Passo 9: Testes** (3-4 horas)

#### `src/modules/auth/__tests__/auth.service.spec.ts`
```typescript
describe('AuthService', () => {
  it('deve registrar novo usuário com sucesso', async () => {
    // arrange, act, assert
  })

  it('deve lançar erro ao registrar com email duplicado', async () => {
    // arrange, act, assert
  })

  it('deve fazer login com credenciais válidas', async () => {
    // arrange, act, assert
  })

  it('deve lançar erro ao fazer login com senha inválida', async () => {
    // arrange, act, assert
  })
})
```

#### `src/modules/auth/__tests__/auth.routes.spec.ts`
```typescript
describe('Auth Routes', () => {
  it('POST /api/v1/auth/register — deve registrar novo usuário', async () => {
    // arrange, act, assert
  })

  it('POST /api/v1/auth/login — deve fazer login', async () => {
    // arrange, act, assert
  })

  it('POST /api/v1/auth/logout — deve fazer logout', async () => {
    // arrange, act, assert
  })
})
```

Meta: 90%+ cobertura do AuthService

### **Passo 10: Documentação Swagger** (1 hora)

- [ ] Instalar `@fastify/swagger`
- [ ] Configurar em `src/app.ts`
- [ ] Documentar rotas auth
- [ ] Acessível em `http://localhost:3000/documentation`

### **Passo 11: Docker & CI** (1-2 horas)

- [ ] Criar `backend/Dockerfile`
- [ ] Atualizar `docker-compose.yml` com serviço backend
- [ ] Testar: `docker compose up`

---

## 🧪 TESTES OBRIGATÓRIOS

### Cobertura Esperada
| Módulo | Meta |
|--------|------|
| AuthService | 90%+ |
| AuthController | 80%+ |
| Utilitários (hash, jwt) | 100% |
| Middlewares | 80%+ |

### Comandos
```bash
npm run test                  # Executar testes
npm run test:watch           # Watch mode
npm run test:coverage        # Gerar cobertura
```

---

## ✅ DELIVERABLES FINAIS FASE 2

Ao concluir Fase 2, você deve ter:

- ✅ Backend rodando em `http://localhost:3000`
- ✅ `/api/v1/health` retornando `{ status: 'ok' }`
- ✅ `POST /api/v1/auth/register` funcionando
- ✅ `POST /api/v1/auth/login` retornando accessToken + refreshToken
- ✅ `POST /api/v1/auth/logout` limpando cookie
- ✅ Middlewares de autenticação funcionando
- ✅ RBAC pronto para uso (mesmo que sem aplicar em Fase 2)
- ✅ Testes com 80%+ cobertura
- ✅ Docker Compose com backend + mysql rodando
- ✅ Swagger documentado em /documentation
- ✅ `.env.example` completo com instruções
- ✅ Logs estruturados com Pino

---

## 🔄 FLUXO DE IMPLEMENTAÇÃO RECOMENDADO

```
1. Estrutura & Setup (2 horas)
   └─ Pastas, package.json, tsconfig.json, npm install

2. Prisma Setup (1 hora)
   └─ schema.prisma, migrations, prisma.client.ts

3. Utilitários Compartilhados (2 horas)
   └─ hash.ts, jwt.ts, logger.ts, errors

4. Fastify App (2 horas)
   └─ app.ts, server.ts, plugins, error handler

5. Schemas Zod (1 hora)
   └─ auth.schema.ts em packages/shared

6. Middlewares (2 horas)
   └─ auth, rbac, logger, error

7. Módulo Auth (4 horas)
   └─ repository, service, controller, routes

8. Testes (3 horas)
   └─ unitários + integração

9. Swagger (1 hora)
   └─ documentação OpenAPI

10. Docker & CI (1 hora)
    └─ Dockerfile, docker-compose

TOTAL: ~19 horas de trabalho
```

---

## 🎯 CHECKLIST ANTES DE PASSAR FASE 3

- [ ] `npm run dev` inicia backend sem erros
- [ ] `docker compose up` funciona (mysql + backend)
- [ ] `curl http://localhost:3000/api/v1/health` retorna status ok
- [ ] Swagger acessível em `http://localhost:3000/documentation`
- [ ] Testes passam: `npm run test` (cobertura >= 80%)
- [ ] Todos os arquivos criados conforme estrutura definida
- [ ] `.env.example` preenchido e documentado
- [ ] Git com primeiro commit: `chore: implementa Fase 2 (Backend Fastify + Auth)`
- [ ] Documentação de como rodar backend no README.md

---

## 📚 ARQUIVOS DE REFERÊNCIA

| Arquivo | Localização | Uso |
|---------|-------------|-----|
| Schema Prisma | `docs/2-MODELAGEM/schema.prisma` | Copiar para `backend/prisma/` |
| DER | `docs/2-MODELAGEM/01_MODELAGEM_DER.md` | Consultar durante desenvolvimento |
| Arquitetura | `docs/2-MODELAGEM/Projeto - Documentação final.md` | Padrões e regras |
| Guia Fase 2 | `docs/3-FASES/GUIA_FASE_2.md` | Passo a passo |
| Database URL | `docker/.env` | `mysql://user:pass@mysql:3306/pilates_db` |

---

## 🚀 PRÓXIMO PASSO

**Quer que eu comece a implementar Fase 2 agora?**

Posso:
1. ✅ Criar toda estrutura de pastas e arquivos
2. ✅ Implementar app.ts, server.ts, configurações
3. ✅ Criar utilitários (hash, jwt, logger)
4. ✅ Implementar módulo auth completo
5. ✅ Escrever testes com 90%+ cobertura
6. ✅ Configurar Swagger
7. ✅ Fazer primeiro commit com "feat: implementa Fase 2"

**Estimado:** 6-8 horas de desenvolvimento

---

**Status:** 🟢 **PRONTO PARA COMEÇAR FASE 2** 🚀
