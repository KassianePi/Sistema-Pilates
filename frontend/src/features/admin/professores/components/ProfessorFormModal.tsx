import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateProfessor, useUpdateProfessor } from '../hooks/useProfessores'
import { formatCPF, formatTelefone, onlyDigits } from '@/lib/formatters'
import type { Professor } from '@/types/domain.types'

const createSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
  especialidade: z.string().optional(),
  bio: z.string().optional(),
})

const editSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
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

  const {
    register, handleSubmit, reset, setValue, watch, control,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
  })

  useEffect(() => {
    if (professor) {
      reset({
        nomeCompleto: professor.usuario.nomeCompleto,
        telefone: professor.usuario.telefone ?? '',
        especialidade: professor.especialidade ?? '',
        bio: professor.bio ?? '',
        status: professor.status,
      })
    } else {
      reset({ nomeCompleto: '', email: '', cpf: '', senha: '', telefone: '', especialidade: '', bio: '' })
    }
  }, [professor, reset, open])

  async function onSubmit(values: CreateForm | EditForm) {
    const payload = {
      ...values,
      telefone: (values.telefone && values.telefone.length) ? values.telefone : undefined,
    }

    if (isEditing && professor) {
      await updateProfessor.mutateAsync({ id: professor.id, dto: payload as EditForm })
    } else {
      await createProfessor.mutateAsync(payload as CreateForm)
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
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="nomeCompleto">Nome completo *</Label>
            <Input id="nomeCompleto" {...register('nomeCompleto')} placeholder="Nome do professor" />
            {errors.nomeCompleto && <p className="text-xs text-rosa-vibrante">{errors.nomeCompleto.message}</p>}
          </div>

          {!isEditing && (
            <>
              {/* E-mail */}
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" type="email" {...register('email' as never)} placeholder="email@exemplo.com" />
                {(errors as { email?: { message?: string } }).email && (
                  <p className="text-xs text-rosa-vibrante">{(errors as { email?: { message?: string } }).email?.message}</p>
                )}
              </div>

              {/* CPF com máscara */}
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF *</Label>
                <Controller
                  name={'cpf' as never}
                  control={control as never}
                  render={({ field: { onChange, value } }: any) => (
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={formatCPF(value ?? '')}
                      onChange={(e) => onChange(onlyDigits(e.target.value))}
                    />
                  )}
                />
                {(errors as { cpf?: { message?: string } }).cpf && (
                  <p className="text-xs text-rosa-vibrante">{(errors as { cpf?: { message?: string } }).cpf?.message}</p>
                )}
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <Label htmlFor="senha">Senha *</Label>
                <Input id="senha" type="password" {...register('senha' as never)} placeholder="Mínimo 6 caracteres" />
                {(errors as { senha?: { message?: string } }).senha && (
                  <p className="text-xs text-rosa-vibrante">{(errors as { senha?: { message?: string } }).senha?.message}</p>
                )}
              </div>
            </>
          )}

          {/* Telefone com máscara */}
          <div className="space-y-1.5">
            <Label htmlFor="telefone">Telefone</Label>
            <Controller
              name={'telefone' as never}
              control={control as never}
              render={({ field: { onChange, value } }: any) => (
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  value={formatTelefone(value ?? '')}
                  onChange={(e) => onChange(onlyDigits(e.target.value))}
                />
              )}
            />
            {errors.telefone && <p className="text-xs text-rosa-vibrante">{errors.telefone.message}</p>}
          </div>

          {/* Especialidade */}
          <div className="space-y-1.5">
            <Label htmlFor="especialidade">Especialidade</Label>
            <Input id="especialidade" {...register('especialidade')} placeholder="Ex: Pilates clínico, Reformer..." />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" {...register('bio')} placeholder="Breve descrição do professor..." rows={3} />
          </div>

          {/* Status (só na edição) */}
          {isEditing && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={(watch as (k: string) => string)('status') ?? 'ATIVO'}
                onValueChange={(v) => setValue('status' as never, v as never)}
              >
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
