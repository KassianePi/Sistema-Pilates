export const AGENDA_ERRORS = {
  NOT_FOUND: 'Aula não encontrada',
  PROFESSOR_NOT_FOUND: 'Professor não encontrado',
  CONFLITO_HORARIO: 'Professor já possui aula neste horário',
  CAPACIDADE_EXCEDIDA: 'Capacidade máxima da aula atingida',
  AULA_ENCERRADA: 'Não é possível alterar uma aula já realizada ou cancelada',
  DATA_PASSADA: 'Não é possível agendar aula no passado',
} as const

export const AGENDA_ERROR_CODES = {
  NOT_FOUND: 'AULA_NOT_FOUND',
  CONFLITO_HORARIO: 'CONFLITO_HORARIO',
  CAPACIDADE_EXCEDIDA: 'CAPACIDADE_EXCEDIDA',
  AULA_ENCERRADA: 'AULA_ENCERRADA',
} as const
