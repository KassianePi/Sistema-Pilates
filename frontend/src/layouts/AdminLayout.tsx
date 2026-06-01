import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarDays,
  DollarSign,
  CreditCard,
  BarChart3,
  Bell,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { AdminUser } from '@/types/auth.types'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Alunos', to: '/admin/alunos', icon: Users },
  { label: 'Professores', to: '/admin/professores', icon: UserCheck },
  { label: 'Agenda', to: '/admin/agenda', icon: CalendarDays },
  { label: 'Financeiro', to: '/admin/financeiro', icon: DollarSign },
  { label: 'Planos', to: '/admin/planos', icon: CreditCard },
  { label: 'Relatórios', to: '/admin/relatorios', icon: BarChart3 },
  { label: 'Notificações', to: '/admin/notificacoes', icon: Bell },
  { label: 'Auditoria', to: '/admin/auditoria', icon: ShieldCheck },
  { label: 'Usuários', to: '/admin/usuarios', icon: Settings },
]

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const adminUser = user as AdminUser | null

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="flex h-screen bg-creme-fundo overflow-hidden">
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-preto-puro/40 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:relative z-30 flex flex-col h-full bg-roxo-profundo text-branco-puro transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Header da sidebar */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 flex-shrink-0">
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-branco-puro text-sm leading-tight truncate">
                Studio de Pilates
              </p>
              <p className="text-white/50 text-xs truncate">Área Administrativa</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex ml-auto p-1.5 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-rosa-vibrante text-branco-puro'
                    : 'text-white/70 hover:bg-white/10 hover:text-branco-puro',
                  collapsed && 'justify-center px-2',
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Rodapé da sidebar */}
        <div className="flex-shrink-0 border-t border-white/10 p-3 space-y-1">
          {!collapsed && adminUser && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-medium text-branco-puro truncate">
                {adminUser.nome}
              </p>
              <p className="text-xs text-white/50 truncate">{adminUser.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-branco-puro transition-colors',
              collapsed && 'justify-center px-2',
            )}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header className="md:hidden flex items-center h-14 px-4 bg-branco-puro border-b border-bege-cartao flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md text-cinza-texto hover:bg-bege-suave"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold text-cinza-forte text-sm">
            Studio de Pilates
          </span>
        </header>

        {/* Área de conteúdo */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
