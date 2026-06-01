import type { CreateAlunoData } from '../alunos.types'
export type CreateAlunoDTO = Omit<CreateAlunoData, 'senhaHash'> & { senha: string }
