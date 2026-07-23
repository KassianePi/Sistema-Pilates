import { AvaliacoesRepository } from './avaliacoes.repository'
import { AppError, ValidationError } from '../../shared/errors'
import { logInfo } from '../../shared/utils'
import { createAvaliacaoSchema, updateAvaliacaoSchema, listAvaliacoesSchema } from '../../shared/schemas'
import { AVALIACOES_ERRORS, FOTO_TIPOS_PERMITIDOS, FOTO_MAX_BYTES } from './avaliacoes.constants'
import { prisma } from '../../database/prisma.client'
import type { AvaliacaoCorporal, CreateAvaliacaoData, UpdateAvaliacaoData } from './avaliacoes.types'

export type AvaliacaoComImc = AvaliacaoCorporal & { imc: number | null }

export class AvaliacoesService {
  constructor(private repository: AvaliacoesRepository) {}

  async criar(data: CreateAvaliacaoData): Promise<AvaliacaoComImc> {
    const validado = createAvaliacaoSchema.parse(data)

    const aluno = await prisma.aluno.findUnique({ where: { id: validado.alunoId } })
    if (!aluno) throw ValidationError.forField('alunoId', AVALIACOES_ERRORS.ALUNO_NOT_FOUND)

    validado.fotos?.forEach((foto) => this.validarFoto(foto))

    const avaliacao = await this.repository.create({
      alunoId: validado.alunoId,
      registradoPorId: data.registradoPorId,
      dataAvaliacao: validado.dataAvaliacao,
      peso: validado.peso,
      altura: validado.altura,
      medidas: validado.medidas,
      queixaPrincipal: validado.queixaPrincipal,
      historicoMedico: validado.historicoMedico,
      observacoesPostura: validado.observacoesPostura,
      observacoesGerais: validado.observacoesGerais,
      fotos: validado.fotos,
    })

    logInfo('Avaliação corporal criada', { id: avaliacao.id, alunoId: avaliacao.alunoId })
    return this.comImc(avaliacao)
  }

  async buscarPorId(id: string): Promise<AvaliacaoComImc> {
    const avaliacao = await this.repository.findById(id)
    if (!avaliacao) throw AppError.notFound('Avaliação', id)
    return this.comImc(avaliacao)
  }

  async listar(params: { alunoId?: string; page?: number; limit?: number }) {
    const validado = listAvaliacoesSchema.parse(params)
    const { avaliacoes, total } = await this.repository.findAll({
      alunoId: validado.alunoId,
      page: validado.page,
      limit: validado.limit,
    })
    return {
      avaliacoes: avaliacoes.map((a) => this.comImc(a)),
      total,
      page: validado.page,
      limit: validado.limit,
      totalPages: Math.ceil(total / validado.limit),
    }
  }

  async atualizar(id: string, data: UpdateAvaliacaoData): Promise<AvaliacaoComImc> {
    await this.buscarPorId(id)
    const validado = updateAvaliacaoSchema.parse(data)
    const avaliacao = await this.repository.update(id, validado)
    logInfo('Avaliação corporal atualizada', { id })
    return this.comImc(avaliacao)
  }

  async excluir(id: string): Promise<void> {
    await this.buscarPorId(id)
    await this.repository.delete(id)
    logInfo('Avaliação corporal excluída', { id })
  }

  private validarFoto(foto: { arquivo: string; tipoArquivo: string }) {
    if (!FOTO_TIPOS_PERMITIDOS.includes(foto.tipoArquivo as any)) {
      throw ValidationError.forField('fotos', AVALIACOES_ERRORS.TIPO_ARQUIVO_INVALIDO)
    }
    const tamanhoEstimado = Math.round((foto.arquivo.length * 3) / 4)
    if (tamanhoEstimado > FOTO_MAX_BYTES) {
      throw ValidationError.forField('fotos', AVALIACOES_ERRORS.ARQUIVO_MUITO_GRANDE)
    }
  }

  private comImc(avaliacao: AvaliacaoCorporal): AvaliacaoComImc {
    const peso = avaliacao.peso ? Number(avaliacao.peso) : null
    const altura = avaliacao.altura ? Number(avaliacao.altura) : null
    const imc = peso && altura ? Math.round((peso / (altura * altura)) * 100) / 100 : null
    return { ...avaliacao, imc }
  }
}

export const avaliacoesService = new AvaliacoesService(new AvaliacoesRepository())
