# 🔨 PLANO DE EXECUÇÃO FASE 2 — Quebrado em Partes

**Status:** Planejamento  
**Objetivo:** Dividir a implementação de 19 horas em blocos menores e executáveis  
**Metodo:** Executar 1 parte por vez, com verificação e commit após cada parte

---

## 📦 VISÃO GERAL DAS 10 PARTES

```
┌─────────────────────────────────────────────────────────────┐
│ PARTE 1: Estrutura e Configuração Inicial                  │
│ ├─ Pastas backend/
│ ├─ package.json com todas as dependências
│ ├─ tsconfig.json
│ ├─ vitest.config.ts
│ ├─ .env e .env.example
│ └─ Tempo: 1-2 horas
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PARTE 2: Prisma Setup e Database                           │
│ ├─ Copiar schema.prisma
│ ├─ Executar npx prisma generate
│ ├─ Executar migrations
│ ├─ Criar prisma.client.ts
│ ├─ Verificar no DBeaver
│ └─ Tempo: 1 hora
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PARTE 3: Utilitários Compartilhados                         │
│ ├─ src/shared/utils/hash.ts (bcrypt)
│ ├─ src/shared/utils/jwt.ts (sign/verify)
│ ├─ src/shared/utils/logger.ts (pino)
│ ├─ src/shared/utils/validators.ts
│ ├─ src/shared/errors/AppError.ts
│ ├─ src/shared/errors/ValidationError.ts
│ ├─ src/shared/constants/messages.ts
│ └─ Tempo: 1.5-2 horas
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PARTE 4: Fastify App e Server                              │
│ ├─ src/config/env.ts (variáveis)
│ ├─ src/app.ts (Fastify setup com plugins)
│ ├─ src/server.ts (entry point)
│ ├─ Testar: npm run dev
│ └─ Tempo: 1-1.5 horas
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PARTE 5: Middlewares                                        │
│ ├─ src/shared/middlewares/auth.middleware.ts
│ ├─ src/shared/middlewares/rbac.middleware.ts
│ ├─ src/shared/middlewares/logger.middleware.ts
│ ├─ src/shared/middlewares/error.middleware.ts
│ └─ Tempo: 1.5-2 horas
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PARTE 6: Schemas Zod Compartilhados                         │
│ ├─ packages/shared/schemas/auth.schema.ts
│ ├─ packages/shared/schemas/index.ts
│ ├─ Importar em package.json como @shared
│ └─ Tempo: 45 min - 1 hora
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PARTE 7: Módulo Auth (Repository, Service, Types)          │
│ ├─ src/modules/auth/auth.types.ts
│ ├─ src/modules/auth/auth.constants.ts
│ ├─ src/modules/auth/auth.repository.ts
│ ├─ src/modules/auth/auth.service.ts
│ ├─ src/modules/auth/dto/*.ts
│ └─ Tempo: 2-2.5 horas
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PARTE 8: Módulo Auth (Controller e Routes)                 │
│ ├─ src/modules/auth/auth.controller.ts
│ ├─ src/modules/auth/auth.routes.ts
│ ├─ Registrar rotas em src/app.ts
│ ├─ Testar endpoints com curl/postman
│ └─ Tempo: 1.5-2 horas
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PARTE 9: EventBus                                           │
│ ├─ src/events/event-bus.ts
│ ├─ Emitir evento em auth.service.ts
│ └─ Tempo: 30 min
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PARTE 10: Testes, Swagger e Docker                          │
│ ├─ src/modules/auth/__tests__/auth.service.spec.ts
│ ├─ src/modules/auth/__tests__/auth.routes.spec.ts
│ ├─ @fastify/swagger setup
│ ├─ backend/Dockerfile
│ ├─ Atualizar docker-compose.yml
│ ├─ Verificar cobertura (80%+)
│ ├─ npm run test
│ ├─ docker compose up
│ └─ Tempo: 3-4 horas
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 PARTE 1: Estrutura e Configuração Inicial (1-2 horas)

### O que será criado:

```
backend/
├── src/
│   ├── modules/
│   │   └── auth/
│   │       ├── dto/
│   │       ├── __tests__/
│   │       └── (arquivos de auth)
│   ├── shared/
│   │   ├── errors/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── types/
│   ├── events/
│   ├── database/
│   │   ├── prisma/
│   │   └── migrations/
│   ├── config/
│   └── (arquivos raiz: app.ts, server.ts)
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .env
├── .env.example
└── .gitignore
```

### Arquivos a criar nesta parte:

1. **backend/package.json**
   - scripts: dev, build, start, test, test:coverage
   - dependencies: fastify, @fastify/*, prisma, @prisma/client, bcryptjs, zod, pino, pino-pretty, typescript
   - devDependencies: @types/node, tsx, vitest, supertest, @types/supertest, @fastify/swagger, eslint, prettier

2. **backend/tsconfig.json**
   - Configuração TypeScript com paths: `@shared`, `@modules`

3. **backend/vitest.config.ts**
   - Setup básico para testes

4. **backend/.env**
   ```
   DATABASE_URL=mysql://pilates_user:pilates_pass@mysql:3306/pilates_db
   NODE_ENV=development
   JWT_SECRET=seu_secret_super_seguro_aqui_32_caracteres_minimo
   JWT_REFRESH_SECRET=seu_refresh_secret_super_seguro_32_caracteres
   PORT=3000
   ```

5. **backend/.env.example**
   ```
   DATABASE_URL=mysql://user:password@localhost:3306/pilates_db
   NODE_ENV=development
   JWT_SECRET=gerar com: openssl rand -base64 32
   JWT_REFRESH_SECRET=gerar com: openssl rand -base64 32
   PORT=3000
   ```

6. **Pastas vazias** (estrutura apenas):
   - src/modules/auth/{dto,__tests__}
   - src/shared/{errors,middlewares,utils,constants,types}
   - src/events/
   - src/database/{prisma,migrations}
   - src/config/

### Verificação ao final:

```bash
# Estrutura criada
ls -R backend/src/

