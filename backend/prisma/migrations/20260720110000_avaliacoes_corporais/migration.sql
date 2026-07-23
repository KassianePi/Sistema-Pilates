-- CreateTable
CREATE TABLE `avaliacoes_corporais` (
    `id` VARCHAR(36) NOT NULL,
    `aluno_id` VARCHAR(36) NOT NULL,
    `registrado_por_id` VARCHAR(36) NOT NULL,
    `data_avaliacao` DATETIME(3) NOT NULL,
    `peso` DECIMAL(5, 2) NULL,
    `altura` DECIMAL(4, 2) NULL,
    `medidas` JSON NULL,
    `queixa_principal` VARCHAR(500) NULL,
    `historico_medico` LONGTEXT NULL,
    `observacoes_postura` LONGTEXT NULL,
    `observacoes_gerais` LONGTEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `avaliacoes_corporais_aluno_id_idx`(`aluno_id`),
    INDEX `avaliacoes_corporais_data_avaliacao_idx`(`data_avaliacao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacoes_fotos` (
    `id` VARCHAR(36) NOT NULL,
    `avaliacao_id` VARCHAR(36) NOT NULL,
    `arquivo` LONGTEXT NOT NULL,
    `tipo_arquivo` VARCHAR(50) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `avaliacoes_fotos_avaliacao_id_idx`(`avaliacao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `avaliacoes_corporais` ADD CONSTRAINT `avaliacoes_corporais_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_corporais` ADD CONSTRAINT `avaliacoes_corporais_registrado_por_id_fkey` FOREIGN KEY (`registrado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_fotos` ADD CONSTRAINT `avaliacoes_fotos_avaliacao_id_fkey` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacoes_corporais`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
