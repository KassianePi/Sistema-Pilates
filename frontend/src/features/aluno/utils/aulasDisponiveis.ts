import type { PresencaAluno } from '@/services/presenca.service'

export interface AulasDisponiveisResult {
  /** Cota de aulas do plano no período (null quando não há plano). */
  cota: number | null
  /** Aulas realizadas (PRESENTE) no mês de referência. */
  realizadas: number
  /** Aulas ainda disponíveis (null quando ilimitado ou sem plano). */
  disponiveis: number | null
  ilimitado: boolean
  semPlano: boolean
}

/**
 * Regra de negócio de "Aulas Disponíveis" — encapsulada fora da UI.
 *
 * Hoje: cota mensal do plano (`aulasPlano`) menos as presenças PRESENTE do mês corrente.
 * Preparada para evoluir sem mexer na UI:
 *  - `aulasPlano` nulo  → sem plano (disponiveis = null).
 *  - `aulasPlano <= 0`  → tratado como ilimitado (placeholder p/ planos ilimitados/personalizados).
 *  - futuro: somar reposições, planos trimestrais (cota * meses), etc. — alterar só aqui.
 */
export function calcularAulasDisponiveis(params: {
  aulasPlano: number | null | undefined
  presencas: PresencaAluno[]
  referencia?: Date
}): AulasDisponiveisResult {
  const { aulasPlano, presencas, referencia = new Date() } = params
  const ano = referencia.getFullYear()
  const mes = referencia.getMonth()

  const realizadas = presencas.filter((p) => {
    if (p.status !== 'PRESENTE' || !p.aula.data) return false
    const [y, m] = p.aula.data.split('-').map(Number)
    return y === ano && m - 1 === mes
  }).length

  const semPlano = aulasPlano == null
  const ilimitado = !semPlano && (aulasPlano as number) <= 0

  if (semPlano || ilimitado) {
    return { cota: semPlano ? null : (aulasPlano as number), realizadas, disponiveis: null, ilimitado, semPlano }
  }

  const cota = aulasPlano as number
  return { cota, realizadas, disponiveis: Math.max(0, cota - realizadas), ilimitado: false, semPlano: false }
}
