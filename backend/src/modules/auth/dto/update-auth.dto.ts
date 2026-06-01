import type { FuncaoUsuario, StatusUsuario } from '@prisma/client'

export interface UpdateAuthDTO {
  nomeCompleto?: string
  telefone?: string | null
  funcao?: FuncaoUsuario
  status?: StatusUsuario
}
