import { useState } from 'react'
import {
  CalendarDays, ClipboardCheck, CreditCard, ChevronRight, Clock, CheckCircle2,
  AlertTriangle, AlertCircle, Send, Users, Upload, FileCheck, Sparkles, History,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { agendaService } from '@/services/agenda.service'
import { financeiroService } from '@/services/financeiro.service'
import type { AlunoUser } from '@/types/auth.types'
import type { StatusMensalidade, CategoriaAula, Aula } from '@/types/domain.types'

function formatarDataCurta(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}
function formatarValor(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

const STATUS_MENSALIDADE: Record<StatusMensalidade, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline'; Icon: React.ElementType }> = {
  PAGO: { label: 'Em dia', variant: 'success', Icon: CheckCircle2 },
  PENDENTE: { label: 'Pendente', variant: 'warning', Icon: AlertTriangle },
  VENCIDO: { label: 'Vencido', variant: 'destructive', Icon: AlertCircle },
  CANCELADO: { label: 'Cancelado', variant: 'outline', Icon: () => null },
  PARCIAL: { label: 'Parcial', variant: 'warning', Icon: AlertTriangle },
}

const CATEGORIA_TAG: Record<CategoriaAula, { label: string; className: string }> = {
  GERAL: { label: 'Grade regular', className: 'bg-lilas-claro text-roxo-profundo border-lilas-medio/30' },
  SOB_DEMANDA: { label: 'Sob demanda', className: 'bg-rosa-vibrante/10 text-rosa-vibrante border-rosa-vibrante/30' },
}

// ────────────────────────────────────────────────────────────────────────────
// Acesso rápido
// ────────────────────────────────────────────────────────────────────────────

interface QuickLinkProps {
  to: string
  icon: React.ElementType
  label: string
  description: string
  iconColor: string
  iconBg: string
}

function QuickLink({ to, icon: Icon, label, description, iconColor, iconBg }: QuickLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 rounded-xl bg-branco-puro border border-bege-cartao hover:border-lilas-medio hover:shadow-sm transition-all group"
    >
      <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-cinza-forte text-sm">{label}</p>
        <p className="text-cinza-texto text-xs mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-cinza-medio group-hover:text-lilas-medio transition-colors" />
    </Link>
  )
}

const quickLinks: QuickLinkProps[] = [
  { to: '/aluno/agenda', icon: CalendarDays, label: 'Minhas Aulas', description: 'Veja seus horários e próximas aulas', iconColor: 'text-roxo-profundo', iconBg: 'bg-lilas-claro' },
  { to: '/aluno/presenca', icon: ClipboardCheck, label: 'Minha Presença', description: 'Acompanhe sua frequência nas aulas', iconColor: 'text-rosa-vibrante', iconBg: 'bg-rosa-vibrante/10' },
  { to: '/aluno/financeiro', icon: CreditCard, label: 'Financeiro', description: 'Mensalidades, pagamentos e estornos', iconColor: 'text-green-600', iconBg: 'bg-green-50' },
]

// ────────────────────────────────────────────────────────────────────────────
// Seção: Agenda segmentada
// ────────────────────────────────────────────────────────────────────────────

type Escopo = 'minhas' | 'gerais' | 'historico'

const FILTROS: { value: Escopo; label: string; Icon: React.ElementType }[] = [
  { value: 'minhas', label: 'Minhas aulas', Icon: CalendarDays },
  { value: 'gerais', label: 'Aulas gerais', Icon: Sparkles },
  { value: 'historico', label: 'Histórico', Icon: History },
]

function AulaItem({ aula }: { aula: Aula }) {
  const tag = CATEGORIA_TAG[aula.categoria ?? 'GERAL']
  return (
    <li className="flex items-start justify-between gap-3 py-3 flex-wrap">
      <div className="space-y-0.5 min-w-0">
        <p className="font-medium text-cinza-forte text-sm">{aula.titulo}</p>
        <p className="text-xs text-cinza-texto capitalize">{formatarDataCurta(aula.data)}</p>
        <div className="flex items-center gap-3 text-xs text-cinza-medio">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{aula.horaInicio} – {aula.horaFim}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{aula.professor.usuario.nomeCompleto}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className={cn('text-[11px] px-2 py-0.5 rounded-full border font-medium', tag.className)}>{tag.label}</span>
        <span className="text-[11px] text-cinza-medio">{aula.vagasOcupadas}/{aula.vagas} vagas</span>
      </div>
    </li>
  )
}

