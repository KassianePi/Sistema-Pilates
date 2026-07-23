-- CreateTable
CREATE TABLE `cobrancas_pix` (
    `id` VARCHAR(36) NOT NULL,
    `mensalidade_id` VARCHAR(36) NOT NULL,
    `gateway` VARCHAR(30) NOT NULL DEFAULT 'MERCADO_PAGO',
    `external_payment_id` VARCHAR(50) NULL,
    `external_reference` VARCHAR(36) NOT NULL,
    `status` ENUM('PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO', 'EXPIRADO') NOT NULL DEFAULT 'PENDENTE',
    `status_detail` VARCHAR(100) NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `qr_code` LONGTEXT NULL,
    `qr_code_base64` LONGTEXT NULL,
    `ticket_url` VARCHAR(500) NULL,
    `data_expiracao` DATETIME(3) NULL,
    `data_aprovacao` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cobrancas_pix_external_payment_id_key`(`external_payment_id`),
    INDEX `cobrancas_pix_mensalidade_id_idx`(`mensalidade_id`),
    INDEX `cobrancas_pix_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhooks_mercado_pago` (
    `id` VARCHAR(36) NOT NULL,
    `cobranca_pix_id` VARCHAR(36) NULL,
    `external_event_id` VARCHAR(100) NOT NULL,
    `topico` VARCHAR(30) NOT NULL,
    `payment_id_mp` VARCHAR(50) NULL,
    `payload` JSON NOT NULL,
    `processado_com_sucesso` BOOLEAN NOT NULL DEFAULT false,
    `erro` LONGTEXT NULL,
    `recebido_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `webhooks_mercado_pago_external_event_id_key`(`external_event_id`),
    INDEX `webhooks_mercado_pago_cobranca_pix_id_idx`(`cobranca_pix_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cobrancas_pix` ADD CONSTRAINT `cobrancas_pix_mensalidade_id_fkey` FOREIGN KEY (`mensalidade_id`) REFERENCES `mensalidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webhooks_mercado_pago` ADD CONSTRAINT `webhooks_mercado_pago_cobranca_pix_id_fkey` FOREIGN KEY (`cobranca_pix_id`) REFERENCES `cobrancas_pix`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
