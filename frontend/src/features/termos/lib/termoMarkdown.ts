/**
 * Parser de markdown simples, compartilhado entre o documento na tela (TermoDocumento)
 * e a geração de PDF (termoPdf) — evita duplicar a lógica de formatação.
 */

export type BlocoTermo = { tipo: 'h2' | 'h3' | 'p' | 'li'; texto: string }

export function parseTermoMarkdown(conteudo: string): BlocoTermo[] {
  const linhas = conteudo.replace(/\r\n/g, '\n').split('\n')
  const blocos: BlocoTermo[] = []
  for (const linha of linhas) {
    const l = linha.trim()
    if (!l) continue
    if (l.startsWith('### ')) blocos.push({ tipo: 'h3', texto: l.slice(4).trim() })
    else if (l.startsWith('## ')) blocos.push({ tipo: 'h2', texto: l.slice(3).trim() })
    else if (l.startsWith('# ')) blocos.push({ tipo: 'h2', texto: l.slice(2).trim() })
    else if (l.startsWith('- ') || l.startsWith('* ')) blocos.push({ tipo: 'li', texto: l.slice(2).trim() })
    else blocos.push({ tipo: 'p', texto: l })
  }
  return blocos
}

/** Divide um texto em segmentos marcando trechos em **negrito**. */
export function segmentosNegrito(texto: string): { texto: string; negrito: boolean }[] {
  return texto
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((p) => p.length > 0)
    .map((p) =>
      p.startsWith('**') && p.endsWith('**') ? { texto: p.slice(2, -2), negrito: true } : { texto: p, negrito: false },
    )
}
