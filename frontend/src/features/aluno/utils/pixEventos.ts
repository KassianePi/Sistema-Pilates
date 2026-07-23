type PixEvento =
  | { tipo: 'pix_gerado'; mensalidadeId: string }
  | { tipo: 'pix_copiado'; mensalidadeId: string }
  | { tipo: 'pix_aprovado'; mensalidadeId: string }
  | { tipo: 'pix_sincronizado'; mensalidadeId: string; statusResultante: string }
  | { tipo: 'pix_erro_consulta'; mensalidadeId: string; erro: string }
  | { tipo: 'pix_erro_gerar'; mensalidadeId: string; erro: string }

/**
 * Ponto único de registro de eventos do fluxo de pagamento PIX. Hoje só loga
 * em desenvolvimento — sem integração com nenhuma ferramenta externa. Quando
 * o projeto adotar Sentry/PostHog/GA (ou similar), só este arquivo muda.
 */
export function registrarEventoPix(evento: PixEvento): void {
  if (import.meta.env.DEV) {
    console.debug('[pix]', evento)
  }
}
