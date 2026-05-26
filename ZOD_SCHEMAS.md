# 📐 Parte 6: Schemas Zod Compartilhados — Fase 2

**Status:** ✅ **CONCLUÍDO**  
**Data:** 26 de Maio de 2026  
**Tempo:** ~1h

---

## 🎯 O Que Foi Implementado

### Estrutura de Pastas

```
packages/shared/
├── schemas/
│   ├── auth.schema.ts              ✅ Login, Register, Refresh, ChangePassword
│   ├── aluno.schema.ts             ✅ Create, Update, List filters
│   ├── pagamento.schema.ts         ✅ Create, Update, List filters
│   ├── agenda.schema.ts            ✅ Create, Update, Presença
│   └── index.ts                    ✅ Exports centralizados
├── package.json                    ✅ Configuração do pacote
└── __tests__/
    ├── auth.schema.spec.ts         ✅ Testes auth
    └── aluno.schema.spec.ts        ✅ Testes aluno
```

---

## 📋 Detalhes de Cada Schema

### 1️⃣ `auth.schema.ts` — Autenticação

```typescript
loginSchema                    // Login (email + senha)
registerSchema                 // Registro (com confirmação de senha)
refreshTokenSchema             // Renovar token
changePasswordSchema           // Mudança de senha
authResponseSchema             // Response após login
tokenPayloadSchema             // Estrutura do JWT
```

#### Login
```typescript
{
  email: "user@pilates.local"  // Email válido, lowercase
  senha: "senha123"            // Min 6, max 128 chars
}
```

#### Register
```typescript
{
  email: "novo@pilates.local"
  nome: "João Silva"           // Min 3, max 255
  senha: "senha123"
  senhaConfirmacao: "senha123" // Deve ser igual
  telefone: "11987654321"      // Opcional, 10-11 dígitos
  cpf: "12345678901"           // Opcional, 11 dígitos
}
```

**Validações:**
- Email é obrigatório e válido
- Senha mín 6 caracteres
- Senhas devem corresponder
- Telefone: 10 ou 11 dígitos
- CPF: 11 dígitos
- Aceita null para campos opcionais

#### Change Password
```typescript
{
  senhaAtual: "senha123"
  novaSenha: "novaSenha456"
  novaSenhaConfirmacao: "novaSenha456"
}
```

**Validações:**
- Senhas devem corresponder
- Nova senha ≠ senha atual
- Mín 6 caracteres

---

### 2️⃣ `aluno.schema.ts` — Alunos

```typescript
createAlunoSchema              // Criar novo aluno
updateAlunoSchema              // Atualizar aluno (PATCH)
listAlunosSchema               // Filtros para listar
alunoResponseSchema            // Response ao buscar
listAlunosResponseSchema       // Response ao listar
```

#### Create Aluno
```typescript
{
  nome: "Maria Silva"                 // Min 3, max 255
  email: "maria@pilates.local"        // Email válido
  telefone: "11987654321"             // Obrigatório
  cpf: "12345678901"                  // Opcional
  dataNascimento: "1990-05-15"        // Deve ter 18+ anos
  endereco: "Rua X, 123"              // Opcional
  cidade: "São Paulo"                 // Opcional
  estado: "SP"                        // Opcional, 2 chars
  cep: "01234-567"                    // Opcional
  planoId: "uuid"                     // Obrigatório
  nomePagador: "Responsável"          // Opcional
  cpfPagador: "12345678901"           // Opcional
  ativo: true                         // Default true
  obs: "Observações"                  // Opcional, max 500
}
```

**Validações:**
- Email único (verificado em BD, não em schema)
- CPF único (verificado em BD)
- Data de nascimento: mín 18 anos
- Estado: 2 letras uppercase (SP, RJ, etc)
- CEP: formato 5 dígitos + 3 dígitos
- Telefone: 10 ou 11 dígitos

#### Update Aluno (PATCH)
```typescript
// Todos os campos opcionais
{ nome: "Novo Nome" }
{ email: "novo@pilates.local" }
{ ativo: false }
```

#### List Alunos (com filtros)
```typescript
{
  search: "Maria"              // Busca por nome/email
  planoId: "uuid"              // Filtrar por plano
  ativo: true                  // Filtrar status
  limite: 20                   // Default 20, max 100
  pagina: 1                    // Default 1
  ordenarPor: "dataCriacao"    // nome|dataCriacao|dataAtualizacao
  ordem: "desc"                // asc|desc
}
```

