export const AVALIACOES_ERRORS = {
  NOT_FOUND: 'Avaliação não encontrada',
  ALUNO_NOT_FOUND: 'Aluno não encontrado',
  TIPO_ARQUIVO_INVALIDO: 'Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.',
  ARQUIVO_MUITO_GRANDE: 'Arquivo muito grande. Tamanho máximo: 5 MB.',
} as const

export const AVALIACOES_ERROR_CODES = {
  NOT_FOUND: 'AVALIACAO_NOT_FOUND',
  ALUNO_NOT_FOUND: 'ALUNO_NOT_FOUND',
} as const

export const FOTO_TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const
export const FOTO_MAX_BYTES = 5 * 1024 * 1024
