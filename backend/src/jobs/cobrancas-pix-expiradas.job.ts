import { pagamentosPixService } from '../modules/pagamentos-pix/pagamentos-pix.service'
import { logInfo, logWarn } from '../shared/utils'

const INTERVALO_MS = 60 * 60 * 1000 // 1 hora

export function iniciarJobCobrancasPixExpiradas(): NodeJS.Timeout {
  logInfo('Job cobranças PIX expiradas iniciado (intervalo: 1h)')

  // Executa na inicialização para cobrir downtime
  pagamentosPixService
    .processarCobrancasExpiradas()
    .catch((err) => logWarn('Job cobranças PIX: erro na execução inicial', { error: String(err) }))

  return setInterval(() => {
    pagamentosPixService
      .processarCobrancasExpiradas()
      .catch((err) => logWarn('Job cobranças PIX: erro na execução periódica', { error: String(err) }))
  }, INTERVALO_MS)
}
