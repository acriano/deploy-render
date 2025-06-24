# 🚀 Guia Completo de Deploy do Backend no Render

## 📋 Pré-requisitos

1. ✅ Conta no [Render.com](https://render.com)
2. ✅ Banco de dados PostgreSQL configurado
3. ✅ Frontend já deployado e funcionando
4. ✅ Repositório Git configurado

## 🗄️ Configuração do Banco de Dados

### Opção 1: PostgreSQL no Render
1. No painel do Render, clique em "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `recycleczs-db`
   - **Database**: `recyclecs`
   - **User**: `recycleczs_user`
   - **Region**: Escolha a mais próxima
   - **Plan**: Free (para começar)

### Opção 2: Neon (Recomendado)
1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a string de conexão

### Opção 3: ElephantSQL
1. Acesse [elephantsql.com](https://elephantsql.com)
2. Crie uma conta gratuita
3. Crie uma nova instância
4. Copie a string de conexão

## 🔧 Deploy no Render

### Passo 1: Criar Web Service
1. Acesse [render.com](https://render.com) e faça login
2. Clique em "New +" e selecione "Web Service"
3. Conecte seu repositório GitHub/GitLab
4. Configure o serviço:

```
Name: recycleczs-backend
Environment: Node
Region: Oregon (ou mais próxima)
Branch: main
Root Directory: deploy-render/deploy-render
Build Command: npm install
Start Command: npm run start:prod
```

### Passo 2: Configurar Variáveis de Ambiente

No painel do Render, vá em "Environment" e configure:

#### 🔐 Variáveis Obrigatórias:
```
NODE_ENV = production
PORT = 5000
POSTGRES_HOST = seu-host-postgres
POSTGRES_PORT = 5432
POSTGRES_DB = recyclecs
POSTGRES_USER = seu-usuario
POSTGRES_PASSWORD = sua-senha
```

#### 🔑 Variáveis de Segurança (geradas automaticamente):
```
JWT_SECRET = [será gerado automaticamente]
SESSION_SECRET = [será gerado automaticamente]
```

### Passo 3: Configurar CORS

Após o deploy, você precisará atualizar o arquivo `server/index.ts` para incluir a URL do seu frontend:

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://seu-frontend-url.onrender.com', // URL do seu frontend
        'http://localhost:3000', // Para desenvolvimento local
      ]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 🧪 Testando o Deploy

### 1. Health Check
Após o deploy, teste se a API está funcionando:
```
GET https://seu-backend-url.onrender.com/api/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. Ping Test
```
GET https://seu-backend-url.onrender.com/api/ping
```

### 3. Teste da API
```
GET https://seu-backend-url.onrender.com/api/test
```

## 🔄 Migrações do Banco

O script `scripts/init-production.js` será executado automaticamente durante o deploy e irá:

1. ✅ Testar conexão com o banco
2. ✅ Executar migrações do Drizzle
3. ✅ Verificar se tudo está funcionando

## 📁 Estrutura de Arquivos

```
deploy-render/deploy-render/
├── server/                    # Código do backend
│   ├── index.ts              # Servidor principal
│   ├── routes.ts             # Rotas da API
│   ├── config/               # Configurações
│   │   └── database.ts       # Config do PostgreSQL
│   └── middleware/           # Middlewares
├── shared/                   # Schema compartilhado
│   └── schema.ts            # Schema do banco
├── drizzle/                  # Migrações
│   └── 0000_initial.sql     # Migração inicial
├── scripts/                  # Scripts utilitários
│   └── init-production.js   # Script de inicialização
├── package.json             # Dependências
├── render.yaml              # Configuração do Render
├── Dockerfile               # Configuração Docker
└── README-DEPLOY.md         # Este arquivo
```

## 🚨 Troubleshooting

### Erro de Conexão com Banco
```
❌ Falha na conexão com o banco de dados
```
**Solução:**
- Verifique se as variáveis de ambiente estão corretas
- Teste a conexão localmente com as mesmas credenciais
- Verifique se o banco permite conexões externas
- Para Neon: certifique-se de que a string de conexão está correta

### Erro de CORS
```
❌ CORS policy: No 'Access-Control-Allow-Origin' header
```
**Solução:**
- Atualize a configuração de CORS no `server/index.ts`
- Adicione a URL do seu frontend na lista de origens permitidas
- Certifique-se de que o frontend está usando HTTPS em produção

### Erro de Build
```
❌ Build failed
```
**Solução:**
- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que o Node.js versão 20+ está sendo usado
- Verifique os logs de build no Render

### Erro de Migração
```
❌ Migration failed
```
**Solução:**
- Verifique se o banco de dados existe
- Verifique se o usuário tem permissões para criar tabelas
- Execute as migrações manualmente se necessário

## 🔗 URLs Importantes

Após o deploy, você terá:

- **Backend API**: `https://recycleczs-backend.onrender.com`
- **Health Check**: `https://recycleczs-backend.onrender.com/api/health`
- **Frontend**: `https://seu-frontend-url.onrender.com`
- **Banco de Dados**: `postgresql://user:pass@host:port/db`

## 📞 Suporte

Se encontrar problemas:

1. 📖 Verifique os logs no painel do Render
2. 🔍 Teste os endpoints de health check
3. 🐛 Verifique se as variáveis de ambiente estão corretas
4. 💬 Consulte a documentação do Render

## 🎉 Próximos Passos

Após o deploy bem-sucedido:

1. ✅ Configure o frontend para usar a nova URL da API
2. ✅ Teste todas as funcionalidades
3. ✅ Configure um domínio personalizado (opcional)
4. ✅ Configure monitoramento e alertas
5. ✅ Configure backups automáticos do banco

---

**🎯 Deploy concluído!** Sua API está pronta para produção! 🚀 