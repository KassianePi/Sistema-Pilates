import { useState } from 'react'
import { FileText, Plus, Pencil, Eye, Send, Users, Download, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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
import { TermoDocumento } from '@/features/termos/components/TermoDocumento'
import { gerarTermoPdf } from '@/features/termos/lib/termoPdf'
import {
  useTermosAdmin,
  useCriarTermo,
  useEditarTermo,
  usePublicarTermo,
  useAceitesTermo,
} from '@/features/termos/hooks/useTermos'
import type { TermoUso } from '@/services/termos.service'

const fmtData = (d: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—')
const fmtDataHora = (d: string) =>
  new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const CONTEUDO_MODELO = `## 1. Identificação das Partes

Texto da seção...

## 2. Objeto

Texto da seção...

## 3. Política de Reembolso

O reembolso pode ser solicitado em até 7 dias úteis após a matrícula...`

// ---------------- Criar / editar versão ----------------
function FormVersaoModal({ termo, onClose }: { termo?: TermoUso | null; onClose: () => void }) {
  const isEditing = !!termo
  const [titulo, setTitulo] = useState(termo?.titulo ?? 'Termos de Uso e Prestação de Serviços')
  const [conteudo, setConteudo] = useState(termo?.conteudo ?? CONTEUDO_MODELO)
  const criar = useCriarTermo()
  const editar = useEditarTermo()
  const salvando = criar.isPending || editar.isPending

  function salvar() {
    const payload = { titulo: titulo.trim(), conteudo: conteudo.trim() }
    if (isEditing) {
      editar.mutate({ id: termo!.id, ...payload }, { onSuccess: onClose })
    } else {
      criar.mutate(payload, { onSuccess: onClose })
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar versão ${termo!.versao} (rascunho)` : 'Nova versão do termo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 overflow-y-auto flex-1 pr-1">
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Conteúdo</Label>
            <Textarea
              rows={16}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="font-mono text-xs leading-relaxed"
            />
            <p className="text-xs text-cinza-texto">
              Formatação: <code>## Título</code>, <code>### Subtítulo</code>, <code>- item</code> de lista e{' '}
              <code>**negrito**</code>. A política de reembolso (7 dias úteis) e os dados da clínica aparecem
              automaticamente em destaque.
            </p>
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || titulo.trim().length < 3 || conteudo.trim().length < 20}>
            {salvando ? 'Salvando...' : isEditing ? 'Salvar rascunho' : 'Criar rascunho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------- Pré-visualização ----------------
function PreviewModal({ termo, onClose }: { termo: TermoUso; onClose: () => void }) {
  const [baixando, setBaixando] = useState(false)
  async function baixar() {
    setBaixando(true)
    try {
      await gerarTermoPdf(termo)
    } catch {
      toast.error('Não foi possível gerar o PDF.')
    } finally {
      setBaixando(false)
    }
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pré-visualização — versão {termo.versao}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 border border-bege-cartao rounded-lg p-4 sm:p-6">
          <TermoDocumento termo={termo} />
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={baixar} disabled={baixando}>
            <Download className="w-4 h-4 mr-1.5" /> {baixando ? 'Gerando...' : 'Baixar PDF'}
          </Button>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------- Aceites de uma versão ----------------
function AceitesModal({ termo, onClose }: { termo: TermoUso; onClose: () => void }) {
  const { data: aceites = [], isLoading } = useAceitesTermo(termo.id)
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-roxo-profundo" /> Aceites da versão {termo.versao}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 -mt-1">
          {isLoading ? (
            <p className="text-sm text-cinza-texto text-center py-8">Carregando...</p>
          ) : aceites.length === 0 ? (
            <p className="text-sm text-cinza-texto text-center py-8">Nenhum aluno aceitou esta versão ainda.</p>
          ) : (
            <ul className="divide-y divide-bege-cartao">
              {aceites.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cinza-forte truncate">{a.aluno.usuario.nomeCompleto}</p>
                    <p className="text-xs text-cinza-texto truncate">{a.aluno.usuario.email}</p>
                  </div>
                  <span className="text-xs text-cinza-texto shrink-0">{fmtDataHora(a.aceitoEm)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter className="mt-2">
          <Badge variant="secondary">
            {aceites.length} aceite{aceites.length !== 1 ? 's' : ''}
          </Badge>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AdminTermosPage() {
  const { data: termos = [], isLoading } = useTermosAdmin()
  const publicar = usePublicarTermo()

  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState<TermoUso | null>(null)
  const [previewing, setPreviewing] = useState<TermoUso | null>(null)
  const [vendoAceites, setVendoAceites] = useState<TermoUso | null>(null)
  const [publicando, setPublicando] = useState<TermoUso | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-cinza-forte flex items-center gap-2">
            <FileText className="w-6 h-6 text-roxo-profundo" /> Termos de Uso
          </h1>
          <p className="text-sm text-cinza-texto mt-1">
            Crie, edite e publique as versões do termo. Versões publicadas são imutáveis.
          </p>
        </div>
        <Button onClick={() => setCriando(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nova versão
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-roxo-profundo" /> Versões
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-cinza-texto text-sm py-6 text-center">Carregando...</p>
          ) : termos.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-cinza-texto">
              <FileText className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Nenhuma versão cadastrada. Crie a primeira versão.</p>
            </div>
          ) : (
            <ul className="divide-y divide-bege-cartao">
              {termos.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3 gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-cinza-forte truncate">
                        v{t.versao} · {t.titulo}
                      </p>
                      {t.publicado ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Publicada
                        </Badge>
                      ) : (
                        <Badge variant="outline">Rascunho</Badge>
                      )}
                    </div>
                    <p className="text-xs text-cinza-texto mt-0.5">
                      {t.publicado ? `Publicada em ${fmtData(t.publicadoEm)}` : `Criada em ${fmtData(t.criadoEm)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cinza-medio hover:text-cinza-forte"
                      title="Pré-visualizar"
                      onClick={() => setPreviewing(t)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cinza-medio hover:text-cinza-forte"
                      title="Ver aceites"
                      onClick={() => setVendoAceites(t)}
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    {!t.publicado && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-cinza-medio hover:text-cinza-forte"
                          title="Editar"
                          onClick={() => setEditando(t)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-roxo-profundo hover:text-rosa-vibrante"
                          title="Publicar"
                          onClick={() => setPublicando(t)}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {criando && <FormVersaoModal onClose={() => setCriando(false)} />}
      {editando && <FormVersaoModal termo={editando} onClose={() => setEditando(null)} />}
      {previewing && <PreviewModal termo={previewing} onClose={() => setPreviewing(null)} />}
      {vendoAceites && <AceitesModal termo={vendoAceites} onClose={() => setVendoAceites(null)} />}

      <AlertDialog open={!!publicando} onOpenChange={(v) => !v && setPublicando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar versão {publicando?.versao}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta versão passará a ser a vigente e será apresentada aos alunos para aceite. Após publicada, ela não
              poderá mais ser editada. As demais versões serão despublicadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (publicando)
                  publicar.mutate(publicando.id, {
                    onSuccess: () => setPublicando(null),
                  })
              }}
            >
              Publicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
