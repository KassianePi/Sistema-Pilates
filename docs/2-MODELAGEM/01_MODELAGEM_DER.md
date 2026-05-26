# 🏢 Sistema Studio de Pilates — Modelagem DER

**Data:** 26 de Maio de 2026  
**Fase:** 1 — Modelagem (DER, Wireframes, Fluxos)  
**Status:** Em Desenvolvimento

---

## 📋 Índice

1. [Análise de Entidades](#análise-de-entidades)
2. [Diagrama Entidade-Relacionamento (DER)](#diagrama-entidade-relacionamento)
3. [Documentação de Entidades](#documentação-de-entidades)
4. [Relacionamentos e Integridade Referencial](#relacionamentos-e-integridade-referencial)
5. [Considerações PL/SQL (Procedures e Triggers)](#considerações-plsql)
6. [Índices e Performance](#índices-e-performance)
7. [Próximos Passos](#próximos-passos)

---

## 📊 Análise de Entidades

O sistema é organizado em **8 módulos principais**, cada um com suas entidades:

| Módulo | Entidades Principais | Responsabilidade |
|--------|----------------------|------------------|
| **auth** | users, roles, permissions | Autenticação, autorização e RBAC |
| **alunos** | students, student_plans, student_progress | Gestão de alunos e progresso |
| **professores** | instructors | Gestão de professores |
| **agenda** | classes, attendances, class_schedule | Aulas, presença e reposição |
| **pagamentos** | payments, payment_methods | Pagamento de mensalidades |
| **financeiro** | monthly_fees, cash_register, financial_reports | Gestão financeira e caixa |
| **notificacoes** | notifications | Notificações aos alunos/professores |
| **auditoria** | audit_logs | Rastreamento de operações |

---

## 🗂️ Diagrama Entidade-Relacionamento

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA STUDIO DE PILATES                     │
└─────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
                         │    USERS     │
                         ├──────────────┤
                         │ id (PK)      │
                         │ email        │
                         │ password     │
                         │ full_name    │
                         │ phone        │
                         │ role         │
                         │ status       │
                         │ created_at   │
                         └──────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                    ▼         ▼         ▼
              ┌──────────┐ ┌──────────┐ ┌──────────────┐
              │ STUDENTS │ │INSTRUCTORS│ │  ADMINS ETC  │
              └──────────┘ └──────────┘ └──────────────┘
                    │
                    ├─────────────────────────┐
                    ▼                         ▼
          ┌──────────────────┐      ┌─────────────────┐
          │  STUDENT_PLANS   │      │ STUDENT_PROGRESS│
          ├──────────────────┤      ├─────────────────┤
          │ id (PK)          │      │ id (PK)         │
          │ student_id (FK)  │      │ student_id (FK) │
          │ plan_type        │      │ class_id (FK)   │
          │ start_date       │      │ date            │
          │ end_date         │      │ performance     │
          │ status           │      │ notes           │
          └──────────────────┘      └─────────────────┘

          ┌──────────────────┐
          │    CLASSES       │
          ├──────────────────┤
          │ id (PK)          │
          │ instructor_id(FK)│      ┌───────────────────┐
          │ schedule_id (FK) │──────│  CLASS_SCHEDULE   │
          │ status           │      ├───────────────────┤
          │ capacity         │      │ id (PK)           │
          │ created_at       │      │ day_of_week       │
          └──────────────────┘      │ start_time        │
                    │               │ end_time          │
                    ▼               │ room              │
          ┌──────────────────┐      └───────────────────┘
          │   ATTENDANCES   │
          ├──────────────────┤
          │ id (PK)          │
          │ student_id (FK)  │
          │ class_id (FK)    │
          │ date             │
          │ status           │
          │ checked_in_at    │
          └──────────────────┘

          ┌──────────────────┐
          │   MONTHLY_FEES   │
          ├──────────────────┤
          │ id (PK)          │
          │ student_id (FK)  │
          │ month            │
          │ year             │
          │ amount           │
          │ status           │
          │ due_date         │
          │ paid_date        │
          └──────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │    PAYMENTS      │
          ├──────────────────┤
          │ id (PK)          │
          │ monthly_fee_id   │
          │ amount           │
          │ method           │
          │ reference        │
          │ paid_at          │
          └──────────────────┘

          ┌──────────────────┐
          │  NOTIFICATIONS   │
          ├──────────────────┤
          │ id (PK)          │
          │ recipient_id(FK) │
          │ type             │
          │ subject          │
          │ message          │
          │ read_at          │
          │ created_at       │
          └──────────────────┘

          ┌──────────────────┐
          │   AUDIT_LOGS     │
          ├──────────────────┤
          │ id (PK)          │
          │ user_id (FK)     │
          │ entity           │
          │ action           │
          │ old_values       │
          │ new_values       │
          │ created_at       │
          └──────────────────┘
```

---

## 📚 Documentação de Entidades

### 1️⃣ **USERS** (Autenticação)

**Propósito:** Armazenar credenciais e informações de acesso para todos os usuários (admin, professores, recepcionistas, etc.)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(11) UNIQUE NOT NULL,
  role ENUM('ADMIN', 'INSTRUCTOR', 'RECEPTIONIST', 'FINANCIAL') NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Atributos-Chave:**
- `email`: Identificador único, usado para login
- `password_hash`: Bcrypt (nunca armazenar em texto plano)
- `cpf`: Documento único por compliance
- `role`: Controla acesso via RBAC
- `status`: Permite soft delete

---

### 2️⃣ **STUDENTS** (Alunos)

**Propósito:** Armazenar dados dos alunos matriculados

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  date_of_birth DATE,
  gender ENUM('M', 'F', 'OTHER'),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  medical_restrictions TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Relacionamentos:**
- `1:1` com **USERS** (cada aluno é um usuário)
- `1:N` com **STUDENT_PLANS** (um aluno pode ter múltiplos planos ao longo do tempo)
- `1:N` com **STUDENT_PROGRESS** (rastreamento de desempenho)
- `1:N` com **MONTHLY_FEES** (múltiplas cobranças ao longo dos meses)

---

### 3️⃣ **INSTRUCTORS** (Professores)

**Propósito:** Informações específicas dos professores

```sql
CREATE TABLE instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  specialization VARCHAR(255),
  certification_number VARCHAR(50),
  hourly_rate DECIMAL(10, 2),
  bio TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Relacionamentos:**
- `1:1` com **USERS**
- `1:N` com **CLASSES** (um professor pode dar múltiplas aulas)

---

### 4️⃣ **STUDENT_PLANS** (Planos de Alunos)

**Propósito:** Rastrear o histórico de planos de cada aluno

```sql
CREATE TABLE student_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  plan_type ENUM('BASICO_4', 'BASICO_8', 'PREMIUM', 'CUSTOMIZADO') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_cost DECIMAL(10, 2) NOT NULL,
  classes_per_week INT,
  status ENUM('ACTIVE', 'PAUSED', 'COMPLETED') DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```

**Planos Oferecidos:**
- **BASICO_4**: 4 aulas/semana
- **BASICO_8**: 8 aulas/semana
- **PREMIUM**: Aulas ilimitadas + atendimento personalizado
- **CUSTOMIZADO**: Plano sob demanda

---

### 5️⃣ **CLASS_SCHEDULE** (Horário de Aulas)

**Propósito:** Definir recurring schedule (segunda a segunda, por exemplo)

```sql
CREATE TABLE class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL,
  day_of_week ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50),
  capacity INT DEFAULT 15,
  status ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
);
```

---

### 6️⃣ **CLASSES** (Ocorrências de Aulas)

**Propósito:** Cada aula específica que ocorre (segunda-feira 08:00 em 26/05/2026)

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_schedule_id UUID NOT NULL,
  instructor_id UUID NOT NULL,
  occurrence_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50),
  capacity INT DEFAULT 15,
  status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_class (class_schedule_id, occurrence_date),
  FOREIGN KEY (class_schedule_id) REFERENCES class_schedules(id),
  FOREIGN KEY (instructor_id) REFERENCES instructors(id)
);
```

---

### 7️⃣ **ATTENDANCES** (Presença)

**Propósito:** Registrar presença/ausência dos alunos

```sql
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  class_id UUID NOT NULL,
  status ENUM('PRESENT', 'ABSENT', 'JUSTIFIED') DEFAULT 'ABSENT',
  checked_in_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance (student_id, class_id),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);
```

**Lógica de Negócio:**
- Apenas alunos com plano **ACTIVE** podem ter presença registrada
- Uma aula só pode ocorrer se há pelo menos **1 aluno** inscrito

---

### 8️⃣ **STUDENT_PROGRESS** (Progresso)

**Propósito:** Avaliação periódica do progresso do aluno

```sql
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  class_id UUID NOT NULL,
  evaluation_date DATE NOT NULL,
  flexibility_score INT CHECK (flexibility_score BETWEEN 1 AND 10),
  strength_score INT CHECK (strength_score BETWEEN 1 AND 10),
  balance_score INT CHECK (balance_score BETWEEN 1 AND 10),
  endurance_score INT CHECK (endurance_score BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id)
);
```

---

### 9️⃣ **MONTHLY_FEES** (Mensalidades)

**Propósito:** Rastrear mensalidades de cada aluno

```sql
CREATE TABLE monthly_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') DEFAULT 'PENDING',
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_monthly_fee (student_id, month, year),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```

---

### 🔟 **PAYMENTS** (Pagamentos)

**Propósito:** Registrar cada transação de pagamento

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_fee_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER') NOT NULL,
  reference VARCHAR(255),
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_by_user_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (monthly_fee_id) REFERENCES monthly_fees(id) ON DELETE CASCADE,
  FOREIGN KEY (received_by_user_id) REFERENCES users(id)
);
```

---

### 1️⃣1️⃣ **CASH_REGISTER** (Caixa)

**Propósito:** Rastreamento de movimento de caixa diário

```sql
CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_date DATE NOT NULL UNIQUE,
  opening_balance DECIMAL(15, 2) DEFAULT 0,
  total_income DECIMAL(15, 2) DEFAULT 0,
  total_expenses DECIMAL(15, 2) DEFAULT 0,
  closing_balance DECIMAL(15, 2),
  opened_by_user_id UUID NOT NULL,
  closed_by_user_id UUID,
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
  notes TEXT,
  FOREIGN KEY (opened_by_user_id) REFERENCES users(id),
  FOREIGN KEY (closed_by_user_id) REFERENCES users(id)
);
```

---

### 1️⃣2️⃣ **NOTIFICATIONS** (Notificações)

**Propósito:** Armazenar notificações para alunos (aula cancelada, mensalidade vencida, etc.)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  type ENUM('CLASS_CANCELLED', 'FEE_OVERDUE', 'WELCOME', 'SYSTEM') NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

### 1️⃣3️⃣ **AUDIT_LOGS** (Auditoria)

**Propósito:** Rastrear todas as operações críticas para compliance

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'READ') NOT NULL,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
);
```

---

## 🔗 Relacionamentos e Integridade Referencial

| De | Para | Tipo | Descrição |
|-------|----------|------|-----------|
| STUDENTS | USERS | 1:1 | Cada aluno é um usuário |
| INSTRUCTORS | USERS | 1:1 | Cada professor é um usuário |
| STUDENT_PLANS | STUDENTS | N:1 | Um aluno pode ter múltiplos planos |
| CLASS_SCHEDULES | INSTRUCTORS | N:1 | Um professor pode ter múltiplos horários |
| CLASSES | CLASS_SCHEDULES | N:1 | Uma ocorrência refere ao horário recorrente |
| CLASSES | INSTRUCTORS | N:1 | Cada aula tem um professor |
| ATTENDANCES | STUDENTS | N:1 | Um aluno participa de múltiplas aulas |
| ATTENDANCES | CLASSES | N:1 | Uma aula tem múltiplas presenças |
| STUDENT_PROGRESS | STUDENTS | N:1 | Histórico de progresso do aluno |
| MONTHLY_FEES | STUDENTS | N:1 | Um aluno tem múltiplas mensalidades |
| PAYMENTS | MONTHLY_FEES | N:1 | Uma mensalidade pode ter múltiplos pagamentos |
| PAYMENTS | USERS | N:1 | Quem recebeu o pagamento |
| CASH_REGISTERS | USERS | N:1 | Quem abriu/fechou o caixa |
| NOTIFICATIONS | USERS | N:1 | Notificações para diversos usuários |
| AUDIT_LOGS | USERS | N:1 | Quem executou a ação |

---

## 🔐 Considerações PL/SQL

### ✅ Trigger: Atualizar Status de Mensalidade Automaticamente

Quando um pagamento é realizado, a mensalidade deve mudar de `PENDING` para `PAID`:

```sql
DELIMITER //

CREATE TRIGGER update_fee_status_after_payment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  UPDATE monthly_fees
  SET status = 'PAID', updated_at = NOW()
  WHERE id = NEW.monthly_fee_id;
END //

DELIMITER ;
```

---

### ✅ Trigger: Validar Plano Antes de Registrar Presença

Um aluno só pode ter presença se seu plano está ativo:

```sql
DELIMITER //

CREATE TRIGGER validate_student_plan_before_attendance
BEFORE INSERT ON attendances
FOR EACH ROW
BEGIN
  DECLARE active_plan_count INT;
  
  SELECT COUNT(*) INTO active_plan_count
  FROM student_plans
  WHERE student_id = NEW.student_id
    AND status = 'ACTIVE'
    AND start_date <= CURDATE()
    AND (end_date IS NULL OR end_date >= CURDATE());
  
  IF active_plan_count = 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Student does not have an active plan';
  END IF;
END //

DELIMITER ;
```

---

### ✅ Procedure: Gerar Mensalidades do Mês

Procedure chamada todo dia 1º do mês para criar mensalidades para alunos ativos:

```sql
DELIMITER //

CREATE PROCEDURE sp_generate_monthly_fees()
BEGIN
  DECLARE v_current_month INT;
  DECLARE v_current_year INT;
  DECLARE v_due_date DATE;
  
  SET v_current_month = MONTH(CURDATE());
  SET v_current_year = YEAR(CURDATE());
  SET v_due_date = DATE_ADD(CURDATE(), INTERVAL 10 DAY);
  
  INSERT INTO monthly_fees 
    (student_id, month, year, amount, status, due_date)
  SELECT 
    s.id,
    v_current_month,
    v_current_year,
    sp.monthly_cost,
    'PENDING',
    v_due_date
  FROM students s
  INNER JOIN student_plans sp ON s.id = sp.student_id
  WHERE sp.status = 'ACTIVE'
    AND sp.start_date <= CURDATE()
    AND (sp.end_date IS NULL OR sp.end_date >= CURDATE())
    AND NOT EXISTS (
      SELECT 1 FROM monthly_fees
      WHERE student_id = s.id
        AND month = v_current_month
        AND year = v_current_year
    );
  
  -- Emitir evento para notificar alunos
  -- INSERT INTO notifications ... (será feito via aplicação)
END //

DELIMITER ;
```

---

### ✅ Procedure: Buscar Alunos com Mensalidade Vencida

```sql
DELIMITER //

CREATE PROCEDURE sp_get_overdue_fees()
BEGIN
  SELECT 
    s.id,
    u.full_name,
    u.email,
    u.phone,
    mf.id as fee_id,
    mf.amount,
    mf.due_date,
    DATEDIFF(CURDATE(), mf.due_date) as days_overdue
  FROM monthly_fees mf
  INNER JOIN students s ON mf.student_id = s.id
  INNER JOIN users u ON s.user_id = u.id
  WHERE mf.status IN ('PENDING', 'OVERDUE')
    AND mf.due_date < CURDATE()
  ORDER BY mf.due_date ASC;
END //

DELIMITER ;
```

---

### ✅ Procedure: Relatório de Presença do Mês

```sql
DELIMITER //

CREATE PROCEDURE sp_attendance_report(
  IN p_month INT,
  IN p_year INT
)
BEGIN
  SELECT 
    s.id,
    u.full_name,
    sp.plan_type,
    COUNT(DISTINCT c.id) as total_classes,
    SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as classes_attended,
    SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as classes_absent,
    SUM(CASE WHEN a.status = 'JUSTIFIED' THEN 1 ELSE 0 END) as classes_justified,
    ROUND(
      (SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) / COUNT(DISTINCT c.id)) * 100, 
      2
    ) as attendance_percentage
  FROM students s
  INNER JOIN users u ON s.user_id = u.id
  LEFT JOIN student_plans sp ON s.id = sp.student_id
    AND sp.status = 'ACTIVE'
  LEFT JOIN classes c ON MONTH(c.occurrence_date) = p_month
    AND YEAR(c.occurrence_date) = p_year
  LEFT JOIN attendances a ON s.id = a.student_id
    AND a.class_id = c.id
  WHERE s.active = TRUE
  GROUP BY s.id, u.full_name, sp.plan_type
  ORDER BY attendance_percentage DESC;
