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

  async exportarExcel(id: string, nomeArquivo?: string): Promise<void> {
    const { data } = await api.get(`/relatorios/${id}/exportar`, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivo ?? `relatorio_${id.slice(0, 8)}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  async exportarDireto(dto: GerarRelatorioDTO, nomeArquivo?: string): Promise<void> {
    const { data } = await api.post('/relatorios/exportar-direto', dto, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivo ?? `relatorio_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}
