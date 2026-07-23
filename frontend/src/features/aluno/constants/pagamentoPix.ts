/** Intervalo do polling de rotina (só lê o banco, nunca chama o Mercado Pago). */
export const PIX_POLLING_INTERVAL_MS = 5000

/** Tick da contagem regressiva até a expiração da cobrança. */
export const PIX_COUNTDOWN_TICK_MS = 1000

/** Últimos N segundos antes de expirar em que o countdown muda de cor (alerta). */
export const PIX_EXPIRATION_WARNING_SECONDS = 300
