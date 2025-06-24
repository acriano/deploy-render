# Guia de Deploy do Backend no Render

## Pré-requisitos

1. Conta no Render.com
2. Banco de dados PostgreSQL configurado (pode ser no próprio Render ou externo como Neon, ElephantSQL, etc.)
3. Frontend já deployado e funcionando

## Passos para Deploy

### 1. Configurar o Banco de Dados

Se você ainda não tem um banco de dados PostgreSQL, você pode:
- Criar um PostgreSQL no Render
- Usar Neon (neon.tech)
- Usar ElephantSQL
- Ou qualquer outro provedor PostgreSQL

### 2. Deploy no Render

1. Acesse [render.com](https://render.com) e faça login
2. Clique em "New +" e selecione "Web Service"
3. Conecte seu repositório GitHub/GitLab
4. Configure o serviço:
   - **Name**: `recycleczs-backend`
   - **Environment**: `Node`
   - **Region**: Escolha a mais próxima
   - **Branch**: `main` (ou sua branch principal)
   - **Root Directory**: `deploy-render/deploy-render`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Configurar Variáveis de Ambiente

No painel do Render, vá em "Environment" e configure as seguintes variáveis:

#### Obrigatórias:
- `NODE_ENV`: `production`
- `PORT`: `5000`
- `POSTGRES_HOST`: URL do seu banco PostgreSQL
- `POSTGRES_PORT`: `5432`
- `POSTGRES_DB`: Nome do seu banco de dados
- `POSTGRES_USER`: Usuário do banco
- `POSTGRES_PASSWORD`: Senha do banco

#### Geradas automaticamente:
- `JWT_SECRET`: Será gerada automaticamente
- `SESSION_SECRET`: Será gerada automaticamente

### 4. Configurar CORS

No arquivo `server/index.ts`, atualize a configuração de CORS para incluir a URL do seu frontend:

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://your-frontend-url.onrender.com', // URL do seu frontend
        'http://localhost:3000', // Para desenvolvimento local
        // outras URLs permitidas
      ]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 5. Executar Migrações

Após o deploy, você precisará executar as migrações do banco de dados. Você pode fazer isso:

1. Via SSH no Render (se disponível)
2. Ou criando um script de inicialização que executa as migrações

### 6. Testar a API

Após o deploy, teste se a API está funcionando acessando:
`https://your-backend-url.onrender.com/api/health` (se existir um endpoint de health)

## Estrutura de Arquivos

```
deploy-render/deploy-render/
├── server/           # Código do backend
├── shared/           # Schema do banco
├── drizzle/          # Migrações
├── package.json      # Dependências
├── render.yaml       # Configuração do Render
└── Dockerfile        # Configuração Docker (opcional)
```

## Troubleshooting

### Erro de Conexão com Banco
- Verifique se as variáveis de ambiente estão corretas
- Teste a conexão localmente com as mesmas credenciais
- Verifique se o banco permite conexões externas

### Erro de CORS
- Verifique se a URL do frontend está na lista de origens permitidas
- Certifique-se de que o frontend está usando HTTPS em produção

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que o Node.js versão 20+ está sendo usado

## URLs Importantes

- **Backend**: `https://your-backend-url.onrender.com`
- **Frontend**: `https://your-frontend-url.onrender.com`
- **Banco de Dados**: `postgresql://user:pass@host:port/db` 