# Protheus Approval System - Backend

Backend NestJS para o sistema de aprovação do Protheus com workflows de cadastro.

## 🚀 Tecnologias

- **Framework**: NestJS 10.x
- **Database (App)**: PostgreSQL 15 + Prisma ORM
- **Database (Protheus)**: SQL Server + TypeORM (read-only)
- **Authentication**: JWT + Passport
- **Language**: TypeScript

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Acesso ao SQL Server do Protheus

## 🔧 Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:
- Credenciais do SQL Server (Protheus)
- URL da API REST do Protheus
- JWT Secret
- Configurações de email (SMTP)

### 3. Iniciar PostgreSQL

Na raiz do projeto (um nível acima):

```bash
docker-compose up -d
```

Verificar se está rodando:

```bash
docker ps
```

### 4. Executar migrations do Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Iniciar servidor de desenvolvimento

```bash
npm run start:dev
```

O backend estará rodando em: `http://localhost:3000/api`

## 📚 Estrutura do Projeto

```
src/
├── modules/
│   ├── auth/              # Autenticação e autorização
│   ├── users/             # Gerenciamento de usuários
│   ├── sx3/               # Leitor do dicionário SX3 do Protheus
│   ├── form-template/     # Templates de formulários
│   ├── registration/      # Workflows de cadastro
│   ├── workflow/          # Motor de workflow
│   └── protheus-integration/  # Integração REST com Protheus
├── prisma/
│   ├── prisma.module.ts   # Módulo Prisma
│   └── prisma.service.ts  # Service Prisma
├── app.module.ts          # Módulo principal
└── main.ts                # Entry point
```

## 🔌 Conexões de Banco

Este projeto utiliza **duas conexões de banco de dados**:

1. **PostgreSQL** (Prisma): Dados da aplicação
   - Usuários
   - Form templates
   - Registration requests
   - Workflows
   - Aprovações

2. **SQL Server** (TypeORM): Protheus (read-only)
   - SX3 (dicionário de dados)
   - Tabelas do Protheus para consulta

## 📝 Comandos Úteis

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Prisma
npm run prisma:generate    # Gerar client
npm run prisma:migrate     # Executar migrations
npm run prisma:studio      # Abrir Prisma Studio

# Linting
npm run lint
npm run format
```

## 🔐 Autenticação

O sistema utiliza JWT para autenticação. Os tokens são válidos por 24h (configurável no `.env`).

### Endpoints de autenticação:
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Usuário atual

## 📊 Principais Módulos

### SX3 Module
Lê o dicionário de dados (SX3) do Protheus via SQL Server.

**Endpoints**:
- `GET /api/sx3/tables/:tableName/fields` - Campos da tabela
- `POST /api/sx3/sync` - Sincronizar cache

### Form Template Module
Gerencia templates de formulários baseados na SX3.

**Endpoints**:
- `GET /api/form-templates` - Listar templates
- `POST /api/form-templates` - Criar template
- `PUT /api/form-templates/:id/fields/:fieldId` - Atualizar campo

### Registration Module
Gerencia workflows de cadastro com aprovação multinível.

**Endpoints**:
- `POST /api/registrations` - Criar rascunho
- `POST /api/registrations/:id/submit` - Submeter para aprovação
- `POST /api/registrations/:id/approve` - Aprovar
- `POST /api/registrations/:id/reject` - Rejeitar

## 🌐 CORS

Por padrão, o backend aceita requisições de `http://localhost:5173` (frontend Vite).

Para alterar, configure a variável `CORS_ORIGIN` no `.env`.

## 📦 Deployment

### Build

```bash
npm run build
```

### Executar em produção

```bash
NODE_ENV=production npm run start:prod
```

## 🐛 Troubleshooting

### Erro ao conectar no PostgreSQL
- Verifique se o Docker está rodando
- Verifique a `DATABASE_URL` no `.env`
- Execute `docker-compose logs postgres`

### Erro ao conectar no SQL Server (Protheus)
- Verifique as credenciais no `.env`
- Teste a conexão com algum client SQL
- Verifique se o firewall permite a conexão

### Prisma não gera o client
- Execute `npm run prisma:generate`
- Delete `node_modules` e `package-lock.json`, reinstale

## 📄 Licença

MIT
