import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Caminho do banco de dados principal
const dbPath = path.join(rootDir, 'dev.db');

// Função para criar backup do banco de dados
function backupDatabase() {
  try {
    console.log('Criando backup do banco de dados dev.db...');

    // Verificar se o banco de dados existe
    if (!fs.existsSync(dbPath)) {
      console.log('Banco de dados dev.db não encontrado. Nenhum backup criado.');
      return false;
    }

    // Criar diretório de backup se não existir
    const backupDir = path.join(rootDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
      console.log('Diretório de backups criado.');
    }

    // Nome do arquivo de backup com data e hora
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `dev_${timestamp}.db`);

    // Copiar o banco de dados
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ Backup criado com sucesso: ${backupPath}`);

    return true;
  } catch (error) {
    console.error(`❌ ERRO ao criar backup: ${error.message}`);
    return false;
  }
}

// Executar a função
backupDatabase(); 