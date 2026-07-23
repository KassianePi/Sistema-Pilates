-- Geração automática de mensalidades: configurações (segue o mesmo padrão
-- singleton já usado por usar_pix_automatico em configuracao_studio), lock de
-- execução única e histórico persistido de execuções.

-- AlterTable: novas configurações administráveis sem deploy
ALTER TABLE `configuracao_studio`
  ADD COLUMN `geracao_automatica_ativa` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `dias_antes_geracao` INT NOT NULL DEFAULT 5,
  ADD COLUMN `maximo_mensalidades_futuras` INT NOT NULL DEFAULT 1,
  ADD COLUMN `cron_geracao_mensalidades` VARCHAR(50) NOT NULL DEFAULT '0 0,6,12,18 * * *';

-- CreateTable: lock de execução única (evita cron + execução manual, ou duas
-- réplicas do backend, processarem a lista de alunos ao mesmo tempo)
CREATE TABLE `job_locks` (
  `chave` VARCHAR(100) NOT NULL,
  `travado_em` DATETIME(3) NOT NULL,
  `expira_em` DATETIME(3) NOT NULL,
  `origem` ENUM('CRON', 'MANUAL') NOT NULL,
  PRIMARY KEY (`chave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: histórico persistido de execuções (preparado para um card de
-- status no Dashboard Administrativo). Dry-run nunca grava aqui.
CREATE TABLE `execucoes_job_mensalidades` (
  `id` VARCHAR(36) NOT NULL,
  `origem` ENUM('CRON', 'MANUAL') NOT NULL,
  `status` ENUM('EM_ANDAMENTO', 'SUCESSO', 'PARCIAL', 'ERRO') NOT NULL DEFAULT 'EM_ANDAMENTO',
  `dry_run` BOOLEAN NOT NULL DEFAULT false,
  `executado_por_id` VARCHAR(36) NULL,
  `iniciado_em` DATETIME(3) NOT NULL,
  `finalizado_em` DATETIME(3) NULL,
  `duracao_ms` INT NULL,
  `total_alunos_elegiveis` INT NOT NULL DEFAULT 0,
  `alunos_analisados` INT NOT NULL DEFAULT 0,
  `mensalidades_criadas` INT NOT NULL DEFAULT 0,
  `alunos_ignorados` INT NOT NULL DEFAULT 0,
  `detalhes_ignorados` JSON NOT NULL,
  `erros` JSON NOT NULL,
  `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `execucoes_job_mensalidades_iniciado_em_idx` (`iniciado_em`),
  INDEX `execucoes_job_mensalidades_status_idx` (`status`),
  CONSTRAINT `execucoes_job_mensalidades_executado_por_id_fkey`
    FOREIGN KEY (`executado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
