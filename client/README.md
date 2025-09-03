# Frontend - Sistema de Aprovação Protheus

Interface web moderna para o sistema de aprovação integrado diretamente com Protheus ERP via APIs REST.

## 🚀 Tecnologias Utilizadas

- **React 19** - Framework frontend com hooks modernos
- **TypeScript** - Tipagem estática para maior segurança
- **Material-UI 6** - Sistema de design profissional
- **Vite** - Build tool ultrarrápido
- **React Router 7** - Roteamento SPA
- **React Query** - Gerenciamento de estado server
- **Zustand** - Gerenciamento de estado client-side
- **React Hook Form** - Formulários performáticos
- **Zod** - Validação robusta de schemas
- **Axios** - Cliente HTTP com interceptors
- **date-fns** - Manipulação de datas

## ⚡ Funcionalidades

- ✅ **Conexão Direta ao Protheus** - Sem backend intermediário
- ✅ **Autenticação OAuth2** - Integração nativa com Protheus ERP
- ✅ **Dashboard Moderno** - Estatísticas em tempo real
- ✅ **Aprovação de Documentos** - Interface intuitiva para aprovações
- ✅ **Sistema de Filtros** - Busca avançada de documentos
- ✅ **Design Responsivo** - Funciona em desktop, tablet e mobile
- ✅ **Renovação Automática de Tokens** - Sessão sempre ativa
- ✅ **Cache Inteligente** - Performance otimizada com React Query
- ✅ **Feedback Visual** - Toast notifications e loading states
- ✅ **Tratamento de Erros** - UX consistente em cenários de erro

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento (porta 3001)
npm start               # Alias para npm run dev

# Build e Deploy
npm run build           # Build otimizado para produção
npm run build:analyze   # Build com análise de bundle
npm run preview         # Preview do build de produção

# Qualidade de Código
npm run lint            # ESLint (máximo 0 warnings)
npm run lint:fix        # Corrige problemas de lint automaticamente
npm run type-check      # Verificação de tipos TypeScript
npm run format          # Formata código com Prettier
npm run format:check    # Verifica se código está formatado
npm run health          # Executa todas as verificações

# Utilitários
npm run clean           # Limpa cache e build
```

## ⚙️ Configuração

### Conexão Protheus ERP

O frontend se conecta diretamente ao Protheus ERP via proxy configurado no Vite:

- **Servidor Protheus**: `brsvcub050:3079/rest`
- **Proxy Local**: `/api` → `http://brsvcub050:3079/rest`
- **Autenticação**: OAuth2 nativa do Protheus

### 🚀 Desenvolvimento

1. **Instale as dependências:**
```bash
npm install
```

2. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

3. **Acesse a aplicação:**
   - URL: http://localhost:3001
   - Login: Use suas credenciais do Protheus ERP

### 🔌 Endpoints Protheus

A aplicação utiliza diretamente as APIs REST do Protheus:

- `POST /api/oauth2/v1/token` - Autenticação OAuth2
- `GET /api/framework/v1/users` - Informações do usuário
- `GET /api/documents` - Listagem de documentos (mock)
- `POST /api/documents/{id}/approve` - Aprovação (mock)
- `POST /api/documents/{id}/reject` - Rejeição (mock)

## 📁 Estrutura do Projeto

```
src/
├── components/              # Componentes reutilizáveis
│   ├── AppLayout.tsx       # Layout principal da aplicação
│   ├── DashboardStats.tsx  # Componente de estatísticas
│   ├── DocumentList.tsx    # Lista de documentos
│   ├── LoginForm.tsx       # Formulário de login
│   ├── ProtectedRoute.tsx  # Rota protegida
│   └── ui/                 # Componentes básicos de UI
├── contexts/               # Contextos React
│   └── AuthContext.tsx     # Bridge entre Context API e Zustand
├── hooks/                  # Custom hooks
│   └── useDocuments.ts     # Hooks para React Query
├── lib/                    # Configurações e utilitários
│   ├── queryClient.ts      # Configuração React Query
│   └── utils.ts            # Funções utilitárias
├── pages/                  # Páginas da aplicação
│   ├── DashboardPage.tsx   # Dashboard principal
│   ├── DocumentsPage.tsx   # Página de documentos
│   └── LoginPage.tsx       # Página de login
├── schemas/                # Schemas de validação
│   └── loginSchema.ts      # Validação do formulário de login
├── services/               # Serviços e APIs
│   ├── api.ts             # Cliente Axios configurado
│   ├── authService.ts     # Autenticação OAuth2 Protheus
│   └── documentService.ts # Gerenciamento de documentos
├── stores/                 # Gerenciamento de estado
│   ├── authStore.ts       # Estado de autenticação
│   └── documentStore.ts   # Estado de documentos
├── theme/                  # Sistema de design
│   └── theme.ts           # Tema Material-UI customizado
├── types/                  # Definições TypeScript
│   └── auth.ts            # Tipos para Protheus APIs
├── App.tsx                # Componente raiz
└── main.tsx               # Entry point da aplicação
```

