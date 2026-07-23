import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save, RefreshCw, PlayCircle, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useConfiguracaoGeracaoAutomatica } from '../hooks/useConfiguracaoGeracaoAutomatica'
import { useExecutarGeracaoMensalidades } from '../hooks/useExecutarGeracaoMensalidades'
import {
  DIAS_ANTES_GERACAO_MIN,
  DIAS_ANTES_GERACAO_MAX,
  MAXIMO_MENSALIDADES_FUTURAS_MIN,
  MAXIMO_MENSALIDADES_FUTURAS_MAX,
} from '../constants/geracaoAutomatica.constants'

const schema = z.object({
  geracaoAutomaticaAtiva: z.boolean().optional(),
  diasAntesGeracao: z.coerce.number().int().min(DIAS_ANTES_GERACAO_MIN).max(DIAS_ANTES_GERACAO_MAX),
  maximoMensalidadesFuturas: z.coerce
    .number()
    .int()
    .min(MAXIMO_MENSALIDADES_FUTURAS_MIN)
    .max(MAXIMO_MENSALIDADES_FUTURAS_MAX),
})
type FormValues = z.infer<typeof schema>

export function SecaoGeracaoAutomatica() {
  const { config, isLoading, salvar, isSaving } = useConfiguracaoGeracaoAutomatica()
  const { executar, isExecuting, progresso } = useExecutarGeracaoMensalidades()
  const [confirmando, setConfirmando] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (config) {
      reset({
        geracaoAutomaticaAtiva: config.geracaoAutomaticaAtiva ?? true,
        diasAntesGeracao: config.diasAntesGeracao ?? 5,
        maximoMensalidadesFuturas: config.maximoMensalidadesFuturas ?? 1,
      })
    }
  }, [config, reset])

  async function onSubmit(values: FormValues) {
    await salvar(values)
  }

  async function confirmarExecucao() {
    setConfirmando(false)
    await executar(false)
  }

  const progressoPercent =
    progresso && progresso.totalAlunosElegiveis > 0
      ? Math.round((progresso.alunosAnalisados / progresso.totalAlunosElegiveis) * 100)
      : null

  if (isLoading) return <div className="text-cinza-medio text-sm py-4">Carregando...</div>

  return (
    <div className="bg-branco-puro rounded-xl border border-bege-cartao p-6 space-y-5">
      <h2 className="text-sm font-semibold text-cinza-forte uppercase tracking-wide flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-roxo-profundo" />
        Geração automática de mensalidades
      </h2>
      <p className="text-xs text-cinza-texto">
        Gera automaticamente a próxima mensalidade de cada aluno ativo, alguns dias antes do vencimento. Nunca gera
        cobrança PIX — isso continua acontecendo sob demanda do aluno, pelo portal.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <label className="flex items-start gap-2.5 bg-lilas-claro/30 border border-lilas-medio/20 rounded-lg p-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('geracaoAutomaticaAtiva')}
            className="mt-0.5 w-4 h-4 rounded border-cinza-medio/50 text-roxo-profundo focus:ring-roxo-profundo/30"
          />
          <span className="text-sm">
            <span className="block font-medium text-cinza-forte">Gerar mensalidades automaticamente</span>
            <span className="block text-xs text-cinza-texto mt-0.5">
              Desligado, nenhuma mensalidade é gerada automaticamente — nem pelo job agendado, nem pelo botão "Executar
              agora" abaixo.
            </span>
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="diasAntesGeracao">Dias antes do vencimento</Label>
            <Input
              id="diasAntesGeracao"
              type="number"
              min={DIAS_ANTES_GERACAO_MIN}
              max={DIAS_ANTES_GERACAO_MAX}
              {...register('diasAntesGeracao')}
            />
            {errors.diasAntesGeracao && <p className="text-xs text-rosa-vibrante">{errors.diasAntesGeracao.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maximoMensalidadesFuturas">Máximo de mensalidades futuras</Label>
            <Input
              id="maximoMensalidadesFuturas"
              type="number"
              min={MAXIMO_MENSALIDADES_FUTURAS_MIN}
              max={MAXIMO_MENSALIDADES_FUTURAS_MAX}
              {...register('maximoMensalidadesFuturas')}
            />
            {errors.maximoMensalidadesFuturas && (
              <p className="text-xs text-rosa-vibrante">{errors.maximoMensalidadesFuturas.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting || isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar configurações
          </Button>
        </div>
      </form>

      <div className="border-t border-bege-cartao pt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => executar(true)} disabled={isExecuting}>
            <FlaskConical className="w-4 h-4 mr-1.5" /> Simular
          </Button>
          <Button type="button" size="sm" onClick={() => setConfirmando(true)} disabled={isExecuting}>
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-1.5" />
            )}
            Executar agora
          </Button>
        </div>

        {progressoPercent !== null && (
          <div className="space-y-1">
            <div className="h-2 bg-bege-suave rounded-full overflow-hidden">
              <div
                className="h-full bg-roxo-profundo rounded-full transition-all"
                style={{ width: `${progressoPercent}%` }}
              />
            </div>
            <p className="text-xs text-cinza-texto">
              {progresso?.alunosAnalisados}/{progresso?.totalAlunosElegiveis} analisados ·{' '}
              {progresso?.mensalidadesCriadas} criadas
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Executar geração automática?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá analisar todos os alunos ativos e criar as mensalidades que estiverem dentro da janela de
              geração configurada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExecucao} disabled={isExecuting}>
              Executar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
