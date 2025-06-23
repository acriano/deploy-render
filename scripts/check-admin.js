import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import BetterSQLite from 'better-sqlite3';
import bcrypt from 'bcrypt';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Caminho do banco de dados
const dbPath = path.join(rootDir, 'dev.db');

// Função para verificar e criar usuário admin
async function checkAndCreateAdmin() {
  console.log('Verificando banco de dados para usuário administrador...');

  // Verificar se o banco de dados existe
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ ERRO: Banco de dados não encontrado em ${dbPath}`);
    console.log('Execute "npm run db:seed" para criar o banco de dados.');
    return false;
  }

  try {
    // Conectar ao banco de dados
    const db = new BetterSQLite(dbPath);

    // Verificar se a tabela de usuários existe
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableExists) {
      console.error('❌ ERRO: Tabela de usuários não existe no banco de dados.');
      console.log('Execute "npm run db:seed" para criar as tabelas necessárias.');
      return false;
    }

    // Verificar se existe algum usuário admin
    const adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();

    if (adminUser) {
      console.log('✅ Usuário administrador encontrado:');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Nome de usuário: ${adminUser.username}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log('\nPara fazer login, use:');
      console.log(`   Email: ${adminUser.email}`);
      console.log('   Senha: "senha123" (sem as aspas)');
      return true;
    }

    // Criar usuário admin se não existir
    console.log('Nenhum administrador encontrado. Criando usuário administrador...');

    // Gerar hash da senha
    const saltRounds = 10;
    const plainPassword = 'senha123';
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    // Criar novo usuário admin
    const insert = db.prepare(`
      INSERT INTO users (username, password, name, email, phone, role, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    const result = insert.run(
      'admin',
      passwordHash,
      'Administrador',
      'admin@recicla.com',
      '555-1234',
      'admin',
      now
    );

    if (result.changes === 1) {
      console.log('✅ Usuário administrador criado com sucesso!');
      console.log('\nPara fazer login, use:');
      console.log('   Email: admin@recicla.com');
      console.log('   Senha: senha123');
      return true;
    } else {
      console.error('❌ ERRO: Falha ao criar usuário administrador.');
      return false;
    }
  } catch (error) {
    console.error(`❌ ERRO: ${error.message}`);
    return false;
  }
}

// Executar a função
checkAndCreateAdmin(); 