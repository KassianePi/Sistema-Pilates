export interface EvolucaoAula {
  id: string
  alunoId: string
  aulaId: string
  registradoPorId: string
  observacao: string
  criadoEm: Date
  atualizadoEm: Date
  aula?: { id: string; dataHoraInicio: Date; sala: string } | null
  registradoPor?: { id: string; nomeCompleto: string } | null
}

export interface CreateEvolucaoData {
  alunoId: string
  aulaId: string
  registradoPorId: string
  observacao: string
}

export interface UpdateEvolucaoData {
  observacao: string
}