# package.json válido
cat backend/package.json | grep '"name"'

# Pastas existem
[ -d "backend/src/modules/auth" ] && echo "✅ OK"
```

---

## 🗄️ PARTE 2: Prisma Setup e Database (1 hora)

### O que será feito:

1. **backend/prisma/schema.prisma**
   - Copiar do arquivo na documentação
   - Adaptar para nomes em português (já está em português no init.sql)
   - 13 modelos Prisma com todos os relacionamentos

2. **Executar comandos:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   ```

3. **backend/src/database/prisma.client.ts**
   ```typescript
   import { PrismaClient } from '@prisma/client'
   
   export const prisma = new PrismaClient()
   
   export default prisma
   ```

4. **Verificar no DBeaver:**
   - Conectar em localhost:3306
   - Verificar 13 tabelas em português: usuarios, alunos, professores, aulas, presencas, etc.
   - Verificar relacionamentos estão ok

### Verificação ao final:

```bash
# Prisma gerado
[ -f "backend/node_modules/.prisma/client/index.d.ts" ] && echo "✅ Prisma OK"

# Migrations executadas
ls backend/prisma/migrations/ | wc -l

# DBeaver: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'pilates_db'
# Deve retornar 13
```

---

## 🔧 PARTE 3: Utilitários Compartilhados (1.5-2 horas)

### Arquivos a criar:

**1. backend/src/shared/utils/hash.ts**
```typescript
import { hash, compare } from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash)
}
```

**2. backend/src/shared/utils/jwt.ts**
```typescript
import { sign, verify, decode } from 'jsonwebtoken'

interface JWTPayload {
  id: string
  email: string
  funcao: string
}

export function signAccessToken(payload: JWTPayload): string {
  return sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' })
}

export function signRefreshToken(payload: { id: string }): string {
  return sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JWTPayload {
  return verify(token, process.env.JWT_SECRET!) as JWTPayload
}

export function verifyRefreshToken(token: string): { id: string } {
  return verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string }
}

export function decodeToken(token: string) {
  return decode(token)
}
```

**3. backend/src/shared/utils/logger.ts**
```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
})
```

**4. backend/src/shared/utils/validators.ts**
```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\d{10,20}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
```

**5. backend/src/shared/errors/AppError.ts**
```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```

**6. backend/src/shared/errors/ValidationError.ts**
```typescript
import { AppError } from './AppError'

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 422)
  }
}
```

**7. backend/src/shared/errors/UnauthorizedError.ts**
```typescript
import { AppError } from './AppError'

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 'UNAUTHORIZED', 401)
  }
}
```

