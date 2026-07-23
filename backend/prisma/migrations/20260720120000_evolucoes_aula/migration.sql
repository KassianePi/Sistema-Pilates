-- CreateTable
CREATE TABLE `evolucoes_aula` (
    `id` VARCHAR(36) NOT NULL,
    `aluno_id` VARCHAR(36) NOT NULL,
    `aula_id` VARCHAR(36) NOT NULL,
    `registrado_por_id` VARCHAR(36) NOT NULL,
    `observacao` LONGTEXT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `evolucoes_aula_aluno_id_idx`(`aluno_id`),
    INDEX `evolucoes_aula_aula_id_idx`(`aula_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `evolucoes_aula` ADD CONSTRAINT `evolucoes_aula_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evolucoes_aula` ADD CONSTRAINT `evolucoes_aula_aula_id_fkey` FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evolucoes_aula` ADD CONSTRAINT `evolucoes_aula_registrado_por_id_fkey` FOREIGN KEY (`registrado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
