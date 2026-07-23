export type StatusReposicao = 'PENDENTE' | 'AGENDADA' | 'REALIZADA' | 'CANCELADA'

export interface Reposicao {
  id: string
  alunoId: string
  aulaOriginalId: string
  aulaReposicaoId: string | null
  motivo: string
  status: StatusReposicao
  dataSolicitacao: Date
  criadoEm: Date
  atualizadoEm: Date
  aluno?: { id: string; usuario: { nomeCompleto: string } } | null
  aulaOriginal?: { id: string; dataHoraInicio: Date; sala: string } | null
  aulaReposicao?: { id: string; dataHoraInicio: Date; sala: string; capacidade: number } | null
}

export interface CreateReposicaoData {
  alunoId: string
  aulaOriginalId: string
  motivo: string
}
