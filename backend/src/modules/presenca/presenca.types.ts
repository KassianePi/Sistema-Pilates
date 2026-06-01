import type { StatusPresenca } from '@prisma/client'

export interface Presenca {
  id: string
  alunoId: string
  aulaId: string
  status: StatusPresenca
  dataRegistro: Date
  criadoEm: Date
  atualizadoEm: Date
  aluno?: { id: string; usuario: { nomeCompleto: string } }
  aula?: { id: string; dataHoraInicio: Date; sala: string }
}

export interface CreatePresencaData {
  alunoId: string
  aulaId: string
  status: StatusPresenca
  dataRegistro: Date
}

export interface UpdatePresencaData {
  status: StatusPresenca
}
