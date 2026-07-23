import type { ResumoExecucaoMensalidades } from '../types/geracaoAutomatica.types'

const ROTULO_STATUS: Record<ResumoExecucaoMensalidades['status'], string> = {
  EM_ANDAMENTO: 'Em andamento',
  SUCESSO: 'Sucesso',
  PARCIAL: 'Parcial',
  ERRO: 'Erro',
}

/** Formata a duração em milissegundos como texto curto (ex.: "2.3s", "850ms"). */
export function formatDuracao(duracaoMs: number): string {
  if (duracaoMs < 1000) return `${duracaoMs}ms`
  return `${(duracaoMs / 1000).toFixed(1)}s`
}

/** Resumo de uma linha para o toast/relatório após "Executar agora" ou "Simular". */
export function formatResumoExecucao(resumo: ResumoExecucaoMensalidades): string {
  const prefixo = resumo.dryRun ? 'Simulação' : ROTULO_STATUS[resumo.status]
  const partes = [
    `${prefixo}:`,
    `${resumo.mensalidadesCriadas} mensalidade(s) criada(s)`,
    `${resumo.alunosIgnorados} ignorado(s)`,
  ]
  if (resumo.erros.length > 0) partes.push(`${resumo.erros.length} erro(s)`)
  partes.push(`em ${formatDuracao(resumo.duracaoMs)}`)
  return partes.join(' ')
}
