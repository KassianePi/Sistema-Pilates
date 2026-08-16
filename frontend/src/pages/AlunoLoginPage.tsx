import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Dumbbell, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { formatCPF, onlyDigits } from '@/lib/formatters'

const loginSchema = z.object({
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function AlunoLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const { loginAluno } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { cpf: '', senha: '' } })

  async function onSubmit(data: LoginForm) {
    try {
      await loginAluno(data.cpf, data.senha)
      navigate('/aluno/dashboard')
    } catch {
      toast.error('CPF ou senha incorretos.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-roxo-profundo flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-rosa-vibrante/10" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/4 right-1/4 w-40 h-40 rounded-full bg-lilas-medio/10" />

        <div className="relative z-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-rosa-vibrante flex items-center justify-center shadow-lg shadow-rosa-vibrante/30">
              <Dumbbell className="w-10 h-10 text-branco-puro" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-branco-puro leading-tight">
              Studio de
              <br />
              <span className="text-rosa-vibrante">Pilates</span>
            </h1>
            <p className="mt-3 text-white/60 text-lg">Portal do Aluno</p>
          </div>
          <div className="mt-8 bg-white/5 rounded-xl p-6 max-w-xs mx-auto text-left space-y-4">
            {[
              { icon: '📅', text: 'Visualize suas aulas e horários' },
              { icon: '✅', text: 'Acompanhe sua frequência' },
              { icon: '💳', text: 'Gerencie seus pagamentos' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <p className="text-white/70 text-sm">{item.text}</p>
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
              <div className="w-14 h-14 rounded-xl bg-rosa-vibrante flex items-center justify-center shadow-md">
                <Dumbbell className="w-7 h-7 text-branco-puro" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-cinza-forte">Studio de Pilates</h2>
            <p className="text-cinza-texto text-sm mt-1">Portal do Aluno</p>
          </div>

          {/* Título do formulário */}
          <div className="hidden lg:block">
            <h2 className="text-3xl font-bold text-cinza-forte">Olá, bem-vindo!</h2>
            <p className="text-cinza-texto mt-2">Acesse sua conta para ver suas aulas e progresso.</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Controller
                name="cpf"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    autoComplete="username"
                    value={formatCPF(value ?? '')}
                    onChange={(e) => onChange(onlyDigits(e.target.value))}
                  />
                )}
              />
              {errors.cpf && <p className="text-rosa-vibrante text-xs mt-1">{errors.cpf.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha</Label>
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-xs font-medium text-roxo-profundo hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cinza-texto hover:text-cinza-forte transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.senha && <p className="text-rosa-vibrante text-xs mt-1">{errors.senha.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Acessar minha conta'}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <p className="text-xs text-cinza-texto">Problemas para entrar? Fale com a recepção do studio.</p>
            <div className="pt-3 border-t border-bege-cartao">
              <Link to="/admin/login" className="text-xs font-medium text-roxo-profundo hover:underline">
                É da equipe? Acessar o painel administrativo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recuperação de senha (reset é manual pelo studio) */}
      <Dialog open={showReset} onOpenChange={setShowReset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-roxo-profundo" /> Recuperar acesso
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1 text-sm text-cinza-texto">
            <p>Por segurança, a redefinição de senha é feita pelo studio.</p>
            <p>
              Entre em contato com a recepção (pessoalmente ou pelo WhatsApp), informe seu CPF e o studio definirá uma
              nova senha para você.
            </p>
            <Button className="w-full" onClick={() => setShowReset(false)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
