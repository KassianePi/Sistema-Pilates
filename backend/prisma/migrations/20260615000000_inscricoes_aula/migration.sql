-- CreateTable
CREATE TABLE `inscricoes_aula` (
    `id` VARCHAR(36) NOT NULL,
    `alunoId` VARCHAR(36) NOT NULL,
    `aulaId` VARCHAR(36) NOT NULL,
    `status` ENUM('ATIVA', 'CANCELADA') NOT NULL DEFAULT 'ATIVA',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `inscricoes_aula_aulaId_idx`(`aulaId`),
    INDEX `inscricoes_aula_alunoId_idx`(`alunoId`),
    INDEX `inscricoes_aula_status_idx`(`status`),
    UNIQUE INDEX `inscricoes_aula_alunoId_aulaId_key`(`alunoId`, `aulaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inscricoes_aula` ADD CONSTRAINT `inscricoes_aula_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inscricoes_aula` ADD CONSTRAINT `inscricoes_aula_aulaId_fkey` FOREIGN KEY (`aulaId`) REFERENCES `aulas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

