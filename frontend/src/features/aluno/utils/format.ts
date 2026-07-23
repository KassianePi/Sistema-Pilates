/** Formatadores compartilhados da Área do Aluno (evita duplicação entre páginas). */

export function formatarValor(v: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0))
}

/**
 * Datas "puras" (vencimento, data de início, nascimento...) chegam da API como
 * meia-noite UTC — não representam um instante real, só um dia de calendário.
 * Exibir com toLocaleDateString sem fixar o fuso converte pro horário local do
 * navegador e, em fusos negativos (Brasil), mostra o dia anterior. Fixando
 * timeZone: 'UTC' a data exibida é sempre o dia gravado, não importa o fuso de
 * quem está vendo a tela.
 */
export function formatarData(d?: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function formatarDataHora(d?: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt.getTime())
    ? '—'
    : dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function formatarDataLonga(d?: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  return isNaN(dt.getTime())
    ? '—'
    : dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

export function primeiroNome(nome?: string | null): string {
  return nome?.trim().split(/\s+/)[0] ?? 'Aluno'
}
