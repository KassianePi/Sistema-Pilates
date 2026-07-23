import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, Phone, Mail, BookOpen, Sparkles, Save, Loader2, QrCode, Key, Building2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { meService } from '@/services/me.service'
import { configuracaoService } from '@/services/configuracao.service'
import type { ConfiguracaoStudio } from '@/services/configuracao.service'
import { useAuth } from '@/hooks/useAuth'
import type { AdminUser } from '@/types/auth.types'
import { SecaoGeracaoAutomatica } from '../components/SecaoGeracaoAutomatica'

const perfilSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  telefone: z
    .string()
    .regex(/^\d{10,11}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  especialidade: z.string().max(200).optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional().or(z.literal('')),
})

const pixSchema = z.object({
  chavePix: z.string().max(255).optional().or(z.literal('')),
  tipoChavePix: z.enum(['CPF', 'EMAIL', 'CELULAR', 'ALEATORIA']).optional(),
  nomeRecebedor: z.string().max(255).optional().or(z.literal('')),
  usarPixAutomatico: z.boolean().optional(),
})

type PerfilForm = z.infer<typeof perfilSchema>
type PixForm = z.infer<typeof pixSchema>

function SecaoPix() {
  const queryClient = useQueryClient()
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [qrBase64, setQrBase64] = useState<string | null>(null)

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracao-studio'],
    queryFn: configuracaoService.buscar,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PixForm>({
    resolver: zodResolver(pixSchema),
  })

  useEffect(() => {
    if (config) {
      reset({
        chavePix: config.chavePix ?? '',
        tipoChavePix: config.tipoChavePix ?? undefined,
        nomeRecebedor: config.nomeRecebedor ?? '',
        usarPixAutomatico: config.usarPixAutomatico ?? true,
      })
      if (config.qrCodeBase64) {
        setPreview(config.qrCodeBase64)
        setQrBase64(config.qrCodeBase64)
      }
    }
  }, [config, reset])

  const mutation = useMutation({
    mutationFn: (dados: ConfiguracaoStudio) => configuracaoService.salvar(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-studio'] })
      toast.success('Dados de pagamento salvos.')
    },
    onError: () => toast.error('Erro ao salvar dados de pagamento.'),
  })

  function onArquivoQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024 * 2) {
      toast.error('QR Code deve ter no máximo 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setPreview(base64)
      setQrBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  function removerQr() {
    setPreview(null)
    setQrBase64(null)
    if (inputFileRef.current) inputFileRef.current.value = ''
  }

  async function onSubmit(values: PixForm) {
    await mutation.mutateAsync({
      chavePix: values.chavePix?.trim() || null,
      tipoChavePix: values.tipoChavePix ?? null,
      nomeRecebedor: values.nomeRecebedor?.trim() || null,
      qrCodeBase64: qrBase64,
      usarPixAutomatico: values.usarPixAutomatico ?? true,
    })
  }

  if (isLoading) return <div className="text-cinza-medio text-sm py-4">Carregando...</div>

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-branco-puro rounded-xl border border-bege-cartao p-6 space-y-5"
    >
      <h2 className="text-sm font-semibold text-cinza-forte uppercase tracking-wide flex items-center gap-2">
        <QrCode className="w-4 h-4 text-roxo-profundo" />
        Dados de Pagamento PIX
      </h2>
      <p className="text-xs text-cinza-texto">
        Estas informações serão exibidas no portal do aluno quando houver mensalidade pendente.
      </p>

      <label className="flex items-start gap-2.5 bg-lilas-claro/30 border border-lilas-medio/20 rounded-lg p-3 cursor-pointer">
        <input
          type="checkbox"
          {...register('usarPixAutomatico')}
          className="mt-0.5 w-4 h-4 rounded border-cinza-medio/50 text-roxo-profundo focus:ring-roxo-profundo/30"
        />
        <span className="text-sm">
          <span className="block font-medium text-cinza-forte">Usar cobrança PIX automática (Mercado Pago)</span>
          <span className="block text-xs text-cinza-texto mt-0.5">
            Com isso ligado, o aluno gera e paga o PIX pela própria tela, com confirmação automática. Desligando, o
            portal do aluno volta a mostrar a chave PIX estática abaixo e o envio manual de comprovante.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
            <Key className="w-3.5 h-3.5" /> Tipo de chave
          </Label>
          <Select value={watch('tipoChavePix') ?? ''} onValueChange={(v) => setValue('tipoChavePix', v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CPF">CPF</SelectItem>
              <SelectItem value="EMAIL">E-mail</SelectItem>
              <SelectItem value="CELULAR">Celular</SelectItem>
              <SelectItem value="ALEATORIA">Chave aleatória</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
            <Key className="w-3.5 h-3.5" /> Chave PIX
          </Label>
          <Input placeholder="Ex: 11999999999 ou email@studio.com" {...register('chavePix')} />
          {errors.chavePix && <p className="text-rosa-vibrante text-xs">{errors.chavePix.message}</p>}
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
            <Building2 className="w-3.5 h-3.5" /> Nome do recebedor
          </Label>
          <Input placeholder="Ex: Studio Pilates LTDA" {...register('nomeRecebedor')} />
          {errors.nomeRecebedor && <p className="text-rosa-vibrante text-xs">{errors.nomeRecebedor.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
          <QrCode className="w-3.5 h-3.5" /> QR Code PIX{' '}
          <span className="text-cinza-medio font-normal">(opcional, PNG/JPG, máx 2MB)</span>
        </Label>
        <input
          ref={inputFileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onArquivoQr}
        />
        {preview ? (
          <div className="flex items-start gap-4">
            <img
              src={preview}
              alt="QR Code PIX"
              className="w-32 h-32 object-contain border border-bege-cartao rounded-lg"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removerQr}
              className="text-rosa-vibrante border-rosa-vibrante/30"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Remover
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={() => inputFileRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Carregar QR Code
          </Button>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar dados de pagamento
        </Button>
      </div>
    </form>
  )
}

export function ProfessorPerfilPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const adminUser = user as AdminUser | null
  const isAdmin = adminUser?.role === 'ADMIN'

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['meu-perfil'],
    queryFn: meService.getMeuPerfil,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
  })

  useEffect(() => {
    if (perfil) {
      reset({
        nomeCompleto: perfil.nome,
        telefone: perfil.telefone ?? '',
        especialidade: perfil.especialidade ?? '',
        bio: perfil.bio ?? '',
      })
    }
  }, [perfil, reset])

  const mutation = useMutation({
    mutationFn: (dados: PerfilForm) =>
      meService.atualizarMeuPerfil({
        nomeCompleto: dados.nomeCompleto,
        telefone: dados.telefone?.trim() || null,
        especialidade: dados.especialidade?.trim() || null,
        bio: dados.bio?.trim() || null,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['meu-perfil'] })
      reset({
        nomeCompleto: updated.nome,
        telefone: updated.telefone ?? '',
        especialidade: updated.especialidade ?? '',
        bio: updated.bio ?? '',
      })
      toast.success('Perfil atualizado com sucesso.')
    },
    onError: () => toast.error('Erro ao atualizar perfil. Tente novamente.'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-cinza-medio" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-cinza-forte">Meu Perfil</h1>
        <p className="text-cinza-texto text-sm mt-1">Gerencie suas informações pessoais e profissionais.</p>
      </div>

      <div className="bg-branco-puro rounded-xl border border-bege-cartao p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-roxo-profundo/10 flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-roxo-profundo" />
        </div>
        <div>
          <p className="font-semibold text-cinza-forte">{perfil?.nome}</p>
          <p className="text-sm text-cinza-texto">{perfil?.email}</p>
          <span className="inline-block mt-1 text-xs bg-lilas-claro text-roxo-profundo font-medium px-2 py-0.5 rounded-full">
            {adminUser?.role ?? 'Usuário'}
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="bg-branco-puro rounded-xl border border-bege-cartao p-6 space-y-5"
      >
        <h2 className="text-sm font-semibold text-cinza-forte uppercase tracking-wide mb-4">Dados Pessoais</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="nomeCompleto" className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
              <User className="w-3.5 h-3.5" /> Nome Completo
            </Label>
            <Input id="nomeCompleto" {...register('nomeCompleto')} />
            {errors.nomeCompleto && <p className="text-rosa-vibrante text-xs">{errors.nomeCompleto.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefone" className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
              <Phone className="w-3.5 h-3.5" /> Telefone
            </Label>
            <Input id="telefone" placeholder="11999999999" {...register('telefone')} />
            {errors.telefone && <p className="text-rosa-vibrante text-xs">{errors.telefone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
              <Mail className="w-3.5 h-3.5" /> E-mail
            </Label>
            <Input
              value={perfil?.email ?? ''}
              disabled
              className="bg-bege-suave/50 border-cinza-medio/30 text-cinza-texto cursor-not-allowed"
            />
            <p className="text-cinza-medio text-xs">Para alterar o e-mail, contate o administrador.</p>
          </div>
        </div>

        <div className="border-t border-bege-cartao pt-5 space-y-4">
          <h2 className="text-sm font-semibold text-cinza-forte uppercase tracking-wide">Perfil Profissional</h2>
          <div className="space-y-1.5">
            <Label htmlFor="especialidade" className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
              <Sparkles className="w-3.5 h-3.5" /> Especialidade
            </Label>
            <Input
              id="especialidade"
              placeholder="Ex: Pilates Clínico, Reabilitação..."
              {...register('especialidade')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio" className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
              <BookOpen className="w-3.5 h-3.5" /> Sobre mim
            </Label>
            <textarea
              id="bio"
              rows={4}
              placeholder="Breve descrição sobre sua experiência..."
              {...register('bio')}
              className="w-full rounded-md border border-cinza-medio/50 px-3 py-2 text-sm focus:outline-none focus:border-lilas-medio focus:ring-1 focus:ring-lilas-medio/20 resize-none bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting || mutation.isPending || !isDirty}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar alterações
          </Button>
        </div>
      </form>

      {isAdmin && <SecaoPix />}
      {isAdmin && <SecaoGeracaoAutomatica />}
    </div>
  )
}
