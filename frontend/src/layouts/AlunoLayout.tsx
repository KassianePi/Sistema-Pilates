import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Receipt,
  User,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { AlunoUser } from '@/types/auth.types'
import { ChatSuporte } from '@/components/ChatSuporte'
import { notificacoesService } from '@/services/notificacoes.service'

const navItems = [
  { label: 'Início', to: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Minhas Aulas', to: '/aluno/agenda', icon: CalendarDays },
  { label: 'Presença', to: '/aluno/presenca', icon: ClipboardList },
  { label: 'Financeiro', to: '/aluno/financeiro', icon: Receipt },
  { label: 'Notificações', to: '/aluno/notificacoes', icon: Bell },
  { label: 'Meu Perfil', to: '/aluno/perfil', icon: User },
]

export function AlunoLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
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

  async function handleLogout() {
    await logout()
    navigate('/aluno/login')
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
            {alunoUser && (
              <span className="text-sm text-white/70 truncate max-w-[140px]">
                {alunoUser.nome}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-branco-puro transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>

          {/* Botão menu mobile */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isNotif = item.to === '/aluno/notificacoes'
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-rosa-vibrante text-branco-puro'
                        : 'text-white/70 hover:bg-white/10 hover:text-branco-puro',
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
                  {isNotif && naoLidas > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rosa-vibrante text-branco-puro text-[10px] font-bold flex items-center justify-center">
                      {naoLidas > 9 ? '9+' : naoLidas}
                    </span>
                  )}
                </NavLink>
              )
            })}
            {alunoUser && (
              <div className="px-3 pt-2 pb-1 border-t border-white/10 mt-2">
                <p className="text-xs text-white/50">{alunoUser.nome}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        )}
      </header>

      {/* Conteúdo */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <ChatSuporte />
    </div>
  )
}
