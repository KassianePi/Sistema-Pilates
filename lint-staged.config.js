import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

// lint-staged não roda em um workspace npm — backend e frontend têm
// node_modules/eslint/prettier próprios, com configs diferentes. Chamamos os
// pontos de entrada JS de cada um via `node` diretamente (em vez dos shims
// .bin/.cmd via shell), o que evita por completo os problemas de quoting do
// cmd.exe no Windows quando o caminho do repositório tem espaços.

function run(projectDir, entryJs, args) {
  const cwd = resolve(projectDir)
  const script = resolve(cwd, entryJs)
  execFileSync(process.execPath, [script, ...args], { cwd, stdio: 'inherit' })
}

function makeTask(projectDir) {
  return (files) => {
    if (files.length === 0) return []
    run(projectDir, 'node_modules/eslint/bin/eslint.js', ['--fix', ...files])
    run(projectDir, 'node_modules/prettier/bin/prettier.cjs', ['--write', ...files])
    // Já executamos diretamente acima — não devolvemos comandos de shell
    // para o lint-staged rodar por conta própria.
    return []
  }
}

export default {
  'backend/src/**/*.ts': makeTask('backend'),
  'frontend/src/**/*.{ts,tsx}': makeTask('frontend'),
}
