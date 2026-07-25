-- Exclusão de aluno deve remover TUDO relacionado a ele do banco. Todas as
-- tabelas dependentes de `alunos`/`mensalidades` já cascateiam corretamente
-- (presenças, inscrições, reposições, comprovantes, cobranças PIX, avaliações,
-- evoluções, termos aceitos) — só `estornos` ficou com ON DELETE RESTRICT,
-- o que bloqueia a exclusão (com erro 500 genérico) sempre que o aluno tiver
-- algum estorno registrado. Alinha `estornos` ao mesmo padrão CASCADE.

ALTER TABLE `estornos` DROP FOREIGN KEY `estornos_mensalidade_id_fkey`;
ALTER TABLE `estornos` DROP FOREIGN KEY `estornos_aluno_id_fkey`;

ALTER TABLE `estornos`
  ADD CONSTRAINT `estornos_mensalidade_id_fkey`
    FOREIGN KEY (`mensalidade_id`) REFERENCES `mensalidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `estornos_aluno_id_fkey`
    FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
