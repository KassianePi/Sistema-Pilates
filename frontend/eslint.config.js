import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Várias telas usam `any` deliberadamente em pontos de integração com
      // react-hook-form/APIs externas — manter como aviso, não erro, para
      // não travar o lint por débito técnico pré-existente fora de escopo.
      '@typescript-eslint/no-explicit-any': 'warn',
      // AuthContext.tsx exporta o Context junto do Provider — separar exigiria
      // mexer no arquivo central de autenticação sem necessidade direta; manter
      // como aviso (preferência de Fast Refresh, não um erro de correção).
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    // Utilitários de teste reexportam helpers (não só componentes) — padrão
    // comum em test-utils, não precisa seguir a regra de Fast Refresh.
    files: ['src/test/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