---

### 3️⃣ `pagamento.schema.ts` — Pagamentos

```typescript
createPagamentoSchema          // Criar pagamento
updatePagamentoSchema          // Atualizar pagamento
confirmarPagamentoSchema       // Confirmar recebimento
listPagamentosSchema           // Filtros para listar
pagamentoResponseSchema        // Response ao buscar
listPagamentosResponseSchema   // Response ao listar
```

#### Create Pagamento
```typescript
{
  alunoId: "uuid"                    // Obrigatório
  valor: 200.00                      // Positivo, max 999999.99
  dataVencimento: "2026-06-26"       // Futuro
  tipo: "MENSALIDADE"                // MENSALIDADE|AULA_EXTRA|MATERIAL|OUTROS
  metodo: "PIX"                      // PIX|CARTAO|BOLETO|DINHEIRO|TRANSFERENCIA
  descricao: "Descrição"             // Opcional
  referencia: "Ref-001"              // Opcional
}
```

**Status Possíveis:**
- PENDENTE (padrão)
- PAGO
- CANCELADO
- ATRASADO

#### List Pagamentos
```typescript
{
  alunoId: "uuid"                    // Filtro opcional
  status: "PENDENTE"                 // Filtro opcional
  tipo: "MENSALIDADE"                // Filtro opcional
  metodo: "PIX"                      // Filtro opcional
  dataInicio: "2026-05-01"           // Data mínima
  dataFim: "2026-05-31"              // Data máxima
  limite: 20                         // Default 20, max 100
  pagina: 1                          // Default 1
  ordenarPor: "dataVencimento"       // dataVencimento|valor|dataCriacao
  ordem: "asc"                       // asc|desc
}
```

---

### 4️⃣ `agenda.schema.ts` — Aulas

```typescript
createAulaSchema               // Criar aula
updateAulaSchema               // Atualizar aula (PATCH)
inscreverAlunoSchema           // Inscrever aluno em aula
marcarPresencaSchema           // Marcar presença
listAulasSchema                // Filtros para listar
aulaResponseSchema             // Response ao buscar
listAulasResponseSchema        // Response ao listar
```

#### Create Aula
```typescript
{
  professorId: "uuid"                // Obrigatório
  dataHora: "2026-06-01T10:00:00Z"   // Futuro, ISO 8601
  duracao: 60                        // Min 15, max 180 minutos
  capacidade: 10                     // Min 1, max 50
  tipo: "AULA_GRUPO"                 // AULA_GRUPO|AULA_INDIVIDUAL|AULA_DUPLA
  modalidade: "PILATES_MAT"          // PILATES_MAT|PILATES_APARELHOS|REFORMER|CADILLAC
  descricao: "Descrição"             // Opcional
  local: "Sala 1"                    // Opcional
  ativa: true                        // Default true
}
```

#### Marcar Presença
```typescript
{
  alunoId: "uuid"                    // Aluno
  presente: true                     // true|false
  observacoes: "Faltou última"       // Opcional
}
```

#### List Aulas
```typescript
{
  professorId: "uuid"                // Filtro opcional
  modalidade: "PILATES_MAT"          // Filtro opcional
  tipo: "AULA_GRUPO"                 // Filtro opcional
  dataInicio: "2026-06-01"           // Data mínima
  dataFim: "2026-06-30"              // Data máxima
  ativa: true                        // Filtro opcional
  limite: 20                         // Default 20, max 100
  pagina: 1                          // Default 1
  ordenarPor: "dataHora"             // dataHora|duracao|capacidade
  ordem: "asc"                       // asc|desc
}
```

---

## 🔄 Como Usar os Schemas

### No Backend (Services)

```typescript
import { createAlunoSchema, CreateAlunoDTO } from '@shared/schemas'
import { ValidationError } from '@shared/errors'

async function criarAluno(data: unknown): Promise<Aluno> {
  try {
    const validated = createAlunoSchema.parse(data)
    // validated é do tipo CreateAlunoDTO ✅
    return await repository.create(validated)
  } catch (error) {
    throw ValidationError.fromZod(error)
  }
}
```

### No Controller

```typescript
import { createAlunoSchema } from '@shared/schemas'

app.post('/api/v1/alunos', async (request, reply) => {
  const validated = createAlunoSchema.parse(request.body)
  const aluno = await service.create(validated)
  return { success: true, data: aluno }
})
```

### No Frontend (React)

