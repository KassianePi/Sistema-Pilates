/** Extrai a mensagem de erro de uma resposta de API (Axios) de forma tipada, sem `any`. */
export function mensagemErro(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as { response?: { data?: { message?: string } }; message?: string }
    return e.response?.data?.message ?? e.message ?? fallback
  }
  return fallback
}
