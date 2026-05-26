# 🎯 DESAFIOS PRÁTICOS — DER e SQL

**Dificuldade:** Intermediária  
**Tempo:** 1-2 horas  
**Objetivo:** Aprofundar conhecimento em modelagem de dados

---

## 🚀 Como Usar Este Arquivo

1. **Leia** o desafio
2. **Tente resolver** antes de ver a solução
3. **Implemente** em Adminer ou MySQL CLI
4. **Valide** a resposta contra a sugestão

---

## 📝 Desafio 1: Alunos Ativos

**Enunciado:**
Crie uma query que liste todos os alunos que:
- Têm um plano ativo
- Pagaram a mensalidade do mês atual
- Tiveram presença em aulas este mês

**Pistas:**
- Use JOIN entre students, student_plans, payments, attendances
- Filtre por plan status = 'ACTIVE'
- Filtre por payment status = 'PAID'
- Use DATE_TRUNC ou MONTH/YEAR para mês atual

**Sugestão de Resposta:**
```sql
SELECT DISTINCT
  u.id,
  u.full_name,
  sp.plan_type,
  COUNT(a.id) as attendances_this_month
FROM users u
INNER JOIN students s ON u.id = s.user_id
INNER JOIN student_plans sp ON s.id = sp.student_id
INNER JOIN monthly_fees mf ON sp.id = mf.student_plan_id
INNER JOIN payments p ON mf.id = p.monthly_fee_id
INNER JOIN classes c ON YEAR(c.class_date) = YEAR(CURDATE())
  AND MONTH(c.class_date) = MONTH(CURDATE())
LEFT JOIN attendances a ON c.id = a.class_id 
  AND a.student_id = s.id
  AND a.status = 'PRESENT'
WHERE sp.status = 'ACTIVE'
  AND p.payment_method IS NOT NULL
  AND YEAR(p.payment_date) = YEAR(CURDATE())
  AND MONTH(p.payment_date) = MONTH(CURDATE())
GROUP BY u.id, u.full_name, sp.plan_type
ORDER BY attendances_this_month DESC;
```

---

## 📝 Desafio 2: Mensalidades Vencidas

**Enunciado:**
Criar uma stored procedure que:
- Identifique mensalidades vencidas (due_date < CURDATE())
- Atualize status para 'OVERDUE'
- Envie notificação ao aluno
- Retorne quantas foram atualizadas

**Pistas:**
- Procedure deve ter OUTPUT parameter para quantidade
- Use UPDATE com WHERE
- Insira registros em notifications
- Use transaction

**Sugestão de Resposta:**
```sql
DELIMITER $$
CREATE PROCEDURE sp_update_overdue_fees(OUT updated_count INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET updated_count = -1;
  END;
  
  START TRANSACTION;
  
  UPDATE monthly_fees
  SET status = 'OVERDUE'
  WHERE due_date < CURDATE()
    AND status IN ('PENDING', 'PARTIAL');
  
  SET updated_count = ROW_COUNT();
  
  INSERT INTO notifications (user_id, notification_type, message)
  SELECT DISTINCT s.user_id, 'EMAIL', 
    CONCAT('Mensalidade vencida em ', DATE_FORMAT(mf.due_date, '%d/%m/%Y'))
  FROM monthly_fees mf
  INNER JOIN students s ON mf.student_id = s.id
  WHERE mf.status = 'OVERDUE'
    AND mf.updated_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE);
  
  COMMIT;
END$$
DELIMITER ;
```

---

## 📝 Desafio 3: Ocupação das Aulas

**Enunciado:**
Crie uma query que mostre:
- Nome da aula (instructor + dia/horário)
- Capacidade da sala
- Quantidade de alunos inscritos
- Taxa de ocupação (%)
- Filtrar apenas aulas de próximos 7 dias

**Pistas:**
- Use ClassSchedule e Attendance
- Calcule percentual: (COUNT(*) / capacity) * 100
- Use CASE para formato de data/hora
- Group By por class_schedule_id

**Sugestão de Resposta:**
```sql
SELECT
  u.full_name as instructor_name,
  CONCAT(
    DAYNAME(c.class_date), ' ',
    TIME_FORMAT(cs.start_time, '%H:%i')
  ) as class_info,
  cs.room,
  cs.capacity,
  COUNT(a.id) as enrolled_students,
  ROUND((COUNT(a.id) / cs.capacity) * 100, 2) as occupancy_rate
FROM class_schedules cs
INNER JOIN instructors i ON cs.instructor_id = i.id
INNER JOIN users u ON i.user_id = u.id
INNER JOIN classes c ON cs.id = c.class_schedule_id
LEFT JOIN attendances a ON c.id = a.class_id 
  AND a.status IN ('PRESENT', 'JUSTIFIED_ABSENCE')
WHERE c.class_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  AND c.status = 'SCHEDULED'
GROUP BY cs.id, u.full_name, c.class_date, cs.start_time, cs.room, cs.capacity
ORDER BY c.class_date, cs.start_time;
```

