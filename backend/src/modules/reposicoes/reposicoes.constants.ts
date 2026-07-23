export const REPOSICOES_ERRORS = {
  NOT_FOUND: 'Reposição não encontrada',
  ALUNO_NOT_FOUND: 'Aluno não encontrado',
  AULA_ORIGINAL_NOT_FOUND: 'Aula original não encontrada',
  AULA_ORIGINAL_NAO_OCORREU: 'Só é possível solicitar reposição de uma aula que já ocorreu ou foi cancelada',
  ALUNO_NAO_MATRICULADO: 'Você não estava matriculado nesta aula',
  JA_EXISTE_SOLICITACAO: 'Já existe uma solicitação de reposição em aberto para esta aula',
  AULA_REPOSICAO_NOT_FOUND: 'Aula de reposição não encontrada',
  FORA_DO_MES: 'A reposição deve ser agendada dentro do mesmo mês da aula original',
  SEM_VAGA: 'A aula de reposição escolhida não tem vagas disponíveis',
  STATUS_INVALIDO_AGENDAR: 'Só é possível agendar reposições pendentes',
  STATUS_INVALIDO_CANCELAR: 'Não é possível cancelar uma reposição já realizada ou cancelada',
} as const

export const REPOSICOES_ERROR_CODES = {
  NOT_FOUND: 'REPOSICAO_NOT_FOUND',
} as const
