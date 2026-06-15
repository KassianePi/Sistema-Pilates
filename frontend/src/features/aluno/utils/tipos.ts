/**
 * Formas financeiras como o portal do aluno realmente as recebe (o objeto em runtime
 * traz campos além dos declarados no domínio — ex.: pagamentos, criadoEm). Tipadas aqui
 * para evitar `any` nas páginas e utilitários.
 */

export interface PagamentoResumo {
  id: string
  dataPagamento?: string | null
  valor?: number
}

export interface MensalidadeAluno {
  id: string
  status: string
  valor: number
  vencimento: string
  criadoEm?: string | null
  plano?: { nome?: string | null } | null
  pagamentos?: PagamentoResumo[] | null
}

export interface ComprovanteAluno {
  id: string
  mensalidadeId: string
  status: string
  nomeArquivo: string
  dataEnvio: string
  observacoes?: string | null
  atualizadoEm?: string | null
  mensalidade?: { plano?: { nome?: string | null } | null } | null
}
