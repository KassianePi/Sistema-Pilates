import { api } from './api'
import type { Plano, ApiResponse, PaginatedResponse } from '@/types/domain.types'

export interface CreatePlanoDTO {
  nome: string
  descricao?: string
  valor: number
  duracaoMeses: number
  aulasSemanais: number
}

export type UpdatePlanoDTO = Partial<CreatePlanoDTO>

type TipoPlano = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'

function duracaoToTipo(meses: number): TipoPlano {
  if (meses <= 1) return 'MENSAL'
  if (meses <= 3) return 'TRIMESTRAL'
  if (meses <= 6) return 'SEMESTRAL'
  return 'ANUAL'
}

function tipoToDuracao(tipo: TipoPlano): number {
  const map: Record<TipoPlano, number> = { MENSAL: 1, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12 }
  return map[tipo] ?? 1
}

type BackendPlano = { id: string; nome: string; descricao?: string | null; preco: number; aulas: number; tipo: TipoPlano; ativo: boolean; createdAt: string; updatedAt: string }
type BackendListResponse = { planos: BackendPlano[]; total: number; page: number; limit: number; totalPages: number }

function mapPlano(raw: BackendPlano): Plano {
  return {
    id: raw.id,
    nome: raw.nome,
    descricao: raw.descricao ?? undefined,
    valor: Number(raw.preco),
    aulasSemanais: raw.aulas,
    duracaoMeses: tipoToDuracao(raw.tipo),
    ativo: raw.ativo,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export const planosService = {
  async listar(params?: { pagina?: number; limite?: number; busca?: string }): Promise<PaginatedResponse<Plano>> {
    const { data } = await api.get<ApiResponse<BackendListResponse>>('/planos', {
      params: { page: params?.pagina, limit: params?.limite },
    })
    const r = data.data
    return { data: r.planos.map(mapPlano), total: r.total, pagina: r.page, limite: r.limit, totalPaginas: r.totalPages }
  },

  async buscarPorId(id: string) {
    const { data } = await api.get<ApiResponse<BackendPlano>>(`/planos/${id}`)
    return mapPlano(data.data)
  },

  async criar(dto: CreatePlanoDTO) {
    const { data } = await api.post<ApiResponse<BackendPlano>>('/planos', {
      nome: dto.nome,
      descricao: dto.descricao,
      preco: dto.valor,
      aulas: dto.aulasSemanais,
      tipo: duracaoToTipo(dto.duracaoMeses),
    })
    return mapPlano(data.data)
  },

  async atualizar(id: string, dto: UpdatePlanoDTO) {
    const payload: Record<string, unknown> = {}
    if (dto.nome !== undefined) payload.nome = dto.nome
    if (dto.descricao !== undefined) payload.descricao = dto.descricao
    if (dto.valor !== undefined) payload.preco = dto.valor
    if (dto.aulasSemanais !== undefined) payload.aulas = dto.aulasSemanais
    if (dto.duracaoMeses !== undefined) payload.tipo = duracaoToTipo(dto.duracaoMeses)
    const { data } = await api.put<ApiResponse<BackendPlano>>(`/planos/${id}`, payload)
    return mapPlano(data.data)
  },

  async excluir(id: string) {
    await api.delete(`/planos/${id}`)
  },
}
