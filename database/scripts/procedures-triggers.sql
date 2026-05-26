-- ============================================================================
-- 🏢 STORED PROCEDURES E TRIGGERS — Sistema Studio de Pilates
-- ============================================================================
-- Database: MySQL 8.0+
-- Data: 26 de Maio de 2026
--
-- Nota: Estas procedures serão chamadas principalmente via Node.js/Prisma
-- Alguns triggers são críticos e devem ser mantidos no banco
--
-- ============================================================================

-- ============================================================================
-- 📋 TRIGGER 1: Atualizar status da mensalidade após pagamento
-- ============================================================================
-- Quando um pagamento é registrado, a mensalidade muda para PAID
DELIMITER //

CREATE TRIGGER tr_update_fee_status_after_payment
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
  UPDATE monthly_fees
  SET status = 'PAID', paid_date = NEW.paid_at, updated_at = NOW()
  WHERE id = NEW.monthly_fee_id
    AND status != 'PAID';
END //

DELIMITER ;

-- ============================================================================
-- 📋 TRIGGER 2: Validar plano ativo antes de registrar presença
-- ============================================================================
-- Um aluno SÓ pode ter presença se tem plano ACTIVE
DELIMITER //

CREATE TRIGGER tr_validate_student_plan_before_attendance
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
    SET MESSAGE_TEXT = 'Aluno sem plano ativo não pode ter presença registrada';
  END IF;
END //

DELIMITER ;

-- ============================================================================
-- 📋 TRIGGER 3: Atualizar mensalidades para OVERDUE automaticamente
-- ============================================================================
-- Job diário (chamar via Node.js em scheduler)
-- Mas podemos ter um trigger que marca como OVERDUE quando a data passar
DELIMITER //

CREATE TRIGGER tr_update_overdue_fees
BEFORE UPDATE ON monthly_fees
FOR EACH ROW
BEGIN
  IF NEW.status = 'PENDING'
     AND NEW.due_date < CURDATE() THEN
    SET NEW.status = 'OVERDUE';
  END IF;
END //

DELIMITER ;

-- ============================================================================
-- 🔧 PROCEDURE 1: Gerar mensalidades do mês
-- ============================================================================
-- Chamada todo 1º dia do mês via Node.js (BullMQ/Cron)
-- Cria mensalidades para todos os alunos com plano ACTIVE
DELIMITER //

CREATE PROCEDURE sp_generate_monthly_fees()
BEGIN
  DECLARE v_current_month INT;
  DECLARE v_current_year INT;
  DECLARE v_due_date DATE;
  DECLARE v_affected_rows INT DEFAULT 0;

  SET v_current_month = MONTH(CURDATE());
  SET v_current_year = YEAR(CURDATE());
  SET v_due_date = DATE_ADD(CURDATE(), INTERVAL 10 DAY);

  START TRANSACTION;

  INSERT INTO monthly_fees
    (id, student_id, month, year, amount, status, due_date, created_at, updated_at)
  SELECT
    UUID(),
    s.id,
    v_current_month,
    v_current_year,
    sp.monthly_cost,
    'PENDING',
    v_due_date,
    NOW(),
    NOW()
  FROM students s
  INNER JOIN student_plans sp ON s.id = sp.student_id
  WHERE sp.status = 'ACTIVE'
    AND sp.start_date <= CURDATE()
    AND (sp.end_date IS NULL OR sp.end_date >= CURDATE())
    AND s.active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM monthly_fees mf
      WHERE mf.student_id = s.id
        AND mf.month = v_current_month
        AND mf.year = v_current_year
    );

  SET v_affected_rows = ROW_COUNT();
  COMMIT;

  -- Registrar na auditoria (será feito via Node.js)
  SELECT v_affected_rows as monthly_fees_created;
END //

DELIMITER ;

-- ============================================================================
-- 🔧 PROCEDURE 2: Buscar alunos com mensalidade vencida
-- ============================================================================
-- Retorna listagem de alunos inadimplentes
DELIMITER //

CREATE PROCEDURE sp_get_overdue_fees()
BEGIN
  SELECT
    s.id as student_id,
    u.full_name,
    u.email,
    u.phone,
    mf.id as fee_id,
    mf.month,
    mf.year,
    mf.amount,
    mf.due_date,
    DATEDIFF(CURDATE(), mf.due_date) as days_overdue,
    mf.status
  FROM monthly_fees mf
  INNER JOIN students s ON mf.student_id = s.id
  INNER JOIN users u ON s.user_id = u.id
  WHERE mf.status IN ('PENDING', 'OVERDUE')
    AND mf.due_date < CURDATE()
    AND s.active = TRUE
  ORDER BY mf.due_date ASC;
