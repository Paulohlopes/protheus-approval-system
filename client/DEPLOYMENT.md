# 🚀 Guia de Deploy - Sistema de Aprovação Protheus

## 📋 Pré-requisitos

### Ambiente de Desenvolvimento
- **Node.js**: v18+ (recomendado v20 LTS)
- **NPM**: v9+ (ou Yarn/PNPM equivalente)
- **Sistema Operacional**: Windows, macOS, ou Linux

### Servidor Protheus
- **Protheus ERP**: Versão com suporte REST API
- **Servidor**: `brsvcub050:3079` (configurável)
- **Serviços Ativos**: REST API e OAuth2

## 🛠️ Instalação e Configuração

### 1. Preparar Ambiente

```bash
# Clone o repositório (se necessário)
cd /path/to/protheus-approval-system/client

# Instalar dependências
npm install

# Verificar saúde do projeto
npm run health
```

### 2. Configuração do Servidor Protheus

Confirme se as seguintes APIs estão funcionando:

```bash
# Teste de conectividade
curl http://brsvcub050:3079/rest/api/oauth2/v1/token

# Ou via proxy local (depois de iniciar dev server)
curl http://localhost:3001/api/oauth2/v1/token
```

### 3. Desenvolvimento Local

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Ou usando alias
npm start
```

A aplicação estará disponível em:
- **URL**: http://localhost:3001
- **Proxy APIs**: `/api/*` → `http://brsvcub050:3079/rest/*`

## 📦 Build para Produção

### 1. Build Básico

```bash
# Gerar build otimizado
npm run build

# Arquivos gerados em ./dist/
ls -la dist/
```

### 2. Build com Análise

```bash
# Build + análise de bundle size
npm run build:analyze
```

### 3. Preview Local

```bash
# Testar build localmente
npm run preview
```

## 🌐 Deploy em Produção

### Opção 1: Servidor Web Estático (Nginx)

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /path/to/dist;
    index index.html;

    # SPA - todas as rotas para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para Protheus ERP
    location /api/ {
        proxy_pass http://brsvcub050:3079/rest/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
    }

    # Cache estático
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Opção 2: Apache

```apache
<VirtualHost *:80>
    ServerName seu-dominio.com
    DocumentRoot /path/to/dist
    
    # SPA Routing
    <Directory "/path/to/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Proxy para Protheus
    ProxyPreserveHost On
    ProxyPass /api/ http://brsvcub050:3079/rest/
    ProxyPassReverse /api/ http://brsvcub050:3079/rest/
</VirtualHost>
```

### Opção 3: Plataformas Cloud

#### Netlify
```bash
# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

Configurar `_redirects`:
```
/api/* http://brsvcub050:3079/rest/:splat 200
/* /index.html 200
```

#### Vercel
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "http://brsvcub050:3079/rest/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## ⚙️ Configurações de Produção

### 1. Variáveis de Ambiente

Criar `.env.production`:
```env
VITE_API_BASE_URL=http://seu-protheus-server:3079/rest
VITE_APP_TITLE=Sistema de Aprovação Protheus
VITE_APP_VERSION=1.0.0
```

### 2. Configuração de Proxy

Para ambientes onde o Protheus não está diretamente acessível:

```typescript
// vite.config.ts - produção
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://brsvcub050:3079/rest',
        changeOrigin: true,
        secure: true, // https em produção
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

## 🔒 Considerações de Segurança

### 1. HTTPS Obrigatório

```bash
# Certificado SSL Let's Encrypt
sudo certbot --nginx -d seu-dominio.com
```

### 2. Headers de Segurança

```nginx
# Adicionar ao Nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### 3. Firewall

```bash
# Permitir apenas portas necessárias
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3001/tcp  # dev port
```

## 📊 Monitoramento

### 1. Logs de Acesso

```nginx
# Nginx log customizado
log_format protheus_access '$remote_addr - $remote_user [$time_local] '
                          '"$request" $status $body_bytes_sent '
                          '"$http_referer" "$http_user_agent" '
                          'rt=$request_time';

access_log /var/log/nginx/protheus_access.log protheus_access;
```

### 2. Health Check

```bash
# Criar endpoint para monitoramento
curl -f http://seu-dominio.com/ || exit 1
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **CORS Error**
   ```bash
   # Verificar configuração proxy
   curl -H "Origin: http://localhost:3001" -v http://brsvcub050:3079/rest/api/oauth2/v1/token
   ```

2. **404 em Rotas SPA**
   ```nginx
   # Verificar se fallback está configurado
   try_files $uri $uri/ /index.html;
   ```

3. **Bundle Size Grande**
   ```bash
   # Analisar bundle
   npm run build:analyze
   ```

## 📞 Suporte

### Contatos
- **Desenvolvimento**: Equipe Frontend
- **Infraestrutura**: Administradores de Sistema
- **Protheus ERP**: Equipe ERP

### Logs Úteis
- **Nginx**: `/var/log/nginx/access.log`
- **Aplicação**: Browser DevTools > Console
- **Protheus**: Logs do servidor ERP