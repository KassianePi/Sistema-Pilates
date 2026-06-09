import { useState } from 'react'
import {
  DollarSign, CheckCircle2, Clock, AlertTriangle, QrCode, Copy,
  RotateCcw, Info, ChevronDown, ChevronUp, Send, Zap,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { financeiroService } from '@/services/financeiro.service'
import { configuracaoService } from '@/services/configuracao.service'
import { estornosService } from '@/services/estornos.service'
import type { StatusMensalidade } from '@/types/domain.types'
import type { Estorno, StatusEstorno } from '@/services/estornos.service'

function formatarValor(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

const STATUS_MENSALIDADE: Record<StatusMensalidade, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline'; Icon: React.ElementType }> = {
  PAGO: { label: 'Pago', variant: 'success', Icon: CheckCircle2 },
  PENDENTE: { label: 'Pendente', variant: 'warning', Icon: Clock },
  VENCIDO: { label: 'Vencido', variant: 'destructive', Icon: AlertTriangle },
  CANCELADO: { label: 'Cancelado', variant: 'outline', Icon: () => null },
  PARCIAL: { label: 'Parcial', variant: 'warning', Icon: Clock },
}

const STATUS_ESTORNO: Record<StatusEstorno, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }> = {
  SOLICITADO: { label: 'Aguardando análise', variant: 'warning' },
  APROVADO: { label: 'Aprovado', variant: 'success' },
  PROCESSADO: { label: 'Concluído', variant: 'success' },
  NEGADO: { label: 'Negado', variant: 'destructive' },
}

const TIPO_CHAVE: Record<string, string> = {
  CPF: 'CPF',
  EMAIL: 'E-mail',
  CELULAR: 'Celular',
  ALEATORIA: 'Chave aleatória',
}

function CardPix({ chavePix, tipoChavePix, nomeRecebedor, qrCodeBase64 }: {
  chavePix?: string | null; tipoChavePix?: string | null
  nomeRecebedor?: string | null; qrCodeBase64?: string | null
}) {
  function copiar() {
    if (chavePix) {
      navigator.clipboard.writeText(chavePix)
      toast.success('Chave PIX copiada!')
    }
  }

  return (
    <Card className="border-lilas-medio/30 bg-lilas-claro/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-roxo-profundo">
          <QrCode className="w-4 h-4" /> Como pagar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-cinza-texto">
          Realize o pagamento via PIX e aguarde a confirmação do seu studio.
        </p>

        {chavePix && (
          <div className="bg-branco-puro rounded-lg p-3 border border-lilas-medio/20 space-y-1">
            <p className="text-xs text-cinza-medio">{tipoChavePix ? TIPO_CHAVE[tipoChavePix] ?? tipoChavePix : 'Chave PIX'}</p>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm font-semibold text-cinza-forte flex-1 break-all">{chavePix}</p>
              <Button variant="outline" size="sm" onClick={copiar} className="shrink-0">
                <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
              </Button>
            </div>
            {nomeRecebedor && <p className="text-xs text-cinza-texto">Recebedor: <strong>{nomeRecebedor}</strong></p>}
          </div>
        )}

        {qrCodeBase64 && (
          <div className="flex justify-center">
            <img src={qrCodeBase64} alt="QR Code PIX" className="w-40 h-40 object-contain border border-bege-cartao rounded-lg" />
          </div>
        )}

        <p className="text-xs text-cinza-medio flex items-center gap-1">
          <Info className="w-3 h-3" />
          Após o pagamento, avise seu studio. A confirmação é feita manualmente.
        </p>
      </CardContent>
    </Card>
  )
}

