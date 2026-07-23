import type { OrigemExecucaoJob, StatusExecucaoJob, Prisma } from '@prisma/client'

export type { OrigemExecucaoJob, StatusExecucaoJob }

export type MotivoIgnorado =
  | 'SEM_PLANO'
  | 'SEM_BASELINE'
  | 'AINDA_NAO_ELEGIVEL'
  | 'LIMITE_FUTURAS_ATINGIDO'
  | 'JA_EXISTENTE'

export interface DetalheIgnorado {
  alunoId: string
  motivo: MotivoIgnorado
}

export interface DetalheErro {
  alunoId: string
  mensagem: string
}

export interface ResumoExecucao {
  id: string | null // null em dry-run (não persiste)
  origem: OrigemExecucaoJob
  status: StatusExecucaoJob
  dryRun: boolean
  totalAlunosElegiveis: number
  alunosAnalisados: number
  mensalidadesCriadas: number
  alunosIgnorados: number
  detalhesIgnorados: DetalheIgnorado[]
  erros: DetalheErro[]
  duracaoMs: number
  iniciadoEm: Date
  finalizadoEm: Date
}

export interface AlunoElegivel {
  id: string
  usuarioId: string
  diaVencimento: number
  planoAtual: { id: string; tipo: string; preco: Prisma.Decimal } | null
  mensalidades: { mesReferencia: Date }[] // já filtrada/ordenada pelo repository: só a última MENSAL
}

export interface DadosNovaMensalidade {
  alunoId: string
  planoId: string
  mesReferencia: Date
  dataVencimento: Date
  valor: number
}

export interface CriarSeNaoExisteResultado {
  criada: boolean
  mensalidadeId: string | null
}

export interface MensalidadeParaGeracaoImediata {
  tipo: string
  mesReferencia: Date
  aluno: {
    id: string
    usuarioId: string
    status: string
    diaVencimento: number
    planoAtual: { id: string; tipo: string; preco: Prisma.Decimal } | null
  }
}

export interface ExecucaoEmAndamento {
  id: string
  origem: OrigemExecucaoJob
  totalAlunosElegiveis: number
  alunosAnalisados: number
  mensalidadesCriadas: number
  alunosIgnorados: number
  iniciadoEm: Date
}
