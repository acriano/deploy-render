import pgPromise from 'pg-promise';

// Configuração do PostgreSQL
const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'recyclecs',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Configurações adicionais para melhor performance
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo máximo que uma conexão pode ficar ociosa
  connectionTimeoutMillis: 2000, // Tempo máximo para estabelecer conexão
};

// Inicializar pg-promise
const pgp = pgPromise({
  // Opções de configuração
  capSQL: true, // Capitaliza comandos SQL
  schema: 'public' // Schema padrão
});

// Criar instância do banco de dados
const db = pgp(config);

// Função para testar a conexão
export async function testConnection() {
  try {
    const result = await db.one('SELECT NOW()');
    console.log('Conexão com PostgreSQL estabelecida com sucesso:', result.now);
    return true;
  } catch (error) {
    console.error('Erro ao conectar com PostgreSQL:', error);
    return false;
  }
}

// Função para executar queries
export async function query(text: string, params?: any[]) {
  try {
    return await db.any(text, params);
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
}

// Função para executar comandos (INSERT, UPDATE, DELETE)
export async function execute(text: string, params?: any[]) {
  try {
    return await db.none(text, params);
  } catch (error) {
    console.error('Erro ao executar comando:', error);
    throw error;
  }
}

// Função para obter um único registro
export async function getOne(text: string, params?: any[]) {
  try {
    return await db.one(text, params);
  } catch (error) {
    console.error('Erro ao obter registro:', error);
    throw error;
  }
}

// Função para obter múltiplos registros
export async function getMany(text: string, params?: any[]) {
  try {
    return await db.many(text, params);
  } catch (error) {
    console.error('Erro ao obter registros:', error);
    throw error;
  }
}

export default db; 