import { api } from './api'

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
  criadoEm: string
  mensalidade?: {
    id: string
    valor: number
    mesReferencia: string
    plano: { nome: string } | null
  }
  aluno?: { id: string; usuario: { nomeCompleto: string } }
  aprovadoPor?: { nomeCompleto: string } | null
}

export const estornosService = {
  async solicitar(mensalidadeId: string, motivo?: string): Promise<Estorno> {
    const { data } = await api.post('/estornos', { mensalidadeId, motivo })
    return data.data
  },

  async listar(params?: { alunoId?: string; status?: string; page?: number; limit?: number }) {
    const { data } = await api.get('/estornos', { params })
    return data
  },

  async buscarPorId(id: string): Promise<Estorno> {
    const { data } = await api.get(`/estornos/${id}`)
    return data.data
  },

  async aprovar(id: string): Promise<Estorno> {
    const { data } = await api.patch(`/estornos/${id}/aprovar`)
    return data.data
  },

  async negar(id: string): Promise<Estorno> {
    const { data } = await api.patch(`/estornos/${id}/negar`)
    return data.data
  },

  async processar(id: string): Promise<Estorno> {
    const { data } = await api.patch(`/estornos/${id}/processar`)
    return data.data
  },

  async listarMeusEstornos(params?: { page?: number; limit?: number }): Promise<{ estornos: Estorno[]; total: number; page: number; limit: number; totalPages: number }> {
    const { data } = await api.get('/aluno/estornos', { params })
    return data
  },
}
