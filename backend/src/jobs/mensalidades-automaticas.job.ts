import cron, { type ScheduledTask } from 'node-cron'
import { mensalidadesAutomaticasService } from '../modules/mensalidades-automaticas/mensalidades-automaticas.service'
import { configuracaoRepository } from '../modules/configuracao/configuracao.repository'
import { logInfo, logWarn } from '../shared/utils'

const EXPRESSAO_PADRAO = '0 0,6,12,18 * * *'
const TIMEZONE = 'America/Sao_Paulo'

let tarefaAtual: ScheduledTask | undefined

/**
 * Agenda a geração automática de mensalidades via node-cron. A expressão vem
 * de ConfiguracaoStudio.cronGeracaoMensalidades, mas é lida só uma vez, no
 * boot — mudar o valor pela UI/API persiste no banco imediatamente, mas só
 * passa a valer depois de um restart do backend (ver plano da feature).
 */
export async function iniciarJobMensalidadesAutomaticas(): Promise<void> {
  const config = await configuracaoRepository.find()
  const expressaoConfigurada = config?.cronGeracaoMensalidades

  let expressao = EXPRESSAO_PADRAO
  if (expressaoConfigurada && cron.validate(expressaoConfigurada)) {
    expressao = expressaoConfigurada
  } else if (expressaoConfigurada) {
    logWarn('cronGeracaoMensalidades inválido na configuração, usando padrão', {
      valorConfigurado: expressaoConfigurada,
      padrao: EXPRESSAO_PADRAO,
    })
  }

  tarefaAtual = cron.schedule(
    expressao,
    () => {
      mensalidadesAutomaticasService
        .executarGeracao('CRON')
        .catch((err) =>
          logWarn('Job geração automática de mensalidades: erro na execução agendada', { error: String(err) }),
        )
    },
    { timezone: TIMEZONE },
  )

  logInfo('Job geração automática de mensalidades agendado', { expressao, timezone: TIMEZONE })
}

export function pararJobMensalidadesAutomaticas(): void {
  tarefaAtual?.stop()
}
