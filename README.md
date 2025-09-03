# Protheus Approval System

Sistema frontend de aprovação de documentos para integração com Protheus ERP.

## Estrutura do Projeto

Este projeto agora contém apenas o frontend desenvolvido em React com TypeScript:

```
client/
├── src/
│   ├── components/        # Componentes React reutilizáveis
│   ├── pages/            # Páginas da aplicação
│   ├── services/         # Serviços e API calls
│   ├── contexts/         # React Contexts
│   ├── hooks/            # Custom hooks
│   ├── stores/           # Zustand stores
│   ├── types/            # Definições de tipos TypeScript
│   └── lib/              # Utilitários e configurações
├── public/               # Arquivos públicos
└── package.json          # Dependências do frontend
```

## Funcionalidades

- **Interface moderna** desenvolvida com React e TypeScript
- **Autenticação segura** com sistema de login
- **Dashboard intuitivo** com estatísticas de aprovações
- **Listagem de documentos** com filtros e paginação
- **Aprovação/Rejeição** de documentos com interface amigável
- **Design responsivo** com Tailwind CSS
- **Gerenciamento de estado** com Zustand
- **Validação de formulários** com React Hook Form e Zod

## Instalação

```bash
# Navegar para a pasta do cliente
cd client

# Instalar dependências
npm install
```

## Executar

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview
```

A aplicação estará disponível em: http://localhost:5173

## Tecnologias Utilizadas

- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Superset tipado do JavaScript
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **React Router** - Roteamento do lado cliente
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Zustand** - Gerenciamento de estado
- **React Query** - Cache e sincronização de dados
- **Lucide React** - Ícones modernos

## Configuração de Ambiente

O frontend está configurado para se comunicar com uma API backend. Para desenvolvimento, você pode:

1. Configurar um backend local
2. Usar dados mock (já implementados)
3. Apontar para uma API de desenvolvimento

## Próximos Passos

1. Integrar com API backend real do Protheus
2. Implementar notificações push
3. Adicionar testes unitários e e2e
4. Configurar CI/CD
5. Implementar PWA (Progressive Web App)