# 🐄 AgroPrimos - Sistema de Gestão de Gado

Sistema web para gestão de gado da Agropecuária Cambui.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com) (já configurada)
- Conta no [GitHub](https://github.com)
- Conta na [Vercel](https://vercel.com)

## 🚀 Deploy na Vercel

### Passo 1: Subir código no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Crie um repositório chamado `agroprimos`
3. NÃO marque "Initialize with README"
4. Clique em "Create repository"

### Passo 2: Conectar com a Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em "Add New..." → "Project"
4. Importe o repositório `agroprimos`
5. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave anon do Supabase
6. Clique em "Deploy"

### Passo 3: Conectar domínio

1. Na Vercel, vá em Settings → Domains
2. Adicione `agroprimos.com.br`
3. Configure o DNS conforme instruções da Vercel

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Acessar em http://localhost:3000
```

## 📁 Estrutura do Projeto

```
agroprimos/
├── app/
│   ├── globals.css    # Estilos globais
│   ├── layout.js      # Layout principal
│   └── page.js        # Página principal (todo o app)
├── lib/
│   └── supabase.js    # Cliente Supabase
├── .env.local         # Variáveis de ambiente
├── package.json       # Dependências
└── tailwind.config.js # Configuração Tailwind
```

## 🔐 Credenciais

- **Senha de acesso:** agroprimos2024 (configurável no Supabase)
- **URL Supabase:** https://yeszgaswvnwbhncpemtx.supabase.co

## 📞 Suporte

Em caso de dúvidas, consulte a documentação do projeto ou entre em contato.
