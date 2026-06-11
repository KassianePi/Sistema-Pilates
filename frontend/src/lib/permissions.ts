import type { UserRole } from '@/types/auth.types'

// Rotas que cada role pode acessar no painel admin
export const ROLE_ALLOWED_ROUTES: Record<UserRole, string[]> = {
  ADMIN: [
    '/admin/dashboard',
    '/admin/alunos',
    '/admin/professores',
    '/admin/agenda',
    '/admin/financeiro',
    '/admin/planos',
    '/admin/relatorios',
    '/admin/notificacoes',
    '/admin/auditoria',
    '/admin/usuarios',
    '/admin/perfil',
    '/admin/modalidades',
  ],
  RECEPCIONISTA: [
    '/admin/dashboard',
    '/admin/alunos',
    '/admin/agenda',
    '/admin/notificacoes',
    '/admin/perfil',
  ],
  PROFESSOR: [
    '/admin/dashboard',
    '/admin/alunos',
    '/admin/agenda',
    '/admin/financeiro',
    '/admin/relatorios',
    '/admin/notificacoes',
    '/admin/perfil',
  ],
  FINANCEIRO: [
    '/admin/dashboard',
    '/admin/financeiro',
    '/admin/planos',
    '/admin/relatorios',
    '/admin/notificacoes',
    '/admin/perfil',
  ],
}

// Primeira rota acessível por role (usada como redirect após login)
export const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  RECEPCIONISTA: '/admin/dashboard',
  PROFESSOR: '/admin/agenda',
  FINANCEIRO: '/admin/dashboard',
}

export function canAccess(role: UserRole, path: string): boolean {
  return ROLE_ALLOWED_ROUTES[role]?.includes(path) ?? false
}