END //

DELIMITER ;
```

---

## 📈 Índices e Performance

```sql
-- Índices para STUDENTS
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_cpf ON students(cpf);
CREATE INDEX idx_students_active ON students(active);

-- Índices para CLASSES
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_occurrence_date ON classes(occurrence_date);
CREATE INDEX idx_classes_status ON classes(status);

-- Índices para ATTENDANCES
CREATE INDEX idx_attendances_student_id ON attendances(student_id);
CREATE INDEX idx_attendances_class_id ON attendances(class_id);
CREATE INDEX idx_attendances_status ON attendances(status);

-- Índices para MONTHLY_FEES
CREATE INDEX idx_monthly_fees_student_id ON monthly_fees(student_id);
CREATE INDEX idx_monthly_fees_status ON monthly_fees(status);
CREATE INDEX idx_monthly_fees_due_date ON monthly_fees(due_date);
CREATE INDEX idx_monthly_fees_year_month ON monthly_fees(year, month);

-- Índices para PAYMENTS
CREATE INDEX idx_payments_monthly_fee_id ON payments(monthly_fee_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

-- Índices para AUDIT_LOGS
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 🎯 Próximos Passos

✅ **Concluído:**
- [x] Análise de entidades
- [x] DER estruturado
- [x] Documentação de todas as tabelas
- [x] Relacionamentos definidos
- [x] Procedures e Triggers mapeados

⏭️ **Próximos:**
1. **Criar Wireframes** das principais telas (Dashboard, Agenda, Alunos, Financeiro)
2. **Documentar Fluxos de Negócio** (ex: matrícula, pagamento, reposição de aula)
3. **Refinar Modelo** com aprovação do time
4. **Iniciar Fase 2** (Backend: Setup Fastify + Prisma)

---

## 📌 Notas Importantes

- **PL/SQL será essencial** para procedures de relatórios, jobs automáticos (gerar mensalidades), e validações complexas
- **Auditoria é crítica** — todos os movimentos financeiros devem ser rastreáveis
- **Soft deletes** via `status` ou `active` flags são preferidos ao DELETE
- **Timestamps** (`created_at`, `updated_at`) em todas as entidades críticas
- **Validações no BD** (CHECK constraints) complementam validações na aplicação

---

**Documentação criada em:** 26 de Maio de 2026  
**Versão:** 1.0  
**Próxima revisão:** Após aprovação do DER
