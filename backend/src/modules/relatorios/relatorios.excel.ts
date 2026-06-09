import ExcelJS from 'exceljs'
import type { Relatorio } from './relatorios.types'

const ROXO = '5B4191'
const BRANCO = 'FFFFFF'
const BEGE = 'F6EDDF'

function estiloCabecalho(ws: ExcelJS.Worksheet, row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROXO } }
    cell.font = { bold: true, color: { argb: BRANCO }, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { bottom: { style: 'thin', color: { argb: ROXO } } }
  })
  row.height = 22
  ws.autoFilter = ws.autoFilter ?? `A1:${String.fromCharCode(64 + (row.cellCount || 1))}1`
}

function adicionarMetadados(wb: ExcelJS.Workbook, relatorio: Relatorio) {
  wb.creator = 'Studio Pilates'
  wb.created = new Date()
  wb.properties.date1904 = false

  const ws = wb.addWorksheet('Info')
  ws.getColumn(1).width = 25
  ws.getColumn(2).width = 40

  const campos: [string, string][] = [
    ['Título', relatorio.titulo],
    ['Tipo', relatorio.tipo],
    ['Período início', new Date(relatorio.dataPeriodoInicio).toLocaleDateString('pt-BR')],
    ['Período fim', new Date(relatorio.dataPeriodoFim).toLocaleDateString('pt-BR')],
    ['Gerado em', new Date(relatorio.criadoEm).toLocaleString('pt-BR')],
    ['Professor', relatorio.professor?.usuario.nomeCompleto ?? '—'],
  ]

  campos.forEach(([label, valor], i) => {
    const row = ws.getRow(i + 1)
    row.getCell(1).value = label
    row.getCell(1).font = { bold: true }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BEGE } }
    row.getCell(2).value = valor
  })
}

export async function gerarExcel(relatorio: Relatorio): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  adicionarMetadados(wb, relatorio)

  let conteudo: Record<string, unknown>
  try {
    conteudo = JSON.parse(relatorio.conteudo) as Record<string, unknown>
  } catch {
    conteudo = {}
  }

  const ws = wb.addWorksheet('Dados')

  switch (relatorio.tipo) {
    case 'FREQUENCIA': {
      ws.columns = [
        { header: 'Status', key: 'status', width: 25 },
        { header: 'Quantidade', key: 'quantidade', width: 15 },
      ]
      estiloCabecalho(ws, ws.getRow(1))
      const presencas = (conteudo.presencas ?? []) as { status: string; _count: { id: number } }[]
      presencas.forEach((p) => ws.addRow({ status: p.status, quantidade: p._count.id }))
      const total = presencas.reduce((acc, p) => acc + p._count.id, 0)
      const totalRow = ws.addRow({ status: 'TOTAL', quantidade: total })
      totalRow.font = { bold: true }
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BEGE } }
      break
    }

    case 'FINANCEIRO': {
      ws.columns = [
        { header: 'Métrica', key: 'metrica', width: 30 },
        { header: 'Valor', key: 'valor', width: 20 },
      ]
      estiloCabecalho(ws, ws.getRow(1))
      ws.addRow({ metrica: 'Total de pagamentos', valor: conteudo.pagamentos ?? 0 })
      const totalRow = ws.addRow({ metrica: 'Total arrecadado (R$)', valor: Number(conteudo.totalArrecadado ?? 0) })
      totalRow.getCell('valor').numFmt = '"R$"#,##0.00'
      totalRow.font = { bold: true }
      break
    }

    case 'RECEITA_MENSAL': {
      ws.columns = [
        { header: 'Métrica', key: 'metrica', width: 30 },
        { header: 'Valor (R$)', key: 'valor', width: 20 },
      ]
      estiloCabecalho(ws, ws.getRow(1))
      const rows = [
        { metrica: 'Total mensalidades', valor: conteudo.totalMensalidades ?? 0 },
        { metrica: 'Total bruto', valor: Number(conteudo.totalBruto ?? 0) },
        { metrica: 'Total desconto', valor: Number(conteudo.totalDesconto ?? 0) },
        { metrica: 'Total líquido', valor: Number(conteudo.totalLiquido ?? 0) },
      ]
      rows.forEach((r, i) => {
        const row = ws.addRow(r)
        if (i > 0) row.getCell('valor').numFmt = '"R$"#,##0.00'
      })
      break
    }

    case 'PENDENCIAS_PAGAMENTO': {
      ws.columns = [
        { header: 'Métrica', key: 'metrica', width: 40 },
        { header: 'Quantidade', key: 'quantidade', width: 15 },
      ]
      estiloCabecalho(ws, ws.getRow(1))
      ws.addRow({ metrica: 'Mensalidades pendentes ou vencidas', quantidade: conteudo.totalPendencias ?? 0 })
      break
    }

    default: {
      ws.addRow(['Dados do relatório'])
      ws.addRow([relatorio.conteudo])
    }
  }

  ws.getRows(2, ws.rowCount - 1)?.forEach((row, i) => {
    if (i % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BEGE } }
    }
  })

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
