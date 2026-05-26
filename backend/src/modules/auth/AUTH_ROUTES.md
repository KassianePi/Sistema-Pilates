# Auth Routes - Documentação Completa

## Visão Geral

O módulo Auth expõe 5 endpoints HTTP para gerenciar autenticação de usuários:

- 3 endpoints **públicos** (login, register, refresh)
- 2 endpoints **protegidos** (logout, change-password)

Todos os endpoints seguem o padrão de resposta:

```json
{
  "success": true,
  "data": { /* dados da resposta */ }
}
```

ou em caso de erro:

```json
{
  "success": false,
  "message": "Descrição do erro",
  "code": "CODIGO_DO_ERRO"
}
```

---

## Endpoints

### 1. POST /api/v1/auth/login

**Status:** `200 OK` | **Status Erro:** `400 Bad Request` | `401 Unauthorized`

Autentica usuário com email e senha.

**Request:**
```json
{
  "email": "user@pilates.local",
  "senha": "senha123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "usuarioId": "uuid-123",
    "email": "user@pilates.local",
    "nome": "João Silva",
    "funcao": "ADMIN",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

**Validações:**
- Email deve ser válido
- Senha mínimo 6 caracteres
- Email convertido para minúsculas automaticamente
- Usuário deve estar ativo (status = ATIVO)
- Credenciais devem estar corretas

**Erros:**
- `400` - Email inválido ou senha muito curta
- `401` - Email não encontrado ou senha incorreta

---

### 2. POST /api/v1/auth/register

**Status:** `201 Created` | **Status Erro:** `400 Bad Request`

Registra novo usuário.

**Request:**
```json
{
  "email": "novo@pilates.local",
  "nome": "João Silva",
  "cpf": "12345678901",
  "telefone": "11999999999",
  "senha": "senha123",
  "senhaConfirmacao": "senha123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "usuarioId": "uuid-456",
    "email": "novo@pilates.local",
    "nome": "João Silva",
    "funcao": "RECEPCIONISTA",
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

**Validações:**
- Email deve ser válido e único
- Nome mínimo 3 caracteres
- CPF deve ter 11 dígitos (obrigatório)
- Telefone deve ter 10-11 dígitos (opcional)
- Senhas devem coincidir
- Senhas mínimo 6 caracteres
- Email convertido para minúsculas automaticamente

**Role padrão:** `RECEPCIONISTA`

**Erros:**
- `400` - Validação falhou ou email já existe

---

### 3. POST /api/v1/auth/refresh

**Status:** `200 OK` | **Status Erro:** `400 Bad Request` | `401 Unauthorized`

Renova access token usando refresh token. Implementa **rotação de refresh token**.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

**Comportamento:**
- Valida refresh token antigo
- Gera novo access token (15 minutos)
- Gera novo refresh token (7 dias) - **rotação**
- Retorna ambos os tokens

**Erros:**
- `400` - Refresh token inválido ou vazio
- `401` - Refresh token expirado ou inválido

---

### 4. POST /api/v1/auth/logout

**Status:** `200 OK` | **Status Erro:** `401 Unauthorized`

Realiza logout do usuário. ⚠️ **PROTEGIDO** (requer autenticação)

**Request:**
```
Authorization: Bearer eyJhbGc...
```

**Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

**Comportamento:**
- Apenas registra o logout em logs
- JWT é stateless, cliente responsável por remover token
- Pode ser usado como hook para limpeza no cliente

**Erros:**
- `401` - Token ausente, inválido ou expirado

---

### 5. POST /api/v1/auth/change-password

**Status:** `200 OK` | **Status Erro:** `400 Bad Request` | `401 Unauthorized`

Muda senha do usuário autenticado. ⚠️ **PROTEGIDO** (requer autenticação)

**Request:**
```
Authorization: Bearer eyJhbGc...
```

```json
{
  "senhaAtual": "senha123",
  "novaSenha": "novaSenha456",
  "novaSenhaConfirmacao": "novaSenha456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

**Validações:**
- Senhas mínimo 6 caracteres
- Senhas deve coincidir
- Nova senha deve ser diferente da atual
- Senha atual deve estar correta

**Erros:**
- `400` - Validação falhou (senhas não coincidem, muito curtas)
- `401` - Token ausente ou senha atual incorreta

---

## Fluxo de Autenticação

### 1. Login
```
POST /api/v1/auth/login
↓
Validar email/senha
↓
Verificar usuário existe e está ativo
↓
Comparar senha com Bcrypt
↓
Gerar access token (15 min) + refresh token (7 dias)
↓
200 OK com tokens
```

### 2. Usar Access Token
```
GET /api/v1/data
Authorization: Bearer <accessToken>
↓
Middleware valida token
↓
Se válido: continua
Se expirado: erro 401
Se inválido: erro 401
```

### 3. Renovar Token (Refresh)
```
POST /api/v1/auth/refresh
Body: { refreshToken }
↓
Validar refresh token
↓
Gerar novo access token (15 min)
↓
Gerar novo refresh token (7 dias) - ROTAÇÃO
↓
200 OK com novos tokens
```

### 4. Logout
```
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
↓
Log de logout
↓
200 OK
↓
Client remove tokens
```

---

## Segurança

### JWT
- **Access Token:** HS256, 15 minutos
- **Refresh Token:** HS256, 7 dias
- Secrets em variáveis de ambiente

### Passwords
- **Hash:** Bcrypt (10 salt rounds)
- **Validação:** Mínimo 6 caracteres

### Rate Limiting
- Rotas públicas: limite aplicado globalmente (100 req/15 min)
- Localhost: sem limite

### RBAC
- Não há autorização específica por role nestes endpoints
- Logout e change-password requerem apenas autenticação

---

## Exemplos cURL

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@pilates.local","senha":"senha123"}'
```

### Register
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"novo@pilates.local",
    "nome":"João Silva",
    "cpf":"12345678901",
    "telefone":"11999999999",
    "senha":"senha123",
    "senhaConfirmacao":"senha123"
  }'
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGc..."}'
```

### Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGc..."
```

### Change Password
```bash
curl -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "senhaAtual":"senha123",
    "novaSenha":"novaSenha456",
    "novaSenhaConfirmacao":"novaSenha456"
  }'
```

---

## Testes

Todos os endpoints têm testes de integração com Supertest:

```bash
npm run test -- auth.routes.spec.ts
```

Cobertura:
- ✅ Login com credenciais corretas
- ✅ Login com email inválido
- ✅ Login com credenciais incorretas
- ✅ Register com dados válidos
- ✅ Register com email duplicado
- ✅ Refresh token válido
- ✅ Refresh token inválido
- ✅ Logout com autenticação
- ✅ Change password com autenticação
- ✅ Change password com senha incorreta

---

## Status HTTP

| Método | Endpoint | Status Sucesso | Status Erro |
|--------|----------|---|---|
| POST | /login | 200 | 400, 401 |
| POST | /register | 201 | 400 |
| POST | /refresh | 200 | 400, 401 |
| POST | /logout | 200 | 401 |
| POST | /change-password | 200 | 400, 401 |

---

## Próximas Etapas

- [ ] Implementar Swagger/OpenAPI completo
- [ ] Adicionar rate limiting específico por endpoint
- [ ] Implementar token blacklist para logout
- [ ] Adicionar refresh token rotation audit log
- [ ] Implementar 2FA (autenticação de dois fatores)
