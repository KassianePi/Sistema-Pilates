-- ============================================================================
-- 🏢 SISTEMA STUDIO DE PILATES — Script de Inicialização
-- ============================================================================
-- Database: MySQL 8.0+
-- Data: 26 de Maio de 2026
--
-- Este arquivo é executado automaticamente pelo Docker ao iniciar o MySQL
-- Cria todas as tabelas, indexes e relacionamentos do DER
--
-- ============================================================================

-- Usar banco de dados padrão
USE `pilates_db`;

-- Desabilitar foreign key checks temporariamente
SET FOREIGN_KEY_CHECKS=0;

-- ============================================================================
-- 🔐 MÓDULO AUTH — Autenticação
-- ============================================================================

CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `email` VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email do usuário',
  `senha_hash` VARCHAR(255) NOT NULL COMMENT 'Hash Bcrypt da senha',
  `nome_completo` VARCHAR(255) NOT NULL COMMENT 'Nome completo',
  `telefone` VARCHAR(20) COMMENT 'Telefone',
  `cpf` VARCHAR(11) UNIQUE NOT NULL COMMENT 'CPF (documento)',
  `funcao` ENUM('ADMIN', 'PROFESSOR', 'RECEPCIONISTA', 'FINANCEIRO') NOT NULL DEFAULT 'RECEPCIONISTA' COMMENT 'Função/Perfil',
  `status` ENUM('ATIVO', 'INATIVO', 'SUSPENSO') NOT NULL DEFAULT 'ATIVO' COMMENT 'Status do usuário',
  `ultimo_acesso_em` DATETIME COMMENT 'Último acesso',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY `idx_email` (`email`),
  KEY `idx_cpf` (`cpf`),
  KEY `idx_status` (`status`),
  KEY `idx_funcao` (`funcao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuários do sistema (Admin, Professor, Recepcionista, Financeiro)';

-- ============================================================================
-- 👨‍🎓 MÓDULO ALUNOS — Gestão de Alunos
-- ============================================================================

CREATE TABLE IF NOT EXISTS `alunos` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `usuario_id` VARCHAR(36) UNIQUE NOT NULL COMMENT 'FK -> usuarios',
  `data_nascimento` DATE COMMENT 'Data de nascimento',
  `genero` ENUM('M', 'F', 'OUTRO') COMMENT 'Gênero',
  `endereco` VARCHAR(255) COMMENT 'Endereço',
  `cidade` VARCHAR(100) COMMENT 'Cidade',
  `estado` VARCHAR(2) COMMENT 'Estado (UF)',
  `cep` VARCHAR(10) COMMENT 'CEP',
  `contato_emergencia_nome` VARCHAR(255) COMMENT 'Nome contato emergência',
  `contato_emergencia_telefone` VARCHAR(20) COMMENT 'Telefone contato emergência',
  `restricoes_medicas` TEXT COMMENT 'Restrições médicas',
  `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_usuario_id` (`usuario_id`),
  KEY `idx_ativo` (`ativo`),
  CONSTRAINT `fk_alunos_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dados específicos de alunos (relação 1:1 com usuarios)';

CREATE TABLE IF NOT EXISTS `planos_alunos` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `aluno_id` VARCHAR(36) NOT NULL COMMENT 'FK -> alunos',
  `tipo_plano` ENUM('BASICO_4', 'BASICO_8', 'PREMIUM', 'CUSTOMIZADO') NOT NULL COMMENT 'Tipo do plano',
  `data_inicio` DATE NOT NULL COMMENT 'Data início',
  `data_fim` DATE COMMENT 'Data fim',
  `custo_mensal` DECIMAL(10, 2) NOT NULL COMMENT 'Custo mensal',
  `aulas_por_semana` INT COMMENT 'Aulas por semana',
  `status` ENUM('ATIVO', 'PAUSADO', 'CONCLUIDO') NOT NULL DEFAULT 'ATIVO',
  `observacoes` TEXT COMMENT 'Observações',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY `idx_aluno_id` (`aluno_id`),
  KEY `idx_status` (`status`),
  KEY `idx_data_inicio` (`data_inicio`),
  KEY `idx_data_fim` (`data_fim`),
  CONSTRAINT `fk_planos_alunos_aluno_id` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Histórico de planos dos alunos';

CREATE TABLE IF NOT EXISTS `progresso_alunos` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `aluno_id` VARCHAR(36) NOT NULL COMMENT 'FK -> alunos',
  `aula_id` VARCHAR(36) NOT NULL COMMENT 'FK -> aulas',
  `data_avaliacao` DATE NOT NULL COMMENT 'Data da avaliação',
  `nota_flexibilidade` INT COMMENT 'Nota flexibilidade (1-10)',
  `nota_forca` INT COMMENT 'Nota força (1-10)',
  `nota_equilibrio` INT COMMENT 'Nota equilíbrio (1-10)',
  `nota_resistencia` INT COMMENT 'Nota resistência (1-10)',
  `observacoes` TEXT COMMENT 'Observações',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY `idx_aluno_id` (`aluno_id`),
  KEY `idx_aula_id` (`aula_id`),
  KEY `idx_data_avaliacao` (`data_avaliacao`),
  CONSTRAINT `fk_progresso_alunos_aluno_id` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_progresso_alunos_aula_id` FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Progresso e avaliações dos alunos';

-- ============================================================================
-- 👨‍🏫 MÓDULO PROFESSORES — Gestão de Professores
-- ============================================================================

CREATE TABLE IF NOT EXISTS `professores` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `usuario_id` VARCHAR(36) UNIQUE NOT NULL COMMENT 'FK -> usuarios',
  `especializacao` VARCHAR(255) COMMENT 'Especialização',
  `numero_certificado` VARCHAR(50) COMMENT 'Número certificado',
  `taxa_horaria` DECIMAL(10, 2) COMMENT 'Taxa horária',
  `biografia` TEXT COMMENT 'Biografia',
  `ativo` BOOLEAN NOT NULL DEFAULT TRUE,
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_usuario_id` (`usuario_id`),
  KEY `idx_ativo` (`ativo`),
  CONSTRAINT `fk_professores_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Dados específicos de professores/instrutores';

-- ============================================================================
-- 📅 MÓDULO AGENDA — Aulas e Horários
-- ============================================================================

CREATE TABLE IF NOT EXISTS `horarios_aulas` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `professor_id` VARCHAR(36) NOT NULL COMMENT 'FK -> professores',
  `dia_semana` ENUM('SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM') NOT NULL COMMENT 'Dia da semana',
  `hora_inicio` VARCHAR(5) NOT NULL COMMENT 'Horário início (HH:MM)',
  `hora_fim` VARCHAR(5) NOT NULL COMMENT 'Horário fim (HH:MM)',
  `sala` VARCHAR(50) COMMENT 'Sala/Local',
  `capacidade` INT NOT NULL DEFAULT 15 COMMENT 'Capacidade máxima',
  `status` ENUM('ATIVO', 'ARQUIVADO') NOT NULL DEFAULT 'ATIVO',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY `idx_professor_id` (`professor_id`),
  KEY `idx_dia_semana` (`dia_semana`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_horarios_aulas_professor_id` FOREIGN KEY (`professor_id`) REFERENCES `professores`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Horários recorrentes de aulas (segunda a segunda)';

CREATE TABLE IF NOT EXISTS `aulas` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `horario_aula_id` VARCHAR(36) NOT NULL COMMENT 'FK -> horarios_aulas',
  `professor_id` VARCHAR(36) NOT NULL COMMENT 'FK -> professores',
  `data_aula` DATE NOT NULL COMMENT 'Data da aula',
  `hora_inicio` VARCHAR(5) NOT NULL COMMENT 'Horário início (HH:MM)',
  `hora_fim` VARCHAR(5) NOT NULL COMMENT 'Horário fim (HH:MM)',
  `sala` VARCHAR(50) COMMENT 'Sala/Local',
  `capacidade` INT NOT NULL DEFAULT 15 COMMENT 'Capacidade máxima',
  `status` ENUM('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA') NOT NULL DEFAULT 'AGENDADA',
  `observacoes` TEXT COMMENT 'Observações',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_horario_aula_data` (`horario_aula_id`, `data_aula`),
  KEY `idx_professor_id` (`professor_id`),
  KEY `idx_data_aula` (`data_aula`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_aulas_horario_aula_id` FOREIGN KEY (`horario_aula_id`) REFERENCES `horarios_aulas`(`id`),
  CONSTRAINT `fk_aulas_professor_id` FOREIGN KEY (`professor_id`) REFERENCES `professores`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Ocorrências específicas de aulas (cada aula em cada data)';

CREATE TABLE IF NOT EXISTS `presencas` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `aluno_id` VARCHAR(36) NOT NULL COMMENT 'FK -> alunos',
  `aula_id` VARCHAR(36) NOT NULL COMMENT 'FK -> aulas',
  `status` ENUM('PRESENTE', 'AUSENTE', 'JUSTIFICADO') NOT NULL DEFAULT 'AUSENTE' COMMENT 'Status presença',
  `registrado_em` DATETIME COMMENT 'Momento do check-in',
  `observacoes` TEXT COMMENT 'Observações',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_aluno_aula` (`aluno_id`, `aula_id`),
  KEY `idx_aluno_id` (`aluno_id`),
  KEY `idx_aula_id` (`aula_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_presencas_aluno_id` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_presencas_aula_id` FOREIGN KEY (`aula_id`) REFERENCES `aulas`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de presença/ausência dos alunos em aulas';

-- ============================================================================
-- 💰 MÓDULO FINANCEIRO — Gestão Financeira
-- ============================================================================

CREATE TABLE IF NOT EXISTS `mensalidades` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `aluno_id` VARCHAR(36) NOT NULL COMMENT 'FK -> alunos',
  `mes` TINYINT NOT NULL COMMENT 'Mês (1-12)',
  `ano` INT NOT NULL COMMENT 'Ano',
  `valor` DECIMAL(10, 2) NOT NULL COMMENT 'Valor',
  `status` ENUM('PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE' COMMENT 'Status pagamento',
  `data_vencimento` DATE NOT NULL COMMENT 'Data vencimento',
  `data_pagamento` DATE COMMENT 'Data pagamento',
  `observacoes` TEXT COMMENT 'Observações',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY `uk_aluno_mes_ano` (`aluno_id`, `mes`, `ano`),
  KEY `idx_aluno_id` (`aluno_id`),
  KEY `idx_status` (`status`),
  KEY `idx_data_vencimento` (`data_vencimento`),
  KEY `idx_ano_mes` (`ano`, `mes`),
  CONSTRAINT `fk_mensalidades_aluno_id` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Mensalidades dos alunos (geradas automaticamente)';

CREATE TABLE IF NOT EXISTS `pagamentos` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `mensalidade_id` VARCHAR(36) NOT NULL COMMENT 'FK -> mensalidades',
  `valor` DECIMAL(10, 2) NOT NULL COMMENT 'Valor pago',
  `metodo_pagamento` ENUM('DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA_BANCARIA') NOT NULL COMMENT 'Método pagamento',
  `referencia` VARCHAR(255) COMMENT 'Referência (código transação, etc)',
  `pago_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora pagamento',
  `recebido_por_usuario_id` VARCHAR(36) NOT NULL COMMENT 'FK -> usuarios (quem recebeu)',
  `observacoes` TEXT COMMENT 'Observações',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY `idx_mensalidade_id` (`mensalidade_id`),
  KEY `idx_pago_em` (`pago_em`),
  KEY `idx_recebido_por_usuario_id` (`recebido_por_usuario_id`),
  CONSTRAINT `fk_pagamentos_mensalidade_id` FOREIGN KEY (`mensalidade_id`) REFERENCES `mensalidades`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pagamentos_recebido_por_usuario_id` FOREIGN KEY (`recebido_por_usuario_id`) REFERENCES `usuarios`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registro de cada transação de pagamento';

CREATE TABLE IF NOT EXISTS `caixa` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `data_abertura` DATE UNIQUE NOT NULL COMMENT 'Data abertura',
  `saldo_abertura` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Saldo abertura',
  `total_entrada` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Total entrada',
  `total_saida` DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT 'Total saída',
  `saldo_fechamento` DECIMAL(15, 2) COMMENT 'Saldo fechamento',
  `aberto_por_usuario_id` VARCHAR(36) NOT NULL COMMENT 'FK -> usuarios (quem abriu)',
  `fechado_por_usuario_id` VARCHAR(36) COMMENT 'FK -> usuarios (quem fechou)',
  `aberto_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora abertura',
  `fechado_em` DATETIME COMMENT 'Data/hora fechamento',
  `status` ENUM('ABERTO', 'FECHADO') NOT NULL DEFAULT 'ABERTO' COMMENT 'Status caixa',
  `observacoes` TEXT COMMENT 'Observações',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY `idx_data_abertura` (`data_abertura`),
  KEY `idx_status` (`status`),
  KEY `idx_aberto_por_usuario_id` (`aberto_por_usuario_id`),
  KEY `idx_fechado_por_usuario_id` (`fechado_por_usuario_id`),
  CONSTRAINT `fk_caixa_aberto_por_usuario_id` FOREIGN KEY (`aberto_por_usuario_id`) REFERENCES `usuarios`(`id`),
  CONSTRAINT `fk_caixa_fechado_por_usuario_id` FOREIGN KEY (`fechado_por_usuario_id`) REFERENCES `usuarios`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Caixa diário com rastreamento de movimentação';

-- ============================================================================
-- 🔔 MÓDULO NOTIFICAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS `notificacoes` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `usuario_destinatario_id` VARCHAR(36) NOT NULL COMMENT 'FK -> usuarios',
  `tipo` ENUM('AULA_CANCELADA', 'MENSALIDADE_VENCIDA', 'BOAS_VINDAS', 'SISTEMA') NOT NULL COMMENT 'Tipo notificação',
  `assunto` VARCHAR(255) NOT NULL COMMENT 'Assunto',
  `mensagem` TEXT NOT NULL COMMENT 'Mensagem',
  `lido_em` DATETIME COMMENT 'Data/hora leitura',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY `idx_usuario_destinatario_id` (`usuario_destinatario_id`),
  KEY `idx_criado_em` (`criado_em`),
  KEY `idx_lido_em` (`lido_em`),
  CONSTRAINT `fk_notificacoes_usuario_destinatario_id` FOREIGN KEY (`usuario_destinatario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Notificações para alunos/professores/admin';

-- ============================================================================
-- 📊 MÓDULO AUDITORIA — Logs e Auditoria
-- ============================================================================

CREATE TABLE IF NOT EXISTS `logs_auditoria` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'CUID',
  `usuario_id` VARCHAR(36) NOT NULL COMMENT 'FK -> usuarios',
  `tipo_entidade` VARCHAR(100) NOT NULL COMMENT 'Tipo entidade (ex: Aluno, Pagamento)',
  `id_entidade` VARCHAR(36) COMMENT 'ID da entidade afetada',
  `acao` ENUM('CRIAR', 'ATUALIZAR', 'DELETAR', 'LER') NOT NULL COMMENT 'Ação realizada',
  `valores_antigos` JSON COMMENT 'Valores antigos (para ATUALIZAR)',
  `valores_novos` JSON COMMENT 'Valores novos (para ATUALIZAR/CRIAR)',
  `endereco_ip` VARCHAR(45) COMMENT 'IP do usuário',
  `user_agent` VARCHAR(255) COMMENT 'User-Agent',
  `criado_em` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY `idx_usuario_id` (`usuario_id`),
  KEY `idx_entidade` (`tipo_entidade`, `id_entidade`),
  KEY `idx_criado_em` (`criado_em`),
  CONSTRAINT `fk_logs_auditoria_usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log de auditoria com rastreamento completo de operações';

-- ============================================================================
-- 🔧 VIEWS PARA CONSULTAS COMPLEXAS
-- ============================================================================

-- View: Alunos com status financeiro
CREATE OR REPLACE VIEW `v_alunos_status_financeiro` AS
SELECT
  a.id,
  u.nome_completo,
  u.email,
  u.telefone,
  pa.tipo_plano,
  pa.data_inicio as data_inicio_plano,
  pa.data_fim as data_fim_plano,
  pa.status as status_plano,
  (
    SELECT COUNT(*) FROM mensalidades m
    WHERE m.aluno_id = a.id
      AND m.status = 'PAGO'
      AND MONTH(m.criado_em) = MONTH(CURDATE())
      AND YEAR(m.criado_em) = YEAR(CURDATE())
  ) as pago_este_mes,
  (
    SELECT COALESCE(SUM(valor), 0) FROM mensalidades m
    WHERE m.aluno_id = a.id
      AND m.status IN ('PENDENTE', 'VENCIDO')
  ) as total_devido,
  (
    SELECT COUNT(*) FROM mensalidades m
    WHERE m.aluno_id = a.id
      AND m.status = 'VENCIDO'
  ) as quantidade_vencidas,
  a.ativo,
  a.criado_em as data_criacao_aluno
FROM alunos a
INNER JOIN usuarios u ON a.usuario_id = u.id
LEFT JOIN planos_alunos pa ON a.id = pa.aluno_id
  AND pa.status = 'ATIVO'
  AND pa.data_inicio <= CURDATE()
  AND (pa.data_fim IS NULL OR pa.data_fim >= CURDATE());

-- View: Aulas com inscrições
CREATE OR REPLACE VIEW `v_aulas_com_inscricoes` AS
SELECT
  au.id,
  au.data_aula,
  au.hora_inicio,
  au.hora_fim,
  ha.dia_semana,
  au.sala,
  au.capacidade,
  u.nome_completo as nome_professor,
  COUNT(p.id) as alunos_inscritos,
  SUM(CASE WHEN p.status = 'PRESENTE' THEN 1 ELSE 0 END) as quantidade_presentes,
  SUM(CASE WHEN p.status = 'AUSENTE' THEN 1 ELSE 0 END) as quantidade_ausentes,
  au.status
FROM aulas au
INNER JOIN horarios_aulas ha ON au.horario_aula_id = ha.id
INNER JOIN professores pr ON au.professor_id = pr.id
INNER JOIN usuarios u ON pr.usuario_id = u.id
LEFT JOIN presencas p ON au.id = p.aula_id
GROUP BY au.id, au.data_aula, au.hora_inicio, au.hora_fim, ha.dia_semana,
         au.sala, au.capacidade, u.nome_completo, au.status;

-- ============================================================================
-- ✅ REABILITAR FOREIGN KEY CHECKS
-- ============================================================================

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================================
-- 📊 DADOS INICIAIS PARA TESTE (OPCIONAL)
-- ============================================================================

-- Inserir usuário admin para teste
INSERT INTO `usuarios` (id, email, senha_hash, nome_completo, telefone, cpf, funcao, status)
VALUES (
  'user_admin_001',
  'admin@pilates.local',
  '$2a$10$NZXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'Administrador Sistema',
  '11999999999',
  '12345678901',
  'ADMIN',
  'ATIVO'
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir usuário recepcionista para teste
INSERT INTO `usuarios` (id, email, senha_hash, nome_completo, telefone, cpf, funcao, status)
VALUES (
  'user_recep_001',
  'recepcionista@pilates.local',
  '$2a$10$NZXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'Recepcionista Pilates',
  '11999999998',
  '12345678902',
  'RECEPCIONISTA',
  'ATIVO'
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir usuário professor para teste
INSERT INTO `usuarios` (id, email, senha_hash, nome_completo, telefone, cpf, funcao, status)
VALUES (
  'user_prof_001',
  'professor@pilates.local',
  '$2a$10$NZXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'Professor Pilates',
  '11999999997',
  '12345678903',
  'PROFESSOR',
  'ATIVO'
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir professor (relacionado)
INSERT INTO `professores` (id, usuario_id, especializacao, ativo)
VALUES (
  'prof_001',
  'user_prof_001',
  'Pilates Clássico',
  TRUE
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir usuário aluno para teste
INSERT INTO `usuarios` (id, email, senha_hash, nome_completo, telefone, cpf, funcao, status)
VALUES (
  'user_aluno_001',
  'aluno@pilates.local',
  '$2a$10$NZXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'Maria Silva (Aluno)',
  '11999999996',
  '12345678904',
  'RECEPCIONISTA',
  'ATIVO'
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir aluno (relacionado)
INSERT INTO `alunos` (id, usuario_id, genero, ativo)
VALUES (
  'aluno_001',
  'user_aluno_001',
  'F',
  TRUE
) ON DUPLICATE KEY UPDATE id=id;

-- Inserir plano de aluno
INSERT INTO `planos_alunos` (id, aluno_id, tipo_plano, data_inicio, data_fim, custo_mensal, aulas_por_semana, status)
VALUES (
  'plano_001',
  'aluno_001',
  'BASICO_4',
  CURDATE(),
  DATE_ADD(CURDATE(), INTERVAL 30 DAY),
  200.00,
  4,
  'ATIVO'
) ON DUPLICATE KEY UPDATE id=id;

-- ============================================================================
-- ✅ FIM DO SCRIPT DE INICIALIZAÇÃO
-- ============================================================================

-- Verificação final
SELECT 'Banco de dados inicializado com sucesso!' as status;
SELECT COUNT(*) as total_tabelas FROM information_schema.tables WHERE table_schema = 'pilates_db';
