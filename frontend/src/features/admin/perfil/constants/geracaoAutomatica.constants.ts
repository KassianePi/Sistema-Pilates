// Limites dos campos numéricos do formulário — espelham a validação do backend
// (configuracao.service.ts) para dar feedback imediato no formulário.
export const DIAS_ANTES_GERACAO_MIN = 1
export const DIAS_ANTES_GERACAO_MAX = 28
export const MAXIMO_MENSALIDADES_FUTURAS_MIN = 1
export const MAXIMO_MENSALIDADES_FUTURAS_MAX = 6

// Intervalo de polling do status enquanto uma execução manual está em andamento.
export const INTERVALO_POLLING_MS = 1500
