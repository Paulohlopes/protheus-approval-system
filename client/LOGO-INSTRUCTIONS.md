# 🎨 Instruções para Adicionar o Logo da Empresa

## 📍 Onde Colocar o Arquivo do Logo

Copie o arquivo do logo da sua empresa para o seguinte caminho:

```
protheus-approval-system/client/public/logo.png
```

### Caminho Completo no Seu Computador:
```
C:\Users\paulo\OneDrive\Área de Trabalho\Projetos Git\protheus-approval-system\client\public\logo.png
```

---

## 📋 Requisitos do Arquivo

### ✅ Formatos Aceitos:
- **PNG** (Recomendado - com fundo transparente)
- **SVG** (Ideal para qualidade em qualquer tamanho)
- **JPG/JPEG** (Aceito, mas sem transparência)

### 📏 Dimensões Recomendadas:
- **Largura**: 200-400px
- **Altura**: 50-100px
- **Proporção**: Preferencialmente horizontal (landscape)

### 💡 Dicas:
- Use fundo **transparente** (PNG) para melhor integração visual
- Evite logos muito altos (verticais)
- Resolução mínima: 150 DPI
- Tamanho do arquivo: Máximo 500KB

---

## 🎯 Onde o Logo Aparecerá

Após adicionar o arquivo `logo.png` na pasta `public/`, o logo aparecerá automaticamente em:

### 1. 🔐 Tela de Login
- Tamanho: **Grande** (64px altura)
- Posição: Centro da tela, acima do formulário
- Estilo: Logo completo com fundo branco

### 2. 📱 Menu Lateral (Sidebar)
- Tamanho: **Médio** (48px altura)
- Posição: Topo do menu lateral esquerdo
- Estilo: Logo em branco sobre fundo gradiente azul

### 3. 📊 Barra Superior (AppBar)
- Tamanho: **Pequeno** (32px altura)
- Posição: Canto superior esquerdo, ao lado do título
- Estilo: Logo em branco
- Visibilidade: Apenas em telas médias/grandes (oculto em mobile)

---

## 🔄 Como Aplicar

### Passo 1: Copiar o Arquivo
1. Localize o arquivo do logo da empresa
2. Renomeie para `logo.png` (ou `logo.svg`)
3. Copie para: `C:\Users\paulo\OneDrive\Área de Trabalho\Projetos Git\protheus-approval-system\client\public\`

### Passo 2: Verificar
1. O servidor de desenvolvimento recarregará automaticamente
2. Acesse `http://localhost:3001/login`
3. O logo deve aparecer no lugar do ícone padrão

---

## 🎨 Formatos Alternativos

Se quiser usar um formato diferente de PNG, basta renomear o arquivo no componente:

### Para SVG:
Renomeie o arquivo para `logo.svg` e o sistema detectará automaticamente.

### Para JPG:
Renomeie o arquivo para `logo.jpg` ou `logo.jpeg`

---

## ❓ Troubleshooting

### O logo não aparece?
1. Verifique se o nome do arquivo está correto: `logo.png` (minúsculo)
2. Confirme que está na pasta `public/` (não em `src/`)
3. Limpe o cache do navegador (Ctrl + Shift + R)
4. Verifique o console do navegador para erros

### O logo está muito grande/pequeno?
O sistema ajusta automaticamente o tamanho, mas você pode:
1. Redimensionar o arquivo original
2. Ou editar o componente `CompanyLogo.tsx` para ajustar os tamanhos

### O logo está com qualidade ruim?
Use um arquivo de maior resolução ou formato SVG (vetorial)

---

## 📞 Suporte

Se tiver problemas para adicionar o logo, verifique:
- ✅ Nome do arquivo: `logo.png`
- ✅ Caminho: `public/logo.png`
- ✅ Formato: PNG, SVG ou JPG
- ✅ Tamanho: Menor que 500KB

---

**Nota**: Após adicionar o logo, o sistema continuará funcionando normalmente mesmo que o arquivo não exista, mostrando um ícone padrão como fallback.
