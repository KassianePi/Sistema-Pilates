import type { CreateProfessorData } from '../professores.types'
export type CreateProfessorDTO = Omit<CreateProfessorData, 'senhaHash'> & { senha: string }
