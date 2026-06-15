/** Formatadores compartilhados da Área do Aluno (evita duplicação entre páginas). */

export function formatarValor(v: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v ?? 0))
}

/**
 * Converte uma string em Date tratando datas puras "YYYY-MM-DD" como horário LOCAL.
 * (Sem isso, o JS interpreta a data pura como UTC e o fuso negativo exibe o dia anterior.)
 */
function paraData(d: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d)
}

export function formatarData(d?: string | null): string {
  if (!d) return '—'
  const dt = paraData(d)
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('pt-BR')
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
  const dt = paraData(d)
  return isNaN(dt.getTime())
    ? '—'
    : dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function primeiroNome(nome?: string | null): string {
  return nome?.trim().split(/\s+/)[0] ?? 'Aluno'
}