## 🔐 Autenticação

### OAuth2 Protheus
- **Integração Nativa**: Conecta diretamente ao Protheus ERP
- **Campos Suportados**: usuário, senha, empresa (opcional), filial (opcional)
- **Token Management**: Renovação automática em background
- **Segurança**: Tokens JWT com interceptors HTTP

### Fluxo de Autenticação
1. Usuário insere credenciais no formulário Material-UI
2. Aplicação envia requisição OAuth2 para Protheus
3. Protheus retorna `access_token` e `refresh_token`
4. Tokens são armazenados e gerenciados pelo Zustand
5. Interceptors Axios adicionam tokens automaticamente
6. Renovação automática quando tokens expiram

## 🎨 Design System

### Material-UI Customizado
- **Tema Personalizado**: Cores corporativas e tipografia
- **Componentes Responsivos**: Grid system e breakpoints
- **Acessibilidade**: WCAG 2.1 AA compliance
- **Dark Mode**: Preparado para tema escuro (futuro)

### Paleta de Cores
- **Primary**: #1976d2 (Azul corporativo)
- **Success**: #2e7d32 (Verde para aprovações)
- **Warning**: #ed6c02 (Laranja para pendências)
- **Error**: #d32f2f (Vermelho para rejeições)

## 🛡️ Segurança

- **OAuth2 Nativo**: Sem credenciais hardcoded
- **Tokens Seguros**: Armazenamento com persistência Zustand
- **Auto Refresh**: Renovação transparente de tokens
- **Axios Interceptors**: Headers de autorização automáticos
- **Form Validation**: Schemas rigorosos com Zod
- **HTTPS Ready**: Configurado para produção segura

## 🚀 Performance

### Otimizações Implementadas
- **Code Splitting**: Chunks automáticos por rota e vendor
- **Tree Shaking**: Bundle otimizado removendo código não usado
- **Lazy Loading**: Componentes carregados sob demanda
- **React Query Cache**: Cache inteligente para APIs
- **Memoization**: Componentes otimizados com React.memo
- **Bundle Analyzer**: Análise de tamanho de bundle

### Métricas Esperadas
- **First Contentful Paint**: < 2s
- **Time to Interactive**: < 3s  
- **Bundle Size**: < 1MB (gzipped)

## 📦 Build e Deploy

### Build Otimizado
```bash
npm run build           # Build de produção
npm run build:analyze   # Com análise de bundle
```

### Deploy
- **SPA**: Single Page Application
- **Assets**: Otimizados com Vite
- **Chunk Strategy**: Vendor, UI libs, aplicação
- **Source Maps**: Apenas em desenvolvimento

## 🌐 Compatibilidade

### Navegadores Suportados
- **Chrome**: 88+ (ES2020)
- **Firefox**: 84+ 
- **Safari**: 14+
- **Edge**: 88+

### Dispositivos
- **Desktop**: 1200px+ (design principal)
- **Tablet**: 768px - 1199px (responsivo)
- **Mobile**: 320px - 767px (mobile-first)

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de Conexão com Protheus**
   - Verifique se o servidor `brsvcub050:3079` está acessível
   - Confirme se o serviço REST do Protheus está rodando

2. **Token Expirado**
   - Aplicação renova automaticamente
   - Se persistir, limpe o localStorage e faça login novamente

3. **Erro de CORS**
   - Configuração de proxy no Vite resolve automaticamente
   - Para produção, configure CORS no Protheus

## 📞 Suporte

Para questões técnicas ou bugs, consulte a documentação do Protheus REST API ou entre em contato com a equipe de desenvolvimento.
