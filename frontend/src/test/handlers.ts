import { http, HttpResponse } from 'msw'

const BASE = '/api/v1'

/**
 * Handlers padrão — cobrem o caminho feliz mais comum de cada endpoint usado
 * nos testes. Os testes que precisam de um comportamento diferente (erro,
 * dados específicos) sobrescrevem com `server.use(...)` no próprio teste.
 */
export const handlers = [
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({
      success: true,
      data: {
        usuarioId: 'admin-1',
        email: 'admin@pilates.local',
        nome: 'Admin Teste',
        funcao: 'ADMIN',
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        expiresIn: 900,
      },
    }),
  ),

  http.post(`${BASE}/auth/aluno/login`, () =>
    HttpResponse.json({
      success: true,
      data: {
        usuarioId: 'aluno-1',
        email: 'aluno@pilates.local',
        nome: 'Aluno Teste',
        funcao: 'ALUNO',
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        expiresIn: 900,
      },
    }),
  ),

  http.post(`${BASE}/auth/logout`, () => HttpResponse.json({ success: true, data: {} })),

  http.post(`${BASE}/auth/refresh`, () =>
    HttpResponse.json(
      {
        success: false,
        message: 'Refresh token inválido',
        code: 'TOKEN_INVALID',
      },
      { status: 401 },
    ),
  ),

  // Listas usadas por selects/formulários em vários testes — vazias por padrão
  http.get(`${BASE}/planos`, () => HttpResponse.json({ success: true, data: [], total: 0 })),
  http.get(`${BASE}/alunos`, () => HttpResponse.json({ success: true, data: [], total: 0 })),
]