function AgendaSection() {
  const [escopo, setEscopo] = useState<Escopo>('minhas')

  const { data, isLoading } = useQuery({
    queryKey: ['aulas-aluno-dashboard', escopo],
    queryFn: () => agendaService.listarAulasAluno({ escopo, limit: 50 }),
  })
  const aulas = data?.data ?? []

  const vazio: Record<Escopo, string> = {
    minhas: 'Você não tem aulas agendadas.',
    gerais: 'Nenhuma aula geral disponível no momento.',
    historico: 'Nenhuma aula no seu histórico ainda.',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-roxo-profundo" /> Minha Agenda
        </CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => setEscopo(f.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                escopo === f.value
                  ? 'bg-roxo-profundo text-branco-puro border-roxo-profundo'
                  : 'bg-branco-puro text-cinza-texto border-bege-cartao hover:bg-lilas-claro/40',
              )}
            >
              <f.Icon className="w-3.5 h-3.5" /> {f.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Legenda de segmentação */}
        <div className="flex flex-wrap gap-3 mb-3 text-[11px] text-cinza-medio">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-lilas-medio inline-block" /> Grade regular
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rosa-vibrante inline-block" /> Sob demanda
          </span>
        </div>

        {isLoading ? (
          <p className="text-cinza-medio text-sm py-8 text-center">Carregando...</p>
        ) : aulas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-cinza-medio">
            <CalendarDays className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">{vazio[escopo]}</p>
          </div>
        ) : (
          <ul className="divide-y divide-bege-cartao">
            {aulas.map((aula) => <AulaItem key={aula.id} aula={aula} />)}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Modal: enviar comprovante por mensalidade
// ────────────────────────────────────────────────────────────────────────────

function ModalEnviarComprovante({ mensalidadeId, nomePlano, onClose }: {
  mensalidadeId: string; nomePlano: string; onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [arquivo, setArquivo] = useState<{ base64: string; nome: string; tipo: string } | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setArquivo({ base64: reader.result as string, nome: file.name, tipo: file.type })
    reader.readAsDataURL(file)
  }

  const mutation = useMutation({
    mutationFn: () => financeiroService.enviarComprovante({
      mensalidadeId,
      arquivo: arquivo!.base64,
      nomeArquivo: arquivo!.nome,
      tipoArquivo: arquivo!.tipo,
    }),
    onSuccess: () => {
      toast.success('Comprovante enviado! Aguarde a análise do studio.')
      queryClient.invalidateQueries({ queryKey: ['comprovantes-aluno-dashboard'] })
      onClose()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Erro ao enviar comprovante.'),
  })

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-roxo-profundo" /> Enviar Comprovante
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="bg-lilas-claro/40 border border-lilas-medio/20 rounded-lg p-3 text-sm">
            <p className="font-medium text-cinza-forte">{nomePlano}</p>
            <p className="text-cinza-texto mt-0.5">Envie a foto ou PDF do comprovante do pagamento PIX desta mensalidade.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Arquivo <span className="text-cinza-medio text-xs">(máx. 5MB — JPG, PNG, PDF)</span></Label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFile}
              className="block w-full text-sm text-cinza-texto file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-bege-cartao file:text-xs file:font-medium file:bg-branco-puro hover:file:bg-bege-cartao/50 cursor-pointer"
            />
            {arquivo && <p className="text-xs text-green-700 flex items-center gap-1"><FileCheck className="w-3.5 h-3.5" /> {arquivo.nome}</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !arquivo}
              className="bg-roxo-profundo hover:bg-roxo-profundo/90"
            >
              {mutation.isPending ? 'Enviando...' : 'Enviar comprovante'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Seção: Mensalidades
// ────────────────────────────────────────────────────────────────────────────

function MensalidadesSection() {
  const [comprovanteModal, setComprovanteModal] = useState<{ id: string; nomePlano: string } | null>(null)
  const [notificandoId, setNotificandoId] = useState<string | null>(null)

  const { data: mensalidadesData, isLoading } = useQuery({
    queryKey: ['mensalidades-aluno-dashboard'],
    queryFn: () => financeiroService.listarMinhasMensalidades({ limite: 12 }),
  })
  const { data: comprovantes } = useQuery({
    queryKey: ['comprovantes-aluno-dashboard'],
    queryFn: () => financeiroService.listarMeusComprovantes(),
  })

  const notificarPagamento = useMutation({
    mutationFn: (mensalidadeId: string) => financeiroService.notificarPagamento(mensalidadeId),
    onSuccess: () => { toast.success('Studio notificado! Aguarde a confirmação do pagamento.'); setNotificandoId(null) },
    onError: (err: any) => { toast.error(err?.response?.data?.message ?? 'Erro ao notificar pagamento.'); setNotificandoId(null) },
  })

  const mensalidades = mensalidadesData?.data ?? []
  const comComprovante = new Set(
    (comprovantes ?? []).filter((c: any) => c.status === 'PENDENTE' || c.status === 'APROVADO').map((c: any) => c.mensalidadeId),
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-roxo-profundo" /> Minhas Mensalidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-cinza-medio text-sm py-8 text-center">Carregando...</p>
        ) : mensalidades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-cinza-medio">
            <CreditCard className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Nenhuma mensalidade encontrada.</p>
          </div>
        ) : (
          <ul className="divide-y divide-bege-cartao">
            {mensalidades.map((m: any) => {
              const info = STATUS_MENSALIDADE[m.status as StatusMensalidade] ?? STATUS_MENSALIDADE.PENDENTE
              const emAberto = m.status === 'PENDENTE' || m.status === 'VENCIDO'
              const jaEnviou = comComprovante.has(m.id)
              return (
                <li key={m.id} className="flex items-start justify-between gap-3 py-3 flex-wrap">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-medium text-cinza-forte text-sm">{m.plano?.nome ?? 'Aula avulsa'}</p>
                    <p className="text-xs text-cinza-medio">Vencimento: {formatarData(m.vencimento ?? m.dataVencimento)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className="font-semibold text-cinza-forte text-sm">{formatarValor(m.valor)}</span>
                    <Badge variant={info.variant}><info.Icon className="w-3 h-3 mr-1" />{info.label}</Badge>
                    {emAberto && !jaEnviou && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-roxo-profundo border-roxo-profundo/30 hover:bg-roxo-profundo/5"
                        onClick={() => setComprovanteModal({ id: m.id, nomePlano: m.plano?.nome ?? 'Avulso' })}
                      >
                        <Upload className="w-3.5 h-3.5 mr-1" /> Enviar comprovante
                      </Button>
                    )}
                    {emAberto && !jaEnviou && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-cinza-texto border-bege-cartao hover:bg-bege-cartao/40"
                        onClick={() => { setNotificandoId(m.id); notificarPagamento.mutate(m.id) }}
                        disabled={notificarPagamento.isPending && notificandoId === m.id}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        {notificarPagamento.isPending && notificandoId === m.id ? 'Enviando...' : 'Notificar'}
                      </Button>
                    )}
                    {emAberto && jaEnviou && (
                      <span className="text-xs text-amber-600 italic">Comprovante enviado</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <Link to="/aluno/financeiro" className="inline-flex items-center gap-1 text-xs text-lilas-medio hover:underline mt-3">
          Ver histórico completo e estornos <ChevronRight className="w-3 h-3" />
        </Link>
      </CardContent>

      {comprovanteModal && (
        <ModalEnviarComprovante
          mensalidadeId={comprovanteModal.id}
          nomePlano={comprovanteModal.nomePlano}
          onClose={() => setComprovanteModal(null)}
        />
      )}
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Página
// ────────────────────────────────────────────────────────────────────────────

export function AlunoDashboardPage() {
  const { user } = useAuth()
  const alunoUser = user as AlunoUser | null
  const firstName = alunoUser?.nome?.split(' ')[0] ?? 'Aluno'

  return (
    <div className="space-y-8">
      {/* Saudação */}
      <div className="bg-roxo-profundo text-branco-puro rounded-2xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-rosa-vibrante flex items-center justify-center flex-shrink-0 text-xl font-bold">
          {firstName.charAt(0)}
        </div>
        <div>
          <p className="text-white/70 text-sm">Bem-vindo de volta,</p>
          <h1 className="text-2xl font-bold mt-0.5">{firstName}!</h1>
          {alunoUser?.plano && (
            <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-white/10 text-white/80">
              Plano: {alunoUser.plano}
            </span>
          )}
        </div>
      </div>

      {/* Acesso rápido */}
      <section>
        <h2 className="text-sm font-semibold text-cinza-medio uppercase tracking-wider mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => <QuickLink key={link.to} {...link} />)}
        </div>
      </section>

      {/* Agenda + Mensalidades */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AgendaSection />
        <MensalidadesSection />
      </section>
    </div>
  )
}
