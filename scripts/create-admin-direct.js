import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

async function createAdmin() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'recyclecs',
    password: 'postgres',
    port: 5432,
  });

  try {
    // Gerar hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Inserir usuário admin
    const result = await pool.query(
      'INSERT INTO users (username, password, name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      ['admin', hashedPassword, 'Administrador', 'admin@recyclecs.com', 'admin']
    );

    console.log('Usuário administrador criado com sucesso!');
    console.log('\nCredenciais de acesso:');
    console.log('Email: admin@recyclecs.com');
    console.log('Senha: admin123');
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
  } finally {
    await pool.end();
  }
}

createAdmin(); 