function ModalEstorno({ mensalidadeId, onClose }: { mensalidadeId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [motivo, setMotivo] = useState('')

  const mutation = useMutation({
    mutationFn: () => estornosService.solicitar(mensalidadeId, motivo.trim() || undefined),
    onSuccess: () => {
      toast.success('Solicitação de estorno enviada. Aguarde a análise do studio.')
      queryClient.invalidateQueries({ queryKey: ['mensalidades-aluno'] })
      queryClient.invalidateQueries({ queryKey: ['estornos-aluno'] })
      onClose()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Erro ao solicitar estorno.'
      toast.error(msg)
    },
  })

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rosa-vibrante" /> Solicitar Estorno
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-1">
            <p className="font-medium">Como funciona o estorno proporcional:</p>
            <p>O valor devolvido é calculado com base nos dias contratados no plano menos os dias em que você compareceu neste mês.</p>
            <p className="text-xs">Exemplo: se o plano tem 12 aulas e você foi a 8, o estorno cobre 4 aulas.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Motivo <span className="text-cinza-medio text-xs">(opcional)</span></Label>
            <Textarea
              placeholder="Descreva o motivo da solicitação..."
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="bg-rosa-vibrante hover:bg-rosa-vibrante/90">
              {mutation.isPending ? 'Enviando...' : 'Solicitar estorno'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ModalNotificarPagamento({ mensalidadeId, nomePlano, onClose }: {
  mensalidadeId: string; nomePlano: string; onClose: () => void
}) {
  const [observacoes, setObservacoes] = useState('')

  const mutation = useMutation({
    mutationFn: () => financeiroService.notificarPagamento(mensalidadeId, observacoes.trim() || undefined),
    onSuccess: () => {
      toast.success('Studio notificado! Aguarde a confirmação do pagamento.')
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao enviar notificação.')
    },
  })

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-4 h-4 text-roxo-profundo" /> Notificar Pagamento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-lilas-claro/40 border border-lilas-medio/20 rounded-lg p-3 space-y-1 text-sm">
            <p className="font-medium text-cinza-forte">{nomePlano}</p>
            <p className="text-cinza-texto">
              Após realizar o pagamento via PIX, clique em <strong>Enviar notificação</strong> para avisar o studio. O pagamento será confirmado manualmente pelo studio.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Observação <span className="text-cinza-medio text-xs">(opcional)</span></Label>
            <Textarea
              placeholder="Ex: PIX enviado às 14h30 de R$ 120,00 para a chave..."
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="bg-roxo-profundo hover:bg-roxo-profundo/90"
            >
              {mutation.isPending ? 'Enviando...' : 'Enviar notificação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ModalSolicitarAvulsa({ onClose }: { onClose: () => void }) {
  const [dataDesejada, setDataDesejada] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const mutation = useMutation({
    mutationFn: () => financeiroService.solicitarAulaAvulsa(dataDesejada || undefined, observacoes.trim() || undefined),
    onSuccess: () => {
      toast.success('Solicitação enviada! O studio entrará em contato para confirmar.')
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Erro ao enviar solicitação.')
    },
  })

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-lilas-medio" /> Solicitar Aula Avulsa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-cinza-texto">
            Solicite uma aula avulsa ao studio. O administrador criará a cobrança e confirmará a data.
          </p>
          <div className="space-y-1.5">
            <Label>Data desejada <span className="text-cinza-medio text-xs">(opcional)</span></Label>
            <Input
              type="date"
              value={dataDesejada}
              onChange={(e) => setDataDesejada(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Observação <span className="text-cinza-medio text-xs">(opcional)</span></Label>
            <Textarea
              placeholder="Ex: horário preferido, modalidade, professor..."
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="bg-lilas-medio hover:bg-roxo-profundo text-branco-puro"
            >
              {mutation.isPending ? 'Enviando...' : 'Enviar solicitação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SecaoEstornos({ estornos }: { estornos: Estorno[] }) {
  const [expandido, setExpandido] = useState(false)
  if (estornos.length === 0) return null

  const visiveis = expandido ? estornos : estornos.slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-rosa-vibrante" /> Solicitações de Estorno
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-bege-cartao">
          {visiveis.map((e) => {
            const info = STATUS_ESTORNO[e.status]
            const mesRef = e.mensalidade?.mesReferencia ? formatarData(e.mensalidade.mesReferencia) : '—'
            return (
              <li key={e.id} className="py-3 flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-cinza-forte">
                    {e.mensalidade?.plano?.nome ?? 'Avulso'} — ref. {mesRef}
                  </p>
                  <p className="text-xs text-cinza-medio">
                    {e.diasComparecidos} de {e.diasContratados} aulas comparecidas
                    {e.motivo && ` · ${e.motivo}`}
                  </p>
                  <p className="text-xs text-cinza-texto">Solicitado em {formatarData(e.criadoEm)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold text-cinza-forte">{formatarValor(e.valorEstorno)}</span>
                  <Badge variant={info.variant}>{info.label}</Badge>
                </div>
              </li>
            )
          })}
        </ul>
        {estornos.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-cinza-texto"
            onClick={() => setExpandido(!expandido)}
          >
            {expandido ? <><ChevronUp className="w-4 h-4 mr-1" /> Ver menos</> : <><ChevronDown className="w-4 h-4 mr-1" /> Ver todos ({estornos.length})</>}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function AlunoFinanceiroPage() {
  const [estornoMensalidadeId, setEstornoMensalidadeId] = useState<string | null>(null)
  const [notificarMensalidade, setNotificarMensalidade] = useState<{ id: string; nomePlano: string } | null>(null)
  const [modalAvulso, setModalAvulso] = useState(false)

  const { data: mensalidadesData, isLoading } = useQuery({
    queryKey: ['mensalidades-aluno'],
    queryFn: () => financeiroService.listarMinhasMensalidades({ limite: 24 }),
  })

  const { data: config } = useQuery({
    queryKey: ['configuracao-studio'],
    queryFn: configuracaoService.buscar,
  })

  const { data: estornosData } = useQuery({
    queryKey: ['estornos-aluno'],
    queryFn: () => estornosService.listarMeusEstornos({ limit: 50 }),
  })

  const mensalidades = mensalidadesData?.data ?? []
  const estornos: Estorno[] = estornosData?.estornos ?? []

  const pendentes = mensalidades.filter((m: any) => m.status === 'PENDENTE' || m.status === 'VENCIDO')
  const totalPago = mensalidades.reduce((acc: number, m: any) => m.status === 'PAGO' ? acc + m.valor : acc, 0)
  const temPix = !!(config?.chavePix || config?.qrCodeBase64)

  // Mensalidades que já têm estorno ativo (não negado) — desabilita botão
  const mensalidadesComEstorno = new Set(
    estornos.filter((e) => e.status !== 'NEGADO').map((e) => e.mensalidadeId)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Meu Financeiro</h1>
        <p className="text-sm text-cinza-texto mt-1">Histórico de mensalidades e pagamentos.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-cinza-texto">Total pago</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatarValor(totalPago)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-cinza-texto">Pendentes / Vencidos</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendentes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-cinza-texto">Total de registros</p>
            <p className="text-2xl font-bold text-cinza-forte mt-1">{mensalidades.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Solicitar aula avulsa */}
      <Card className="border-lilas-medio/30">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium text-cinza-forte">Aula Avulsa</p>
            <p className="text-sm text-cinza-texto mt-0.5">Sem plano mensal? Solicite uma aula avulsa ao studio.</p>
          </div>
          <Button
            variant="outline"
            className="border-lilas-medio text-roxo-profundo hover:bg-lilas-claro shrink-0"
            onClick={() => setModalAvulso(true)}
          >
            <Zap className="w-4 h-4 mr-1" /> Solicitar
          </Button>
        </CardContent>
      </Card>

      {/* PIX (só exibe quando há pendências e PIX configurado) */}
      {pendentes.length > 0 && temPix && (
        <CardPix
          chavePix={config?.chavePix}
          tipoChavePix={config?.tipoChavePix}
          nomeRecebedor={config?.nomeRecebedor}
          qrCodeBase64={config?.qrCodeBase64}
        />
      )}

      {/* Histórico de mensalidades */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensalidades</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-cinza-medio text-sm py-6 text-center">Carregando...</p>
          ) : mensalidades.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-cinza-medio">
              <DollarSign className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma mensalidade encontrada.</p>
            </div>
          ) : (
            <ul className="divide-y divide-bege-cartao">
              {mensalidades.map((m: any) => {
                const statusInfo = STATUS_MENSALIDADE[m.status as StatusMensalidade] ?? STATUS_MENSALIDADE.PENDENTE
                const { label, variant, Icon } = statusInfo
                const podeSolicitarEstorno = (m.status === 'PAGO' || m.status === 'PARCIAL') && !mensalidadesComEstorno.has(m.id)
                const temEstornoAtivo = mensalidadesComEstorno.has(m.id)
                return (
                  <li key={m.id} className="flex items-start justify-between py-3 gap-3 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-cinza-forte">{m.plano?.nome ?? 'Avulso'}</p>
                      <p className="text-xs text-cinza-medio">Vencimento: {formatarData(m.vencimento ?? m.dataVencimento)}</p>
                      {m.status === 'PAGO' && m.pagamentos?.length > 0 && (
                        <p className="text-xs text-green-700">
                          Pago em {formatarData(m.pagamentos[m.pagamentos.length - 1].dataPagamento)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className="font-semibold text-cinza-forte">{formatarValor(m.valor)}</span>
                      <Badge variant={variant}>
                        <Icon className="w-3 h-3 mr-1" />
                        {label}
                      </Badge>
                      {(m.status === 'PENDENTE' || m.status === 'VENCIDO') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-roxo-profundo border-roxo-profundo/30 hover:bg-roxo-profundo/5"
                          onClick={() => setNotificarMensalidade({ id: m.id, nomePlano: m.plano?.nome ?? 'Avulso' })}
                        >
                          <Send className="w-3 h-3 mr-1" /> Notificar pagamento
                        </Button>
                      )}
                      {podeSolicitarEstorno && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-rosa-vibrante border-rosa-vibrante/30 hover:bg-rosa-vibrante/5"
                          onClick={() => setEstornoMensalidadeId(m.id)}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Estorno
                        </Button>
                      )}
                      {temEstornoAtivo && (
                        <span className="text-xs text-cinza-medio italic">Estorno solicitado</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Histórico de estornos */}
      <SecaoEstornos estornos={estornos} />

      {estornoMensalidadeId && (
        <ModalEstorno mensalidadeId={estornoMensalidadeId} onClose={() => setEstornoMensalidadeId(null)} />
      )}

      {notificarMensalidade && (
        <ModalNotificarPagamento
          mensalidadeId={notificarMensalidade.id}
          nomePlano={notificarMensalidade.nomePlano}
          onClose={() => setNotificarMensalidade(null)}
        />
      )}

      {modalAvulso && <ModalSolicitarAvulsa onClose={() => setModalAvulso(false)} />}
    </div>
  )
}
