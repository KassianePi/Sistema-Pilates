import { prisma } from '../database/prisma.client'
import { eventBus } from '../events/event-bus'
import { logInfo, logError, logWarn } from '../shared/utils'

async function processarMensalidadesVencidas(): Promise<void> {
  const agora = new Date()

  try {
    const mensalidadesVencidas = await prisma.mensalidade.findMany({
      where: {
        status: 'PENDENTE',
        dataVencimento: { lt: agora },
      },
      include: {
        aluno: { select: { id: true, usuarioId: true } },
      },
      take: 200,
    })

    if (mensalidadesVencidas.length === 0) {
      logInfo('Job mensalidades: nenhuma vencida encontrada')
      return
    }

    logInfo(`Job mensalidades: processando ${mensalidadesVencidas.length} mensalidades vencidas`)

    const ids = mensalidadesVencidas.map((m) => m.id)
    await prisma.mensalidade.updateMany({
      where: { id: { in: ids } },
      data: { status: 'VENCIDO' },
    })

    for (const mensalidade of mensalidadesVencidas) {
      eventBus.emit('mensalidade.vencida', {
        mensalidadeId: mensalidade.id,
        alunoId: mensalidade.alunoId,
        usuarioId: mensalidade.aluno.usuarioId,
        dataVencimento: mensalidade.dataVencimento,
      })
    }

    logInfo(`Job mensalidades: ${mensalidadesVencidas.length} mensalidades marcadas como vencidas`)
  } catch (error) {
    logError('Job mensalidades: erro ao processar vencimentos', error as Error)
  }
}

const INTERVALO_MS = 6 * 60 * 60 * 1000 // 6 horas

export function iniciarJobMensalidadesVencidas(): NodeJS.Timeout {
  logInfo('Job mensalidades vencidas iniciado (intervalo: 6h)')

  // Executa imediatamente na inicialização
  processarMensalidadesVencidas().catch((err) =>
    logWarn('Job mensalidades: erro na execução inicial', { error: String(err) }),
  )

  return setInterval(() => {
    processarMensalidadesVencidas().catch((err) =>
      logWarn('Job mensalidades: erro na execução periódica', { error: String(err) }),
    )
  }, INTERVALO_MS)
}
