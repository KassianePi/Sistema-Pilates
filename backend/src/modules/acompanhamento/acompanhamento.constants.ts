/**
 * Parâmetros de classificação de risco de evasão do aluno.
 * Ajuste estes limites conforme a realidade do studio.
 */
export const ACOMPANHAMENTO = {
  /** Janela (em dias) usada para calcular taxa de presença e faltas recentes. */
  JANELA_DIAS: 30,
  /** Sem comparecer há mais que isto (dias) → risco de evasão. */
  DIAS_SEM_PRESENCA_RISCO: 14,
  /** Taxa de presença (%) abaixo disso, no período, → atenção. */
  TAXA_PRESENCA_ATENCAO: 50,
  /** Mínimo de registros no período para a taxa ser considerada relevante. */
  MIN_REGISTROS_TAXA: 2,
  /** Mensalidade pendente vencendo em até X dias → atenção. */
  DIAS_VENCIMENTO_PROXIMO: 3,
} as const

export const ACOMPANHAMENTO_ERRORS = {
  ALUNO_NOT_FOUND: 'Aluno não encontrado',
} as const
