import { useState } from 'react'
import { Settings, Plus, UserCheck, UserX, Pencil, X, Search } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatCPF, formatTelefone, onlyDigits } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useUsuarios, useCriarUsuario, useAtualizarUsuario, useAlterarStatusUsuario } from '../hooks/useUsuarios'
import { useAuth } from '@/hooks/useAuth'
import type { UsuarioSistema } from '@/services/usuarios.service'
import type { AdminUser } from '@/types/auth.types'

type FuncaoSistema = 'ADMIN' | 'RECEPCIONISTA' | 'PROFESSOR' | 'FINANCEIRO'

const FUNCAO_LABEL: Record<FuncaoSistema, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  PROFESSOR: 'Professor',
  FINANCEIRO: 'Financeiro',
}

const FUNCAO_BADGE: Record<FuncaoSistema, 'default' | 'secondary' | 'outline' | 'warning'> = {
  ADMIN: 'default',
  RECEPCIONISTA: 'secondary',
  PROFESSOR: 'outline',
  FINANCEIRO: 'warning',
}

function formatarData(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const criarSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
  funcao: z.enum(['ADMIN', 'RECEPCIONISTA', 'PROFESSOR', 'FINANCEIRO'] as const),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  senhaConfirmacao: z.string().min(6),
}).refine(d => d.senha === d.senhaConfirmacao, {
  message: 'Senhas não conferem',
  path: ['senhaConfirmacao'],
})

const editarSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
})

type CriarForm = z.infer<typeof criarSchema>
type EditarForm = z.infer<typeof editarSchema>

// ── Modal Criar ───────────────────────────────────────────────────────────────

