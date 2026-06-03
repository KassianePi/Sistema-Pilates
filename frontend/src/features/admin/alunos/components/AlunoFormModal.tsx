import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateAluno, useUpdateAluno } from '../hooks/useAlunos'
import { usePlanos } from '@/features/admin/planos/hooks/usePlanos'
import type { Aluno } from '@/types/domain.types'

const createSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone: z.string().optional(),
  planoId: z.string().optional(),
  dataNascimento: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
})

const editSchema = createSchema.omit({ senha: true, email: true }).extend({
  status: z.enum(['ATIVO', 'INATIVO']).optional(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

interface Props {
  open: boolean
  onClose: () => void
  aluno?: Aluno | null
}

export function AlunoFormModal({ open, onClose, aluno }: Props) {
  const isEditing = !!aluno
  const createAluno = useCreateAluno()
  const updateAluno = useUpdateAluno()
  const { data: planosData } = usePlanos({ limite: 100 })
  const planos = planosData?.data ?? []

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
  })

  useEffect(() => {
    if (aluno) {
      reset({
        nome: aluno.usuario.nome,
        email: aluno.usuario.email,
        telefone: aluno.usuario.telefone ?? '',
        planoId: aluno.planoId ?? '',
        dataNascimento: aluno.dataNascimento ? aluno.dataNascimento.split('T')[0] : '',
        cidade: aluno.cidade ?? '',
        estado: aluno.estado ?? '',
        status: aluno.status,
      })
    } else {
      reset({ nome: '', email: '', senha: '', telefone: '', planoId: '', dataNascimento: '', cidade: '', estado: '' })
    }
  }, [aluno, reset, open])

  async function onSubmit(values: CreateForm | EditForm) {
    if (isEditing && aluno) {
      await updateAluno.mutateAsync({ id: aluno.id, dto: values as EditForm })
    } else {
      await createAluno.mutateAsync(values as CreateForm)
    }
    onClose()
  }

  const planoIdValue = watch('planoId')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input id="nome" {...register('nome')} placeholder="Nome do aluno" />
              {errors.nome && <p className="text-xs text-red-600">{errors.nome.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" type="email" {...register('email')} placeholder="email@exemplo.com" disabled={isEditing} />
              {(errors as { email?: { message?: string } }).email && <p className="text-xs text-red-600">{(errors as { email?: { message?: string } }).email?.message}</p>}
            </div>

            {!isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha *</Label>
                <Input id="senha" type="password" {...register('senha')} placeholder="Mínimo 6 caracteres" />
                {(errors as { senha?: { message?: string } }).senha && (
                  <p className="text-xs text-red-600">{(errors as { senha?: { message?: string } }).senha?.message}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register('telefone')} placeholder="(11) 99999-9999" />
            </div>

            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={planoIdValue ?? ''} onValueChange={(v) => setValue('planoId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem plano</SelectItem>
                  {planos.filter(p => p.ativo).map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>{plano.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataNascimento">Data de nascimento</Label>
              <Input id="dataNascimento" type="date" {...register('dataNascimento')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...register('cidade')} placeholder="Cidade" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input id="estado" {...register('estado')} placeholder="SP" maxLength={2} className="uppercase" />
            </div>

            {isEditing && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={(watch as (k: string) => string)('status') ?? 'ATIVO'}
                  onValueChange={(v) => setValue('status' as never, v as never)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || createAluno.isPending || updateAluno.isPending}>
              {isEditing ? 'Salvar alterações' : 'Cadastrar aluno'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
