import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Receipt,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { AlunoUser } from '@/types/auth.types'

const navItems = [
  { label: 'Início', to: '/aluno/dashboard', icon: LayoutDashboard },
  { label: 'Minhas Aulas', to: '/aluno/agenda', icon: CalendarDays },
  { label: 'Presença', to: '/aluno/presenca', icon: ClipboardList },
  { label: 'Financeiro', to: '/aluno/financeiro', icon: Receipt },
  { label: 'Meu Perfil', to: '/aluno/perfil', icon: User },
]

export function AlunoLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const alunoUser = user as AlunoUser | null

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
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-rosa-vibrante text-branco-puro'
                      : 'text-white/70 hover:bg-white/10 hover:text-branco-puro',
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
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
            {navItems.map((item) => (
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
                {item.label}
              </NavLink>
            ))}
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
    </div>
  )
}
