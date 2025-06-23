import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

async function updateAdmin() {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'recyclecs',
    password: 'C3pt',
    port: 5432,
  });

  try {
    // Gerar hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('senha123', saltRounds);

    // Verificar se o usuário já existe
    const checkUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admok@gmail.com']
    );

    if (checkUser.rows.length > 0) {
      // Atualizar usuário existente
      const result = await pool.query(
        'UPDATE users SET password = $1, role = $2 WHERE email = $3 RETURNING *',
        [hashedPassword, 'admin', 'admok@gmail.com']
      );
      console.log('Usuário administrador atualizado com sucesso:', result.rows[0]);
    } else {
      // Criar novo usuário administrador
      const result = await pool.query(
        'INSERT INTO users (username, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['admok', 'Administrador', 'admok@gmail.com', hashedPassword, 'admin']
      );
      console.log('Usuário administrador criado com sucesso:', result.rows[0]);
    }

    console.log('\nCredenciais de acesso:');
    console.log('Email: admok@gmail.com');
    console.log('Senha: senha123');
  } catch (error) {
    console.error('Erro ao atualizar usuário administrador:', error);
  } finally {
    await pool.end();
  }
}

updateAdmin(); 