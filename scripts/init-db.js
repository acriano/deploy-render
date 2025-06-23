import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema.js';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function main() {
  try {
    console.log('Conectando ao banco de dados...');
    const pool = new Pool({
      user: process.env.POSTGRES_USER || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      database: process.env.POSTGRES_DB || 'recyclecs',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
    });

    const db = drizzle(pool, { schema });

    console.log('Executando migrações...');
    await migrate(db, { migrationsFolder: 'drizzle' });

    console.log('Banco de dados inicializado com sucesso!');
    await pool.end();
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
}

main(); 