END //

DELIMITER ;

-- ============================================================================
-- 🔧 PROCEDURE 3: Relatório de presença mensal por aluno
-- ============================================================================
-- Retorna estatísticas de presença de um mês
DELIMITER //

CREATE PROCEDURE sp_attendance_report(
  IN p_month INT,
  IN p_year INT
)
BEGIN
  SELECT
    s.id as student_id,
    u.full_name,
    sp.plan_type,
    COUNT(DISTINCT c.id) as total_classes_offered,
    SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) as classes_attended,
    SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) as classes_absent,
    SUM(CASE WHEN a.status = 'JUSTIFIED' THEN 1 ELSE 0 END) as classes_justified,
    ROUND(
      (SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) /
       NULLIF(COUNT(DISTINCT c.id), 0)) * 100,
      2
    ) as attendance_percentage,
    MAX(CASE WHEN a.status = 'PRESENT' THEN c.occurrence_date END) as last_attended_date
  FROM students s
  INNER JOIN users u ON s.user_id = u.id
  LEFT JOIN student_plans sp ON s.id = sp.student_id
    AND sp.status = 'ACTIVE'
    AND sp.start_date <= CURDATE()
    AND (sp.end_date IS NULL OR sp.end_date >= CURDATE())
  LEFT JOIN classes c ON MONTH(c.occurrence_date) = p_month
    AND YEAR(c.occurrence_date) = p_year
    AND c.status NOT IN ('CANCELLED')
  LEFT JOIN attendances a ON s.id = a.student_id
    AND a.class_id = c.id
  WHERE s.active = TRUE
  GROUP BY s.id, u.full_name, sp.plan_type
  ORDER BY attendance_percentage DESC, u.full_name ASC;
END //

DELIMITER ;

-- ============================================================================
-- 🔧 PROCEDURE 4: Enviar notificações de mensalidade vencida
-- ============================================================================
-- Chamada via cron diariamente
-- Cria notificações para alunos inadimplentes
DELIMITER //

CREATE PROCEDURE sp_send_overdue_notifications()
BEGIN
  DECLARE v_current_month INT;
  DECLARE v_current_year INT;
  DECLARE v_notification_count INT DEFAULT 0;

  SET v_current_month = MONTH(CURDATE());
  SET v_current_year = YEAR(CURDATE());

  START TRANSACTION;

  -- Atualizar fees PENDING para OVERDUE se estão vencidas
  UPDATE monthly_fees
  SET status = 'OVERDUE', updated_at = NOW()
  WHERE status = 'PENDING'
    AND due_date < CURDATE();

  -- Inserir notificações para alunos com fees OVERDUE
  INSERT INTO notifications
    (id, recipient_id, type, subject, message, created_at)
  SELECT
    UUID(),
    s.user_id,
    'FEE_OVERDUE',
    'Mensalidade em Atraso',
    CONCAT(
      'Sua mensalidade de ',
      MONTHNAME(DATE(CONCAT(mf.year, '-', LPAD(mf.month, 2, '0'), '-01'))),
      ' está vencida desde ',
      mf.due_date,
      '. Valor: R$ ',
      FORMAT(mf.amount, 2, 'pt_BR'),
      '. Por favor, regularize sua situação.'
    ),
    NOW()
  FROM monthly_fees mf
  INNER JOIN students s ON mf.student_id = s.id
  WHERE mf.status = 'OVERDUE'
    AND mf.due_date < CURDATE()
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.recipient_id = s.user_id
        AND n.type = 'FEE_OVERDUE'
        AND MONTH(n.created_at) = v_current_month
        AND YEAR(n.created_at) = v_current_year
    );

  SET v_notification_count = ROW_COUNT();
  COMMIT;

  SELECT v_notification_count as notifications_created;
END //

DELIMITER ;

-- ============================================================================
-- 🔧 PROCEDURE 5: Verificar elegibilidade de presença
-- ============================================================================
-- Verifica se um aluno pode ter presença registrada em uma aula
DELIMITER //

