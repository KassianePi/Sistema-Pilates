// Quantos meses separam uma competência da próxima, por tipo de plano.
export const MESES_POR_TIPO_PLANO: Record<string, number> = {
  MENSAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
}

// Chave do lock de execução única (JobLock.chave) — um só valor, sempre a
// mesma geração, nunca duas em paralelo (cron + manual, ou duas réplicas).
export const LOCK_CHAVE = 'geracao_mensalidades'

// TTL generoso (30 min): muito acima do tempo esperado de uma execução real,
// só serve para autorrecuperar de um crash sem deixar o lock preso pra sempre.
export const LOCK_TTL_MS = 30 * 60 * 1000

// Tamanho do lote de alunos processado por vez (paginação por cursor).
export const TAMANHO_LOTE = 200

export const MENSALIDADES_AUTOMATICAS_ERRORS = {
  ALUNO_NOT_FOUND: 'Aluno não encontrado',
} as const
