export const ALUNOS_ERRORS = {
  NOT_FOUND: 'Aluno não encontrado',
  EMAIL_DUPLICADO: 'Já existe um usuário com este email',
  CPF_DUPLICADO: 'Já existe um usuário com este CPF',
  PLANO_NOT_FOUND: 'Plano não encontrado',
} as const

export const ALUNOS_ERROR_CODES = {
  NOT_FOUND: 'ALUNO_NOT_FOUND',
  EMAIL_DUPLICADO: 'ALUNO_EMAIL_DUPLICADO',
  CPF_DUPLICADO: 'ALUNO_CPF_DUPLICADO',
  PLANO_NOT_FOUND: 'PLANO_NOT_FOUND',
} as const

/**
 * Domínio usado para gerar um e-mail sintético quando o aluno não tem
 * e-mail real (login do aluno é por CPF, não por e-mail — ver auth.service.ts
 * `loginPorCpf`). Mantido em sincronia com `EMAIL_SINTETICO_SUFFIX` em
 * `frontend/src/lib/formatters.ts` (usado para ocultar o valor na UI).
 */
export const EMAIL_SINTETICO_DOMINIO = 'sememail.pilates.local'

export function emailSintetico(cpf: string): string {
  return `${cpf}@${EMAIL_SINTETICO_DOMINIO}`
}
