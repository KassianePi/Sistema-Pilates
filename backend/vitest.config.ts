import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Garante que todo arquivo de teste tenha acesso às variáveis de .env
    // (ex: JWT_SECRET), do mesmo jeito que server.ts faz em runtime real —
    // sem depender de import incidental do Prisma Client em outros arquivos.
    setupFiles: ['dotenv/config'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/types.ts',
        '**/constants.ts',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@modules': path.resolve(__dirname, './src/modules'),
    },
  },
})
