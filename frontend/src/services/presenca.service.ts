import { api } from './api'
import type { ApiResponse, Presenca, StatusPresenca } from '@/types/domain.types'

export interface BatchPresencaDTO {
  aulaId: string
  presencas: Array<{ alunoId: string; status: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO' }>
}

// Presença normalizada para o portal do aluno: o backend retorna a aula como
// { id, dataHoraInicio, sala }; aqui derivamos data/horaInicio/titulo para a UI.
export interface PresencaAluno {
  id: string
  status: StatusPresenca
  dataRegistro: string
  aula: {
    id: string
    sala: string
    dataHoraInicio: string
    data: string        // YYYY-MM-DD (local)
    horaInicio: string  // HH:mm (local)
    titulo: string
  }
}

interface PresencaRaw {
  id: string
  status: StatusPresenca
  dataRegistro: string
  aula?: { id?: string; dataHoraInicio?: string; sala?: string } | null
}

const pad = (n: number) => String(n).padStart(2, '0')

function mapPresencaAluno(raw: PresencaRaw): PresencaAluno {
  const iso = raw?.aula?.dataHoraInicio
  const dt = iso ? new Date(iso) : null
  const valido = dt && !isNaN(dt.getTime())
  const data = valido ? `${dt!.getFullYear()}-${pad(dt!.getMonth() + 1)}-${pad(dt!.getDate())}` : ''
  const horaInicio = valido ? `${pad(dt!.getHours())}:${pad(dt!.getMinutes())}` : ''
  const sala = raw?.aula?.sala ?? ''
  return {
    id: raw.id,
    status: raw.status,
    dataRegistro: raw.dataRegistro,
    aula: { id: raw?.aula?.id ?? '', sala, dataHoraInicio: iso ?? '', data, horaInicio, titulo: sala ? `Aula — ${sala}` : 'Aula' },
  }
}

export const presencaService = {
  async listarMinhas(params?: { status?: string; limit?: number }): Promise<PresencaAluno[]> {
    const { data } = await api.get<ApiResponse<{ presencas: PresencaRaw[] }>>('/aluno/presencas', {
      params: { status: params?.status, limit: params?.limit ?? 100 },
    })
    return (data.data.presencas ?? []).map(mapPresencaAluno)
  },

  async registrarBatch(dto: BatchPresencaDTO): Promise<{ registros: number; aulaStatus: string }> {
    const { data } = await api.post<ApiResponse<{ registros: number; aulaStatus: string }>>('/presencas/batch', dto)
    return data.data
  },

  async listar(params?: { aulaId?: string; alunoId?: string; status?: string; page?: number; limit?: number }) {
    const { data } = await api.get<ApiResponse<{ presencas: Presenca[]; total: number; page: number; limit: number; totalPages: number }>>('/presencas', { params })
    return data.data
  },
}
