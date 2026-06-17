import { jsPDF } from 'jspdf'
import { parseTermoMarkdown, segmentosNegrito } from './termoMarkdown'
import { CLINICA, POLITICA_REEMBOLSO } from './termoConstantes'
import type { TermoUso } from '@/services/termos.service'

async function carregarLogoDataUrl(): Promise<string | null> {
  try {
    const resp = await fetch(CLINICA.logo)
    if (!resp.ok) return null
    const blob = await resp.blob()
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Gera e baixa o PDF profissional do termo: logo, dados da clínica/proprietária,
 * política de reembolso em destaque, corpo formatado, paginação e rodapé.
 */
export async function gerarTermoPdf(
  termo: TermoUso,
  aceite?: { versao: number; aceitoEm: string } | null,
): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 48
  const contentW = pageW - margin * 2
  const bottomLimit = pageH - 56
  let y = margin

  const ensure = (space: number) => {
    if (y + space > bottomLimit) {
      doc.addPage()
      y = margin
    }
  }

  // Escreve texto com **negrito** inline, quebrando linhas e tratando bullet/indentação.
  const escreverRico = (
    texto: string,
    opts: { size: number; color: [number, number, number]; indent?: number; bullet?: boolean; bold?: boolean; lineH?: number },
  ) => {
    const indent = opts.indent ?? 0
    const lineH = opts.lineH ?? opts.size * 1.4
    const x0 = margin + indent
    const maxW = contentW - indent
    doc.setFontSize(opts.size)
    doc.setTextColor(opts.color[0], opts.color[1], opts.color[2])

    const tokens: { w: string; b: boolean }[] = []
    for (const seg of segmentosNegrito(texto)) {
      for (const parte of seg.texto.split(/(\s+)/)) {
        if (parte.length) tokens.push({ w: parte, b: opts.bold || seg.negrito })
      }
    }

    let linha: { w: string; b: boolean }[] = []
    let larguraLinha = 0
    let primeira = true
    const flush = () => {
      ensure(lineH)
      if (opts.bullet && primeira) {
        doc.setFont('helvetica', 'normal')
        doc.text('•', margin + 4, y)
      }
      let cx = x0
      for (const t of linha) {
        doc.setFont('helvetica', t.b ? 'bold' : 'normal')
        doc.text(t.w, cx, y)
        cx += doc.getTextWidth(t.w)
      }
      y += lineH
      linha = []
      larguraLinha = 0
      primeira = false
    }

    for (const t of tokens) {
      doc.setFont('helvetica', t.b ? 'bold' : 'normal')
      const tw = doc.getTextWidth(t.w)
      if (larguraLinha + tw > maxW && linha.length > 0) flush()
      linha.push(t)
      larguraLinha += tw
    }
    if (linha.length) flush()
  }

  const logo = await carregarLogoDataUrl()

  // ---- Cabeçalho institucional ----
  const headerTextX = margin + (logo ? 64 : 0)
  if (logo) {
    try { doc.addImage(logo, 'PNG', margin, y, 52, 52) } catch { /* logo opcional */ }
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(64, 62, 60)
  doc.text(CLINICA.nome, headerTextX, y + 18)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(140, 120, 80)
  doc.text(CLINICA.subtitulo.toUpperCase(), headerTextX, y + 33)
  doc.setTextColor(110, 110, 110)
  doc.text(`Proprietária: ${CLINICA.proprietaria}`, headerTextX, y + 47)
  y += 64
  doc.setDrawColor(201, 162, 39); doc.setLineWidth(1.5); doc.line(margin, y, pageW - margin, y)
  y += 24

  // ---- Título + metadados da versão ----
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(64, 62, 60)
  doc.text(termo.titulo, margin, y); y += 18
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(130, 130, 130)
  const pub = termo.publicadoEm ? new Date(termo.publicadoEm).toLocaleDateString('pt-BR') : '—'
  doc.text(`Versão ${termo.versao}  ·  Publicado em ${pub}  ·  Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, y)
  y += 22

  // ---- Caixa de reembolso (destaque) ----
  const padding = 14
  const tituloH = 18
  const lineH = 14
  // Mede as linhas com a MESMA fonte/tamanho da renderização (size 10) — senão o texto
  // é quebrado para uma largura menor (size 9) e estoura a borda direita ao ser desenhado.
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
  const linhasReembolso = doc.splitTextToSize(POLITICA_REEMBOLSO.texto, contentW - padding * 2) as string[]
  const boxH = padding * 2 + tituloH + linhasReembolso.length * lineH
  ensure(boxH + 6)
  doc.setFillColor(255, 248, 230); doc.setDrawColor(245, 200, 90); doc.setLineWidth(1)
  doc.roundedRect(margin, y, contentW, boxH, 6, 6, 'FD')
  let ty = y + padding + 8
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(146, 100, 20)
  doc.text(POLITICA_REEMBOLSO.titulo, margin + padding, ty); ty += tituloH
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(120, 90, 30)
  for (const l of linhasReembolso) { doc.text(l, margin + padding, ty); ty += lineH }
  y += boxH + 18

  // ---- Corpo do termo ----
  for (const b of parseTermoMarkdown(termo.conteudo)) {
    if (b.tipo === 'h2') {
      y += 8; ensure(18)
      escreverRico(b.texto, { size: 12, color: [74, 21, 75], bold: true, lineH: 16 })
      y += 2
    } else if (b.tipo === 'h3') {
      y += 4; ensure(16)
      escreverRico(b.texto, { size: 11, color: [64, 62, 60], bold: true, lineH: 15 })
    } else if (b.tipo === 'li') {
      escreverRico(b.texto, { size: 10, color: [80, 80, 80], indent: 16, bullet: true, lineH: 14 })
    } else {
      escreverRico(b.texto, { size: 10, color: [80, 80, 80], lineH: 14 })
      y += 3
    }
  }

  // ---- Rodapé + paginação ----
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setDrawColor(225, 222, 215); doc.setLineWidth(0.5)
    doc.line(margin, pageH - 38, pageW - margin, pageH - 38)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(150, 150, 150)
    doc.text(CLINICA.nome, margin, pageH - 24)
    doc.text(`Página ${i} de ${total}`, pageW - margin, pageH - 24, { align: 'right' })
    if (aceite) {
      doc.text(
        `Aceito em ${new Date(aceite.aceitoEm).toLocaleString('pt-BR')} — versão ${aceite.versao}`,
        pageW / 2,
        pageH - 24,
        { align: 'center' },
      )
    }
  }

  doc.save(`termo-clinica-performance-v${termo.versao}.pdf`)
}
