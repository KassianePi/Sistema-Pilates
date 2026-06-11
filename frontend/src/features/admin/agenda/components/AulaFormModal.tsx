import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateAula, useUpdateAula } from '../hooks/useAgenda'
import { useProfessores } from '@/features/admin/professores/hooks/useProfessores'
import { modalidadesService } from '@/services/modalidades.service'
import type { Aula } from '@/types/domain.types'

const schema = z.object({
  professorId: z.string().min(1, 'Selecione um professor'),
  sala: z.string().min(1, 'Informe a sala'),
  data: z.string().min(1, 'Selecione uma data'),
  horaInicio: z.string().min(1, 'Informe o horário de início'),
  horaFim: z.string().min(1, 'Informe o horário de fim'),
  capacidade: z.number().int().min(1, 'Mínimo 1 vaga'),
  tipo: z.enum(['INDIVIDUAL', 'DUPLA', 'GRUPO']),
  categoria: z.enum(['GERAL', 'SOB_DEMANDA']),
  modalidadeId: z.string().optional().nullable(),
  observacoes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  aula?: Aula | null
}

const TIPOS = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'DUPLA', label: 'Dupla' },
  { value: 'GRUPO', label: 'Grupo' },
]

export function AulaFormModal({ open, onClose, aula }: Props) {
  const isEditing = !!aula
  const createAula = useCreateAula()
  const updateAula = useUpdateAula()
  const { data: profData } = useProfessores({ limite: 100 })
  const professores = profData?.data ?? []

  const { data: modalidadesData } = useQuery({
    queryKey: ['modalidades-ativas'],
    queryFn: () => modalidadesService.listar(true),
  })
  const modalidades = modalidadesData ?? []

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'GRUPO', categoria: 'GERAL', capacidade: 8 },
  })

  useEffect(() => {
    if (aula) {
      reset({
        professorId: aula.professorId,
        sala: aula.sala ?? '',
        data: aula.data,
        horaInicio: aula.horaInicio,
        horaFim: aula.horaFim,
        capacidade: aula.vagas,
        tipo: aula.tipo,
        categoria: aula.categoria ?? 'GERAL',
        modalidadeId: aula.modalidadeId ?? null,
        observacoes: aula.observacoes ?? '',
      })
    } else {
      reset({ professorId: '', sala: '', data: '', horaInicio: '', horaFim: '', capacidade: 8, tipo: 'GRUPO', categoria: 'GERAL', modalidadeId: null, observacoes: '' })
    }
  }, [aula, reset, open])

  function calcDuracao(horaInicio: string, horaFim: string): number {
    const [hi, mi] = horaInicio.split(':').map(Number)
    const [hf, mf] = horaFim.split(':').map(Number)
    return Math.max(15, (hf * 60 + mf) - (hi * 60 + mi))
  }

  async function onSubmit(values: FormData) {
    const dataHoraInicio = `${values.data}T${values.horaInicio}:00`
    const duracao = calcDuracao(values.horaInicio, values.horaFim)

    if (isEditing && aula) {
      await updateAula.mutateAsync({
        id: aula.id,
        dto: { dataHoraInicio, duracao, capacidade: values.capacidade, sala: values.sala, tipo: values.tipo, categoria: values.categoria, modalidadeId: values.modalidadeId, observacoes: values.observacoes },
      })
    } else {
      await createAula.mutateAsync({
        professorId: values.professorId,
        dataHoraInicio,
        duracao,
        capacidade: values.capacidade,
        sala: values.sala,
        tipo: values.tipo,
        categoria: values.categoria,
        modalidadeId: values.modalidadeId,
        observacoes: values.observacoes,
      })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Aula' : 'Nova Aula'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Professor *</Label>
              <Select value={watch('professorId')} onValueChange={(v) => setValue('professorId', v)} disabled={isEditing}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent>
                  {professores.filter(p => p.status === 'ATIVO').map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.usuario.nomeCompleto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.professorId && <p className="text-xs text-red-600">{errors.professorId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sala">Sala *</Label>
              <Input id="sala" {...register('sala')} placeholder="Ex: Sala 1, Studio Principal" />
              {errors.sala && <p className="text-xs text-red-600">{errors.sala.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacidade">Capacidade (vagas) *</Label>
              <Input id="capacidade" type="number" min="1" {...register('capacidade', { valueAsNumber: true })} />
              {errors.capacidade && <p className="text-xs text-red-600">{errors.capacidade.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="data">Data *</Label>
              <Input id="data" type="date" {...register('data')} />
              {errors.data && <p className="text-xs text-red-600">{errors.data.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horaInicio">Início *</Label>
              <Input id="horaInicio" type="time" {...register('horaInicio')} />
              {errors.horaInicio && <p className="text-xs text-red-600">{errors.horaInicio.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horaFim">Fim *</Label>
              <Input id="horaFim" type="time" {...register('horaFim')} />
              {errors.horaFim && <p className="text-xs text-red-600">{errors.horaFim.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={watch('tipo')} onValueChange={(v) => setValue('tipo', v as FormData['tipo'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria *</Label>
              <Select value={watch('categoria')} onValueChange={(v) => setValue('categoria', v as FormData['categoria'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GERAL">Geral (grade regular)</SelectItem>
                  <SelectItem value="SOB_DEMANDA">Sob demanda (particular/reposição)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Modalidade</Label>
              <Select
                value={watch('modalidadeId') ?? ''}
                onValueChange={(v) => setValue('modalidadeId', v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma modalidade" />
                </SelectTrigger>
                <SelectContent>
                  {modalidades.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register('observacoes')} rows={2} placeholder="Observações adicionais..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || createAula.isPending || updateAula.isPending}>
              {isEditing ? 'Salvar alterações' : 'Agendar aula'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
