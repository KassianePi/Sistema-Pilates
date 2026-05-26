-- ============================================================================
-- 🏢 SISTEMA STUDIO DE PILATES — Script de Inicialização
-- ============================================================================
-- Database: MySQL 8.0+
-- Data: 26 de Maio de 2026
--
-- Este arquivo é executado automaticamente pelo Docker ao iniciar o MySQL
-- Cria todas as tabelas, indexes e relacionamentos do DER
--
-- ============================================================================

-- Usar banco de dados padrão
USE `pilates_db`;

-- Desabilitar foreign key checks temporariamente
SET FOREIGN_KEY_CHECKS=0;

-- ============================================================================
-- 🔐 MÓDULO AUTH — Autenticação
-- ============================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `email` VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email do usuário',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hash Bcrypt da senha',
  `full_name` VARCHAR(255) NOT NULL COMMENT 'Nome completo',
  `phone` VARCHAR(20) COMMENT 'Telefone',
  `cpf` VARCHAR(11) UNIQUE NOT NULL COMMENT 'CPF (documento)',
  `role` ENUM('ADMIN', 'INSTRUCTOR', 'RECEPTIONIST', 'FINANCIAL') NOT NULL DEFAULT 'RECEPTIONIST' COMMENT 'Função/Role',
  `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Status do usuário',
  `last_login_at` DATETIME COMMENT 'Último acesso',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY `idx_email` (`email`),
  KEY `idx_cpf` (`cpf`),
  KEY `idx_status` (`status`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuários do sistema (Admin, Professor, Recepcionista, Financeiro)';

-- ============================================================================
-- 👨‍🎓 MÓDULO ALUNOS — Gestão de Alunos
-- ============================================================================

CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `user_id` VARCHAR(36) UNIQUE NOT NULL COMMENT 'FK -> users',
  `date_of_birth` DATE COMMENT 'Data de nascimento',
  `gender` ENUM('M', 'F', 'OTHER') COMMENT 'Gênero',
  `address` VARCHAR(255) COMMENT 'Endereço',
  `city` VARCHAR(100) COMMENT 'Cidade',
  `state` VARCHAR(2) COMMENT 'Estado (UF)',
  `zip_code` VARCHAR(10) COMMENT 'CEP',
  `emergency_contact_name` VARCHAR(255) COMMENT 'Nome contato emergência',
  `emergency_contact_phone` VARCHAR(20) COMMENT 'Telefone contato emergência',
  `medical_restrictions` TEXT COMMENT 'Restrições médicas',
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_active` (`active`),
  CONSTRAINT `fk_students_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dados específicos de alunos (relação 1:1 com users)';

CREATE TABLE IF NOT EXISTS `student_plans` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `student_id` VARCHAR(36) NOT NULL COMMENT 'FK -> students',
  `plan_type` ENUM('BASICO_4', 'BASICO_8', 'PREMIUM', 'CUSTOMIZADO') NOT NULL COMMENT 'Tipo do plano',
  `start_date` DATE NOT NULL COMMENT 'Data início',
  `end_date` DATE COMMENT 'Data fim',
  `monthly_cost` DECIMAL(10, 2) NOT NULL COMMENT 'Custo mensal',
  `classes_per_week` INT COMMENT 'Aulas por semana',
  `status` ENUM('ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
  `notes` TEXT COMMENT 'Observações',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_start_date` (`start_date`),
  KEY `idx_end_date` (`end_date`),
  CONSTRAINT `fk_student_plans_student_id` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Histórico de planos dos alunos';

