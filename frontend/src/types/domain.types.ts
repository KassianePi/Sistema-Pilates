export type StatusAtivo = 'ATIVO' | 'INATIVO'
export type StatusAluno = 'ATIVO' | 'INATIVO' | 'SUSPENSO' | 'FORMADO'
export type StatusMensalidade = 'PENDENTE' | 'PAGO' | 'VENCIDO' | 'CANCELADO' | 'PARCIAL'
export type StatusAula = 'AGENDADA' | 'REALIZADA' | 'CANCELADA' | 'ADIADA'
export type StatusPresenca = 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO'
export type TipoAula = 'INDIVIDUAL' | 'DUPLA' | 'GRUPO'
export type ModalidadeAula = 'MAT' | 'APARELHOS' | 'REFORMER' | 'CADILLAC'
export type TipoMovimentacao = 'ENTRADA' | 'SAIDA'
export type MetodoPagamento = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX' | 'TRANSFERENCIA'
export type UserRole = 'ADMIN' | 'RECEPCIONISTA' | 'PROFESSOR' | 'FINANCEIRO' | 'ALUNO'

export interface Plano {
  id: string
  nome: string
  descricao?: string
  valor: number
  duracaoMeses: number
  aulasSemanais: number
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface Professor {
  id: string
  usuarioId: string
  especialidade?: string
  bio?: string
  status: StatusAtivo
  createdAt: string
  updatedAt: string
  usuario: {
    id: string
    nomeCompleto: string
    email: string
    telefone?: string
  }
}

export interface Aluno {
  id: string
  usuarioId: string
  planoId?: string
  dataNascimento?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  status: StatusAluno
  createdAt: string
  updatedAt: string
  usuario: {
    id: string
    nomeCompleto: string
    email: string
    telefone?: string
  }
  planoAtual?: Plano
}

export interface Aula {
  id: string
  titulo: string
  professorId: string
  data: string
  horaInicio: string
  horaFim: string
  vagas: number
  vagasOcupadas: number
  tipo: TipoAula
  modalidade: ModalidadeAula
  status: StatusAula
  observacoes?: string
  createdAt: string
  updatedAt: string
  professor: {
    id: string
    usuario: { nomeCompleto: string }
  }
  sala?: string
  duracao?: number
}

export interface Presenca {
  id: string
  aulaId: string
  alunoId: string
  status: StatusPresenca
  observacoes?: string
  createdAt: string
  aula: Pick<Aula, 'id' | 'titulo' | 'data' | 'horaInicio'>
  aluno: { id: string; usuario: { nomeCompleto: string } }
}

export interface Mensalidade {
  id: string
  alunoId: string
  planoId: string
  valor: number
  vencimento: string
  status: StatusMensalidade
  createdAt: string
  updatedAt: string
  aluno: { id: string; usuario: { nomeCompleto: string } }
  plano: Pick<Plano, 'id' | 'nome'>
}

export interface Pagamento {
  id: string
  mensalidadeId: string
  valor: number
  metodoPagamento: MetodoPagamento
  dataPagamento: string
  observacoes?: string
  createdAt: string
  mensalidade: Pick<Mensalidade, 'id' | 'aluno' | 'plano'>
}

export interface Notificacao {
  id: string
  usuarioId: string
  titulo: string
  mensagem: string
  lida: boolean
  arquivada: boolean
  createdAt: string
}

export interface LogAuditoria {
  id: string
  usuarioId?: string
  acao: string
  entidade: string
  entidadeId?: string
  dadosAntigos?: string | null
  dadosNovos?: string | null
  detalhes?: string
  enderecoIp?: string | null
  criadoEm: string
  usuario?: { nomeCompleto: string; email: string }
}

export type TipoRelatorio = 'FREQUENCIA' | 'FINANCEIRO' | 'RECEITA_MENSAL' | 'PENDENCIAS_PAGAMENTO' | 'PRESENCA_ALUNO'

export interface Relatorio {
  id: string
  professorId: string
  tipo: TipoRelatorio
  titulo: string
  descricao?: string | null
  dataPeriodoInicio: string
  dataPeriodoFim: string
  conteudo: string
  criadoEm: string
  atualizadoEm: string
  professor?: { id: string; usuario: { nomeCompleto: string } }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  pagina: number
  limite: number
  totalPaginas: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
}