function ModalCriar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const criar = useCriarUsuario()
  const form = useForm<CriarForm>({ resolver: zodResolver(criarSchema) })

  async function onSubmit(values: CriarForm) {
    await criar.mutateAsync({
      nome: values.nome,
      email: values.email,
      cpf: values.cpf,
      telefone: values.telefone || undefined,
      senha: values.senha,
      senhaConfirmacao: values.senhaConfirmacao,
      funcao: values.funcao,
    })
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Usuário do Sistema</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome completo *</Label>
              <Input placeholder="João Silva" {...form.register('nome')} />
              {form.formState.errors.nome && <p className="text-xs text-rosa-vibrante">{form.formState.errors.nome.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="joao@pilates.local" {...form.register('email')} />
              {form.formState.errors.email && <p className="text-xs text-rosa-vibrante">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>CPF *</Label>
              <Controller
                name="cpf"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={formatCPF(value ?? '')}
                    onChange={(e) => onChange(onlyDigits(e.target.value))}
                  />
                )}
              />
              {form.formState.errors.cpf && <p className="text-xs text-rosa-vibrante">{form.formState.errors.cpf.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Controller
                name="telefone"
                control={form.control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    value={formatTelefone(value ?? '')}
                    onChange={(e) => onChange(onlyDigits(e.target.value))}
                  />
                )}
              />
              {form.formState.errors.telefone && <p className="text-xs text-rosa-vibrante">{form.formState.errors.telefone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Função *</Label>
              <Select onValueChange={(v) => form.setValue('funcao', v as FuncaoSistema, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FUNCAO_LABEL) as FuncaoSistema[]).map((f) => (
                    <SelectItem key={f} value={f}>{FUNCAO_LABEL[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.funcao && <p className="text-xs text-rosa-vibrante">{form.formState.errors.funcao.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Senha *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" {...form.register('senha')} />
              {form.formState.errors.senha && <p className="text-xs text-rosa-vibrante">{form.formState.errors.senha.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar senha *</Label>
              <Input type="password" placeholder="Repita a senha" {...form.register('senhaConfirmacao')} />
              {form.formState.errors.senhaConfirmacao && <p className="text-xs text-rosa-vibrante">{form.formState.errors.senhaConfirmacao.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={criar.isPending}>
              {criar.isPending ? 'Criando...' : 'Criar usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Modal Editar ──────────────────────────────────────────────────────────────

function ModalEditar({ usuario, onClose }: { usuario: UsuarioSistema; onClose: () => void }) {
  const atualizar = useAtualizarUsuario()
  const form = useForm<EditarForm>({
    resolver: zodResolver(editarSchema),
    defaultValues: {
      nomeCompleto: usuario.nome,
      email: usuario.email,
      senha: '',
      telefone: usuario.telefone ?? '',
    },
  })

  async function onSubmit(values: EditarForm) {
    await atualizar.mutateAsync({
      id: usuario.id,
      dto: {
        nomeCompleto: values.nomeCompleto,
        telefone: values.telefone || null,
        email: values.email?.trim() || undefined,
        senha: values.senha?.trim() || undefined,
      },
    })
    onClose()
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Nome completo *</Label>
            <Input {...form.register('nomeCompleto')} />
            {form.formState.errors.nomeCompleto && <p className="text-xs text-rosa-vibrante">{form.formState.errors.nomeCompleto.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input type="email" {...form.register('email')} />
            {form.formState.errors.email && <p className="text-xs text-rosa-vibrante">{form.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Nova senha <span className="text-cinza-medio text-xs">(deixe vazio para não alterar)</span></Label>
            <Input type="password" placeholder="Mínimo 6 caracteres" {...form.register('senha')} />
            {form.formState.errors.senha && <p className="text-xs text-rosa-vibrante">{form.formState.errors.senha.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Controller
              name="telefone"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  value={formatTelefone(value ?? '')}
                  onChange={(e) => onChange(onlyDigits(e.target.value))}
                />
              )}
            />
            {form.formState.errors.telefone && <p className="text-xs text-rosa-vibrante">{form.formState.errors.telefone.message}</p>}
          </div>
          <p className="text-xs text-cinza-medio">Email, CPF e função não podem ser alterados por aqui.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={atualizar.isPending}>
              {atualizar.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function UsuariosPage() {
  const { user } = useAuth()
  const adminUser = user as AdminUser | null

  const [modalCriar, setModalCriar] = useState(false)
  const [editando, setEditando] = useState<UsuarioSistema | null>(null)
  const [confirmandoStatus, setConfirmandoStatus] = useState<{ usuario: UsuarioSistema; ativo: boolean } | null>(null)
  const [filtroFuncao, setFiltroFuncao] = useState('')
  const [busca, setBusca] = useState('')

  const { data, isLoading } = useUsuarios({ funcao: filtroFuncao || undefined })
  const alterarStatus = useAlterarStatusUsuario()

  const usuarios = (data?.data ?? []).filter((u) =>
    busca
      ? u.nome.toLowerCase().includes(busca.toLowerCase()) ||
        u.email.toLowerCase().includes(busca.toLowerCase())
      : true,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cinza-forte">Usuários e Permissões</h1>
          <p className="text-sm text-cinza-texto mt-1">Gerencie os usuários administrativos do sistema.</p>
        </div>
        <Button onClick={() => setModalCriar(true)}>
          <Plus className="w-4 h-4" />
          Novo usuário
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinza-medio" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-9"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca && (
            <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-cinza-medio hover:text-cinza-forte">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={filtroFuncao || 'all'} onValueChange={(v) => setFiltroFuncao(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todas as funções" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as funções</SelectItem>
            {(Object.keys(FUNCAO_LABEL) as FuncaoSistema[]).map((f) => (
              <SelectItem key={f} value={f}>{FUNCAO_LABEL[f]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="w-4 h-4" />
            Usuários do Sistema
            {data?.total !== undefined && (
              <span className="text-xs text-cinza-medio font-normal">({data.total} total)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-cinza-medio">Carregando...</div>
          ) : usuarios.length === 0 ? (
            <div className="py-12 text-center text-cinza-medio">
              <Settings className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => {
                  const isSelf = u.id === adminUser?.id
                  const funcaoLabel = FUNCAO_LABEL[u.funcao as FuncaoSistema] ?? u.funcao
                  const funcaoBadge = FUNCAO_BADGE[u.funcao as FuncaoSistema] ?? 'outline'
                  return (
                    <TableRow key={u.id} className={u.status === 'INATIVO' ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">
                        {u.nome}
                        {isSelf && <span className="ml-2 text-xs text-cinza-medio">(você)</span>}
                      </TableCell>
                      <TableCell className="text-cinza-texto">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={funcaoBadge}>{funcaoLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === 'ATIVO' ? 'success' : 'outline'}>
                          {u.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-cinza-texto text-sm">{formatarData(u.criadoEm)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditando(u)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {!isSelf && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmandoStatus({ usuario: u, ativo: u.status === 'INATIVO' })}
                              title={u.status === 'ATIVO' ? 'Inativar' : 'Reativar'}
                            >
                              {u.status === 'ATIVO'
                                ? <UserX className="w-3.5 h-3.5 text-rosa-vibrante" />
                                : <UserCheck className="w-3.5 h-3.5 text-green-600" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal criar */}
      <ModalCriar open={modalCriar} onClose={() => setModalCriar(false)} />

      {/* Modal editar */}
      {editando && <ModalEditar usuario={editando} onClose={() => setEditando(null)} />}

      {/* Confirmação de status */}
      <AlertDialog open={!!confirmandoStatus} onOpenChange={(v) => !v && setConfirmandoStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmandoStatus?.ativo ? 'Reativar usuário' : 'Inativar usuário'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmandoStatus?.ativo
                ? `Deseja reativar "${confirmandoStatus.usuario.nome}"? O acesso ao sistema será restaurado.`
                : `Deseja inativar "${confirmandoStatus?.usuario.nome}"? O acesso ao sistema será bloqueado.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmandoStatus) {
                  alterarStatus.mutate({ id: confirmandoStatus.usuario.id, ativo: confirmandoStatus.ativo })
                  setConfirmandoStatus(null)
                }
              }}
            >
              {confirmandoStatus?.ativo ? 'Reativar' : 'Inativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