```typescript
import { loginSchema, LoginDTO } from '@shared/schemas'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  async function handleLogin() {
    try {
      const data = { email, senha }
      const validated = loginSchema.parse(data)
      const response = await api.post('/api/v1/auth/login', validated)
      // response.data é AuthResponseDTO ✅
    } catch (error) {
      // Zod error
    }
  }
}
```

---

## 📊 Tipo Seguro Automático

### Zod Inference
```typescript
// Criar tipo a partir do schema
type CreateAlunoDTO = z.infer<typeof createAlunoSchema>

// Equivalente a:
type CreateAlunoDTO = {
  nome: string
  email: string
  telefone: string
  cpf?: string | null
  dataNascimento: string
  // ... todos os campos tipados
}
```

### Validação + Tipagem
```typescript
const validated = createAlunoSchema.parse(data)
// validated é tipado como CreateAlunoDTO automaticamente
// IDE oferece autocomplete ✅

await repository.create(validated)
// repository.create espera CreateAlunoDTO
// TypeScript garante compatibilidade ✅
```

---

## 🧪 Cobertura de Testes

### auth.schema.spec.ts
✅ Login válido  
✅ Email inválido  
✅ Senha muito curta  
✅ Email em minúsculas  
✅ Senhas não correspondem (register)  
✅ Nome muito curto  
✅ Telefone inválido  
✅ Refresh token válido/inválido  
✅ Mudança de senha: nova ≠ atual  

### aluno.schema.spec.ts
✅ Aluno com dados obrigatórios  
✅ Nome muito curto  
✅ Email inválido  
✅ Telefone formato inválido  
✅ Aluno menor de idade  
✅ CPF formato inválido  
✅ CPF válido  
✅ Campos opcionais como null  
✅ Atualização parcial (PATCH)  
✅ Filtros de lista (límites, páginas)  

---

## ✅ Checklist de Implementação

- [x] auth.schema.ts com 6 schemas + tipos
- [x] aluno.schema.ts com 5 schemas + tipos
- [x] pagamento.schema.ts com 5 schemas + tipos
- [x] agenda.schema.ts com 6 schemas + tipos
- [x] Validações: email, telefone, CPF, datas
- [x] Validações: campos obrigatórios vs opcionais
- [x] Validações: tamanho mínimo/máximo
- [x] Validações: enums para status/tipos
- [x] Validações: datas no futuro/passado
- [x] Refinemet: confirmar senhas, datas diferentes
- [x] Tipos TypeScript inferidos (z.infer)
- [x] Exports centralizados (index.ts)
- [x] package.json com paths corretos
- [x] Testes cobrindo validações principais
- [x] JSDoc em todos os schemas
- [x] Exemplos de uso em comentários

---

## 🔗 Integração com Outras Partes

### Com Middlewares (Parte 5)
```typescript
// Validação acontece antes dos middlewares
app.post('/api/v1/alunos', async (request) => {
  const validated = createAlunoSchema.parse(request.body)
  // Se inválido: throws ZodError
  // app.setErrorHandler converte para ValidationError (400)
})
```

### Com Services (Parte 7)
```typescript
class AlunoService {
  async create(data: CreateAlunoDTO) {
    // data já está validado e tipado
    return this.repository.create(data)
  }
}
```

### Com Frontend (React)
```typescript
// Mesmos schemas em frontend
import { createAlunoSchema } from '@shared/schemas'
const validated = createAlunoSchema.parse(formData)
const response = await api.post('/api/v1/alunos', validated)
```

---

## 📝 Próximas Etapas

### Parte 7: Auth Service + Repository
- Usar loginSchema, registerSchema
- Integrar com Bcrypt (Parte 3)
- Integrar com JWT (Parte 3)

### Parte 8: Auth Controller + Routes
- Validar request com schemas
- Retornar authResponseSchema
- Usar middlewares (Parte 5)

### Parte 9: Event Bus
- Emitir eventos após validação
- Listeners para auditoria

---

## 🚀 Pronto para Produção?

✅ Validação de entrada robusta  
✅ Tipagem TypeScript completa  
✅ Schemas compartilhados frontend/backend  
✅ Mensagens de erro claras  
✅ Testes de validação  
✅ DTOs (Data Transfer Objects) bem definidos  

**Status: ✅ PARTE 6 CONCLUÍDA — Pronto para Parte 7 (Auth Service)**

*Última atualização: 26 de Maio de 2026*