---

## 📝 Desafio 4: Relatório Financeiro Mensal

**Enunciado:**
Crie uma query que retorne:
- Mês/Ano
- Mensalidades geradas
- Valor total
- Pagamentos recebidos
- Valor total recebido
- Diferença (a receber)

**Pistas:**
- Agrupe por YEAR e MONTH
- Use SUM(amount) para totais
- Diferencie entre monthly_fees e payments
- Use LEFT JOIN se alguns meses não têm pagamentos

**Sugestão de Resposta:**
```sql
SELECT
  DATE_FORMAT(mf.month_year, '%m/%Y') as month_year,
  COUNT(DISTINCT mf.id) as fees_generated,
  SUM(CASE WHEN mf.status != 'PAID' THEN mf.amount ELSE 0 END) as amount_due,
  COUNT(DISTINCT p.id) as payments_received,
  SUM(COALESCE(p.amount, 0)) as amount_paid,
  SUM(mf.amount) - SUM(COALESCE(p.amount, 0)) as difference
FROM monthly_fees mf
LEFT JOIN payments p ON mf.id = p.monthly_fee_id
GROUP BY DATE_TRUNC('month', mf.month_year)
ORDER BY mf.month_year DESC;
```

---

## 📝 Desafio 5: Eficiência do Professor

**Enunciado:**
Crie um view que mostre por professor:
- Nome do professor
- Total de aulas ministradas
- Média de presença de alunos
- Índice de cancelamento (%)
- Última aula

**Pistas:**
- Use classes, attendances, class_schedules
- Filtre por ClassStatus = 'COMPLETED' para aulas realizadas
- Média = COUNT(PRESENT) / COUNT(todos)
- Cancelamento = COUNT(CANCELED) / COUNT(todos)

**Sugestão de Resposta:**
```sql
CREATE OR REPLACE VIEW v_instructor_performance AS
SELECT
  i.id,
  u.full_name as instructor_name,
  COUNT(DISTINCT CASE WHEN c.status = 'COMPLETED' THEN c.id END) as completed_classes,
  COUNT(DISTINCT CASE WHEN c.status = 'CANCELED' THEN c.id END) as canceled_classes,
  ROUND(
    COUNT(DISTINCT CASE WHEN a.status = 'PRESENT' THEN a.id END) * 100.0 /
    NULLIF(COUNT(DISTINCT a.id), 0), 2
  ) as average_attendance_rate,
  ROUND(
    COUNT(DISTINCT CASE WHEN c.status = 'CANCELED' THEN c.id END) * 100.0 /
    NULLIF(COUNT(DISTINCT c.id), 0), 2
  ) as cancellation_rate,
  MAX(c.class_date) as last_class_date
FROM instructors i
INNER JOIN users u ON i.user_id = u.id
LEFT JOIN class_schedules cs ON i.id = cs.instructor_id
LEFT JOIN classes c ON cs.id = c.class_schedule_id
LEFT JOIN attendances a ON c.id = a.class_id
GROUP BY i.id, u.full_name;
```

---

## 🎓 Aprendizados

Resolvendo estes desafios você praticar:

✅ **Joins complexos** (INNER, LEFT, múltiplos)  
✅ **Agregações** (COUNT, SUM, MAX, MIN, AVG)  
✅ **Filtros temporais** (DATE, MONTH, YEAR)  
✅ **Procedures e Views** (estrutura e sintaxe)  
✅ **Lógica de negócio** (relações entre tabelas)  

---

## 💡 Próximos Passos

1. **Implemente** cada desafio no Adminer
2. **Valide** com os dados de teste
3. **Otimize** as queries (veja EXPLAIN ANALYZE)
4. **Documente** suas soluções
5. **Discuta** alternativas com o time

---

**Dificuldade dos Desafios:**

| # | Dificuldade | Pré-requisitos |
|---|---|---|
| 1 | ⭐ Fácil | JOINs básicos |
| 2 | ⭐⭐ Médio | Procedures, Transactions |
| 3 | ⭐⭐ Médio | GROUP BY, Funções de Data |
| 4 | ⭐⭐ Médio | Agregações avançadas |
| 5 | ⭐⭐⭐ Difícil | Views, Múltiplos JOINs, CASE |