CREATE PROCEDURE sp_check_student_attendance_eligibility(
  IN p_student_id VARCHAR(36),
  IN p_class_date DATE,
  OUT p_is_eligible BOOLEAN,
  OUT p_reason VARCHAR(255)
)
BEGIN
  DECLARE v_active_student BOOLEAN;
  DECLARE v_active_plan_count INT;

  -- Validar se aluno existe e está ativo
  SELECT COUNT(*) INTO v_active_student
  FROM students
  WHERE id = p_student_id AND active = TRUE;

  IF v_active_student = 0 THEN
    SET p_is_eligible = FALSE;
    SET p_reason = 'Aluno não encontrado ou inativo';
    LEAVE sp_check_student_attendance_eligibility;
  END IF;

  -- Validar se tem plano ACTIVE na data
  SELECT COUNT(*) INTO v_active_plan_count
  FROM student_plans
  WHERE student_id = p_student_id
    AND status = 'ACTIVE'
    AND start_date <= p_class_date
    AND (end_date IS NULL OR end_date >= p_class_date);

  IF v_active_plan_count = 0 THEN
    SET p_is_eligible = FALSE;
    SET p_reason = 'Aluno sem plano ativo nesta data';
    LEAVE sp_check_student_attendance_eligibility;
  END IF;

  SET p_is_eligible = TRUE;
  SET p_reason = 'Elegível para presença';
END //

DELIMITER ;

-- ============================================================================
-- 🔧 PROCEDURE 6: Relatório financeiro mensal
-- ============================================================================
-- Resumo financeiro do mês
DELIMITER //

CREATE PROCEDURE sp_monthly_financial_report(
  IN p_month INT,
  IN p_year INT
)
BEGIN
  SELECT
    COUNT(DISTINCT mf.student_id) as total_students,
    COUNT(DISTINCT CASE WHEN mf.status = 'PAID' THEN mf.id END) as fees_paid,
    COUNT(DISTINCT CASE WHEN mf.status = 'PENDING' THEN mf.id END) as fees_pending,
    COUNT(DISTINCT CASE WHEN mf.status = 'OVERDUE' THEN mf.id END) as fees_overdue,
    COUNT(DISTINCT CASE WHEN mf.status = 'CANCELLED' THEN mf.id END) as fees_cancelled,
    SUM(CASE WHEN mf.status = 'PAID' THEN mf.amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN mf.status = 'PENDING' THEN mf.amount ELSE 0 END) as total_pending,
    SUM(CASE WHEN mf.status = 'OVERDUE' THEN mf.amount ELSE 0 END) as total_overdue,
    SUM(mf.amount) as total_expected,
    ROUND(
      (SUM(CASE WHEN mf.status = 'PAID' THEN mf.amount ELSE 0 END) /
       NULLIF(SUM(mf.amount), 0)) * 100,
      2
    ) as payment_rate_percentage
  FROM monthly_fees mf
  WHERE mf.month = p_month
    AND mf.year = p_year;
END //

DELIMITER ;

-- ============================================================================
-- 🔧 VIEW: Alunos com dados financeiros atualizados
-- ============================================================================
CREATE OR REPLACE VIEW v_students_financial_status AS
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

-- ============================================================================
-- 🔧 VIEW: Classes com inscrições
-- ============================================================================
CREATE OR REPLACE VIEW v_classes_with_enrollments AS
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
-- 📊 ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================================

-- Índices para STUDENTS
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_active ON students(active);

-- Índices para CLASSES
CREATE INDEX idx_classes_instructor_id ON classes(instructor_id);
CREATE INDEX idx_classes_occurrence_date ON classes(occurrence_date);
CREATE INDEX idx_classes_status ON classes(status);
CREATE INDEX idx_classes_schedule_id ON classes(class_schedule_id);

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
CREATE INDEX idx_payments_received_by ON payments(received_by_user_id);

-- Índices para AUDIT_LOGS
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Índices para NOTIFICATIONS
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- Índices para CASH_REGISTERS
CREATE INDEX idx_cash_registers_opening_date ON cash_registers(opening_date);
CREATE INDEX idx_cash_registers_status ON cash_registers(status);
CREATE INDEX idx_cash_registers_opened_by ON cash_registers(opened_by_user_id);

-- ============================================================================
-- 📝 NOTAS IMPORTANTES
-- ============================================================================
--
-- 1. Procedures devem ser chamadas via Node.js (Prisma + raw queries)
-- 2. Triggers são críticos e devem estar sempre no banco
-- 3. Views facilitam queries complexas no backend
-- 4. Índices devem ser monitorados para performance
-- 5. Backup de procedures deve ser feito regularmente
-- 6. Logs de execução podem ser adicionados para debugging
--
-- ============================================================================
