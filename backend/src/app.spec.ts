/**
 * Testes da aplicação Fastify
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createApp } from './app'
import { PrismaClientSingleton } from './database/prisma.client'

describe('App', () => {
  let app: any

  beforeAll(async () => {
    try {
      await PrismaClientSingleton.connect()
      app = await createApp()
    } catch (error) {
      console.error('Setup error:', error)
    }
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
    await PrismaClientSingleton.disconnect()
  })

  describe('GET /health', () => {
    it('deve retornar status ok', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.status).toBe('ok')
    })
  })

  describe('GET /api/v1/health', () => {
    it('deve retornar health check da API', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.status).toBe('ok')
      expect(body.data.service).toBe('studio-pilates-api')
    })
  })

  describe('GET /documentation', () => {
    it('deve redirecionar para a UI do Swagger', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation',
      })

      expect(response.statusCode).toBe(302)
    })

    it('deve servir a especificação OpenAPI em /documentation/json', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/documentation/json',
      })

      expect(response.statusCode).toBe(200)
      const spec = JSON.parse(response.body)
      expect(spec.openapi).toBeDefined()
      expect(spec.info.title).toBe('Studio de Pilates — API')
      expect(spec.components.securitySchemes.bearerAuth).toBeDefined()
      // Rota pública não deve exigir Bearer
      expect(spec.paths['/auth/login']?.post?.security).toBeUndefined()
      // Rota protegida deve exigir Bearer
      expect(spec.paths['/alunos']?.get?.security).toEqual([{ bearerAuth: [] }])
    })
  })

  describe('GET /rota-inexistente', () => {
    it('deve retornar 404 para rota não encontrada', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/rota-inexistente',
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.code).toBe('NOT_FOUND')
    })
  })

  describe('Security Headers', () => {
    it('deve incluir headers de segurança (Helmet)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      // Helmet headers
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['x-frame-options']).toBe('DENY')
    })

    it('deve incluir CORS headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          origin: 'http://localhost:3000',
        },
      })

      expect(response.headers['access-control-allow-origin']).toBeDefined()
    })
  })
})
