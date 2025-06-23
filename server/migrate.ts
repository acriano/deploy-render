import { initDatabase } from './init-db';
import { migrateData } from './migrate-data';

async function main() {
  try {
    console.log('Iniciando processo de migração...');
    
    // Inicializa o banco PostgreSQL
    console.log('Inicializando banco PostgreSQL...');
    await initDatabase();
    
    // Migra os dados do SQLite para o PostgreSQL
    console.log('Migrando dados do SQLite para o PostgreSQL...');
    await migrateData();
    
    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  }
}

main(); 