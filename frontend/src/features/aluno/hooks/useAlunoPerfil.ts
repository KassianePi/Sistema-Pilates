import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { meService, type AtualizarPerfilData } from '@/services/me.service'
import { mensagemErro } from '../utils/erro'

export function useAlunoPerfil() {
  return useQuery({
    queryKey: ['meu-perfil'],
    queryFn: () => meService.getMeuPerfil(),
  })
}

export function useAtualizarPerfil() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dados: AtualizarPerfilData) => meService.atualizarMeuPerfil(dados),
    onSuccess: () => {
      toast.success('Perfil atualizado!')
      qc.invalidateQueries({ queryKey: ['meu-perfil'] })
    },
    onError: (err) => toast.error(mensagemErro(err, 'Erro ao atualizar perfil.')),
  })
}
