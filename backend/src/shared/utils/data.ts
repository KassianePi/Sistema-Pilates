/**
 * Helpers de data usados pela geração automática de mensalidades (mas
 * genéricos o suficiente para qualquer outro cálculo de competência/vencimento).
 */

/** Primeiro dia do mês da data informada, à meia-noite (horário local). */
export function inicioDoMes(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), 1)
}

/** Soma (ou subtrai, se negativo) `n` meses à data informada. */
export function adicionarMeses(data: Date, n: number): Date {
  return new Date(data.getFullYear(), data.getMonth() + n, data.getDate())
}

/** Quantidade de dias no mês (0-11) do ano informado. */
export function diasNoMes(ano: number, mesIndex: number): number {
  return new Date(ano, mesIndex + 1, 0).getDate()
}

/**
 * Constrói uma data com o dia informado, "clampando" para o último dia do mês
 * quando ele não existir (ex.: dia=31 em fevereiro vira dia 28 ou 29).
 */
export function construirDataComDia(ano: number, mesIndex: number, dia: number): Date {
  const diaClampado = Math.min(dia, diasNoMes(ano, mesIndex))
  return new Date(ano, mesIndex, diaClampado)
}

/** Subtrai `n` dias da data informada. */
export function subtrairDias(data: Date, n: number): Date {
  const resultado = new Date(data)
  resultado.setDate(resultado.getDate() - n)
  return resultado
}

/**
 * Interpreta uma string de data (ex.: "2026-07-23", vinda de um <input type="date">)
 * como meia-noite no horário LOCAL do processo, em vez de UTC.
 *
 * `new Date("2026-07-23")` é tratado pelo JS como meia-noite UTC; em qualquer
 * timezone com offset negativo (ex.: America/Sao_Paulo, UTC-3) os getters locais
 * (getDate/getMonth/getFullYear) enxergam o dia anterior. Isso quebrava o cálculo
 * de diaVencimento/mesReferencia das mensalidades. Strings com componente de hora
 * (datas/horas completas, já inequívocas) passam direto para o parser nativo.
 */
export function parseDataLocal(data: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return new Date(data)
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}
