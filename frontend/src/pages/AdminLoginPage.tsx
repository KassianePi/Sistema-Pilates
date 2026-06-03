import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
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
  const [loginSuccess, setLoginSuccess] = useState(false)
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
      setLoginSuccess(true)
      setTimeout(() => navigate('/admin/dashboard'), 1100)
    } catch {
      toast.error('E-mail ou senha incorretos.')
    }
  }

  return (
    <>
      {/* Overlay de sucesso ao fazer login */}
      {loginSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(245, 239, 224, 0.97)' }}>
          <div className="flex flex-col items-center gap-5 animate-success-expand">
            {/* Círculo dourado com checkmark */}
            <div className="w-24 h-24 rounded-full bg-ouro-clinica flex items-center justify-center shadow-xl">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <path
                  className="animate-check-draw"
                  d="M10 22 L19 31 L34 14"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-preto-silhueta font-semibold text-lg tracking-wide">
                Bem-vindo!
              </p>
              <p className="text-cinza-silhueta text-sm mt-1">
                Entrando no painel...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex">
        {/* Painel esquerdo — design manual da clínica */}
        <div
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center animate-slide-in-left"
          style={{ background: 'linear-gradient(150deg, #F5EFE0 0%, #EAD9BB 100%)' }}
        >
          {/* Folhas decorativas — canto superior direito */}
          <svg className="absolute top-0 right-0 w-56 h-56 opacity-[0.12]" viewBox="0 0 200 200" fill="#8B6914">
            <path d="M190 0 C165 35, 125 55, 85 78 C108 38, 148 8, 190 0Z" />
            <path d="M200 40 C168 65, 138 82, 98 102 C122 62, 162 38, 200 40Z" />
            <path d="M170 0 C155 28, 125 46, 95 62 C112 32, 142 6, 170 0Z" />
            <path d="M200 10 C180 28, 155 40, 120 56 C138 28, 172 10, 200 10Z" />
          </svg>

          {/* Folhas decorativas — canto inferior esquerdo */}
          <svg className="absolute bottom-0 left-0 w-56 h-56 opacity-[0.12]" viewBox="0 0 200 200" fill="#8B6914">
            <path d="M10 200 C35 165, 75 145, 115 122 C92 162, 52 192, 10 200Z" />
            <path d="M0 160 C32 135, 62 118, 102 98 C78 138, 38 162, 0 160Z" />
            <path d="M30 200 C45 172, 75 154, 105 138 C88 168, 58 194, 30 200Z" />
            <path d="M0 190 C20 172, 45 160, 80 144 C62 172, 28 190, 0 190Z" />
          </svg>

          {/* Conteúdo central */}
          <div className="relative z-10 flex flex-col items-center gap-7 px-14 text-center">

            {/* Nome da clínica */}
            <div className="space-y-1.5">
              <h1 className="text-xl font-black text-preto-silhueta tracking-[0.15em] uppercase leading-snug">
                Clínica Performance e Saúde
              </h1>
              <p className="text-xs text-cinza-silhueta tracking-[0.35em] uppercase font-medium">
                Fisioterapia e Pilates
              </p>
            </div>

            {/* Divisor decorativo com lótus */}
            <div className="flex items-center gap-3 text-ouro-clinica">
              <div className="h-px w-14 bg-gradient-to-r from-transparent to-ouro-clinica" />
              <svg width="28" height="22" viewBox="0 0 28 22" fill="currentColor">
                <path d="M14 1C13 5 12 9 12 13C12 16 13 18 14 19C15 18 16 16 16 13C16 9 15 5 14 1Z" />
                <path d="M9 4C7 8 7 13 9 17C10 14 10 10 9 4Z" />
                <path d="M19 4C21 8 21 13 19 17C18 14 18 10 19 4Z" />
                <path d="M5 8C3 12 4 17 7 18C7 14 6 11 5 8Z" />
                <path d="M23 8C25 12 24 17 21 18C21 14 22 11 23 8Z" />
                <path d="M10 19C8 17 5 18 7 21" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                <path d="M18 19C20 17 23 18 21 21" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              </svg>
              <div className="h-px w-14 bg-gradient-to-l from-transparent to-ouro-clinica" />
            </div>

            {/* Tagline */}
            <p className="text-[1.45rem] text-preto-silhueta/75 font-light leading-relaxed">
              Saúde,{' '}
              <span className="text-ouro-clinica italic font-medium">movimento</span>
              <br />
              e{' '}
              <span className="text-ouro-clinica italic font-medium">bem-estar.</span>
            </p>
          </div>

          {/* Linha curva dourada */}
          <svg
            className="absolute w-full"
            style={{ bottom: '56px' }}
            viewBox="0 0 500 36"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="goldCurve" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#9C7A1A" />
                <stop offset="50%" stopColor="#C9A227" />
                <stop offset="100%" stopColor="#E8C355" />
              </linearGradient>
            </defs>
            <path d="M0 28 Q125 8 250 18 Q375 28 500 8" stroke="url(#goldCurve)" strokeWidth="2.5" fill="none" />
          </svg>

          {/* Faixa dourada inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-ouro-escuro via-ouro-clinica to-ouro-claro" />
        </div>

        {/* Painel direito — formulário */}
        <div className="flex-1 flex items-center justify-center bg-creme-fundo px-6 py-12 animate-fade-in">
          <div className="w-full max-w-sm space-y-8">

            {/* Logo */}
            <div className="flex flex-col items-center gap-4 animate-scale-in-spring">
              <img
                src="/logo-clinica.png"
                alt="Logo Clínica Performance e Saúde"
                className="w-24 h-24 rounded-full object-cover border-2 border-ouro-clinica shadow-md"
              />
              <div className="text-center">
                <h1 className="text-lg font-bold text-preto-silhueta leading-tight tracking-wide uppercase">
                  Clínica Performance e Saúde
                </h1>
                <p className="text-xs text-cinza-silhueta tracking-wider uppercase mt-0.5">
                  Fisioterapia e Pilates
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="h-px w-8 bg-ouro-clinica" />
                  <div className="w-1.5 h-1.5 rounded-full bg-ouro-clinica" />
                  <div className="h-px w-8 bg-ouro-clinica" />
                </div>
              </div>
            </div>

            {/* Título */}
            <div className="text-center animate-fade-in-up-d1">
              <h2 className="text-2xl font-bold text-preto-silhueta">
                Bem-vindo de volta
              </h2>
              <p className="text-cinza-texto text-sm mt-1">
                Acesse o painel administrativo
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2 animate-fade-in-up-d2">
                <Label htmlFor="email" className="text-cinza-forte font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@clinica.com"
                  autoComplete="email"
                  className="border-cinza-medio/50 focus:border-ouro-clinica focus:ring-ouro-clinica/20 bg-white"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-rosa-vibrante text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 animate-fade-in-up-d3">
                <Label htmlFor="senha" className="text-cinza-forte font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pr-10 border-cinza-medio/50 focus:border-ouro-clinica focus:ring-ouro-clinica/20 bg-white"
                    {...register('senha')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cinza-medio hover:text-cinza-forte transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-rosa-vibrante text-xs mt-1">
                    {errors.senha.message}
                  </p>
                )}
              </div>

              <div className="animate-fade-in-up-d4">
                <Button
                  type="submit"
                  variant="ouro"
                  className="w-full h-11 font-semibold tracking-wide"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verificando...' : 'Entrar'}
                </Button>
              </div>
            </form>

            <p className="text-center text-xs text-cinza-medio animate-fade-in-up-d4">
              Acesso restrito a administradores autorizados.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
