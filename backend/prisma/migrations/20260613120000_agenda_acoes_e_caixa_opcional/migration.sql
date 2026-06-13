-- DropForeignKey
ALTER TABLE `pagamentos` DROP FOREIGN KEY `pagamentos_caixaId_fkey`;

-- AlterTable
ALTER TABLE `aulas` ADD COLUMN `data_hora_anterior` DATETIME(3) NULL,
    ADD COLUMN `justificativa` LONGTEXT NULL,
    ADD COLUMN `status_alterado_em` DATETIME(3) NULL,
    ADD COLUMN `status_alterado_por_id` VARCHAR(36) NULL,
    MODIFY `status` ENUM('AGENDADA', 'REALIZADA', 'CANCELADA', 'ADIADA', 'SUSPENSA', 'EXCLUIDA') NOT NULL DEFAULT 'AGENDADA';

-- AlterTable
ALTER TABLE `pagamentos` MODIFY `caixaId` VARCHAR(36) NULL;

-- CreateIndex
CREATE INDEX `aulas_status_alterado_por_id_idx` ON `aulas`(`status_alterado_por_id`);

-- AddForeignKey
ALTER TABLE `aulas` ADD CONSTRAINT `aulas_status_alterado_por_id_fkey` FOREIGN KEY (`status_alterado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_caixaId_fkey` FOREIGN KEY (`caixaId`) REFERENCES `caixas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