**8. backend/src/shared/constants/messages.ts**
```typescript
export const AUTH_MESSAGES = {
  USER_CREATED: 'Usuário criado com sucesso',
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  INVALID_CREDENTIALS: 'Email ou senha inválidos',
  EMAIL_ALREADY_EXISTS: 'Email já cadastrado',
  USER_NOT_FOUND: 'Usuário não encontrado',
  UNAUTHORIZED: 'Não autorizado',
  FORBIDDEN: 'Acesso proibido',
  TOKEN_EXPIRED: 'Token expirado',
  INVALID_TOKEN: 'Token inválido',
  INTERNAL_ERROR: 'Erro interno do servidor',
}

export const JWT_CONFIG = {
  ACCESS_DURATION: '15m',
  REFRESH_DURATION: '7d',
}
```

### Verificação ao final:

```bash
# Arquivos criados
ls -la backend/src/shared/utils/
ls -la backend/src/shared/errors/
ls -la backend/src/shared/constants/

# Importações funcionam
grep -r "import.*from.*hash" backend/src/ && echo "✅ Imports OK"
```

---

## 🚀 PARTE 4: Fastify App e Server (1-1.5 horas)

### Arquivos a criar:

**1. backend/src/config/env.ts**
```typescript
export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production',
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  PORT: parseInt(process.env.PORT || '3000'),
}

// Validar variáveis obrigatórias
const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']
for (const env_var of requiredEnvs) {
  if (!process.env[env_var]) {
    throw new Error(`Variável de ambiente obrigatória: ${env_var}`)
  }
}
```

**2. backend/src/app.ts**
```typescript
import Fastify, { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import { logger } from './shared/utils/logger'
import { env } from './config/env'
import { AppError } from './shared/errors/AppError'

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'debug' : 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  })

  // Security: Helmet
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  })

  // Security: CORS
  await fastify.register(fastifyCors, {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  })

  // Security: Rate Limit
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  })

  // Authentication: JWT
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  })

  // Health check
  fastify.get('/api/v1/health', async (request, reply) => {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    }
  })

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    logger.error(error)

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        message: error.message,
        code: error.code,
      })
    }

    return reply.status(500).send({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
    })
  })

  return fastify
}
```

**3. backend/src/server.ts**
```typescript
import { buildApp } from './app'
import { env } from './config/env'
import { logger } from './shared/utils/logger'

async function start() {
  try {
    const app = await buildApp()
    
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    
    logger.info(`✅ Server rodando em http://localhost:${env.PORT}`)
    logger.info(`📚 Swagger em http://localhost:${env.PORT}/documentation`)
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

start()
```

### Verificação ao final:

```bash
# npm run dev deve funcionar
npm run dev

# Health check retorna sucesso
# curl http://localhost:3000/api/v1/health
# {"success":true,"data":{"status":"ok",...}}
```

---

## 🛡️ PARTE 5: Middlewares (1.5-2 horas)

### Arquivos a criar:

**1. backend/src/shared/middlewares/auth.middleware.ts**
```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { verifyAccessToken } from '../utils/jwt'

export async function authenticateMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = extractTokenFromHeader(request.headers.authorization)
    if (!token) {
      throw new UnauthorizedError('Token não fornecido')
    }

    const decoded = verifyAccessToken(token)
    request.user = decoded
  } catch (error) {
    throw new UnauthorizedError('Token inválido ou expirado')
  }
}

function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        funcao: string
      }
    }
  }
}
```

**2. backend/src/shared/middlewares/rbac.middleware.ts**
```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from '../errors/AppError'

type RoleType = 'ADMIN' | 'PROFESSOR' | 'RECEPCIONISTA' | 'FINANCEIRO'

export function rbacMiddleware(allowedRoles: RoleType[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new AppError('Usuário não autenticado', 'UNAUTHORIZED', 401)
    }

    const userRole = request.user.funcao as RoleType
    if (!allowedRoles.includes(userRole)) {
      throw new AppError('Acesso proibido', 'FORBIDDEN', 403)
    }
  }
}
```

**3. backend/src/shared/middlewares/logger.middleware.ts**
```typescript
import { FastifyRequest, FastifyReply } from 'fastify'
import { logger } from '../utils/logger'

