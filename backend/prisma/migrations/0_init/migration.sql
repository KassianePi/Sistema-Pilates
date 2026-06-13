-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `senha_hash` VARCHAR(255) NOT NULL,
    `nome_completo` VARCHAR(255) NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `cpf` VARCHAR(11) NOT NULL,
    `funcao` ENUM('ADMIN', 'PROFESSOR', 'RECEPCIONISTA', 'FINANCEIRO', 'ALUNO') NOT NULL DEFAULT 'RECEPCIONISTA',
    `status` ENUM('ATIVO', 'INATIVO', 'SUSPENSO') NOT NULL DEFAULT 'ATIVO',
    `ultimo_acesso_em` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_email_key`(`email`),
    UNIQUE INDEX `usuarios_cpf_key`(`cpf`),
    INDEX `usuarios_email_idx`(`email`),
    INDEX `usuarios_cpf_idx`(`cpf`),
    INDEX `usuarios_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alunos` (
    `id` VARCHAR(36) NOT NULL,
    `usuarioId` VARCHAR(36) NOT NULL,
    `plano_id` VARCHAR(36) NULL,
    `data_inicio` DATETIME(3) NOT NULL,
    `data_nascimento` DATETIME(3) NULL,
    `ultimo_acesso` DATETIME(3) NULL,
    `endereco` VARCHAR(255) NULL,
    `cidade` VARCHAR(100) NULL,
    `estado` VARCHAR(2) NULL,
    `cep` VARCHAR(9) NULL,
    `observacoes` LONGTEXT NULL,
    `status` ENUM('ATIVO', 'INATIVO', 'SUSPENSO', 'FORMADO') NOT NULL DEFAULT 'ATIVO',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `alunos_usuarioId_key`(`usuarioId`),
    INDEX `alunos_usuarioId_idx`(`usuarioId`),
    INDEX `alunos_status_idx`(`status`),
    INDEX `alunos_plano_id_idx`(`plano_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `professores` (
    `id` VARCHAR(36) NOT NULL,
    `usuarioId` VARCHAR(36) NOT NULL,
    `especialidade` VARCHAR(255) NULL,
    `bio` LONGTEXT NULL,
    `status` ENUM('ATIVO', 'INATIVO', 'LICENCA') NOT NULL DEFAULT 'ATIVO',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `professores_usuarioId_key`(`usuarioId`),
    INDEX `professores_usuarioId_idx`(`usuarioId`),
    INDEX `professores_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `planos` (
    `id` VARCHAR(36) NOT NULL,
    `nome` VARCHAR(255) NOT NULL,
    `descricao` LONGTEXT NULL,
    `tipo` ENUM('MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL') NOT NULL DEFAULT 'MENSAL',
    `aulas` INTEGER NOT NULL DEFAULT 4,
    `preco` DECIMAL(10, 2) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `planos_nome_key`(`nome`),
    INDEX `planos_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modalidades` (
    `id` VARCHAR(36) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `modalidades_nome_key`(`nome`),
    INDEX `modalidades_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aulas` (
    `id` VARCHAR(36) NOT NULL,
    `professorId` VARCHAR(36) NOT NULL,
    `modalidade_id` VARCHAR(36) NULL,
    `data_hora_inicio` DATETIME(3) NOT NULL,
    `duracao` INTEGER NOT NULL DEFAULT 50,
    `capacidade` INTEGER NOT NULL DEFAULT 10,
    `sala` VARCHAR(100) NOT NULL,
    `tipo` ENUM('INDIVIDUAL', 'DUPLA', 'GRUPO') NOT NULL DEFAULT 'GRUPO',
    `categoria` ENUM('GERAL', 'SOB_DEMANDA') NOT NULL DEFAULT 'GERAL',
    `observacoes` LONGTEXT NULL,
    `status` ENUM('AGENDADA', 'REALIZADA', 'CANCELADA', 'ADIADA') NOT NULL DEFAULT 'AGENDADA',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `aulas_professorId_idx`(`professorId`),
    INDEX `aulas_modalidade_id_idx`(`modalidade_id`),
    INDEX `aulas_data_hora_inicio_idx`(`data_hora_inicio`),
    INDEX `aulas_status_idx`(`status`),
    INDEX `aulas_categoria_idx`(`categoria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `presencas` (
    `id` VARCHAR(36) NOT NULL,
    `alunoId` VARCHAR(36) NOT NULL,
    `aulaId` VARCHAR(36) NOT NULL,
    `status` ENUM('PRESENTE', 'AUSENTE', 'FALTA_JUSTIFICADA') NOT NULL DEFAULT 'PRESENTE',
    `data_registro` DATETIME(3) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `presencas_alunoId_idx`(`alunoId`),
    INDEX `presencas_aulaId_idx`(`aulaId`),
    UNIQUE INDEX `presencas_alunoId_aulaId_key`(`alunoId`, `aulaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reposicoes` (
    `id` VARCHAR(36) NOT NULL,
    `alunoId` VARCHAR(36) NOT NULL,
    `aulaOriginalId` VARCHAR(36) NOT NULL,
    `aulaReposicaoId` VARCHAR(36) NULL,
    `motivo` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDENTE', 'AGENDADA', 'REALIZADA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    `data_solicitacao` DATETIME(3) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reposicoes_alunoId_idx`(`alunoId`),
    INDEX `reposicoes_aulaOriginalId_idx`(`aulaOriginalId`),
    INDEX `reposicoes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `caixas` (
    `id` VARCHAR(36) NOT NULL,
    `usuarioAbreId` VARCHAR(36) NOT NULL,
    `usuarioFechaId` VARCHAR(36) NULL,
    `data_abertura` DATETIME(3) NOT NULL,
    `data_fechamento` DATETIME(3) NULL,
    `saldo_abertura` DECIMAL(10, 2) NOT NULL,
    `saldo_fechamento` DECIMAL(10, 2) NULL,
    `observacoes` LONGTEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `caixas_usuarioAbreId_idx`(`usuarioAbreId`),
    INDEX `caixas_data_abertura_idx`(`data_abertura`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensalidades` (
    `id` VARCHAR(36) NOT NULL,
    `alunoId` VARCHAR(36) NOT NULL,
    `planoId` VARCHAR(36) NULL,
    `tipo` ENUM('MENSAL', 'AVULSO') NOT NULL DEFAULT 'MENSAL',
    `mes_referencia` DATETIME(3) NOT NULL,
    `data_vencimento` DATETIME(3) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `desconto` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDENTE', 'PARCIAL', 'PAGO', 'VENCIDO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    `observacoes` LONGTEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mensalidades_alunoId_idx`(`alunoId`),
    INDEX `mensalidades_status_idx`(`status`),
    INDEX `mensalidades_tipo_idx`(`tipo`),
    INDEX `mensalidades_data_vencimento_idx`(`data_vencimento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamentos` (
    `id` VARCHAR(36) NOT NULL,
    `mensalidadeId` VARCHAR(36) NOT NULL,
    `caixaId` VARCHAR(36) NOT NULL,
    `usuarioId` VARCHAR(36) NOT NULL,
    `data_pagamento` DATETIME(3) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `metodo` ENUM('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'CHEQUE', 'TRANSFERENCIA') NOT NULL DEFAULT 'PIX',
    `referencia` VARCHAR(255) NULL,
    `observacoes` LONGTEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pagamentos_mensalidadeId_idx`(`mensalidadeId`),
    INDEX `pagamentos_caixaId_idx`(`caixaId`),
    INDEX `pagamentos_data_pagamento_idx`(`data_pagamento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `relatorios` (
    `id` VARCHAR(36) NOT NULL,
    `professorId` VARCHAR(36) NOT NULL,
    `tipo` ENUM('FREQUENCIA', 'FINANCEIRO', 'PRESENCA_ALUNO', 'RECEITA_MENSAL', 'PENDENCIAS_PAGAMENTO') NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `descricao` LONGTEXT NULL,
    `data_periodo_inicio` DATETIME(3) NOT NULL,
    `data_periodo_fim` DATETIME(3) NOT NULL,
    `conteudo` LONGTEXT NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `relatorios_professorId_idx`(`professorId`),
    INDEX `relatorios_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacoes` (
    `id` VARCHAR(36) NOT NULL,
    `usuarioId` VARCHAR(36) NOT NULL,
    `tipo` ENUM('AULA_AGENDADA', 'PAGAMENTO_VENCIDO', 'PAGAMENTO_CONFIRMADO', 'MENSALIDADE_CRIADA', 'ESTORNO_ATUALIZADO', 'PRESENCA_REGISTRADA', 'REPOSICAO_OFERECIDA', 'MENSAGEM_ADMIN') NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `mensagem` LONGTEXT NOT NULL,
    `status` ENUM('NAO_LIDA', 'LIDA', 'ARQUIVADA') NOT NULL DEFAULT 'NAO_LIDA',
    `data_leitura` DATETIME(3) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notificacoes_usuarioId_idx`(`usuarioId`),
    INDEX `notificacoes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs_auditoria` (
    `id` VARCHAR(36) NOT NULL,
    `usuarioId` VARCHAR(36) NOT NULL,
    `acao` ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
    `entidade` VARCHAR(255) NOT NULL,
    `entidadeId` VARCHAR(36) NOT NULL,
    `dados_antigos` LONGTEXT NULL,
    `dados_novos` LONGTEXT NULL,
    `endereco_ip` VARCHAR(45) NULL,
    `user_agent` LONGTEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `logs_auditoria_usuarioId_idx`(`usuarioId`),
    INDEX `logs_auditoria_acao_idx`(`acao`),
    INDEX `logs_auditoria_criado_em_idx`(`criado_em`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comprovantes_pagamento` (
    `id` VARCHAR(36) NOT NULL,
    `mensalidade_id` VARCHAR(36) NOT NULL,
    `aluno_id` VARCHAR(36) NOT NULL,
    `arquivo` LONGTEXT NOT NULL,
    `nome_arquivo` VARCHAR(255) NOT NULL,
    `tipo_arquivo` VARCHAR(50) NOT NULL,
    `data_envio` DATETIME(3) NOT NULL,
    `status` ENUM('PENDENTE', 'APROVADO', 'REJEITADO') NOT NULL DEFAULT 'PENDENTE',
    `observacoes` LONGTEXT NULL,
    `analisado_por_id` VARCHAR(36) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `comprovantes_pagamento_mensalidade_id_idx`(`mensalidade_id`),
    INDEX `comprovantes_pagamento_aluno_id_idx`(`aluno_id`),
    INDEX `comprovantes_pagamento_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuracao_studio` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'studio',
    `chave_pix` VARCHAR(255) NULL,
    `tipo_chave_pix` VARCHAR(20) NULL,
    `nome_recebedor` VARCHAR(255) NULL,
    `qr_code_base64` LONGTEXT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estornos` (
    `id` VARCHAR(36) NOT NULL,
    `mensalidade_id` VARCHAR(36) NOT NULL,
    `aluno_id` VARCHAR(36) NOT NULL,
    `dias_contratados` INTEGER NOT NULL,
    `dias_comparecidos` INTEGER NOT NULL,
    `dias_estornados` INTEGER NOT NULL,
    `valor_estorno` DECIMAL(10, 2) NOT NULL,
    `motivo` LONGTEXT NULL,
    `status` ENUM('SOLICITADO', 'APROVADO', 'PROCESSADO', 'NEGADO') NOT NULL DEFAULT 'SOLICITADO',
    `aprovado_por_id` VARCHAR(36) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `estornos_mensalidade_id_idx`(`mensalidade_id`),
    INDEX `estornos_aluno_id_idx`(`aluno_id`),
    INDEX `estornos_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `alunos` ADD CONSTRAINT `alunos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alunos` ADD CONSTRAINT `alunos_plano_id_fkey` FOREIGN KEY (`plano_id`) REFERENCES `planos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `professores` ADD CONSTRAINT `professores_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulas` ADD CONSTRAINT `aulas_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `professores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulas` ADD CONSTRAINT `aulas_modalidade_id_fkey` FOREIGN KEY (`modalidade_id`) REFERENCES `modalidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presencas` ADD CONSTRAINT `presencas_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `presencas` ADD CONSTRAINT `presencas_aulaId_fkey` FOREIGN KEY (`aulaId`) REFERENCES `aulas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reposicoes` ADD CONSTRAINT `reposicoes_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reposicoes` ADD CONSTRAINT `reposicoes_aulaOriginalId_fkey` FOREIGN KEY (`aulaOriginalId`) REFERENCES `aulas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reposicoes` ADD CONSTRAINT `reposicoes_aulaReposicaoId_fkey` FOREIGN KEY (`aulaReposicaoId`) REFERENCES `aulas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caixas` ADD CONSTRAINT `caixas_usuarioAbreId_fkey` FOREIGN KEY (`usuarioAbreId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `caixas` ADD CONSTRAINT `caixas_usuarioFechaId_fkey` FOREIGN KEY (`usuarioFechaId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensalidades` ADD CONSTRAINT `mensalidades_alunoId_fkey` FOREIGN KEY (`alunoId`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensalidades` ADD CONSTRAINT `mensalidades_planoId_fkey` FOREIGN KEY (`planoId`) REFERENCES `planos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_mensalidadeId_fkey` FOREIGN KEY (`mensalidadeId`) REFERENCES `mensalidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_caixaId_fkey` FOREIGN KEY (`caixaId`) REFERENCES `caixas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relatorios` ADD CONSTRAINT `relatorios_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `professores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs_auditoria` ADD CONSTRAINT `logs_auditoria_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comprovantes_pagamento` ADD CONSTRAINT `comprovantes_pagamento_mensalidade_id_fkey` FOREIGN KEY (`mensalidade_id`) REFERENCES `mensalidades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comprovantes_pagamento` ADD CONSTRAINT `comprovantes_pagamento_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comprovantes_pagamento` ADD CONSTRAINT `comprovantes_pagamento_analisado_por_id_fkey` FOREIGN KEY (`analisado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estornos` ADD CONSTRAINT `estornos_mensalidade_id_fkey` FOREIGN KEY (`mensalidade_id`) REFERENCES `mensalidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estornos` ADD CONSTRAINT `estornos_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estornos` ADD CONSTRAINT `estornos_aprovado_por_id_fkey` FOREIGN KEY (`aprovado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