CREATE TABLE IF NOT EXISTS `student_progress` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `student_id` VARCHAR(36) NOT NULL COMMENT 'FK -> students',
  `class_id` VARCHAR(36) NOT NULL COMMENT 'FK -> classes',
  `evaluation_date` DATE NOT NULL COMMENT 'Data da avaliação',
  `flexibility_score` INT COMMENT 'Nota flexibilidade (1-10)',
  `strength_score` INT COMMENT 'Nota força (1-10)',
  `balance_score` INT COMMENT 'Nota equilíbrio (1-10)',
  `endurance_score` INT COMMENT 'Nota resistência (1-10)',
  `notes` TEXT COMMENT 'Observações',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY `idx_student_id` (`student_id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_evaluation_date` (`evaluation_date`),
  CONSTRAINT `fk_student_progress_student_id` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_student_progress_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Progresso e avaliações dos alunos';

-- ============================================================================
-- 👨‍🏫 MÓDULO PROFESSORES — Gestão de Professores
-- ============================================================================

CREATE TABLE IF NOT EXISTS `instructors` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `user_id` VARCHAR(36) UNIQUE NOT NULL COMMENT 'FK -> users',
  `specialization` VARCHAR(255) COMMENT 'Especialização',
  `certification_number` VARCHAR(50) COMMENT 'Número certificado',
  `hourly_rate` DECIMAL(10, 2) COMMENT 'Taxa horária',
  `bio` TEXT COMMENT 'Biografia',
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_active` (`active`),
  CONSTRAINT `fk_instructors_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dados específicos de professores/instrutores';

-- ============================================================================
-- 📅 MÓDULO AGENDA — Aulas e Horários
-- ============================================================================

CREATE TABLE IF NOT EXISTS `class_schedules` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `instructor_id` VARCHAR(36) NOT NULL COMMENT 'FK -> instructors',
  `day_of_week` ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN') NOT NULL COMMENT 'Dia da semana',
  `start_time` VARCHAR(5) NOT NULL COMMENT 'Horário início (HH:MM)',
  `end_time` VARCHAR(5) NOT NULL COMMENT 'Horário fim (HH:MM)',
  `room` VARCHAR(50) COMMENT 'Sala/Local',
  `capacity` INT NOT NULL DEFAULT 15 COMMENT 'Capacidade máxima',
  `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY `idx_instructor_id` (`instructor_id`),
  KEY `idx_day_of_week` (`day_of_week`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_class_schedules_instructor_id` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Horários recorrentes de aulas (segunda a segunda)';

CREATE TABLE IF NOT EXISTS `classes` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `class_schedule_id` VARCHAR(36) NOT NULL COMMENT 'FK -> class_schedules',
  `instructor_id` VARCHAR(36) NOT NULL COMMENT 'FK -> instructors',
  `occurrence_date` DATE NOT NULL COMMENT 'Data da aula',
  `start_time` VARCHAR(5) NOT NULL COMMENT 'Horário início (HH:MM)',
  `end_time` VARCHAR(5) NOT NULL COMMENT 'Horário fim (HH:MM)',
  `room` VARCHAR(50) COMMENT 'Sala/Local',
  `capacity` INT NOT NULL DEFAULT 15 COMMENT 'Capacidade máxima',
  `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  `notes` TEXT COMMENT 'Observações',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_class_schedule_date` (`class_schedule_id`, `occurrence_date`),
  KEY `idx_instructor_id` (`instructor_id`),
  KEY `idx_occurrence_date` (`occurrence_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_classes_class_schedule_id` FOREIGN KEY (`class_schedule_id`) REFERENCES `class_schedules`(`id`),
  CONSTRAINT `fk_classes_instructor_id` FOREIGN KEY (`instructor_id`) REFERENCES `instructors`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Ocorrências específicas de aulas (cada aula em cada data)';

CREATE TABLE IF NOT EXISTS `attendances` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `student_id` VARCHAR(36) NOT NULL COMMENT 'FK -> students',
  `class_id` VARCHAR(36) NOT NULL COMMENT 'FK -> classes',
  `status` ENUM('PRESENT', 'ABSENT', 'JUSTIFIED') NOT NULL DEFAULT 'ABSENT' COMMENT 'Status presença',
  `checked_in_at` DATETIME COMMENT 'Momento do check-in',
  `notes` TEXT COMMENT 'Observações',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_student_class` (`student_id`, `class_id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_class_id` (`class_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_attendances_student_id` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendances_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de presença/ausência dos alunos em aulas';

-- ============================================================================
-- 💰 MÓDULO FINANCEIRO — Gestão Financeira
-- ============================================================================

CREATE TABLE IF NOT EXISTS `monthly_fees` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `student_id` VARCHAR(36) NOT NULL COMMENT 'FK -> students',
  `month` TINYINT NOT NULL COMMENT 'Mês (1-12)',
  `year` INT NOT NULL COMMENT 'Ano',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Valor',
  `status` ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'Status pagamento',
  `due_date` DATE NOT NULL COMMENT 'Data vencimento',
  `paid_date` DATE COMMENT 'Data pagamento',
  `notes` TEXT COMMENT 'Observações',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_student_month_year` (`student_id`, `month`, `year`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_year_month` (`year`, `month`),
  CONSTRAINT `fk_monthly_fees_student_id` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Mensalidades dos alunos (geradas automaticamente)';

CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `monthly_fee_id` VARCHAR(36) NOT NULL COMMENT 'FK -> monthly_fees',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Valor pago',
  `payment_method` ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER') NOT NULL COMMENT 'Método pagamento',
  `reference` VARCHAR(255) COMMENT 'Referência (código transação, etc)',
  `paid_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora pagamento',
  `received_by_user_id` VARCHAR(36) NOT NULL COMMENT 'FK -> users (quem recebeu)',
  `notes` TEXT COMMENT 'Observações',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY `idx_monthly_fee_id` (`monthly_fee_id`),
  KEY `idx_paid_at` (`paid_at`),
  KEY `idx_received_by_user_id` (`received_by_user_id`),
  CONSTRAINT `fk_payments_monthly_fee_id` FOREIGN KEY (`monthly_fee_id`) REFERENCES `monthly_fees`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_received_by_user_id` FOREIGN KEY (`received_by_user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de cada transação de pagamento';

CREATE TABLE IF NOT EXISTS `cash_registers` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `opening_date` DATE UNIQUE NOT NULL COMMENT 'Data abertura',
  `opening_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Saldo abertura',
  `total_income` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Total entrada',
  `total_expenses` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Total saída',
  `closing_balance` DECIMAL(15, 2) COMMENT 'Saldo fechamento',
  `opened_by_user_id` VARCHAR(36) NOT NULL COMMENT 'FK -> users (quem abriu)',
  `closed_by_user_id` VARCHAR(36) COMMENT 'FK -> users (quem fechou)',
  `opened_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora abertura',
  `closed_at` DATETIME COMMENT 'Data/hora fechamento',
  `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN' COMMENT 'Status caixa',
  `notes` TEXT COMMENT 'Observações',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY `idx_opening_date` (`opening_date`),
  KEY `idx_status` (`status`),
  KEY `idx_opened_by_user_id` (`opened_by_user_id`),
  KEY `idx_closed_by_user_id` (`closed_by_user_id`),
  CONSTRAINT `fk_cash_registers_opened_by_user_id` FOREIGN KEY (`opened_by_user_id`) REFERENCES `users`(`id`),
  CONSTRAINT `fk_cash_registers_closed_by_user_id` FOREIGN KEY (`closed_by_user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Caixa diário com rastreamento de movimentação';

-- ============================================================================
-- 🔔 MÓDULO NOTIFICAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `recipient_id` VARCHAR(36) NOT NULL COMMENT 'FK -> users',
  `type` ENUM('CLASS_CANCELLED', 'FEE_OVERDUE', 'WELCOME', 'SYSTEM') NOT NULL COMMENT 'Tipo notificação',
  `subject` VARCHAR(255) NOT NULL COMMENT 'Assunto',
  `message` TEXT NOT NULL COMMENT 'Mensagem',
  `read_at` DATETIME COMMENT 'Data/hora leitura',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY `idx_recipient_id` (`recipient_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_read_at` (`read_at`),
  CONSTRAINT `fk_notifications_recipient_id` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Notificações para alunos/professores/admin';

-- ============================================================================
-- 📊 MÓDULO AUDITORIA — Logs e Auditoria
-- ============================================================================

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `user_id` VARCHAR(36) NOT NULL COMMENT 'FK -> users',
  `entity_type` VARCHAR(100) NOT NULL COMMENT 'Tipo entidade (ex: Student, Payment)',
  `entity_id` VARCHAR(36) COMMENT 'ID da entidade afetada',
  `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'READ') NOT NULL COMMENT 'Ação realizada',
  `old_values` JSON COMMENT 'Valores antigos (para UPDATE)',
  `new_values` JSON COMMENT 'Valores novos (para UPDATE/CREATE)',
  `ip_address` VARCHAR(45) COMMENT 'IP do usuário',
  `user_agent` VARCHAR(255) COMMENT 'User-Agent',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY `idx_user_id` (`user_id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_audit_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log de auditoria com rastreamento completo de operações';

-- ============================================================================
-- 🔧 VIEWS PARA CONSULTAS COMPLEXAS
-- ============================================================================

-- View: Alunos com status financeiro
CREATE OR REPLACE VIEW `v_students_financial_status` AS
SELECT
  s.id,
  u.full_name,
  u.email,
  u.phone,
  sp.plan_type,
  sp.start_date as plan_start_date,
  sp.end_date as plan_end_date,
  sp.status as plan_status,
  (
    SELECT COUNT(*) FROM monthly_fees mf
    WHERE mf.student_id = s.id
      AND mf.status = 'PAID'
      AND MONTH(mf.created_at) = MONTH(CURDATE())
      AND YEAR(mf.created_at) = YEAR(CURDATE())
  ) as paid_this_month,
  (
    SELECT COALESCE(SUM(amount), 0) FROM monthly_fees mf
    WHERE mf.student_id = s.id
      AND mf.status IN ('PENDING', 'OVERDUE')
  ) as total_due,
  (
    SELECT COUNT(*) FROM monthly_fees mf
    WHERE mf.student_id = s.id
      AND mf.status = 'OVERDUE'
  ) as overdue_count,
  s.active,
  s.created_at as student_created_at
FROM students s
INNER JOIN users u ON s.user_id = u.id
LEFT JOIN student_plans sp ON s.id = sp.student_id
  AND sp.status = 'ACTIVE'
  AND sp.start_date <= CURDATE()
  AND (sp.end_date IS NULL OR sp.end_date >= CURDATE());

-- View: Classes com inscrições
CREATE OR REPLACE VIEW `v_classes_with_enrollments` AS
SELECT
  c.id,
  c.occurrence_date,
  c.start_time,
  c.end_time,
  cs.day_of_week,
  c.room,
  c.capacity,
  u.full_name as instructor_name,
  COUNT(a.id) as enrolled_students,
  SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as present_count,
  SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as absent_count,
  c.status
FROM classes c
INNER JOIN class_schedules cs ON c.class_schedule_id = cs.id
INNER JOIN instructors i ON c.instructor_id = i.id
INNER JOIN users u ON i.user_id = u.id
LEFT JOIN attendances a ON c.id = a.class_id
GROUP BY c.id, c.occurrence_date, c.start_time, c.end_time, cs.day_of_week,
         c.room, c.capacity, u.full_name, c.status;

-- ============================================================================
-- ✅ REABILITAR FOREIGN KEY CHECKS
-- ============================================================================

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================================
-- 📊 DADOS INICIAIS PARA TESTE (OPCIONAL)
-- ============================================================================

-- Inserir usuário admin para teste
INSERT INTO `users` (id, email, password_hash, full_name, phone, cpf, role, status)
VALUES (
  'user_admin_001',
  'admin@pilates.local',
  '$2a$10$NZXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'Administrador Sistema',
  '11999999999',
  '12345678901',
  'ADMIN',
  'ACTIVE'
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir usuário recepcionista para teste
INSERT INTO `users` (id, email, password_hash, full_name, phone, cpf, role, status)
VALUES (
  'user_recep_001',
  'recepcionista@pilates.local',
  '$2a$10$NZXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'Recepcionista Pilates',
  '11999999998',
  '12345678902',
  'RECEPTIONIST',
  'ACTIVE'
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir usuário professor para teste
INSERT INTO `users` (id, email, password_hash, full_name, phone, cpf, role, status)
VALUES (
  'user_prof_001',
  'professor@pilates.local',
  '$2a$10$NZXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'Professor Pilates',
  '11999999997',
  '12345678903',
  'INSTRUCTOR',
  'ACTIVE'
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir professor (relacionado)
INSERT INTO `instructors` (id, user_id, specialization, active)
VALUES (
  'instr_001',
  'user_prof_001',
  'Pilates Clássico',
  TRUE
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir usuário aluno para teste
INSERT INTO `users` (id, email, password_hash, full_name, phone, cpf, role, status)
VALUES (
  'user_aluno_001',
  'aluno@pilates.local',
  '$2a$10$NZXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'Maria Silva (Aluno)',
  '11999999996',
  '12345678904',
  'RECEPTIONIST',
  'ACTIVE'
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir aluno (relacionado)
INSERT INTO `students` (id, user_id, gender, active)
VALUES (
  'student_001',
  'user_aluno_001',
  'F',
  TRUE
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir plano de aluno
INSERT INTO `student_plans` (id, student_id, plan_type, start_date, end_date, monthly_cost, classes_per_week, status)
VALUES (
  'plan_001',
  'student_001',
  'BASICO_4',
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 30 DAY),
  200.00,
  4,
  'ACTIVE'
) ON DUPLICATE KEY UPDATE id=id;

-- ============================================================================
-- ✅ FIM DO SCRIPT DE INICIALIZAÇÃO
-- ============================================================================

-- Verificação final
SELECT 'Banco de dados inicializado com sucesso!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'pilates_db';
