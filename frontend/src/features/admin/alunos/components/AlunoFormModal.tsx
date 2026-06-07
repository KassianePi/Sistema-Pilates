import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateAluno, useUpdateAluno } from '../hooks/useAlunos'
import { usePlanos } from '@/features/admin/planos/hooks/usePlanos'
import { formatCPF, formatTelefone, onlyDigits } from '@/lib/formatters'
import type { Aluno } from '@/types/domain.types'

// Schemas de validação — os campos mascarados armazenam dígitos limpos
const createSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
  planoId: z.string().optional(),
  dataInicio: z.string().min(1, 'Informe a data de início'),
  dataNascimento: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)').optional().or(z.literal('')),
})

const editSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
  planoId: z.string().optional(),
  dataNascimento: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)').optional().or(z.literal('')),
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

  const {
    register, handleSubmit, reset, setValue, watch, control,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
  })

  useEffect(() => {
    if (aluno) {
      reset({
        nomeCompleto: aluno.usuario.nomeCompleto,
        email: aluno.usuario.email,
        senha: '',
        telefone: aluno.usuario.telefone ?? '',
        planoId: aluno.planoId ?? '',
        dataNascimento: aluno.dataNascimento ? aluno.dataNascimento.split('T')[0] : '',
        cidade: aluno.cidade ?? '',
        estado: aluno.estado ?? '',
        status: aluno.status,
      })
    } else {
      reset({
        nomeCompleto: '', email: '', cpf: '', senha: '', telefone: '',
        planoId: '', dataInicio: new Date().toISOString().split('T')[0],
        dataNascimento: '', cidade: '', estado: '',
      })
    }
  }, [aluno, reset, open])

  async function onSubmit(values: CreateForm | EditForm) {
    // Normaliza valores antes de enviar à API
    const payload = {
      ...values,
      planoId: (values.planoId && values.planoId.trim()) ? values.planoId : undefined,
      telefone: (values.telefone && values.telefone.length) ? values.telefone : undefined,
      estado: values.estado ? (values.estado as string).toUpperCase() : undefined,
      email: (values as any).email?.trim() || undefined,
      senha: (values as any).senha?.trim() || undefined,
    }

    if (isEditing && aluno) {
      await updateAluno.mutateAsync({ id: aluno.id, dto: payload as EditForm })
    } else {
      await createAluno.mutateAsync(payload as CreateForm)
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

            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="nomeCompleto">Nome completo *</Label>
              <Input id="nomeCompleto" {...register('nomeCompleto')} placeholder="Nome do aluno" />
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

                {/* Data de início */}
                <div className="space-y-1.5">
                  <Label htmlFor="dataInicio">Data de início *</Label>
                  <Input id="dataInicio" type="date" {...register('dataInicio' as never)} />
                  {(errors as { dataInicio?: { message?: string } }).dataInicio && (
                    <p className="text-xs text-rosa-vibrante">{(errors as { dataInicio?: { message?: string } }).dataInicio?.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Email (edição) */}
            {isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="email-edit">E-mail</Label>
                <Input id="email-edit" type="email" {...register('email' as never)} placeholder="email@exemplo.com" />
                {(errors as { email?: { message?: string } }).email && (
                  <p className="text-xs text-rosa-vibrante">{(errors as { email?: { message?: string } }).email?.message}</p>
                )}
              </div>
            )}

            {/* Nova senha (edição) */}
            {isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="senha-edit">Nova senha <span className="text-cinza-medio text-xs">(deixe vazio para não alterar)</span></Label>
                <Input id="senha-edit" type="password" {...register('senha' as never)} placeholder="Mínimo 6 caracteres" />
                {(errors as { senha?: { message?: string } }).senha && (
                  <p className="text-xs text-rosa-vibrante">{(errors as { senha?: { message?: string } }).senha?.message}</p>
                )}
              </div>
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

            {/* Plano */}
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select
                value={planoIdValue || 'none'}
                onValueChange={(v) => setValue('planoId', v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem plano</SelectItem>
                  {planos.filter(p => p.ativo).map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>{plano.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data de nascimento */}
            <div className="space-y-1.5">
              <Label htmlFor="dataNascimento">Data de nascimento</Label>
              <Input id="dataNascimento" type="date" {...register('dataNascimento')} />
            </div>

            {/* Cidade */}
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...register('cidade')} placeholder="Cidade" />
            </div>

            {/* Estado — auto-uppercase */}
            <div className="space-y-1.5">
              <Label htmlFor="estado">Estado (UF)</Label>
              <Controller
                name={'estado' as never}
                control={control as never}
                render={({ field: { onChange, value } }: any) => (
                  <Input
                    id="estado"
                    placeholder="SP"
                    maxLength={2}
                    value={(value ?? '').toUpperCase()}
                    onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                  />
                )}
              />
              {errors.estado && <p className="text-xs text-rosa-vibrante">{errors.estado.message}</p>}
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