export async function loggerMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const start = Date.now()

  reply.addHook('onSend', async (request, reply, payload) => {
    const duration = Date.now() - start
    logger.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
    })
    return payload
  })
}
```

**4. backend/src/shared/middlewares/error.middleware.ts**
```typescript
// Já implementado em app.ts como setErrorHandler
// Este arquivo é para documentação apenas
```

### Verificação ao final:

```bash
# Middlewares estão criados
ls -la backend/src/shared/middlewares/

# Podem ser importados
grep -r "import.*authenticateMiddleware" backend/src/ || echo "✅ Ainda não usado (será em Part 8)"
```

---

## 📦 PARTE 6: Schemas Zod Compartilhados (45 min - 1 hora)

### Arquivos a criar:

**1. packages/shared/schemas/auth.schema.ts**
```typescript
import { z } from 'zod'

export const createLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export const createRegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  nomeCompleto: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  telefone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().min(11, 'CPF inválido').optional(),
})

export const createRefreshTokenSchema = z.object({
  refreshToken: z.string(),
})

// Types gerados do Zod
export type LoginDTO = z.infer<typeof createLoginSchema>
export type RegisterDTO = z.infer<typeof createRegisterSchema>
export type RefreshTokenDTO = z.infer<typeof createRefreshTokenSchema>
```

**2. packages/shared/schemas/index.ts**
```typescript
export * from './auth.schema'
```

**3. Atualizar tsconfig paths**

No raiz do projeto, atualizar package.json para configurar workspaces:

```json
{
  "workspaces": ["backend", "frontend", "packages/shared"]
}
```

No backend/tsconfig.json:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["../packages/shared/*"]
    }
  }
}
```

### Verificação ao final:

```bash
# Schema criado
cat packages/shared/schemas/auth.schema.ts | grep "export const"

# npm install para workspace
npm install

# Pode importar no backend
grep -r "@shared" backend/src/ || echo "✅ Será importado na Parte 7"
```

---

## 🏛️ PARTE 7: Módulo Auth — Repository, Service, Types (2-2.5 horas)

### Arquivos a criar:

**1. backend/src/modules/auth/auth.types.ts**
**2. backend/src/modules/auth/auth.constants.ts**
**3. backend/src/modules/auth/dto/login.dto.ts**
**4. backend/src/modules/auth/dto/register.dto.ts**
**5. backend/src/modules/auth/dto/refresh-token.dto.ts**
**6. backend/src/modules/auth/auth.schema.ts**
**7. backend/src/modules/auth/auth.repository.ts**
**8. backend/src/modules/auth/auth.service.ts**

*(Código detalhado em ANALISE_FASE_2.md)*

### Verificação ao final:

```bash
# Arquivos criados
ls -la backend/src/modules/auth/

# Imports funcionam
npm run build --prefix backend || echo "✅ Build OK (se TypeScript compilar)"

# AuthService pode ser instanciado
# Será testado na Parte 10
```

---

## 🎮 PARTE 8: Módulo Auth — Controller e Routes (1.5-2 horas)

### Arquivos a criar:

**1. backend/src/modules/auth/auth.controller.ts**
**2. backend/src/modules/auth/auth.routes.ts**

E registrar em src/app.ts:

```typescript
import { authRoutes } from './modules/auth/auth.routes'

export async function buildApp(): Promise<FastifyInstance> {
  // ... plugins ...

  // Rotas
  await app.register(authRoutes)

  return app
}
```

### Verificação ao final:

```bash
# npm run dev deve rodar sem erros
npm run dev

# Endpoints devem estar disponíveis:
# POST /api/v1/auth/register
# POST /api/v1/auth/login
# POST /api/v1/auth/logout

# Testar:
# curl -X POST http://localhost:3000/api/v1/auth/register \
#   -H "Content-Type: application/json" \
#   -d '{"email":"test@test.com","senha":"12345678","nomeCompleto":"Teste","telefone":"11999999999"}'
```

---

## 🔌 PARTE 9: EventBus (30 min)

### Arquivos a criar:

**1. backend/src/events/event-bus.ts**
```typescript
import { EventEmitter } from 'node:events'

export const eventBus = new EventEmitter()

// Tipos de eventos
export interface EventMap {
  'usuario.criado': { id: string; email: string; nomeCompleto: string }
  'login.realizado': { id: string; email: string }
  'logout.realizado': { id: string }
}

// Helper para tipagem
export function emitEvent<K extends keyof EventMap>(
  event: K,
  data: EventMap[K]
) {
  eventBus.emit(event, data)
}

export function onEvent<K extends keyof EventMap>(
  event: K,
  handler: (data: EventMap[K]) => void
) {
  eventBus.on(event, handler)
}
```

