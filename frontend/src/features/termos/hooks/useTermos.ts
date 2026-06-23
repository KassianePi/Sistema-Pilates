import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { termosService } from '@/services/termos.service'

const STATUS_KEY = ['termo-status']
const MEUS_ACEITES_KEY = ['termo-meus-aceites']
const ADMIN_KEY = ['termos-admin']

function msgErro(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } }
  return e?.response?.data?.message ?? fallback
}

// ----------------------------------------------------------------
// Portal do aluno
// ----------------------------------------------------------------

/**
 * Status do aluno frente ao termo vigente. Usado pelo gate de 1º acesso.
 * `retry: false` para falhar rápido — em erro, o gate adota fail-open (não bloqueia).
 */
export function useTermoStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => termosService.status(),
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function useAceitarTermo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => termosService.aceitar(),
    onSuccess: () => {
      toast.success('Termos aceitos com sucesso!')
      qc.invalidateQueries({ queryKey: STATUS_KEY })
      qc.invalidateQueries({ queryKey: MEUS_ACEITES_KEY })
    },
    onError: (err) => toast.error(msgErro(err, 'Não foi possível registrar o aceite.')),
  })
}

export function useMeusAceites() {
  return useQuery({
    queryKey: MEUS_ACEITES_KEY,
    queryFn: () => termosService.meusAceites(),
  })
}

// ----------------------------------------------------------------
// Administração (ADMIN)
// ----------------------------------------------------------------

export function useTermosAdmin() {
  return useQuery({
    queryKey: ADMIN_KEY,
    queryFn: () => termosService.listar(),
  })
}

export function useCriarTermo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { titulo: string; conteudo: string }) => termosService.criar(payload),
    onSuccess: () => {
      toast.success('Nova versão criada (rascunho).')
      qc.invalidateQueries({ queryKey: ADMIN_KEY })
    },
    onError: (err) => toast.error(msgErro(err, 'Erro ao criar versão.')),
  })
}

export function useEditarTermo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; titulo?: string; conteudo?: string }) =>
      termosService.editar(id, payload),
    onSuccess: () => {
      toast.success('Versão atualizada.')
      qc.invalidateQueries({ queryKey: ADMIN_KEY })
    },
    onError: (err) => toast.error(msgErro(err, 'Erro ao editar versão.')),
  })
}

export function usePublicarTermo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => termosService.publicar(id),
    onSuccess: () => {
      toast.success('Versão publicada! Os alunos verão esta versão para aceite.')
      qc.invalidateQueries({ queryKey: ADMIN_KEY })
      qc.invalidateQueries({ queryKey: STATUS_KEY })
    },
    onError: (err) => toast.error(msgErro(err, 'Erro ao publicar versão.')),
  })
}

export function useAceitesTermo(termoId: string | null) {
  return useQuery({
    queryKey: ['termo-aceites', termoId],
    queryFn: () => termosService.aceites(termoId!),
    enabled: !!termoId,
  })
}
