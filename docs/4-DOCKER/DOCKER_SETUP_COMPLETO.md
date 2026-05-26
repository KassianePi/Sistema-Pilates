# ✅ DOCKER SETUP — COMPLETO

**Data:** 26 de Maio de 2026  
**Status:** 🟢 Pronto para usar  
**Tempo de setup:** 5 minutos

---

## 📦 Arquivos Criados para Docker

```
Sistema pilates/
├── 🐳 docker-compose.yml          (13 KB) — Orquestração dos containers
├── 🗄️ init.sql                      (18 KB) — Script de inicialização (cria 13 tabelas)
├── ⚙️ mysql.cnf                     (3 KB)  — Configurações MySQL otimizadas
├── 🔐 .env.example                  (2 KB)  — Variáveis de ambiente (template)
└── 📖 README_DOCKER.md              (12 KB) — Guia completo de uso
```

---

## 🚀 Como Começar (5 passos)

### 1️⃣ Copiar .env.example para .env

```bash
cp .env.example .env
```

### 2️⃣ Subir o Docker Compose

```bash
docker-compose up -d
```

### 3️⃣ Aguardar MySQL estar pronto (~30-60 segundos)

```bash
docker-compose logs -f mysql
# Procurar por: "[Server] MySQL Server has started"
```

### 4️⃣ Abrir Adminer no navegador

```
http://localhost:8080
```

**Credenciais:**
- Server: `mysql`
- User: `pilates_user`
- Password: `pilates_pass`
- Database: `pilates_db`

### 5️⃣ Explorar o banco de dados!

Você verá:
- ✅ 13 tabelas criadas
- ✅ 4 usuários de teste
- ✅ 1 professor cadastrado
- ✅ 1 aluno cadastrado
- ✅ 1 plano de 30 dias
- ✅ Todas as relações entre tabelas

---

## 🏗️ Containers Criados

### MySQL 8.0 (Alpine)

```
Container: pilates_mysql
Status: Running
Port: 3306 (localhost)
Volume: mysql_data (persistente)
Health Check: ✅ Automático
```

**Acesso:**
- Direct: `localhost:3306`
- Network: `mysql:3306` (para outros containers)
- User: `pilates_user` / `pilates_pass`
- Root: `root` / `root123`

### Adminer

```
Container: pilates_adminer
Status: Running
URL: http://localhost:8080
Dependência: Aguarda MySQL estar healthy
```

**Recursos:**
- ✅ Interface web simples
- ✅ Sem instalação extra
- ✅ Suporta SQL direto
- ✅ Gerencia todas as operações

---

## 📊 Banco de Dados Criado

### Entidades (13 tabelas)

| # | Tabela | Campos | Índices | FK | Descrição |
|---|--------|--------|---------|----|----|
| 1️⃣ | `users` | 11 | 4 | - | Autenticação (admin, professor, recepcionista, aluno) |
| 2️⃣ | `students` | 13 | 2 | 1 | Dados de alunos (1:1 com users) |
| 3️⃣ | `instructors` | 8 | 2 | 1 | Dados de professores (1:1 com users) |
| 4️⃣ | `student_plans` | 10 | 4 | 1 | Histórico de planos (BASICO_4, BASICO_8, PREMIUM) |
| 5️⃣ | `student_progress` | 10 | 3 | 2 | Avaliações e progresso |
| 6️⃣ | `class_schedules` | 9 | 3 | 1 | Horários recorrentes (seg-dom) |
| 7️⃣ | `classes` | 12 | 3 | 2 | Ocorrências de aulas (cada data) |
| 8️⃣ | `attendances` | 8 | 3 | 2 | Presença/ausência em aulas |
| 9️⃣ | `monthly_fees` | 10 | 4 | 1 | Mensalidades (geradas automaticamente) |
| 🔟 | `payments` | 9 | 3 | 2 | Registros de pagamento |
| 1️⃣1️⃣ | `cash_registers` | 12 | 4 | 2 | Caixa diário |
| 1️⃣2️⃣ | `notifications` | 7 | 3 | 1 | Alertas automáticos |
| 1️⃣3️⃣ | `audit_logs` | 10 | 3 | 1 | Rastreamento de operações |

**Total:** 131 campos, 40+ índices, 20+ relacionamentos

### Views Criadas (2)

| View | Propósito |
|------|-----------|
| `v_students_financial_status` | Status financeiro dos alunos em tempo real |
| `v_classes_with_enrollments` | Classes com inscrições e presença |

### Dados de Teste Inseridos

```
Users:
- admin@pilates.local (ADMIN)
- recepcionista@pilates.local (RECEPTIONIST)
- professor@pilates.local (INSTRUCTOR)
- aluno@pilates.local (RECEPTIONIST)

Instructors:
- 1 professor (Pilates Clássico)

Students:
- 1 aluno (Maria Silva)

Student Plans:
- 1 plano BASICO_4 (R$ 200/mês, 4 aulas/semana)
  Vigência: 30 dias (hoje + 30)
```

---

## 🎯 O Que Você Consegue Fazer Agora

✅ **Explorar o banco visualmente** no Adminer  
✅ **Ver todas as 13 tabelas** e sua estrutura  
✅ **Executar queries SQL** diretamente  
✅ **Verificar os relacionamentos** entre tabelas  
✅ **Ver os dados de teste** (usuários, aluno, plano)  
✅ **Inserir dados manualmente** para teste  
✅ **Backup/Export** dos dados  
✅ **Entender a estrutura** antes de codificar  

