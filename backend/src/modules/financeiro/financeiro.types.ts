import type { MetodoPagamento, StatusMensalidade, Prisma } from '@prisma/client'

export interface Caixa {
  id: string
  usuarioAbreId: string
  usuarioFechaId: string | null
  dataAbertura: Date
  dataFechamento: Date | null
  saldoAbertura: Prisma.Decimal
  saldoFechamento: Prisma.Decimal | null
  observacoes: string | null
  criadoEm: Date
  atualizadoEm: Date
}

export interface Mensalidade {
  id: string
  alunoId: string
  planoId: string
  mesReferencia: Date
  dataVencimento: Date
  valor: Prisma.Decimal
  desconto: Prisma.Decimal
  status: StatusMensalidade
  observacoes: string | null
  criadoEm: Date
  atualizadoEm: Date
  aluno?: { id: string; usuario: { nomeCompleto: string } }
  plano?: { id: string; nome: string }
  pagamentos?: Pagamento[]
}

export interface Pagamento {
  id: string
  mensalidadeId: string
  caixaId: string
  usuarioId: string
  dataPagamento: Date
  valor: Prisma.Decimal
  metodo: MetodoPagamento
  referencia: string | null
  observacoes: string | null
  criadoEm: Date
}

export interface AbrirCaixaData { usuarioId: string; saldoAbertura: number; observacoes?: string | null }
export interface FecharCaixaData { saldoFechamento: number; observacoes?: string | null }
export interface CreateMensalidadeData {
  alunoId: string; planoId: string; mesReferencia: Date; dataVencimento: Date
  valor: number; desconto?: number; observacoes?: string | null
}
export interface CreatePagamentoData {
  mensalidadeId: string; caixaId: string; usuarioId: string; valor: number
  metodo: MetodoPagamento; dataPagamento?: Date; referencia?: string | null; observacoes?: string | null
}
