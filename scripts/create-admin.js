import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema.js';
import { hashPassword } from '../server/auth.js';
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

    console.log('Criando usuário administrador...');
    const hashedPassword = await hashPassword('admin123');
    await db.insert(schema.users).values({
      username: 'admin',
      password: hashedPassword,
      name: 'Administrador',
      email: 'admin@recyclecs.com',
      role: 'admin'
    });

    console.log('Usuário administrador criado com sucesso!');
    console.log('\nCredenciais de acesso:');
    console.log('Email: admin@recyclecs.com');
    console.log('Senha: admin123');
    
    await pool.end();
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    process.exit(1);
  }
}

main(); 