---

## 🔌 Acesso aos Dados

### Via Adminer (Recomendado)

```
URL: http://localhost:8080
Server: mysql
Database: pilates_db
User: pilates_user
Password: pilates_pass
```

### Via MySQL CLI

```bash
mysql -h 127.0.0.1 -u pilates_user -p pilates_db
# Senha: pilates_pass

# Ou como root
mysql -h 127.0.0.1 -u root -p
# Senha: root123
```

### Via DBeaver (Recomendado para ER Diagram)

```
Host: localhost:3306
User: pilates_user
Password: pilates_pass
Database: pilates_db
```

Clique em **ER Diagram** para ver o diagrama visual completo!

---

## 📋 Variáveis de Ambiente (.env)

### Banco de Dados

```env
MYSQL_ROOT_PASSWORD=root123
MYSQL_DATABASE=pilates_db
MYSQL_USER=pilates_user
MYSQL_PASSWORD=pilates_pass
MYSQL_PORT=3306
```

### Interface Web

```env
ADMINER_PORT=8080
# Acesso: http://localhost:8080
```

### Para Fase 2 (Backend)

```env
NODE_ENV=development
DATABASE_URL=mysql://pilates_user:pilates_pass@mysql:3306/pilates_db
```

---

## 🔧 Comandos Essenciais

```bash
# Ver status
docker-compose ps

# Ver logs (MySQL)
docker-compose logs -f mysql

# Entrar no MySQL
docker-compose exec mysql mysql -u pilates_user -p pilates_db

# Parar (mantém dados)
docker-compose stop

# Reiniciar
docker-compose restart

# Parar e remover (mantém dados em volume)
docker-compose down

# Parar e remover TUDO (apaga dados!)
docker-compose down -v
```

---

## 🎨 Estrutura Visual

```
┌─────────────────────────────────────────────────┐
│         DOCKER COMPOSE SETUP                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────────┐         ┌──────────────┐  │
│  │  MySQL 8.0     │ ◄────► │   Adminer    │  │
│  │                │         │  (Web UI)    │  │
│  │ Port: 3306     │         │ Port: 8080   │  │
│  │ Volume: data   │         │              │  │
│  │ Status: Healthy│         │ Running      │  │
│  └────────────────┘         └──────────────┘  │
│                                                 │
│  Dados Persistentes:                           │
│  └─ /var/lib/docker/volumes/mysql_data        │
│                                                 │
└─────────────────────────────────────────────────┘
         ↓ Acesse em http://localhost:8080
```

---

## ✨ O Que Vem Depois

### Fase 2: Backend (Próxima)

O Docker setup que você acabou de criar será usado:

```
Backend (Fase 2) ──► DATABASE_URL=mysql://...@mysql:3306/pilates_db
                    ├─ Conecta ao MySQL via network Docker
                    ├─ Usar schema.prisma
                    └─ Implementar APIs REST
```

### Fase 3+: CRUDs

```
APIs REST ◄──► Adminer (teste visual) + DBeaver (diagrama)
          │
          └─► MySQL (banco de dados)
```

---

## 🎓 Verificação Final

Checklist completo:

- [ ] Docker instalado e rodando
- [ ] `docker-compose up -d` executado
- [ ] Todos os containers em "Up" (docker-compose ps)
- [ ] MySQL está "healthy" (pode levar 30-60s)
- [ ] Adminer acessível em http://localhost:8080
- [ ] Consegue fazer login no Adminer
- [ ] Vê as 13 tabelas
- [ ] Vê os 4 usuários de teste
- [ ] Consegue executar `SELECT * FROM users;`
- [ ] Parou e reiniciou, dados estão lá (docker-compose restart)

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "connection refused" | Aguarde 30-60s, MySQL está iniciando |
| "port 3306 already in use" | Altere MYSQL_PORT em .env, restart |
| "port 8080 already in use" | Altere ADMINER_PORT em .env, restart |
| "tables not created" | Rodou `docker-compose down -v` e perdeu dados, repita |
| "auth failed" | Verifique credenciais em .env e Adminer |

---

## 📈 Próximas Fases

```
Fase 1 ✅ — Modelagem (DER, Prisma, SQL)
    ↓
Fase 2 🔵 — Backend (Fastify + Prisma)
    ↓
Fase 3 🔵 — CRUDs Base
    ↓
Fase 4 🔵 — Agenda
    ↓
Fase 5 🔵 — Financeiro
    ↓
Fase 6 🔵 — Dashboard
    ↓
Fase 7 🔵 — Deploy (Produção)
```

---

## 🎉 Conclusão

Você agora tem:

✨ **Banco de dados MySQL completo** com 13 tabelas  
✨ **Interface web (Adminer)** para explorar dados  
✨ **Dados de teste** pré-carregados  
✨ **Persistência** de dados em volumes Docker  
✨ **Ambiente pronto** para Fase 2  

**Tempo total:** 5 minutos ⏱️

---

**Status:** ✅ Docker Setup Completo!  
**Próximo:** [GUIA_FASE_2.md](./GUIA_FASE_2.md) para implementar Backend  

