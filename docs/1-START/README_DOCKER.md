# 🐳 DOCKER SETUP — Sistema Studio de Pilates

**Data:** 26 de Maio de 2026  
**Status:** Pronto para usar  
**Tempo de setup:** 5 minutos

---

## 📋 Pré-requisitos

Você precisa ter instalado:

1. **Docker** (v20.0+)
   - Windows/Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: `sudo apt install docker.io docker-compose`

2. **Docker Compose** (v1.29+)
   - Incluído no Docker Desktop
   - Linux: `sudo apt install docker-compose` ou `pip install docker-compose`

Verificar instalação:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start (5 minutos)

### 1️⃣ Clonar/Entrar na pasta do projeto

```bash
cd sistema-pilates
```

### 2️⃣ Criar arquivo .env

```bash
# Copiar o template
cp .env.example .env

# Editar se necessário (valores padrão já estão OK)
# nano .env (ou abra em seu editor)
```

### 3️⃣ Subir o Docker Compose

```bash
docker-compose up -d
```

A flag `-d` significa "detached" (rodando em background)

### 4️⃣ Aguardar o MySQL estar pronto (30-60 segundos)

```bash
# Ver status dos containers
docker-compose ps

# Acompanhar logs do MySQL
docker-compose logs -f mysql
```

Quando ver: `[Server] MySQL Server has started`, está pronto!

### 5️⃣ Acessar o Adminer (interface web)

Abra seu navegador:

```
http://localhost:8080
```

**Credenciais:**
- **Server:** `mysql`
- **Username:** `pilates_user`
- **Password:** `pilates_pass`
- **Database:** `pilates_db`

Ou para acessar como root:
- **Username:** `root`
- **Password:** `root123`

---

## 🎯 Acessando o Banco de Dados

### ✅ Opção 1: Adminer (Web Interface)

**URL:** http://localhost:8080

Vantagens:
- ✅ Rápido e fácil
- ✅ Sem instalação extra
- ✅ Visual e intuitivo

Clique em `Login` e veja as tabelas criadas!

### ✅ Opção 2: DBeaver (Desktop)

1. Download: https://dbeaver.io/
2. Nova conexão → MySQL
3. Host: `localhost:3306`
4. User: `pilates_user`
5. Password: `pilates_pass`
6. Test connection → Finish

### ✅ Opção 3: MySQL Client (Terminal)

```bash
# Instalar MySQL client (se não tiver)
# macOS: brew install mysql-client
# Ubuntu/Debian: sudo apt install mysql-client
# Windows: choco install mysql-cli

# Conectar ao banco
mysql -h 127.0.0.1 -u pilates_user -p pilates_db
# Senha: pilates_pass

# Listar tabelas
SHOW TABLES;

# Ver estrutura de uma tabela
DESCRIBE users;
```

### ✅ Opção 4: Dentro do Container

```bash
# Entrar no container MySQL
docker-compose exec mysql mysql -u pilates_user -p pilates_db

# Ou como root
docker-compose exec mysql mysql -u root -p

# Dentro do MySQL
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

---

## 📊 Visualizar o Diagrama das Tabelas

### No Adminer

1. Acesse http://localhost:8080
2. Faça login
3. Clique em **Database** no menu lateral
4. Você verá todas as 13 tabelas criadas:
   - `users`
   - `students`
   - `student_plans`
   - `instructors`
   - `class_schedules`
   - `classes`
   - `attendances`
   - `student_progress`
   - `monthly_fees`
   - `payments`
   - `cash_registers`
   - `notifications`
   - `audit_logs`

5. Clique em cada tabela para ver:
   - Estrutura (campos, tipos)
   - Dados inseridos
   - Índices
   - Relacionamentos

### No DBeaver

1. Acesse sua conexão MySQL
2. Expanda `pilates_db` → `Tables`
3. Clique direito na pasta → **ER Diagram**
4. Veja o diagrama visual de todas as tabelas e relacionamentos!

---

## 🔧 Comandos Úteis

### Ver status dos containers

```bash
docker-compose ps
```

Exemplo de output:
```
NAME                COMMAND                 STATE
pilates_mysql       docker-entrypoint.sh... Up (healthy)
pilates_adminer     entrypoint.sh docker    Up
```

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas MySQL
docker-compose logs -f mysql

# Apenas Adminer
docker-compose logs -f adminer

# Últimas 50 linhas
docker-compose logs -f --tail=50
```

### Parar os containers

```bash
# Parar mas manter dados
docker-compose stop

# Parar e remover containers (dados persistem em volume)
docker-compose down

# Parar, remover containers E dados
docker-compose down -v
```

### Reiniciar

```bash
docker-compose restart
```

### Entrar no container MySQL

```bash
docker-compose exec mysql bash

# Dentro do container
mysql -u pilates_user -p pilates_db
```

### Ver dados de um volume

```bash
# Listar volumes
docker volume ls

# Inspecionar volume
docker volume inspect pilates_mysql_data

# Ver tamanho
du -sh /var/lib/docker/volumes/pilates_*/_data
```

---

## 📝 Dados Iniciais

O arquivo `init.sql` cria automaticamente:

### Usuários de Teste

| Email | Senha | Função |
|-------|-------|--------|
| `admin@pilates.local` | (hash) | Admin |
| `recepcionista@pilates.local` | (hash) | Recepcionista |
| `professor@pilates.local` | (hash) | Professor |
| `aluno@pilates.local` | (hash) | Aluno |

