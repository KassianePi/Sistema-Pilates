import { prisma } from '../database/prisma.client'
import { eventBus } from '../events/event-bus'
import { logInfo, logError, logWarn } from '../shared/utils'

async function finalizarAulasPassadas(): Promise<void> {
  const agora = new Date()

  try {
    // Busca aulas AGENDADAS que já iniciaram
    const aulasIniciadas = await prisma.aula.findMany({
      where: {
        status: 'AGENDADA',
        dataHoraInicio: { lt: agora },
      },
      select: { id: true, dataHoraInicio: true, duracao: true },
      take: 100,
    })

    if (aulasIniciadas.length === 0) {
      logInfo('Job aulas: nenhuma aula pendente de finalização')
      return
    }

    // Filtra apenas as que já terminaram: dataHoraInicio + duracao (min) < agora
    const aulasConcluidas = aulasIniciadas.filter((a) => {
      const fim = new Date(a.dataHoraInicio).getTime() + a.duracao * 60 * 1000
      return fim < agora.getTime()
    })

    if (aulasConcluidas.length === 0) {
      logInfo('Job aulas: aulas iniciadas mas ainda não concluídas')
      return
    }

    const ids = aulasConcluidas.map((a) => a.id)
    await prisma.aula.updateMany({
      where: { id: { in: ids } },
      data: { status: 'REALIZADA' },
    })

    for (const aula of aulasConcluidas) {
      eventBus.emit('aula.realizada', { aulaId: aula.id })
    }

    logInfo(`Job aulas: ${aulasConcluidas.length} aula(s) marcada(s) como REALIZADA automaticamente`)
  } catch (error) {
    logError('Job aulas: erro ao finalizar aulas passadas', error as Error)
  }
}

const INTERVALO_MS = 60 * 60 * 1000 // 1 hora

export function iniciarJobAulasVencidas(): NodeJS.Timeout {
  logInfo('Job aulas vencidas iniciado (intervalo: 1h)')

  // Executa na inicialização para cobrir downtime
  finalizarAulasPassadas().catch((err) => logWarn('Job aulas: erro na execução inicial', { error: String(err) }))

  return setInterval(() => {
    finalizarAulasPassadas().catch((err) => logWarn('Job aulas: erro na execução periódica', { error: String(err) }))
  }, INTERVALO_MS)
}
