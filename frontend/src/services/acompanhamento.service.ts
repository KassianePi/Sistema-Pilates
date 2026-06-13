import { api } from './api'
import type { ApiResponse } from '@/types/domain.types'

export type RiscoAluno = 'EM_RISCO' | 'ATENCAO' | 'OK'

export interface AlunoAcompanhamento {
  id: string
  nome: string
  email: string | null
  plano: string | null
  status: string
  ultimaPresenca: string | null
  diasSemPresenca: number | null
  taxaPresenca: number
  faltasRecentes: number
  totalRegistrosPeriodo: number
  mensalidadeVencida: boolean
  mensalidadesPendentes: number
  proximoVencimento: string | null
  risco: RiscoAluno
  motivosRisco: string[]
}

export interface ResumoAcompanhamento {
  total: number
  emRisco: number
  atencao: number
  ok: number
}

export interface DetalheAluno extends AlunoAcompanhamento {
  dataInicio: string
  telefone: string | null
  presencas: Array<{ id: string; status: string; dataRegistro: string; aula: { dataHoraInicio: string; sala: string } | null }>
  mensalidades: Array<{ id: string; status: string; valor: string | number; dataVencimento: string; plano: string | null }>
  proximasAulas: Array<{ id: string; dataHoraInicio: string; sala: string; status: string }>
}

export const acompanhamentoService = {
  async listar(params?: { risco?: RiscoAluno; busca?: string }): Promise<{ alunos: AlunoAcompanhamento[]; resumo: ResumoAcompanhamento }> {
    const { data } = await api.get<ApiResponse<{ alunos: AlunoAcompanhamento[]; resumo: ResumoAcompanhamento }>>('/acompanhamento/alunos', {
      params: { risco: params?.risco, busca: params?.busca || undefined },
    })
    return data.data
  },

  async detalhe(id: string): Promise<DetalheAluno> {
    const { data } = await api.get<ApiResponse<DetalheAluno>>(`/acompanhamento/alunos/${id}`)
    return data.data
  },
}
