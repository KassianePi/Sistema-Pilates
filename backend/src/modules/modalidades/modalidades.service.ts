import { z } from 'zod'
import { ModalidadesRepository } from './modalidades.repository'
import { AppError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { notificacoesService } from '../notificacoes/notificacoes.service'
import type { Modalidade } from './modalidades.types'

const criarSchema = z.object({
  nome: z.string().min(1).max(100),
  descricao: z.string().max(255).optional().nullable(),
  valor: z.number().positive().max(99999.99).optional().nullable(),
})

const atualizarSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().max(255).optional().nullable(),
  valor: z.number().positive().max(99999.99).optional().nullable(),
  ativo: z.boolean().optional(),
})

export class ModalidadesService {
  constructor(private repository: ModalidadesRepository) {}

  async listar(apenasAtivos = false): Promise<Modalidade[]> {
    return this.repository.findAll(apenasAtivos)
  }

  async buscarPorId(id: string): Promise<Modalidade> {
    const m = await this.repository.findById(id)
    if (!m) throw AppError.notFound('Modalidade', id)
    return m
  }

  async criar(data: { nome: string; descricao?: string | null; valor?: number | null }): Promise<Modalidade> {
    const validado = criarSchema.parse(data)
    const existente = await this.repository.findByNome(validado.nome)
    if (existente) throw AppError.conflict(`Modalidade "${validado.nome}" já existe`)
    const m = await this.repository.create(validado)
    logInfo('Modalidade criada', { id: m.id, nome: m.nome })
    await notificacoesService
      .notificarAdmins('Nova modalidade criada', `A modalidade "${m.nome}" foi criada no sistema.`)
      .catch(() => {
        /* silencioso */
      })
    return m
  }

  async atualizar(
    id: string,
    data: { nome?: string; descricao?: string | null; valor?: number | null; ativo?: boolean },
  ): Promise<Modalidade> {
    await this.buscarPorId(id)
    const validado = atualizarSchema.parse(data)
    if (validado.nome) {
      const existente = await this.repository.findByNome(validado.nome)
      if (existente && existente.id !== id) throw AppError.conflict(`Modalidade "${validado.nome}" já existe`)
    }
    const m = await this.repository.update(id, validado)
    logInfo('Modalidade atualizada', { id })
    if (validado.ativo === false) {
      await notificacoesService
        .notificarAdmins('Modalidade inativada', `A modalidade "${m.nome}" foi marcada como inativa.`)
        .catch(() => {
          /* silencioso */
        })
    } else if (validado.ativo === true) {
      await notificacoesService
        .notificarAdmins('Modalidade reativada', `A modalidade "${m.nome}" foi reativada.`)
        .catch(() => {
          /* silencioso */
        })
    }
    return m
  }

  async excluir(id: string): Promise<void> {
    const m = await this.buscarPorId(id)
    const qtdAulas = await this.repository.countAulas(id)
    if (qtdAulas > 0) throw AppError.badRequest(`Não é possível excluir: ${qtdAulas} aula(s) usam esta modalidade`)
    await this.repository.delete(id)
    logInfo('Modalidade excluída', { id })
    await notificacoesService
      .notificarAdmins('Modalidade excluída', `A modalidade "${m.nome}" foi removida do sistema.`)
      .catch(() => {
        /* silencioso */
      })
  }
}

export const modalidadesService = new ModalidadesService(new ModalidadesRepository())

// Seed das modalidades padrão — chamado no startup
export async function seedModalidades(): Promise<void> {
  const service = modalidadesService
  const lista = await service.listar()
  if (lista.length > 0) return

  const padroes = [
    { nome: 'Mat', descricao: 'Pilates no solo com colchonete' },
    { nome: 'Aparelhos', descricao: 'Pilates com equipamentos de mola' },
    { nome: 'Reformer', descricao: 'Pilates na máquina Reformer' },
    { nome: 'Cadillac', descricao: 'Pilates na mesa Cadillac' },
    { nome: 'Fisioterapia', descricao: 'Atendimento fisioterapêutico individualizado' },
  ]
  for (const p of padroes) {
    await service.criar(p).catch(() => {
      /* já existe */
    })
  }
  logInfo('Modalidades padrão criadas')
}
