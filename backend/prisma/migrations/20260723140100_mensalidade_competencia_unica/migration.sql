-- Idempotência da geração automática de mensalidades: garante no banco que
-- nunca existam duas mensalidades do mesmo aluno para a mesma competência e
-- tipo. É a proteção real contra duplicidade (o código só faz um pré-check
-- barato para logar o motivo do skip com clareza) — mesma filosofia já usada
-- em `baixarComPagamentoAutomatico` (financeiro.repository.ts).
--
-- Também vale para tipo=AVULSO (mesma constraint, sem exceção possível em
-- MySQL sem índice parcial). Mensalidades avulsas manuais no mesmo aluno e
-- mesmo dia exato colidiriam — cenário raro, aceito conscientemente.
--
-- Antes de aplicar em um banco com dados reais, é recomendável checar se já
-- existe alguma duplicidade (o ALTER falha se existir):
--   SELECT alunoId, mes_referencia, tipo, COUNT(*) FROM mensalidades
--   GROUP BY alunoId, mes_referencia, tipo HAVING COUNT(*) > 1;
-- Obs: a coluna FK em `mensalidades` é `alunoId` (camelCase, sem @map no schema).
ALTER TABLE `mensalidades`
  ADD UNIQUE INDEX `mensalidades_alunoId_mes_referencia_tipo_key` (`alunoId`, `mes_referencia`, `tipo`);
