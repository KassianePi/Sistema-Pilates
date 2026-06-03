import { api } from './api'
import type { Aula, ApiResponse, PaginatedResponse, TipoAula, ModalidadeAula } from '@/types/domain.types'

export interface CreateAulaDTO {
  titulo: string
  professorId: string
  data: string
  horaInicio: string
  horaFim: string
  vagas: number
  tipo: TipoAula
  modalidade: ModalidadeAula
  observacoes?: string
}

export type UpdateAulaDTO = Partial<Omit<CreateAulaDTO, 'professorId'>>

export const agendaService = {
  async listar(params?: { pagina?: number; limite?: number; data?: string; professorId?: string; status?: string }) {
    const { data } = await api.get<ApiResponse<PaginatedResponse<Aula>>>('/aulas', { params })
    return data.data
  },

  async buscarPorId(id: string) {
    const { data } = await api.get<ApiResponse<Aula>>(`/aulas/${id}`)
    return data.data
  },

  async criar(dto: CreateAulaDTO) {
    const { data } = await api.post<ApiResponse<Aula>>('/aulas', dto)
    return data.data
  },

  async atualizar(id: string, dto: UpdateAulaDTO) {
    const { data } = await api.put<ApiResponse<Aula>>(`/aulas/${id}`, dto)
    return data.data
  },

  async cancelar(id: string, motivo?: string) {
    const { data } = await api.patch<ApiResponse<Aula>>(`/aulas/${id}/cancelar`, { motivo })
    return data.data
  },
}
