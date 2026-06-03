import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreatePlano, useUpdatePlano } from '../hooks/usePlanos'
import type { Plano } from '@/types/domain.types'

const schema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  valor: z.number().positive('Valor deve ser positivo'),
  duracaoMeses: z.number().int().min(1, 'Duração mínima de 1 mês'),
  aulasSemanais: z.number().int().min(1, 'Mínimo 1 aula por semana'),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  plano?: Plano | null
}

export function PlanoFormModal({ open, onClose, plano }: Props) {
  const isEditing = !!plano
  const createPlano = useCreatePlano()
  const updatePlano = useUpdatePlano()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (plano) {
      reset({
        nome: plano.nome,
        descricao: plano.descricao ?? '',
        valor: plano.valor,
        duracaoMeses: plano.duracaoMeses,
        aulasSemanais: plano.aulasSemanais,
      })
    } else {
      reset({ nome: '', descricao: '', valor: 0, duracaoMeses: 1, aulasSemanais: 2 })
    }
  }, [plano, reset, open])

  async function onSubmit(values: FormData) {
    if (isEditing && plano) {
      await updatePlano.mutateAsync({ id: plano.id, dto: values })
    } else {
      await createPlano.mutateAsync(values)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome do plano *</Label>
            <Input id="nome" {...register('nome')} placeholder="Ex: Plano Mensal 2x" />
            {errors.nome && <p className="text-xs text-red-600">{errors.nome.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" {...register('descricao')} placeholder="Detalhes do plano..." rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input id="valor" type="number" step="0.01" min="0" {...register('valor', { valueAsNumber: true })} placeholder="0,00" />
              {errors.valor && <p className="text-xs text-red-600">{errors.valor.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duracaoMeses">Duração (meses) *</Label>
              <Input id="duracaoMeses" type="number" min="1" {...register('duracaoMeses', { valueAsNumber: true })} />
              {errors.duracaoMeses && <p className="text-xs text-red-600">{errors.duracaoMeses.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aulasSemanais">Aulas/semana *</Label>
              <Input id="aulasSemanais" type="number" min="1" max="7" {...register('aulasSemanais', { valueAsNumber: true })} />
              {errors.aulasSemanais && <p className="text-xs text-red-600">{errors.aulasSemanais.message}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || createPlano.isPending || updatePlano.isPending}>
              {isEditing ? 'Salvar alterações' : 'Criar plano'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
