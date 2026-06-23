export type RiscoAluno = 'EM_RISCO' | 'ATENCAO' | 'OK'

/** Linha da lista de acompanhamento — métricas resumidas por aluno. */
export interface AlunoAcompanhamento {
  id: string
  nome: string
  email: string | null
  plano: string | null
  status: string
  ultimaPresenca: Date | null
  diasSemPresenca: number | null
  taxaPresenca: number // 0–100, na janela configurada
  faltasRecentes: number
  totalRegistrosPeriodo: number
  mensalidadeVencida: boolean
  mensalidadesPendentes: number
  proximoVencimento: Date | null
  risco: RiscoAluno
  motivosRisco: string[]
}

export interface ResumoAcompanhamento {
  total: number
  emRisco: number
  atencao: number
  ok: number
}

/** Visão 360º de um aluno. */
export interface DetalheAluno extends AlunoAcompanhamento {
  dataInicio: Date
  telefone: string | null
  presencas: Array<{
    id: string
    status: string
    dataRegistro: Date
    aula: { dataHoraInicio: Date; sala: string } | null
  }>
  mensalidades: Array<{ id: string; status: string; valor: unknown; dataVencimento: Date; plano: string | null }>
  proximasAulas: Array<{ id: string; dataHoraInicio: Date; sala: string; status: string }>
}
