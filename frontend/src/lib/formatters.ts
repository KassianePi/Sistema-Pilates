/** Remove tudo que não for dígito */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Formata CPF: 000.000.000-00 (recebe raw ou já formatado) */
export function formatCPF(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** Formata telefone: (00) 0000-0000 ou (00) 00000-0000 */
export function formatTelefone(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  // 11 dígitos = celular com 9
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Formata CEP: 00000-000 */
export function formatCEP(value: string): string {
  const d = onlyDigits(value).slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

/**
 * Detecta e-mail sintético gerado automaticamente para aluno sem e-mail real
 * (login do aluno é por CPF — ver `AlunoLoginPage.tsx`). Mantido em
 * sincronia com `EMAIL_SINTETICO_DOMINIO` em
 * `backend/src/modules/alunos/alunos.constants.ts`.
 */
const EMAIL_SINTETICO_SUFFIX = '@sememail.pilates.local'
export function isEmailSintetico(email?: string | null): boolean {
  return !!email && email.toLowerCase().endsWith(EMAIL_SINTETICO_SUFFIX)
}
