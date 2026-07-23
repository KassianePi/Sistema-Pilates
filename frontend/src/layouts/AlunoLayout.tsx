import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, CalendarDays, ClipboardList, Receipt, User, LogOut, Bell, HeartPulse } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { AlunoUser } from '@/types/auth.types'
import { ChatSuporte } from '@/components/ChatSuporte'
import { notificacoesService } from '@/services/notificacoes.service'
import { useTermoStatus } from '@/features/termos/hooks/useTermos'
import { AceiteTermosGate } from '@/features/termos/components/AceiteTermosGate'

const navItems = [
  { label: 'Início', to: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Agenda', to: '/aluno/agenda', icon: CalendarDays },
  { label: 'Frequência', to: '/aluno/presenca', icon: ClipboardList },
  { label: 'Financeiro', to: '/aluno/financeiro', icon: Receipt },
  { label: 'Avaliações', to: '/aluno/avaliacoes', icon: HeartPulse },
  { label: 'Notificações', to: '/aluno/notificacoes', icon: Bell },
  { label: 'Meu Perfil', to: '/aluno/perfil', icon: User },
]

// Barra inferior (mobile): apenas os destinos do dia a dia (evita lotar a barra).
const bottomNavItems = navItems.filter((i) => i.to !== '/aluno/perfil' && i.to !== '/aluno/avaliacoes')

export function AlunoLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const alunoUser = user as AlunoUser | null

  // Contador de notificações não lidas (atualiza a cada 60s)
  const { data: notifData } = useQuery({
    queryKey: ['notificacoes-aluno'],
    queryFn: () => notificacoesService.listar({ limite: 50 }),
    refetchInterval: 60_000,
  })
  const naoLidas = notifData?.naoLidas ?? 0

  // Gate de 1º acesso: status do aceite dos termos (fail-open em erro/ausência de termo).
  const { data: termoStatus, isLoading: termoLoading } = useTermoStatus()

  async function handleLogout() {
    await logout()
    navigate('/aluno/login')
  }

  // Aguarda o status na entrada do portal para evitar exibir conteúdo antes do gate.
  if (termoLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme-fundo">
        <div className="w-8 h-8 rounded-full border-2 border-roxo-profundo border-t-transparent animate-spin" />
      </div>
    )
  }

  // Bloqueia o portal enquanto o termo vigente não for aceito.
  if (termoStatus?.requerAceite && termoStatus.termo) {
    return <AceiteTermosGate termo={termoStatus.termo} onSair={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-creme-fundo">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-roxo-profundo text-branco-puro shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div>
            <p className="font-bold text-sm leading-tight">Studio de Pilates</p>
            <p className="text-white/60 text-xs">Área do Aluno</p>
          </div>

          {/* Navegação desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isNotif = item.to === '/aluno/notificacoes'
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-rosa-vibrante text-branco-puro'
                        : 'text-white/70 hover:bg-white/10 hover:text-branco-puro',
                    )
                  }
                >
                  <span className="relative">
                    <item.icon className="w-4 h-4" />
                    {isNotif && naoLidas > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-rosa-vibrante text-branco-puro text-[10px] font-bold flex items-center justify-center">
                        {naoLidas > 9 ? '9+' : naoLidas}
                      </span>
                    )}
                  </span>
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          {/* Usuário + logout (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {alunoUser && <span className="text-sm text-white/70 truncate max-w-[140px]">{alunoUser.nome}</span>}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-branco-puro transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>

          {/* Ações mobile: perfil + sair (navegação fica na barra inferior) */}
          <div className="flex md:hidden items-center gap-1">
            <NavLink
              to="/aluno/perfil"
              aria-label="Meu perfil"
              className={({ isActive }) =>
                cn(
                  'h-11 w-11 flex items-center justify-center rounded-lg transition-colors',
                  isActive
                    ? 'bg-rosa-vibrante text-branco-puro'
                    : 'text-white/80 hover:bg-white/10 hover:text-branco-puro',
                )
              }
            >
              <User className="w-5 h-5" />
            </NavLink>
            <button
              onClick={handleLogout}
              aria-label="Sair"
              className="h-11 w-11 flex items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-branco-puro transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo (padding inferior extra no mobile para não ficar atrás da barra) */}
      <main className="max-w-5xl mx-auto px-4 pt-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Barra de navegação inferior (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-branco-puro border-t border-bege-cartao flex shadow-[0_-1px_4px_rgba(0,0,0,0.04)]">
        {bottomNavItems.map((item) => {
          const isNotif = item.to === '/aluno/notificacoes'
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors',
                  isActive ? 'text-rosa-vibrante' : 'text-cinza-texto hover:text-cinza-forte',
                )
              }
            >
              <span className="relative">
                <item.icon className="w-5 h-5" />
                {isNotif && naoLidas > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-rosa-vibrante text-branco-puro text-[10px] font-bold flex items-center justify-center">
                    {naoLidas > 9 ? '9+' : naoLidas}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium leading-none truncate max-w-full px-0.5">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <ChatSuporte />
    </div>
  )
}
