import { AuditoriaRepository } from './auditoria.repository'
import { logInfo } from '../../shared/utils'
import { listAuditoriaSchema } from '../../shared/schemas'
import type { LogAuditoria, CreateLogAuditoriaData } from './auditoria.types'
import type { TipoAcao } from '@prisma/client'

export class AuditoriaService {
  constructor(private repository: AuditoriaRepository) {}

  async registrar(data: CreateLogAuditoriaData): Promise<LogAuditoria> {
    const log = await this.repository.create(data)
    return log
  }

  async listar(params: { usuarioId?: string; acao?: string; entidade?: string; dataInicio?: string; dataFim?: string; page?: number; limit?: number }) {
    const validado = listAuditoriaSchema.parse(params)
    const { logs, total } = await this.repository.findAll({
      usuarioId: validado.usuarioId,
      acao: validado.acao,
      entidade: validado.entidade,
      dataInicio: validado.dataInicio ? new Date(validado.dataInicio) : undefined,
      dataFim: validado.dataFim ? new Date(validado.dataFim) : undefined,
      page: validado.page,
      limit: validado.limit,
    })
    return { logs, total, page: validado.page, limit: validado.limit, totalPages: Math.ceil(total / validado.limit) }
  }
}

export const auditoriaService = new AuditoriaService(new AuditoriaRepository())

export async function registrarLog(data: {
  usuarioId: string; acao: TipoAcao; entidade: string; entidadeId: string
  dadosAntigos?: object | null; dadosNovos?: object | null; enderecoIp?: string; userAgent?: string
}): Promise<void> {
  try {
    await auditoriaService.registrar(data)
  } catch { /* não bloquear a operação principal */ }
}
