import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Configurações do banco de dados
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || '5432',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'recyclecs'
};

// Função para criar backup do PostgreSQL
function backupPostgreSQL() {
  return new Promise((resolve, reject) => {
    try {
      console.log('Criando backup do banco de dados PostgreSQL...');

      // Criar diretório de backup se não existir
      const backupDir = path.join(rootDir, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log('Diretório de backups criado.');
      }

      // Nome do arquivo de backup com data e hora
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                       new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
      const backupPath = path.join(backupDir, `recyclecs_backup_${timestamp}.sql`);

      // Comando pg_dump para criar o backup
      const pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${backupPath}" --verbose --clean --if-exists --create`;

      // Definir a senha como variável de ambiente para o comando
      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      console.log('Executando backup...');
      exec(pgDumpCommand, { env }, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ ERRO ao criar backup: ${error.message}`);
          reject(error);
          return;
        }

        if (stderr && !stderr.includes('NOTICE')) {
          console.warn(`Avisos durante o backup: ${stderr}`);
        }

        console.log(`✅ Backup criado com sucesso: ${backupPath}`);
        console.log(`📁 Tamanho do arquivo: ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB`);
        
        // Criar também um backup das configurações
        createConfigBackup(backupDir, timestamp);
        
        resolve(backupPath);
      });
    } catch (error) {
      console.error(`❌ ERRO inesperado: ${error.message}`);
      reject(error);
    }
  });
}

// Função para criar backup das configurações
function createConfigBackup(backupDir, timestamp) {
  try {
    const configBackupPath = path.join(backupDir, `config_backup_${timestamp}.json`);
    
    const configData = {
      database: {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database,
        // Não incluir a senha por segurança
      },
      environment: {
        node_version: process.version,
        platform: process.platform,
        backup_date: new Date().toISOString()
      },
      instructions: {
        restore: "Para restaurar: psql -h localhost -U postgres -d recyclecs -f backup_file.sql",
        setup: "1. Instale PostgreSQL na nova máquina\n2. Crie o banco 'recyclecs'\n3. Configure as variáveis de ambiente no .env\n4. Execute o comando de restore"
      }
    };

    fs.writeFileSync(configBackupPath, JSON.stringify(configData, null, 2));
    console.log(`📋 Configurações salvas em: ${configBackupPath}`);
  } catch (error) {
    console.warn(`⚠️ Não foi possível criar backup das configurações: ${error.message}`);
  }
}

// Executar o backup
backupPostgreSQL()
  .then((backupPath) => {
    console.log('\n🎉 Backup concluído com sucesso!');
    console.log('\n📋 Instruções para restaurar em outra máquina:');
    console.log('1. Instale PostgreSQL na nova máquina');
    console.log('2. Crie o banco de dados: createdb -U postgres recyclecs');
    console.log('3. Copie o arquivo .env e o arquivo de backup');
    console.log(`4. Restaure o backup: psql -U postgres -d recyclecs -f "${path.basename(backupPath)}"`);
    console.log('5. Execute: npm install');
    console.log('6. Inicie o sistema: npm run dev');
  })
  .catch((error) => {
    console.error('❌ Falha no backup:', error.message);
    process.exit(1);
  });