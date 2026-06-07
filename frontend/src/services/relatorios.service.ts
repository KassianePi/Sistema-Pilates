import { api } from './api'
import type { ApiResponse, Relatorio, TipoRelatorio } from '@/types/domain.types'

export interface GerarRelatorioDTO {
  professorId: string
  tipo: TipoRelatorio
  titulo: string
  descricao?: string
  dataPeriodoInicio: string
  dataPeriodoFim: string
}

export interface ListaRelatoriosResponse {
  relatorios: Relatorio[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const relatoriosService = {
  async listar(params?: { professorId?: string; tipo?: string; dataInicio?: string; dataFim?: string; page?: number; limit?: number }) {
    const { data } = await api.get<ApiResponse<ListaRelatoriosResponse>>('/relatorios', { params })
    return data.data
  },

  async buscarPorId(id: string) {
    const { data } = await api.get<ApiResponse<Relatorio>>(`/relatorios/${id}`)
    return data.data
  },

  async gerar(dto: GerarRelatorioDTO) {
    const { data } = await api.post<ApiResponse<Relatorio>>('/relatorios/gerar', dto)
    return data.data
  },
}
