-- CreateTable
CREATE TABLE `termos_uso` (
    `id` VARCHAR(36) NOT NULL,
    `versao` INTEGER NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `conteudo` LONGTEXT NOT NULL,
    `publicado` BOOLEAN NOT NULL DEFAULT false,
    `publicado_em` DATETIME(3) NULL,
    `criado_por_id` VARCHAR(36) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `termos_uso_versao_key`(`versao`),
    INDEX `termos_uso_publicado_idx`(`publicado`),
    INDEX `termos_uso_versao_idx`(`versao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `termos_aceites` (
    `id` VARCHAR(36) NOT NULL,
    `termo_id` VARCHAR(36) NOT NULL,
    `aluno_id` VARCHAR(36) NOT NULL,
    `versao` INTEGER NOT NULL,
    `aceito_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endereco_ip` VARCHAR(45) NULL,
    `user_agent` LONGTEXT NULL,

    INDEX `termos_aceites_termo_id_idx`(`termo_id`),
    INDEX `termos_aceites_aluno_id_idx`(`aluno_id`),
    UNIQUE INDEX `termos_aceites_termo_id_aluno_id_key`(`termo_id`, `aluno_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `termos_uso` ADD CONSTRAINT `termos_uso_criado_por_id_fkey` FOREIGN KEY (`criado_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `termos_aceites` ADD CONSTRAINT `termos_aceites_termo_id_fkey` FOREIGN KEY (`termo_id`) REFERENCES `termos_uso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `termos_aceites` ADD CONSTRAINT `termos_aceites_aluno_id_fkey` FOREIGN KEY (`aluno_id`) REFERENCES `alunos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: versao 1 publicada (Termos de Uso e Prestacao de Servicos da Clinica Performance e Saude)
INSERT INTO `termos_uso` (`id`, `versao`, `titulo`, `conteudo`, `publicado`, `publicado_em`, `criado_em`, `atualizado_em`)
VALUES (
    UUID(),
    1,
    'Termos de Uso e Prestação de Serviços',
    '## 1. Identificação das Partes

Este documento estabelece os Termos de Uso e as condições de Prestação de Serviços entre a **Clínica Performance e Saúde**, doravante denominada CONTRATADA, de propriedade de **Kassiane de Araujo Rodrigues**, e o(a) aluno(a), doravante denominado(a) CONTRATANTE.

## 2. Objeto

O presente termo tem por objeto a prestação de serviços de fisioterapia e pilates, incluindo avaliação, acompanhamento e a realização de aulas e atendimentos, conforme o plano contratado pelo CONTRATANTE.

## 3. Serviços Prestados

- Aulas de pilates individuais, em dupla ou em grupo, conforme o plano.
- Acompanhamento da evolução e da frequência do aluno.
- Atendimento de fisioterapia, quando aplicável.
- Agendamento, reposição e gestão das aulas pelos canais oficiais da clínica.

## 4. Matrícula e Pagamentos

A matrícula é efetivada mediante cadastro e confirmação do pagamento referente ao plano escolhido. Os valores, a periodicidade e a forma de pagamento seguem o plano contratado e as condições informadas no ato da matrícula. O não pagamento nas datas acordadas poderá resultar na suspensão do acesso às aulas.

## 5. Política de Reembolso

O CONTRATANTE poderá solicitar reembolso em até **7 (sete) dias úteis após a realização da matrícula**. Solicitações realizadas após esse período não serão elegíveis para reembolso. O prazo é contado a partir da data de confirmação da matrícula. O pedido deverá ser realizado pelos canais oficiais da Clínica Performance e Saúde.

## 6. Deveres do Aluno

- Fornecer informações verdadeiras e mantê-las atualizadas.
- Comparecer às aulas nos horários agendados e respeitar as regras da clínica.
- Informar condições de saúde relevantes para a prática das atividades.
- Zelar pelos equipamentos e pelo espaço da clínica.

## 7. Deveres da Clínica

- Prestar os serviços com qualidade, segurança e profissionalismo.
- Manter profissionais habilitados para o atendimento.
- Comunicar previamente alterações de horário, cancelamentos ou suspensões.
- Proteger os dados pessoais do aluno conforme a legislação vigente.

## 8. Cancelamento e Suspensão

A clínica poderá cancelar, suspender ou reagendar aulas por motivos operacionais, de força maior ou de segurança, comunicando o aluno e oferecendo reposição quando cabível.

## 9. Privacidade e Proteção de Dados

Os dados pessoais coletados são utilizados exclusivamente para a prestação dos serviços e a gestão da relação com o aluno, em conformidade com a Lei Geral de Proteção de Dados (LGPD). O aluno pode solicitar informações sobre seus dados pelos canais oficiais.

## 10. Disposições Gerais

O aceite deste termo é registrado eletronicamente, com data, hora e versão. A clínica poderá atualizar este documento, publicando novas versões que serão apresentadas ao aluno para novo aceite. Fica eleito o foro da comarca da sede da clínica para dirimir eventuais controvérsias.',
    true,
    NOW(3),
    NOW(3),
    NOW(3)
);
