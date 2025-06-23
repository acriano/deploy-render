import { execute, query } from './config/database';

// Função para criar as tabelas
async function createTables() {
  try {
    console.log('Criando tabelas no PostgreSQL...');

    // Tabela de usuários
    await execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de pontos de coleta
    await execute(`
      CREATE TABLE IF NOT EXISTS collection_points (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        short_name VARCHAR(100),
        schedule TEXT,
        phone VARCHAR(20),
        website VARCHAR(255),
        description TEXT,
        image_url VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de materiais aceitos
    await execute(`
      CREATE TABLE IF NOT EXISTS accepted_materials (
        id SERIAL PRIMARY KEY,
        collection_point_id INTEGER REFERENCES collection_points(id) ON DELETE CASCADE,
        material_type VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de agendamentos
    await execute(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        collection_point_id INTEGER REFERENCES collection_points(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de avaliações
    await execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        collection_point_id INTEGER REFERENCES collection_points(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabela de materiais recicláveis
    await execute(`
      CREATE TABLE IF NOT EXISTS recycle_materials (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        color VARCHAR(7) DEFAULT '#6CB33F',
        youtube_url TEXT,
        recyclable_items JSONB DEFAULT '[]',
        non_recyclable_items JSONB DEFAULT '[]',
        how_to_prepare TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    throw error;
  }
}

// Função para inserir usuário de teste
async function insertTestUser() {
  try {
    const users = await query('SELECT * FROM users LIMIT 1');
    
    if (users.length === 0) {
      console.log('Inserindo usuário de teste...');
      await execute(`
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
      `, ['Admin', 'admin@example.com', 'admin123', 'admin']);
      console.log('Usuário de teste criado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao inserir usuário de teste:', error);
    throw error;
  }
}

// Função principal de inicialização
export async function initDatabase() {
  try {
    await createTables();
    await insertTestUser();
    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
} 