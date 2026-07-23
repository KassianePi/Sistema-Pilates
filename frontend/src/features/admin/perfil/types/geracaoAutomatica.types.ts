export type OrigemExecucaoJob = 'CRON' | 'MANUAL'
export type StatusExecucaoJob = 'EM_ANDAMENTO' | 'SUCESSO' | 'PARCIAL' | 'ERRO'
export type MotivoIgnorado = 'SEM_PLANO' | 'SEM_BASELINE' | 'AINDA_NAO_ELEGIVEL' | 'LIMITE_FUTURAS_ATINGIDO' | 'JA_EXISTENTE'

export interface DetalheIgnorado {
  alunoId: string
  motivo: MotivoIgnorado
}

export interface DetalheErro {
  alunoId: string
  mensagem: string
}

export interface ResumoExecucaoMensalidades {
  id: string | null
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
  iniciadoEm: string
  finalizadoEm: string
}

export interface ExecucaoEmAndamento {
  id: string
  origem: OrigemExecucaoJob
  totalAlunosElegiveis: number
  alunosAnalisados: number
  mensalidadesCriadas: number
  alunosIgnorados: number
  iniciadoEm: string
}
