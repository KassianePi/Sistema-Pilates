import { api } from './api'
import type { ApiResponse } from '@/types/domain.types'
import type { ExecucaoEmAndamento, ResumoExecucaoMensalidades } from '@/features/admin/perfil/types/geracaoAutomatica.types'

export const mensalidadesAutomaticasService = {
  /** Dispara a geração automática de mensalidades manualmente (mesma lógica do job agendado). */
  async executarAgora(dryRun = false): Promise<ResumoExecucaoMensalidades> {
    const { data } = await api.post<ApiResponse<ResumoExecucaoMensalidades>>(
      `/mensalidades/gerar-automatico?dryRun=${dryRun}`,
    )
    return data.data
  },

  /** Status da execução em andamento (para polling de progresso), ou null se nenhuma estiver rodando. */
  async buscarStatusExecucao(): Promise<ExecucaoEmAndamento | null> {
    const { data } = await api.get<ApiResponse<ExecucaoEmAndamento | null>>('/mensalidades/gerar-automatico/status')
    return data.data
  },
}
