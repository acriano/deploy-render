import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { registerRoutes } from './routes';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

// Configurar CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'http://192.168.56.1:3000',
        'http://192.168.1.39:3000',
        'http://192.168.20.115:3000'
      ]
    : true, // Em desenvolvimento, permite todas as origens
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Criar diretórios necessários para uploads
const uploadsPath = path.join(process.cwd(), 'uploads');
const collectionPointsPath = path.join(uploadsPath, 'collection-points');

try {
  // Criar diretório de uploads se não existir
  if (!fs.existsSync(uploadsPath)) {
    console.log('[Server] Criando diretório de uploads...');
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  // Criar diretório de imagens dos pontos de coleta se não existir
  if (!fs.existsSync(collectionPointsPath)) {
    console.log('[Server] Criando diretório de imagens dos pontos de coleta...');
    fs.mkdirSync(collectionPointsPath, { recursive: true });
  }

  // Verificar permissões dos diretórios
  const uploadsStats = fs.statSync(uploadsPath);
  const collectionPointsStats = fs.statSync(collectionPointsPath);

  console.log('[Server] Permissões do diretório de uploads:', uploadsStats.mode.toString(8));
  console.log('[Server] Permissões do diretório de imagens:', collectionPointsStats.mode.toString(8));

  // No Windows, não verificamos as permissões exatas
  // Apenas verificamos se os diretórios existem e são acessíveis
  if (!fs.existsSync(uploadsPath) || !fs.existsSync(collectionPointsPath)) {
    console.error('[Server] Erro: Diretórios de upload não existem');
    process.exit(1);
  }

  // Testar permissões de escrita
  try {
    const testFile = path.join(uploadsPath, 'test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('[Server] Permissões de escrita verificadas com sucesso');
  } catch (error) {
    console.error('[Server] Erro: Sem permissão de escrita nos diretórios de upload');
    process.exit(1);
  }
} catch (error) {
  console.error('[Server] Erro ao criar diretórios de upload:', error);
  process.exit(1);
}

// Função para matar processo na porta
async function killProcessOnPort(port: number) {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.split('\n');
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length > 4) {
        const pid = parts[parts.length - 1];
        try {
          await execAsync(`taskkill /F /PID ${pid}`);
          console.log(`Processo ${pid} na porta ${port} foi finalizado.`);
        } catch (err) {
          console.error(`Erro ao matar processo ${pid}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('Erro ao tentar matar processo:', err);
  }
}

// Configurar rotas
registerRoutes(app).then(() => {
  // Iniciar o servidor
  const server = app.listen(port, () => {
    console.log(`[Server] Servidor rodando na porta ${port}`);
  }).on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`[Server] Erro: A porta ${port} já está em uso. Tentando matar o processo...`);
      killProcessOnPort(port).then(() => {
        console.log('Tentando iniciar o servidor novamente...');
        server.listen(port);
      });
    } else {
      console.error('[Server] Erro:', e);
    }
  });
}).catch(error => {
  console.error('[Server] Erro ao configurar rotas:', error);
  process.exit(1);
});
