import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { loginAdmin } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginForm) {
    try {
      await loginAdmin(data.email, data.senha)
      navigate('/admin/dashboard')
    } catch {
      toast.error('E-mail ou senha incorretos.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-roxo-profundo flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-rosa-vibrante/10" />

        <div className="relative z-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-rosa-vibrante/20 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-rosa-vibrante" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-branco-puro leading-tight">
              Studio de
              <br />
              <span className="text-lilas-medio">Pilates</span>
            </h1>
            <p className="mt-3 text-white/60 text-lg">
              Área Administrativa
            </p>
          </div>
          <div className="flex flex-col gap-3 mt-8 text-left max-w-xs mx-auto">
            {[
              'Gestão completa de alunos e professores',
              'Controle financeiro e mensalidades',
              'Agenda e presença em tempo real',
            ].map((text) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-rosa-vibrante/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-rosa-vibrante" />
                </div>
                <p className="text-white/70 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito - formulário */}
      <div className="flex-1 flex items-center justify-center bg-creme-fundo px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header mobile */}
          <div className="lg:hidden text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-xl bg-roxo-profundo flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-branco-puro" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-cinza-forte">
              Studio de Pilates
            </h2>
            <p className="text-cinza-texto text-sm mt-1">Área Administrativa</p>
          </div>

          {/* Título do formulário */}
          <div className="hidden lg:block">
            <h2 className="text-3xl font-bold text-cinza-forte">
              Bem-vindo de volta
            </h2>
            <p className="text-cinza-texto mt-2">
              Acesse o painel administrativo do studio.
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@studio.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-rosa-vibrante text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('senha')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cinza-medio hover:text-cinza-forte transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-rosa-vibrante text-xs mt-1">
                  {errors.senha.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-xs text-cinza-medio">
            Acesso restrito a administradores autorizados.
          </p>
        </div>
      </div>
    </div>
  )
}
