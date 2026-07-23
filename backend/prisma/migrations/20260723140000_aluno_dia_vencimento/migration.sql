-- Geração automática de mensalidades: dia de vencimento persistido por aluno.
-- Fonte única de verdade a partir de agora — a geração automática nunca deriva
-- o vencimento somando meses à última mensalidade, sempre lê esta coluna.

-- 1. Coluna nasce nullable para permitir backfill em etapas
ALTER TABLE `alunos` ADD COLUMN `dia_vencimento` INT NULL;

-- 2. Alunos que já têm mensalidade MENSAL: usa o dia da PRIMEIRA (menor mes_referencia)
-- Obs: a coluna FK em `mensalidades` é `alunoId` (camelCase, sem @map no schema),
-- diferente de `aluno_id` usado em outras tabelas.
UPDATE `alunos` a
JOIN (
  SELECT m.alunoId, DAY(m.data_vencimento) AS dia
  FROM `mensalidades` m
  INNER JOIN (
    SELECT alunoId, MIN(mes_referencia) AS min_mes
    FROM `mensalidades`
    WHERE tipo = 'MENSAL'
    GROUP BY alunoId
  ) primeira ON primeira.alunoId = m.alunoId AND m.mes_referencia = primeira.min_mes
  WHERE m.tipo = 'MENSAL'
) sub ON sub.alunoId = a.id
SET a.dia_vencimento = sub.dia;

-- 3. Alunos sem nenhuma mensalidade MENSAL: usa o dia de data_inicio
UPDATE `alunos`
SET `dia_vencimento` = DAY(`data_inicio`)
WHERE `dia_vencimento` IS NULL;

-- 4. Agora que 100% das linhas têm valor, torna a coluna obrigatória + trava o intervalo válido
ALTER TABLE `alunos` MODIFY COLUMN `dia_vencimento` INT NOT NULL DEFAULT 10;
ALTER TABLE `alunos` ADD CONSTRAINT `chk_alunos_dia_vencimento` CHECK (`dia_vencimento` BETWEEN 1 AND 31);
