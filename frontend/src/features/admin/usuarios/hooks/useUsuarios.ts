import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usuariosService, type CreateUsuarioDTO, type UpdateUsuarioDTO } from '@/services/usuarios.service'

export function useUsuarios(params?: { page?: number; limit?: number; funcao?: string }) {
  return useQuery({
    queryKey: ['usuarios', params],
    queryFn: () => usuariosService.listar(params),
  })
}

export function useCriarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateUsuarioDTO) => usuariosService.criar(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuário criado com sucesso!')
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? 'Erro ao criar usuário.'
      toast.error(msg)
    },
  })
}

export function useAtualizarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUsuarioDTO }) => usuariosService.atualizar(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuário atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar usuário.'),
  })
}

export function useAlterarStatusUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => usuariosService.alterarStatus(id, ativo),
    onSuccess: (_, { ativo }) => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success(ativo ? 'Usuário reativado.' : 'Usuário inativado.')
    },
    onError: () => toast.error('Erro ao alterar status do usuário.'),
  })
}
