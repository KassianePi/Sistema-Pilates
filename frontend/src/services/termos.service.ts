import { api } from './api'

export interface TermoUso {
  id: string
  versao: number
  titulo: string
  conteudo: string
  publicado: boolean
  publicadoEm: string | null
  criadoEm: string
  atualizadoEm: string
}

export interface StatusTermo {
  requerAceite: boolean
  aceito: boolean
  versaoAtual: number | null
  versaoAceita: number | null
  aceitoEm: string | null
  termo: TermoUso | null
}

export interface MeuAceite {
  id: string
  versao: number
  aceitoEm: string
  termo: { titulo: string; versao: number }
}

export interface AceiteAdmin {
  id: string
  versao: number
  aceitoEm: string
  enderecoIp: string | null
  aluno: { id: string; usuario: { nomeCompleto: string; email: string } }
}

export const termosService = {
  // ----- Portal do aluno -----
  async status(): Promise<StatusTermo> {
    const { data } = await api.get('/aluno/termos/status')
    return data.data
  },
  async aceitar(): Promise<void> {
    await api.post('/aluno/termos/aceite')
  },
  async meusAceites(): Promise<MeuAceite[]> {
    const { data } = await api.get('/aluno/termos/meus-aceites')
    return data.data ?? []
  },

  // ----- Administração (ADMIN) -----
  async listar(): Promise<TermoUso[]> {
    const { data } = await api.get('/termos')
    return data.data ?? []
  },
  async buscar(id: string): Promise<TermoUso> {
    const { data } = await api.get(`/termos/${id}`)
    return data.data
  },
  async criar(payload: { titulo: string; conteudo: string }): Promise<TermoUso> {
    const { data } = await api.post('/termos', payload)
    return data.data
  },
  async editar(id: string, payload: { titulo?: string; conteudo?: string }): Promise<TermoUso> {
    const { data } = await api.put(`/termos/${id}`, payload)
    return data.data
  },
  async publicar(id: string): Promise<TermoUso> {
    const { data } = await api.post(`/termos/${id}/publicar`)
    return data.data
  },
  async aceites(id: string): Promise<AceiteAdmin[]> {
    const { data } = await api.get(`/termos/${id}/aceites`)
    return data.data ?? []
  },
}
