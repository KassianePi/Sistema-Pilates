import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateProfessor, useUpdateProfessor } from '../hooks/useProfessores'
import type { Professor } from '@/types/domain.types'

const createSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone: z.string().optional(),
  especialidade: z.string().optional(),
  bio: z.string().optional(),
})

const editSchema = z.object({
  nome: z.string().min(3),
  telefone: z.string().optional(),
  especialidade: z.string().optional(),
  bio: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO']).optional(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

interface Props {
  open: boolean
  onClose: () => void
  professor?: Professor | null
}

export function ProfessorFormModal({ open, onClose, professor }: Props) {
  const isEditing = !!professor
  const createProfessor = useCreateProfessor()
  const updateProfessor = useUpdateProfessor()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
  })

  useEffect(() => {
    if (professor) {
      reset({
        nome: professor.usuario.nome,
        telefone: professor.usuario.telefone ?? '',
        especialidade: professor.especialidade ?? '',
        bio: professor.bio ?? '',
        status: professor.status,
      })
    } else {
      reset({ nome: '', email: '', senha: '', telefone: '', especialidade: '', bio: '' })
    }
  }, [professor, reset, open])

  async function onSubmit(values: CreateForm | EditForm) {
    if (isEditing && professor) {
      await updateProfessor.mutateAsync({ id: professor.id, dto: values as EditForm })
    } else {
      await createProfessor.mutateAsync(values as CreateForm)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Professor' : 'Novo Professor'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo *</Label>
            <Input id="nome" {...register('nome')} placeholder="Nome do professor" />
            {errors.nome && <p className="text-xs text-red-600">{errors.nome.message}</p>}
          </div>

          {!isEditing && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" {...register('email' as never)} placeholder="email@exemplo.com" />
                {(errors as { email?: { message?: string } }).email && (
                  <p className="text-xs text-red-600">{(errors as { email?: { message?: string } }).email?.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha *</Label>
                <Input id="senha" type="password" {...register('senha' as never)} placeholder="Mínimo 6 caracteres" />
                {(errors as { senha?: { message?: string } }).senha && (
                  <p className="text-xs text-red-600">{(errors as { senha?: { message?: string } }).senha?.message}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" {...register('telefone')} placeholder="(11) 99999-9999" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="especialidade">Especialidade</Label>
            <Input id="especialidade" {...register('especialidade')} placeholder="Ex: Pilates clínico, Reformer..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" {...register('bio')} placeholder="Breve descrição do professor..." rows={3} />
          </div>

          {isEditing && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={(watch as (k: string) => string)('status') ?? 'ATIVO'} onValueChange={(v) => setValue('status' as never, v as never)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || createProfessor.isPending || updateProfessor.isPending}>
              {isEditing ? 'Salvar alterações' : 'Cadastrar professor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
