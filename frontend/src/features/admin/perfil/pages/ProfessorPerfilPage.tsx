import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { User, Phone, Mail, BookOpen, Sparkles, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { meService } from '@/services/me.service'

const perfilSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  telefone: z.string().regex(/^\d{10,11}$/, 'Telefone inválido').optional().or(z.literal('')),
  especialidade: z.string().max(200).optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional().or(z.literal('')),
})

type PerfilForm = z.infer<typeof perfilSchema>

export function ProfessorPerfilPage() {
  const queryClient = useQueryClient()

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['meu-perfil'],
    queryFn: meService.getMeuPerfil,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PerfilForm>({ resolver: zodResolver(perfilSchema) })

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
        <h1 className="text-2xl font-bold text-preto-silhueta">Meu Perfil</h1>
        <p className="text-cinza-texto text-sm mt-1">Gerencie suas informações pessoais e profissionais.</p>
      </div>

      {/* Card de identidade */}
      <div className="bg-branco-puro rounded-xl border border-bege-cartao p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-roxo-profundo/10 flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-roxo-profundo" />
        </div>
        <div>
          <p className="font-semibold text-preto-silhueta">{perfil?.nome}</p>
          <p className="text-sm text-cinza-texto">{perfil?.email}</p>
          <span className="inline-block mt-1 text-xs bg-ouro-clinica/15 text-ouro-escuro font-medium px-2 py-0.5 rounded-full">
            Professor
          </span>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="bg-branco-puro rounded-xl border border-bege-cartao p-6 space-y-5">
        <h2 className="text-sm font-semibold text-cinza-forte uppercase tracking-wide mb-4">Dados Pessoais</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="nomeCompleto" className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
              <User className="w-3.5 h-3.5" /> Nome Completo
            </Label>
            <Input
              id="nomeCompleto"
              {...register('nomeCompleto')}
              className="border-cinza-medio/50 focus:border-ouro-clinica"
            />
            {errors.nomeCompleto && <p className="text-rosa-vibrante text-xs">{errors.nomeCompleto.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefone" className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
              <Phone className="w-3.5 h-3.5" /> Telefone
            </Label>
            <Input
              id="telefone"
              placeholder="11999999999"
              {...register('telefone')}
              className="border-cinza-medio/50 focus:border-ouro-clinica"
            />
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
              className="border-cinza-medio/50 focus:border-ouro-clinica"
            />
            {errors.especialidade && <p className="text-rosa-vibrante text-xs">{errors.especialidade.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio" className="flex items-center gap-1.5 text-cinza-forte font-medium text-sm">
              <BookOpen className="w-3.5 h-3.5" /> Sobre mim
            </Label>
            <textarea
              id="bio"
              rows={4}
              placeholder="Breve descrição sobre sua experiência e abordagem..."
              {...register('bio')}
              className="w-full rounded-md border border-cinza-medio/50 px-3 py-2 text-sm focus:outline-none focus:border-ouro-clinica focus:ring-1 focus:ring-ouro-clinica/20 resize-none bg-white"
            />
            {errors.bio && <p className="text-rosa-vibrante text-xs">{errors.bio.message}</p>}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="ouro"
            disabled={isSubmitting || mutation.isPending || !isDirty}
            className="gap-2"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
