const path = require('path');
const { fileURLToPath } = require('url');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('@neondatabase/serverless');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { testConnection } = require('../server/config/database');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initProduction() {
  console.log('🚀 Iniciando configuração de produção...');

  try {
    // Testar conexão com o banco
    console.log('📡 Testando conexão com o banco de dados...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Falha na conexão com o banco de dados');
      process.exit(1);
    }

    console.log('✅ Conexão com banco de dados estabelecida');

    // Configurar cliente PostgreSQL
    const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`;
    
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client);

    // Executar migrações
    console.log('🔄 Executando migrações...');
    const migrationsPath = path.join(__dirname, '..', 'drizzle');
    
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log('✅ Migrações executadas com sucesso');

    // Fechar conexão
    await client.end();
    
    console.log('🎉 Configuração de produção concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initProduction();
}

module.exports = initProduction; 