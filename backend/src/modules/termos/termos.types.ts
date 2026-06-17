export interface TermoUso {
  id: string
  versao: number
  titulo: string
  conteudo: string
  publicado: boolean
  publicadoEm: Date | null
  criadoPorId: string | null
  criadoEm: Date
  atualizadoEm: Date
}

export interface TermoAceite {
  id: string
  termoId: string
  alunoId: string
  versao: number
  aceitoEm: Date
  enderecoIp: string | null
  userAgent: string | null
}

/** Situação do aluno em relação ao termo publicado atual. */
export interface StatusTermoAluno {
  requerAceite: boolean
  aceito: boolean
  versaoAtual: number | null
  versaoAceita: number | null
  aceitoEm: Date | null
  termo: TermoUso | null
}