**Nota:** As senhas são hashes. Na Fase 2, você criará um endpoint de login.

### Dados Relacionados

- ✅ 1 Professor cadastrado
- ✅ 1 Aluno cadastrado
- ✅ 1 Plano de aluno (BASICO_4, 30 dias)

---

## 🐛 Troubleshooting

### "Connection refused" ao acessar Adminer

**Causa:** MySQL ainda está iniciando  
**Solução:** Aguarde 30-60 segundos e tente novamente

```bash
# Verificar status
docker-compose ps

# Ver logs
docker-compose logs mysql
```

### "Port 3306 already in use"

**Causa:** Outra aplicação está usando a porta  
**Solução:** Mude a porta no `.env`

```bash
# .env
MYSQL_PORT=3307  # Ao invés de 3306

# Reconectar
docker-compose down
docker-compose up -d
```

### "Port 8080 already in use"

**Causa:** Adminer ou outra app está usando  
**Solução:** Mude a porta no `.env`

```bash
# .env
ADMINER_PORT=8081  # Ao invés de 8080

# Reconectar
docker-compose down
docker-compose up -d
```

### Erro "no such file or directory: init.sql"

**Causa:** Arquivo init.sql está em local errado  
**Solução:** Certifique-se que `init.sql` está na mesma pasta que `docker-compose.yml`

```bash
ls -la init.sql
```

### Banco vazio (sem tabelas)

**Causa:** init.sql não foi executado  
**Solução:** Remova e recrie o volume

```bash
docker-compose down -v
docker-compose up -d
```

### Erros de permissão no Windows

**Causa:** WSL (Windows Subsystem for Linux) pode ter problemas  
**Solução:** Execute como administrador ou use Windows PowerShell

---

## 🔐 Segurança (Desenvolvimento vs Produção)

### ✅ Desenvolvimento (Atual)

```
- Senhas simples: root123, pilates_pass
- MySQL sem bind address restriction
- Adminer disponível publicamente
- Logs em nível DEBUG
```

Isso é **OK para desenvolvimento local**.

### ❌ Produção (Fase 7)

```
- Gerar senhas fortes: openssl rand -base64 32
- MySQL bind 127.0.0.1 apenas
- Remover/proteger Adminer
- Logs em nível INFO
- SSL/TLS obrigatório
- Backup automático
```

Vamos implementar isso na **Fase 7 (Deploy)**.

---

## 📊 Estrutura dos Volumes

```
docker volumes/
├── mysql_data/
│   ├── pilates_db/
│   │   ├── db.opt
│   │   ├── users.ibd
│   │   ├── students.ibd
│   │   ├── classes.ibd
│   │   └── ... (outras tabelas)
│   └── mysql/ (banco interno MySQL)
```

Os dados **persistem** mesmo que pare o Docker!

---

## 📚 Próximos Passos

### Depois de subir o Docker

1. **Acesse Adminer** e explore as tabelas
2. **Verifique os dados** inseridos automaticamente
3. **Execute queries** para se familiarizar com o schema
4. **Passe para Fase 2** quando estiver confortável

### Exemplo de Query para Testar

```sql
-- Ver todos os usuários
SELECT id, email, full_name, role, status FROM users;

-- Ver alunos com seus planos
SELECT 
  s.id,
  u.full_name,
  sp.plan_type,
  sp.monthly_cost,
  sp.status
FROM students s
INNER JOIN users u ON s.user_id = u.id
LEFT JOIN student_plans sp ON s.id = sp.student_id;

-- Ver estrutura de uma tabela
DESCRIBE classes;

-- Contar linhas em cada tabela
SELECT table_name, table_rows FROM INFORMATION_SCHEMA.TABLES 
WHERE table_schema = 'pilates_db';
```

---

## 🎓 Verificação Completa

Use este checklist para verificar que tudo está funcionando:

- [ ] Docker instalado e rodando
- [ ] Arquivo `.env` criado
- [ ] `docker-compose up -d` executado com sucesso
- [ ] Todos os containers estão "UP" (docker-compose ps)
- [ ] Adminer acessível em http://localhost:8080
- [ ] Consegue fazer login no Adminer
- [ ] Vê as 13 tabelas no banco
- [ ] Vê os 4 usuários de teste
- [ ] Consegue executar queries SQL
- [ ] Dados estão persistindo (parou e reiniciou container)

---

## 💡 Dicas Profissionais

1. **Não commite .env** — Sempre use .env.example como template
2. **Backup regularmente** — Os dados estão em volumes Docker
3. **Monitore logs** — Use `docker-compose logs -f` para debug
4. **Use nomes descritivos** — Os nomes do seu `.env` ajudam na Fase 2
5. **Documente mudanças** — Se alterar estrutura, atualize `init.sql`

---

## 📞 Suporte

Se tiver dúvidas:

1. Verifique os logs: `docker-compose logs -f mysql`
2. Verifique o arquivo `.env`
3. Confirme que Docker está rodando
4. Tente `docker-compose restart`

---

## 🎉 Pronto!

Você agora tem um **banco de dados MySQL completo com 13 tabelas**, **relacionamentos**, **índices de performance** e **dados de teste**, tudo **rodando em Docker**!

**Próximo passo:** [GUIA_FASE_2.md](./GUIA_FASE_2.md) para implementar o backend.

---

**Última atualização:** 26 de Maio de 2026  
**Versão:** 1.0  
**Status:** ✅ Pronto para usar

