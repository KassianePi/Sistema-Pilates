# Decisões Técnicas — Studio de Pilates

Registro de decisões de engenharia tomadas durante a preparação do projeto para produção, com o contexto e os riscos considerados.

## 1. Testes E2E (Playwright) — adiados

**Decisão**: não instalar nem configurar Playwright nesta etapa. A Etapa 6 cobre apenas testes unitários e de integração de componente (Vitest + React Testing Library + MSW).

**Por quê**: Playwright adiciona ~300MB de browsers, tempo de execução maior em CI, e mais um framework para manter. Faz mais sentido introduzi-lo quando já existir:
- ambiente de homologação estável;
- CI consolidado (Etapa 8);
- banco de testes previsível e com dados controlados (massa de dados fixa para os fluxos E2E, não o banco de desenvolvimento pessoal).

**Plano futuro**: ao retomar, cobrir o fluxo dourado completo (login admin → cadastro de aluno → matrícula em plano → agendamento de aula → presença → cobrança → pagamento/estorno → reflexo no dashboard), como um único teste E2E de fumaça rodando em um job de CI separado e não-bloqueante.

## 2. npm workspaces — não migrado

**Decisão**: manter o esquema atual de compartilhamento do `packages/shared` (dependência `file:../packages/shared` no `package.json` do backend, alias `@shared` no Vite/tsconfig do frontend, `COPY packages/shared` manual nos Dockerfiles) em vez de migrar para npm workspaces reais.

**Como funciona hoje**:
- `backend/package.json` declara `"@pilates/shared": "file:../packages/shared"` — o npm cria um symlink local na instalação.
- `frontend/vite.config.ts` e `tsconfig.app.json` declaram o alias `@shared` apontando para `../../packages/shared`.
- `backend/Dockerfile` copia `packages/shared` explicitamente antes do `npm ci`, já que o contexto de build Docker não segue symlinks fora do diretório copiado.
- Não há `package.json` raiz com `"workspaces"` — cada pacote (`backend`, `frontend`, `packages/shared`) tem seu próprio lockfile e `node_modules`.

**Riscos de migrar agora**:
- Lockfiles precisariam ser regenerados (`package-lock.json` único na raiz), com risco de drift de versões entre o que está fixado hoje e o que o workspace resolveria.
- O contexto de build dos Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`) precisaria ser reestruturado — hoje cada um tem contexto próprio; workspaces tipicamente exigem build a partir da raiz do monorepo.
- CI (Etapa 8) precisaria instalar a partir da raiz, mudando os comandos de install/cache.
- Nenhum problema real está sendo causado pelo esquema atual — é mais verboso, mas funciona e já está validado em produção (build, testes e Docker).

**Plano de migração recomendado** (quando houver tempo dedicado, fora de uma janela de correções):
1. Criar `package.json` raiz com `"workspaces": ["backend", "frontend", "packages/shared"]`.
2. Regenerar lockfile único na raiz, validando que as versões resolvidas batem com as atuais (`npm ls` antes/depois).
3. Atualizar `backend/Dockerfile` e `frontend/Dockerfile` para usar a raiz do monorepo como contexto de build (`context: .` já é o caso do backend; ajustar o frontend).
4. Atualizar `vitest.config.ts`/`vite.config.ts` se os aliases mudarem de resolução.
5. Validar build, testes e `docker compose build` de ponta a ponta antes de remover o esquema antigo.

## 3. Husky hospedado por um `package.json` raiz mínimo

A raiz do projeto não tinha `package.json` antes da Etapa 7. Foi criado um `package.json` raiz **mínimo**, apenas para hospedar o Husky e o `lint-staged` (`prepare` script, hooks de `pre-commit`/`pre-push`). Isso **não é** a migração para workspaces descrita acima — é só o host dos git hooks, sem `"workspaces"` declarado e sem afetar a resolução de dependências de `backend`/`frontend`/`packages/shared`.

## 4. Erro de validação Zod não tratado — rede de segurança global

Durante a Etapa 5 (testes dos módulos pendentes), foi identificado um padrão recorrente: vários controllers tinham `try/catch` próprios que capturavam qualquer erro genericamente e retornavam `500`, mesmo quando o erro real era uma falha de validação Zod (que deveria ser `400`). Cada ocorrência específica foi corrigida pontualmente nos controllers afetados, e adicionalmente foi incluída uma rede de segurança no error handler global do Fastify (`app.ts`) que converte qualquer `ZodError` não tratado em uma resposta `400` no formato `{success, message, code}` — cobrindo módulos que ainda não tenham tratamento explícito.