### Atualizar auth.service.ts para emitir eventos:

```typescript
// Adicionar ao register():
eventBus.emit('usuario.criado', {
  id: user.id,
  email: user.email,
  nomeCompleto: user.nomeCompleto,
})

// Adicionar ao login():
eventBus.emit('login.realizado', {
  id: user.id,
  email: user.email,
})
```

### Verificação ao final:

```bash
# Arquivo criado
ls -la backend/src/events/

# npm run dev sem erros
npm run dev

# Eventos devem estar sendo emitidos (verificar em logs)
```

---

## 🧪 PARTE 10: Testes, Swagger e Docker (3-4 horas)

### A) Testes

**1. backend/src/modules/auth/__tests__/auth.service.spec.ts**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '../auth.service'

// 8-10 testes unitários
// Meta: 90%+ cobertura
```

**2. backend/src/modules/auth/__tests__/auth.routes.spec.ts**
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../../../app'

// 6-8 testes de integração
// Meta: 80%+ cobertura
```

### B) Swagger

Instalar e configurar em src/app.ts:
```bash
npm install @fastify/swagger
```

```typescript
import fastifySwagger from '@fastify/swagger'

await fastify.register(fastifySwagger, {
  routePrefix: '/documentation',
  swagger: {
    info: {
      title: 'API Studio Pilates',
      version: '1.0.0',
    },
  },
})
```

Documentar rotas em auth.routes.ts.

### C) Docker

**1. backend/Dockerfile**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/server.js"]
```

**2. Atualizar docker-compose.yml**
```yaml
services:
  backend:
    build: ./backend
    container_name: pilates_backend
    environment:
      - DATABASE_URL=mysql://pilates_user:pilates_pass@mysql:3306/pilates_db
      - NODE_ENV=development
      - JWT_SECRET=...
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped
```

### Verificação ao final:

```bash
# Testes
npm run test --prefix backend
npm run test:coverage --prefix backend
# Esperado: 80%+ cobertura

# Swagger
# Acessar: http://localhost:3000/documentation

# Docker
docker compose up -d
# Esperado: backend + mysql rodando

# Testar endpoints
curl http://localhost:3000/api/v1/health
# {"success":true,"data":{"status":"ok",...}}
```

---

## 📊 RESUMO DO PLANO

| Parte | O que faz | Tempo | Status |
|-------|-----------|-------|--------|
| 1 | Estrutura + package.json + config | 1-2h | ⏳ Aguardando |
| 2 | Prisma + migrations | 1h | ⏳ Aguardando |
| 3 | Utilitários (hash, jwt, logger) | 1.5-2h | ⏳ Aguardando |
| 4 | Fastify app + server | 1-1.5h | ⏳ Aguardando |
| 5 | Middlewares | 1.5-2h | ⏳ Aguardando |
| 6 | Schemas Zod | 45min-1h | ⏳ Aguardando |
| 7 | Auth repository + service | 2-2.5h | ⏳ Aguardando |
| 8 | Auth controller + routes | 1.5-2h | ⏳ Aguardando |
| 9 | EventBus | 30min | ⏳ Aguardando |
| 10 | Testes + Swagger + Docker | 3-4h | ⏳ Aguardando |
| **TOTAL** | **Backend 100% funcional** | **~19h** | ⏳ Aguardando |

---

## 🎯 PRÓXIMO PASSO

Qual parte você quer que comece?

**Opções:**

A) 🚀 **Começar pela PARTE 1** (Estrutura)  
   - Criar pastas, package.json, tsconfig, .env

B) 🔧 **Começar pela PARTE 2** (Prisma)  
   - Assumindo que Parte 1 já está feita

C) 📋 **Rever o plano** antes de começar  
   - Fazer perguntas, ajustes, esclarecer dúvidas

D) 🎓 **Aprender o padrão primeiro**  
   - Explicar arquitetura antes de implementar

E) 🔨 **Começar tudo de uma vez** (19h straight)  
   - Não seguir as partes, implementar tudo junto

---

**Qual você prefere? Estou pronto! 🚀**

