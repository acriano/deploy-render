import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Arquivos para remover
const filesToRemove = [
  'recycleczs_new.db',
  'recycleczs_new.db-shm',
  'recycleczs_new.db-wal',
  'database.sqlite'
];

// Função para remover um arquivo com tratamento de erro
function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Arquivo removido: ${filePath}`);
      return true;
    } else {
      console.log(`Arquivo não encontrado: ${filePath}`);
      return false;
    }
  } catch (error) {
    // Se o arquivo estiver em uso, informamos ao usuário
    if (error.code === 'EBUSY' || error.code === 'EPERM') {
      console.error(`ERRO: O arquivo ${filePath} está em uso. Feche todos os processos que possam estar usando o banco de dados e tente novamente.`);
    } else {
      console.error(`ERRO ao remover ${filePath}: ${error.message}`);
    }
    return false;
  }
}

// Função principal
function cleanDatabase() {
  console.log('Limpando arquivos de banco de dados não utilizados...');

  let removedCount = 0;
  let errorCount = 0;

  for (const file of filesToRemove) {
    const filePath = path.join(rootDir, file);
    if (removeFile(filePath)) {
      removedCount++;
    } else {
      errorCount++;
    }
  }

  if (removedCount > 0) {
    console.log(`\n✅ ${removedCount} arquivo(s) removido(s) com sucesso.`);
  }

  if (errorCount > 0) {
    console.log(`\n⚠️ ${errorCount} arquivo(s) não puderam ser removidos.`);
    console.log('\nDICA: Para garantir a remoção completa:');
    console.log('1. Pare todos os servidores e processos Node.js');
    console.log('2. Feche todos os programas que possam estar acessando os arquivos');
    console.log('3. Execute este comando novamente');
  }

  console.log('\nNOTA: O sistema agora está configurado para usar apenas o banco de dados dev.db');
}

// Executar a função principal
cleanDatabase(); 