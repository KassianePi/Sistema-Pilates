import { api } from './api'
import type { Aula, ApiResponse, PaginatedResponse, TipoAula, ModalidadeAula, StatusAula } from '@/types/domain.types'

export interface CreateAulaDTO {
  professorId: string
  dataHoraInicio: string
  duracao: number
  capacidade: number
  sala: string
  tipo: TipoAula
  modalidade: ModalidadeAula
  observacoes?: string
}

export type UpdateAulaDTO = Partial<Omit<CreateAulaDTO, 'professorId'>>

type BackendAula = {
  id: string
  professorId: string
  dataHoraInicio: string
  duracao: number
  capacidade: number
  sala: string
  status: string
  tipo: string
  modalidade: string
  observacoes?: string | null
  createdAt: string
  updatedAt: string
  professor: { id: string; usuario: { nomeCompleto: string; email?: string } }
  _count?: { presencas: number }
}

type BackendListResponse = { aulas: BackendAula[]; total: number; page: number; limit: number; totalPages: number }

function mapAula(raw: BackendAula): Aula {
  const dt = new Date(raw.dataHoraInicio)
  const data = dt.toISOString().split('T')[0]
  const horaInicio = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
  const dtFim = new Date(dt.getTime() + raw.duracao * 60 * 1000)
  const horaFim = `${String(dtFim.getHours()).padStart(2, '0')}:${String(dtFim.getMinutes()).padStart(2, '0')}`
  return {
    id: raw.id,
    titulo: `${raw.modalidade} ${raw.tipo} — ${raw.sala}`,
    professorId: raw.professorId,
    data,
    horaInicio,
    horaFim,
    vagas: raw.capacidade,
    vagasOcupadas: raw._count?.presencas ?? 0,
    tipo: raw.tipo as TipoAula,
    modalidade: raw.modalidade as ModalidadeAula,
    status: raw.status as StatusAula,
    observacoes: raw.observacoes ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    professor: { id: raw.professor.id, usuario: { nomeCompleto: raw.professor.usuario.nomeCompleto } },
    sala: raw.sala,
    duracao: raw.duracao,
  }
}

export const agendaService = {
  async listar(params?: { pagina?: number; limite?: number; data?: string; professorId?: string; status?: string }): Promise<PaginatedResponse<Aula>> {
    const { data } = await api.get<ApiResponse<BackendListResponse>>('/aulas', {
      params: {
        status: params?.status,
        professorId: params?.professorId,
        dataInicio: params?.data ? `${params.data}T00:00:00` : undefined,
        dataFim: params?.data ? `${params.data}T23:59:59` : undefined,
        page: params?.pagina,
        limit: params?.limite,
      },
    })
    const r = data.data
    return { data: r.aulas.map(mapAula), total: r.total, pagina: r.page, limite: r.limit, totalPaginas: r.totalPages }
  },

  async buscarPorId(id: string) {
    const { data } = await api.get<ApiResponse<BackendAula>>(`/aulas/${id}`)
    return mapAula(data.data)
  },

  async criar(dto: CreateAulaDTO) {
    const { data } = await api.post<ApiResponse<BackendAula>>('/aulas', dto)
    return mapAula(data.data)
  },

  async atualizar(id: string, dto: UpdateAulaDTO) {
    const { data } = await api.put<ApiResponse<BackendAula>>(`/aulas/${id}`, dto)
    return mapAula(data.data)
  },

  async cancelar(id: string, motivo?: string) {
    const { data } = await api.patch<ApiResponse<BackendAula>>(`/aulas/${id}/cancelar`, { motivo })
    return mapAula(data.data)
  },

  // Endpoint exclusivo para o portal do aluno — retorna agenda de aulas AGENDADAS
  async listarAulasAluno(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Aula>> {
    const { data } = await api.get<ApiResponse<BackendListResponse>>('/aluno/aulas', {
      params: { page: params?.page, limit: params?.limit },
    })
    const r = data.data
    return { data: r.aulas.map(mapAula), total: r.total, pagina: r.page, limite: r.limit, totalPaginas: r.totalPages }
  },
}
