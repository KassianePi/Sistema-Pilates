export type StatusEstorno = 'SOLICITADO' | 'APROVADO' | 'PROCESSADO' | 'NEGADO'

export interface Estorno {
  id: string
  mensalidadeId: string
  alunoId: string
  diasContratados: number
  diasComparecidos: number
  diasEstornados: number
  valorEstorno: number
  motivo: string | null
  status: StatusEstorno
  aprovadoPorId: string | null
  criadoEm: Date
  atualizadoEm: Date
  mensalidade?: {
    id: string
    valor: number
    mesReferencia: Date
    plano: { nome: string } | null
  }
  aluno?: {
    id: string
    usuario: { nomeCompleto: string }
  }
  aprovadoPor?: {
    nomeCompleto: string
  } | null
}

export interface CreateEstornoData {
  mensalidadeId: string
  alunoId: string
  diasContratados: number
  diasComparecidos: number
  diasEstornados: number
  valorEstorno: number
  motivo?: string | null
}
