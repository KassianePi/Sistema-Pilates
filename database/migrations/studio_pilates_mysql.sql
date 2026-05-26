
-- =========================================================
-- SISTEMA STUDIO DE PILATES
-- Script compatível com MySQL 8
-- Gerado automaticamente a partir da documentação DER
-- =========================================================

CREATE DATABASE IF NOT EXISTS studio_pilates;
USE studio_pilates;

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(11) UNIQUE NOT NULL,
  role ENUM('ADMIN', 'INSTRUCTOR', 'RECEPTIONIST', 'FINANCIAL') NOT NULL,
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- STUDENTS
-- =========================================================

CREATE TABLE students (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
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
  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- =========================================================
-- INSTRUCTORS
-- =========================================================

CREATE TABLE instructors (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  specialization VARCHAR(255),
  certification_number VARCHAR(50),
  hourly_rate DECIMAL(10,2),
  bio TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_instructors_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- =========================================================
-- STUDENT_PLANS
-- =========================================================

CREATE TABLE student_plans (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id CHAR(36) NOT NULL,
  plan_type ENUM('BASICO_4', 'BASICO_8', 'PREMIUM', 'CUSTOMIZADO') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_cost DECIMAL(10,2) NOT NULL,
  classes_per_week INT,
  status ENUM('ACTIVE', 'PAUSED', 'COMPLETED') DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_plans_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE
);

-- =========================================================
-- CLASS_SCHEDULES
-- =========================================================

CREATE TABLE class_schedules (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  instructor_id CHAR(36) NOT NULL,
  day_of_week ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50),
  capacity INT DEFAULT 15,
  status ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_class_schedules_instructor
    FOREIGN KEY (instructor_id) REFERENCES instructors(id)
    ON DELETE CASCADE
);

-- =========================================================
-- CLASSES
-- =========================================================

CREATE TABLE classes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  class_schedule_id CHAR(36) NOT NULL,
  instructor_id CHAR(36) NOT NULL,
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
  CONSTRAINT fk_classes_schedule
    FOREIGN KEY (class_schedule_id) REFERENCES class_schedules(id),
  CONSTRAINT fk_classes_instructor
    FOREIGN KEY (instructor_id) REFERENCES instructors(id)
);

-- =========================================================
-- ATTENDANCES
-- =========================================================

CREATE TABLE attendances (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id CHAR(36) NOT NULL,
  class_id CHAR(36) NOT NULL,
  status ENUM('PRESENT', 'ABSENT', 'JUSTIFIED') DEFAULT 'ABSENT',
  checked_in_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance (student_id, class_id),
  CONSTRAINT fk_attendances_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_attendances_class
    FOREIGN KEY (class_id) REFERENCES classes(id)
    ON DELETE CASCADE
);

-- =========================================================
-- STUDENT_PROGRESS
-- =========================================================

CREATE TABLE student_progress (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id CHAR(36) NOT NULL,
  class_id CHAR(36) NOT NULL,
  evaluation_date DATE NOT NULL,
  flexibility_score INT CHECK (flexibility_score BETWEEN 1 AND 10),
  strength_score INT CHECK (strength_score BETWEEN 1 AND 10),
  balance_score INT CHECK (balance_score BETWEEN 1 AND 10),
  endurance_score INT CHECK (endurance_score BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_progress_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_student_progress_class
    FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- =========================================================
-- MONTHLY_FEES
-- =========================================================

CREATE TABLE monthly_fees (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  student_id CHAR(36) NOT NULL,
  month INT NOT NULL,
  year INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') DEFAULT 'PENDING',
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_monthly_fee (student_id, month, year),
  CONSTRAINT fk_monthly_fees_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE
);

-- =========================================================
-- PAYMENTS
-- =========================================================

CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  monthly_fee_id CHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER') NOT NULL,
  reference VARCHAR(255),
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_by_user_id CHAR(36) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_monthly_fee
    FOREIGN KEY (monthly_fee_id) REFERENCES monthly_fees(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_payments_user
    FOREIGN KEY (received_by_user_id) REFERENCES users(id)
);

-- =========================================================
-- CASH_REGISTERS
-- =========================================================

CREATE TABLE cash_registers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  opening_date DATE NOT NULL UNIQUE,
  opening_balance DECIMAL(15,2) DEFAULT 0,
  total_income DECIMAL(15,2) DEFAULT 0,
  total_expenses DECIMAL(15,2) DEFAULT 0,
  closing_balance DECIMAL(15,2),
  opened_by_user_id CHAR(36) NOT NULL,
  closed_by_user_id CHAR(36),
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
  notes TEXT,
  CONSTRAINT fk_cash_register_opened
    FOREIGN KEY (opened_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_cash_register_closed
    FOREIGN KEY (closed_by_user_id) REFERENCES users(id)
);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  recipient_id CHAR(36) NOT NULL,
  type ENUM('CLASS_CANCELLED', 'FEE_OVERDUE', 'WELCOME', 'SYSTEM') NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (recipient_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- =========================================================
-- AUDIT_LOGS
-- =========================================================

CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id CHAR(36),
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'READ') NOT NULL,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_active ON students(active);

CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_occurrence_date ON classes(occurrence_date);
CREATE INDEX idx_classes_status ON classes(status);

CREATE INDEX idx_attendances_student_id ON attendances(student_id);
CREATE INDEX idx_attendances_class_id ON attendances(class_id);
CREATE INDEX idx_attendances_status ON attendances(status);

CREATE INDEX idx_monthly_fees_student_id ON monthly_fees(student_id);
CREATE INDEX idx_monthly_fees_status ON monthly_fees(status);
CREATE INDEX idx_monthly_fees_due_date ON monthly_fees(due_date);

CREATE INDEX idx_payments_monthly_fee_id ON payments(monthly_fee_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =========================================================
-- TRIGGER: Atualizar status da mensalidade
-- =========================================================

DELIMITER $$

CREATE TRIGGER update_fee_status_after_payment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  UPDATE monthly_fees
  SET status = 'PAID',
      paid_date = CURDATE(),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.monthly_fee_id;
END$$

DELIMITER ;

-- =========================================================
-- PROCEDURE: Buscar mensalidades vencidas
-- =========================================================

DELIMITER $$

CREATE PROCEDURE sp_get_overdue_fees()
BEGIN
  SELECT 
    s.id,
    u.full_name,
    u.email,
    mf.amount,
    mf.due_date,
    DATEDIFF(CURDATE(), mf.due_date) AS days_overdue
  FROM monthly_fees mf
  INNER JOIN students s ON mf.student_id = s.id
  INNER JOIN users u ON s.user_id = u.id
  WHERE mf.status IN ('PENDING', 'OVERDUE')
    AND mf.due_date < CURDATE()
  ORDER BY mf.due_date ASC;
END$$

DELIMITER ;

-- =========================================================
-- FIM DO SCRIPT
-- =========================================================
