import type { PresencaAluno } from '@/services/presenca.service'
import type { StatusPresenca } from '@/types/domain.types'

export interface KpisFrequencia {
  totalRegistros: number
  totalPresente: number
  totalAusente: number
  totalJustificado: number
  /** % de presença = PRESENTE / total de registros. */
  percentual: number
  /** Presenças (PRESENTE) no mês de referência. */
  presencasMes: number
}

function ymOf(p: PresencaAluno): { y: number; m: number } | null {
  if (!p.aula.data) return null
  const [y, m] = p.aula.data.split('-').map(Number)
  return Number.isFinite(y) && Number.isFinite(m) ? { y, m: m - 1 } : null
}

export function calcularKpisFrequencia(presencas: PresencaAluno[], referencia = new Date()): KpisFrequencia {
  const total = presencas.length
  const totalPresente = presencas.filter((p) => p.status === 'PRESENTE').length
  const totalAusente = presencas.filter((p) => p.status === 'AUSENTE').length
  const totalJustificado = presencas.filter((p) => p.status === 'JUSTIFICADO').length
  const ano = referencia.getFullYear()
  const mes = referencia.getMonth()
  const presencasMes = presencas.filter((p) => {
    const ym = ymOf(p)
    return p.status === 'PRESENTE' && ym && ym.y === ano && ym.m === mes
  }).length
  return {
    totalRegistros: total,
    totalPresente,
    totalAusente,
    totalJustificado,
    percentual: total > 0 ? Math.round((totalPresente / total) * 100) : 0,
    presencasMes,
  }
}

export interface PontoEvolucao {
  ano: number
  mes: number // 0-11
  label: string // ex.: "jun"
  percentual: number
  totalRegistros: number
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Evolução do % de presença nos últimos N meses (inclui o mês corrente). */
export function calcularEvolucaoMensal(presencas: PresencaAluno[], meses = 6, referencia = new Date()): PontoEvolucao[] {
  const pontos: PontoEvolucao[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1)
    const ano = d.getFullYear()
    const mes = d.getMonth()
    const doMes = presencas.filter((p) => {
      const ym = ymOf(p)
      return ym && ym.y === ano && ym.m === mes
    })
    const presentes = doMes.filter((p) => p.status === 'PRESENTE').length
    pontos.push({
      ano,
      mes,
      label: MESES_CURTOS[mes],
      percentual: doMes.length > 0 ? Math.round((presentes / doMes.length) * 100) : 0,
      totalRegistros: doMes.length,
    })
  }
  return pontos
}

/** Mapa 'YYYY-MM-DD' → status, para o calendário de comparecimento. */
export function mapaPresencasPorDia(presencas: PresencaAluno[]): Record<string, StatusPresenca> {
  const mapa: Record<string, StatusPresenca> = {}
  for (const p of presencas) {
    if (!p.aula.data) continue
    // Prioriza PRESENTE caso haja mais de um registro no mesmo dia.
    if (mapa[p.aula.data] === 'PRESENTE') continue
    mapa[p.aula.data] = p.status
  }
  return mapa
}
