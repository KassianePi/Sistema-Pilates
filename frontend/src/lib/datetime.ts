/**
 * Formata uma data para pt-BR tratando datas puras "YYYY-MM-DD" como horário LOCAL.
 *
 * Sem isso, o JS interpreta "2026-06-15" como UTC meia-noite e, em fusos negativos
 * (ex.: Brasília UTC-3), `toLocaleDateString` exibe o dia anterior. Strings com hora
 * (ISO completo) continuam sendo tratadas como instante absoluto.
 */
export function formatarData(d?: string | null): string {
  if (!d) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  const dt = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d)
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('pt-BR')
}
