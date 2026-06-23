import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  IdCard,
  CreditCard,
  CalendarDays,
  GraduationCap,
  Layers,
  Tag,
  Pencil,
  Check,
  X,
  FileText,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '../../components/PageHeader'
import { LoadingState } from '../../components/LoadingState'
import { useAlunoPerfil, useAtualizarPerfil } from '../../hooks/useAlunoPerfil'
import { formatarData, primeiroNome } from '../../utils/format'

const STATUS_MATRICULA: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }> =
  {
    ATIVO: { label: 'Ativa', variant: 'success' },
    INATIVO: { label: 'Inativa', variant: 'outline' },
    SUSPENSO: { label: 'Suspensa', variant: 'warning' },
    FORMADO: { label: 'Formado', variant: 'secondary' as never },
  }

function Campo({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-cinza-texto mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-cinza-texto">{label}</p>
        <p className="text-sm text-cinza-forte break-words">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export function AlunoPerfilPage() {
  const { data: perfil, isLoading } = useAlunoPerfil()
  const atualizar = useAtualizarPerfil()

  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')

  function abrirEdicao() {
    setNome(perfil?.nome ?? '')
    setTelefone(perfil?.telefone ?? '')
    setEditando(true)
  }

  function salvar() {
    const digits = telefone.replace(/\D/g, '')
    atualizar.mutate({ nomeCompleto: nome.trim(), telefone: digits || null }, { onSuccess: () => setEditando(false) })
  }

  if (isLoading || !perfil) {
    return (
      <div className="space-y-6">
        <PageHeader title="Meu Perfil" subtitle="Seus dados cadastrais." icon={User} />
        <LoadingState />
      </div>
    )
  }

  const statusMat = perfil.statusMatricula
    ? (STATUS_MATRICULA[perfil.statusMatricula] ?? { label: perfil.statusMatricula, variant: 'outline' as const })
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        subtitle="Seus dados cadastrais e acadêmicos."
        icon={User}
        action={
          !editando && (
            <Button variant="outline" size="sm" onClick={abrirEdicao}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
            </Button>
          )
        }
      />

      {/* Cabeçalho do perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rosa-vibrante text-branco-puro flex items-center justify-center text-2xl font-bold shrink-0">
              {primeiroNome(perfil.nome).charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-cinza-forte truncate">{perfil.nome}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {perfil.plano && <Badge variant="secondary">{perfil.plano}</Badge>}
                {statusMat && <Badge variant={statusMat.variant}>Matrícula {statusMat.label}</Badge>}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Dados pessoais */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="text-sm font-semibold text-cinza-forte">Dados pessoais</h2>

          {editando ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Telefone <span className="text-cinza-texto text-xs">(somente números, com DDD)</span>
                </Label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="11999998888"
                  inputMode="numeric"
                />
              </div>
              <Campo icon={Mail} label="E-mail" value={perfil.email} />
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={() => setEditando(false)} disabled={atualizar.isPending}>
                  <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={salvar} disabled={atualizar.isPending || nome.trim().length < 3}>
                  <Check className="w-3.5 h-3.5 mr-1" /> {atualizar.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo icon={User} label="Nome completo" value={perfil.nome} />
              <Campo icon={Mail} label="E-mail" value={perfil.email} />
              <Campo icon={Phone} label="Telefone" value={perfil.telefone} />
              <Campo icon={IdCard} label="CPF" value={perfil.cpf} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados acadêmicos / comerciais */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="text-sm font-semibold text-cinza-forte">Dados acadêmicos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo icon={CreditCard} label="Plano contratado" value={perfil.plano} />
            <Campo icon={Layers} label="Modalidade" value={perfil.modalidade} />
            <Campo icon={Tag} label="Categoria" value={perfil.categoria} />
            <Campo icon={GraduationCap} label="Professor principal" value={perfil.professorPrincipal} />
            <Campo
              icon={CalendarDays}
              label="Início da matrícula"
              value={perfil.dataInicio ? formatarData(perfil.dataInicio) : '—'}
            />
            <Campo icon={User} label="Status da matrícula" value={statusMat?.label} />
          </div>
          <p className="text-xs text-cinza-texto">
            Para alterar plano, modalidade ou status da matrícula, fale com a recepção do studio.
          </p>
        </CardContent>
      </Card>

      {/* Termos de Uso */}
      <Card>
        <CardContent className="p-6">
          <Link to="/aluno/termos" className="flex items-center gap-4 group">
            <span className="p-3 rounded-xl bg-lilas-claro shrink-0">
              <FileText className="w-5 h-5 text-roxo-profundo" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-cinza-forte text-sm">Termos de Uso e Prestação de Serviços</p>
              <p className="text-xs text-cinza-texto mt-0.5">
                Veja o documento vigente, baixe o PDF e consulte seu aceite.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-cinza-medio group-hover:text-lilas-medio transition-colors shrink-0" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
