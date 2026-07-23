import { AuditoriaRepository } from './auditoria.repository'
import { logInfo, parseDataLocal } from '../../shared/utils'
import { listAuditoriaSchema } from '../../shared/schemas'
import type { LogAuditoria, CreateLogAuditoriaData } from './auditoria.types'
import type { TipoAcao } from '@prisma/client'

// Filtros de exportação reaproveitam a validação de listAuditoriaSchema, mas sem
// o teto de paginação (max 100) — a exportação CSV precisa trazer todos os
// registros que casam com o filtro, não uma página.
const exportFiltersSchema = listAuditoriaSchema.omit({ page: true, limit: true })
const EXPORT_LIMIT = 10000

export class AuditoriaService {
  constructor(private repository: AuditoriaRepository) {}

  async registrar(data: CreateLogAuditoriaData): Promise<LogAuditoria> {
    const log = await this.repository.create(data)
    return log
  }

  async listar(params: {
    usuarioId?: string
    acao?: string
    entidade?: string
    dataInicio?: string
    dataFim?: string
    page?: number
    limit?: number
  }) {
    const validado = listAuditoriaSchema.parse(params)
    const { logs, total } = await this.repository.findAll({
      usuarioId: validado.usuarioId,
      acao: validado.acao,
      entidade: validado.entidade,
      dataInicio: validado.dataInicio ? parseDataLocal(validado.dataInicio) : undefined,
      dataFim: validado.dataFim ? parseDataLocal(validado.dataFim) : undefined,
      page: validado.page,
      limit: validado.limit,
    })
    return { logs, total, page: validado.page, limit: validado.limit, totalPages: Math.ceil(total / validado.limit) }
  }

  /** Usado pela exportação CSV — sem teto de paginação (até EXPORT_LIMIT registros). */
  async listarParaExportacao(params: {
    usuarioId?: string
    acao?: string
    entidade?: string
    dataInicio?: string
    dataFim?: string
  }) {
    const validado = exportFiltersSchema.parse(params)
    const { logs } = await this.repository.findAll({
      usuarioId: validado.usuarioId,
      acao: validado.acao,
      entidade: validado.entidade,
      dataInicio: validado.dataInicio ? parseDataLocal(validado.dataInicio) : undefined,
      dataFim: validado.dataFim ? parseDataLocal(validado.dataFim) : undefined,
      page: 1,
      limit: EXPORT_LIMIT,
    })
    return logs
  }
}

export const auditoriaService = new AuditoriaService(new AuditoriaRepository())

export async function registrarLog(data: {
  usuarioId: string
  acao: TipoAcao
  entidade: string
  entidadeId: string
  dadosAntigos?: object | null
  dadosNovos?: object | null
  enderecoIp?: string
  userAgent?: string
}): Promise<void> {
  try {
    await auditoriaService.registrar(data)
  } catch {
    /* não bloquear a operação principal */
  }
}
