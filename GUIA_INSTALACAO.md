# 🚀 Guia Completo de Instalação - Protheus Approval System

Sistema completo de workflows de cadastro para o Protheus com aprovação multinível e integração via SX3.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação do Backend](#instalação-do-backend)
3. [Instalação do Frontend](#instalação-do-frontend)
4. [Configuração](#configuração)
5. [Primeiro Uso](#primeiro-uso)
6. [Fluxo Completo](#fluxo-completo)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker e Docker Compose** ([Download](https://www.docker.com/))
- **Acesso ao SQL Server do Protheus** (para ler SX3)
- **Acesso à API REST do Protheus** (para gravação de dados)

---

## 🖥️ Instalação do Backend

### 1. Instalar Dependências

```bash
cd server
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Application
PORT=3000
NODE_ENV=development

# PostgreSQL (Application Database)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/protheus_approval

# Protheus SQL Server (Read-only for SX3)
PROTHEUS_DB_HOST=seu-servidor-protheus
PROTHEUS_DB_PORT=1433
PROTHEUS_DB_USERNAME=seu-usuario
PROTHEUS_DB_PASSWORD=sua-senha
PROTHEUS_DB_DATABASE=PROTHEUS12

# Protheus REST API
PROTHEUS_OAUTH_URL=http://seu-servidor:porta
PROTHEUS_API_URL=http://seu-servidor:porta/rest

# JWT
JWT_SECRET=mude-isso-para-producao
JWT_EXPIRATION=24h

# Email (para notificações)
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=seu-email@gmail.com
EMAIL_SMTP_PASSWORD=sua-senha
EMAIL_FROM=noreply@company.com

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Iniciar PostgreSQL (Docker)

Na raiz do projeto:

```bash
docker-compose up -d
```

Verificar se está rodando:

```bash
docker ps
```

### 4. Executar Migrations do Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Iniciar Backend

```bash
npm run start:dev
```

✅ Backend estará rodando em: `http://localhost:3000/api`

---

## 🎨 Instalação do Frontend

### 1. Instalar Dependências

```bash
cd client
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Backend Configuration
VITE_BACKEND_URL=http://localhost:3000/api

# Existing Protheus Configuration (keep as is)
VITE_ACTIVE_COUNTRY=BR
VITE_ACTIVE_ERP=PROTHEUS
# ... rest of the configuration
```

### 3. Iniciar Frontend

```bash
npm run dev
```

✅ Frontend estará rodando em: `http://localhost:5173`

---

## ⚙️ Configuração

### Testar Conexões

1. **Testar conexão com PostgreSQL:**
   ```bash
   docker exec -it protheus-approval-postgres psql -U postgres -d protheus_approval
   ```

2. **Testar conexão com Protheus:**
   - Acesse: `http://localhost:3000/api/protheus-integration/test-connection`
   - Deve retornar: `{ "success": true, "message": "Successfully connected to Protheus" }`

3. **Testar API do backend:**
   - Acesse: `http://localhost:3000/api/sx3/tables`
   - Deve retornar lista de tabelas do Protheus

---

## 🎯 Primeiro Uso

### 1. Criar Template de Formulário (Admin)

1. Acesse o frontend: `http://localhost:5173`
2. Vá para **Admin** → **Form Templates**
3. Clique em **Criar Template**
4. Preencha:
   - **Tabela**: `SB1` (para Produtos)
   - **Nome**: `Cadastro de Produtos`
   - **Descrição**: `Formulário para cadastro de novos produtos`
5. Clique em **Criar**

O sistema vai:
- Conectar ao SQL Server do Protheus
- Ler a estrutura da tabela SB1 da SX3
- Criar automaticamente todos os campos
- Marcar apenas campos obrigatórios como visíveis

### 2. Configurar Workflow de Aprovação

Usando a API (você pode criar uma interface depois):

```bash
curl -X POST http://localhost:3000/api/registrations/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "ID-DO-TEMPLATE",
    "name": "Aprovação de Produtos",
    "description": "Workflow de 2 níveis para produtos",
    "levels": [
      {
        "levelOrder": 1,
        "levelName": "Gerente",
        "approverIds": ["user-id-1"],
        "isParallel": false
      },
      {
        "levelOrder": 2,
        "levelName": "Diretor",
        "approverIds": ["user-id-2"],
        "isParallel": false
      }
    ]
  }'
```

### 3. Criar Primeira Solicitação

1. No frontend, vá para **Nova Solicitação**
2. Selecione **Cadastro de Produtos**
3. Preencha o formulário (campos são carregados dinamicamente da SX3)
4. Clique em **Enviar para Aprovação**

### 4. Aprovar Solicitação

1. Vá para **Fila de Aprovação**
2. Clique em **Revisar** na solicitação
3. Clique em **Aprovar**
4. Repita para o segundo nível

### 5. Verificar no Protheus

Após todas as aprovações, o sistema:
1. Muda status para `SYNCING_TO_PROTHEUS`
2. Conecta na API REST do Protheus
3. Cria o registro na tabela SB1
4. Atualiza status para `SYNCED`
5. Guarda o RECNO do Protheus

---

## 🔄 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DO SISTEMA                            │
└─────────────────────────────────────────────────────────────────┘

1. CONFIGURAÇÃO (Admin)
   ↓
   ├─ Criar Form Template (lê SX3)
   ├─ Configurar campos visíveis
   └─ Configurar Workflow de Aprovação

2. SOLICITAÇÃO (Usuário)
   ↓
   ├─ Selecionar tipo de cadastro
   ├─ Preencher formulário dinâmico
   └─ Submeter (DRAFT → PENDING_APPROVAL)

3. APROVAÇÃO MULTINÍVEL
   ↓
   ├─ Nível 1: Gerente aprova → IN_APPROVAL
   ├─ Nível 2: Diretor aprova → APPROVED
   └─ (ou) Qualquer nível rejeita → REJECTED

4. SINCRONIZAÇÃO AUTOMÁTICA
   ↓
   ├─ Sistema detecta APPROVED
   ├─ Conecta no Protheus via REST API
   ├─ Cria registro na tabela
   ├─ Sucesso → SYNCED (guarda RECNO)
   └─ Falha → SYNC_FAILED (pode retentar)

5. AUDITORIA
   ↓
   ├─ Histórico completo de aprovações
   ├─ Log de sincronização
   └─ Dados imutáveis (snapshot)
```

---

## 📊 Endpoints da API

### SX3 (Dicionário de Dados)
- `GET /api/sx3/tables` - Lista tabelas
- `GET /api/sx3/tables/:tableName/fields` - Estrutura da tabela
- `POST /api/sx3/sync` - Sincronizar cache

### Form Templates
- `POST /api/form-templates` - Criar template
- `GET /api/form-templates` - Listar templates
- `GET /api/form-templates/:id` - Detalhes
- `PUT /api/form-templates/:id/fields/:fieldId` - Atualizar campo
- `POST /api/form-templates/:id/reorder` - Reordenar campos

### Registrations
- `POST /api/registrations` - Criar rascunho
- `POST /api/registrations/:id/submit` - Submeter
- `GET /api/registrations` - Listar
- `GET /api/registrations/pending-approval` - Fila de aprovação
- `POST /api/registrations/:id/approve` - Aprovar
- `POST /api/registrations/:id/reject` - Rejeitar
- `POST /api/registrations/:id/retry-sync` - Retentar sincronização

### Workflows
- `POST /api/registrations/workflows` - Criar workflow
- `GET /api/registrations/workflows/template/:id` - Obter workflow

### Protheus Integration
- `GET /api/protheus-integration/test-connection` - Testar conexão
- `POST /api/protheus-integration/sync/:id` - Sincronizar manualmente

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to PostgreSQL"

**Solução:**
```bash
# Verificar se Docker está rodando
docker ps

# Reiniciar container
docker-compose down
docker-compose up -d

# Ver logs
docker-compose logs postgres
```

### Erro: "Cannot connect to Protheus SQL Server"

**Solução:**
1. Verificar credenciais no `.env`
2. Testar conexão com SQL Server Management Studio
3. Verificar firewall (porta 1433)
4. Verificar se usuário tem permissão de leitura

### Erro: "Protheus authentication failed"

**Solução:**
1. Verificar `PROTHEUS_OAUTH_URL` no `.env`
2. Testar endpoint manualmente:
   ```bash
   curl -X POST http://seu-servidor:porta/rest/api/oauth2/v1/token \
     -d "grant_type=password&username=USER&password=PASS"
   ```
3. Verificar se usuário tem acesso à API REST

### Erro: "Table not found in SX3"

**Solução:**
1. Verificar se tabela existe no Protheus
2. Limpar cache: `POST /api/sx3/sync`
3. Verificar permissões do usuário no SQL Server

### Frontend não conecta no Backend

**Solução:**
1. Verificar `VITE_BACKEND_URL` no `.env` do client
2. Verificar CORS no backend (`.env` do server)
3. Verificar se backend está rodando: `http://localhost:3000/api/sx3/tables`

---

## 📚 Estrutura do Projeto

```
protheus-approval-system/
├── server/                 # Backend NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── sx3/              # Leitor SX3
│   │   │   ├── form-template/    # Templates
│   │   │   ├── registration/     # Workflows
│   │   │   └── protheus-integration/
│   │   └── prisma/
│   ├── package.json
│   └── .env
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/            # Páginas admin
│   │   │   └── registration/     # Páginas de cadastro
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── .env
├── docker-compose.yml      # PostgreSQL
└── GUIA_INSTALACAO.md     # Este arquivo
```

---

## 🎓 Próximos Passos

1. **Implementar Autenticação JWT** (usuários reais)
2. **Criar interface para configurar workflows** (frontend)
3. **Adicionar mais tabelas** (SA1, SA2, DA0, DA1)
4. **Implementar notificações por email**
5. **Adicionar dashboard com estatísticas**
6. **Implementar busca e filtros avançados**
7. **Adicionar testes automatizados**

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique os logs do backend: `cd server && npm run start:dev`
2. Verifique os logs do Docker: `docker-compose logs postgres`
3. Teste as conexões manualmente conforme este guia

---

## ✅ Checklist de Instalação

- [ ] Node.js 18+ instalado
- [ ] Docker instalado e rodando
- [ ] Backend: dependências instaladas (`npm install`)
- [ ] Backend: `.env` configurado
- [ ] PostgreSQL rodando (`docker-compose up -d`)
- [ ] Prisma migrations executadas (`npm run prisma:migrate`)
- [ ] Backend iniciado (`npm run start:dev`)
- [ ] Frontend: dependências instaladas (`npm install`)
- [ ] Frontend: `.env` configurado
- [ ] Frontend iniciado (`npm run dev`)
- [ ] Conexão com Protheus testada
- [ ] Primeiro template criado
- [ ] Primeiro workflow configurado
- [ ] Primeira solicitação testada

**Sistema pronto para uso! 🎉**
