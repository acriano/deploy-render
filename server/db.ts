import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
import { join } from 'path';

// Carregar variáveis de ambiente
dotenv.config();

// Criar uma única instância global do pool de conexão
let poolInstance: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

// Função para tentar operação com retry
const retryOperation = async (operation: Function, maxRetries = 5, delay = 1000) => {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.warn(`Tentativa ${attempt + 1}/${maxRetries} falhou:`, error);
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  console.error(`Todas as ${maxRetries} tentativas falharam.`);
  throw lastError;
};

export function getDb() {
  if (!poolInstance) {
    try {
      poolInstance = new Pool({
        user: process.env.POSTGRES_USER || 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'recyclecs',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        // Configurações adicionais para melhor performance
        max: 20, // Máximo de conexões no pool
        idleTimeoutMillis: 30000, // Tempo máximo que uma conexão pode ficar ociosa
        connectionTimeoutMillis: 2000, // Tempo máximo para estabelecer conexão
      });

      // Testar a conexão
      poolInstance.on('connect', () => {
        console.log('Nova conexão estabelecida com o PostgreSQL');
      });

      poolInstance.on('error', (err) => {
        console.error('Erro inesperado na conexão com o PostgreSQL:', err);
      });

      console.log('Conexão com o banco de dados PostgreSQL estabelecida com sucesso');
    } catch (error) {
      console.error('Erro ao conectar ao banco de dados:', error);
      throw error;
    }
  }

  if (!dbInstance) {
    try {
      dbInstance = drizzle(poolInstance, { schema });
      console.log('Instância do Drizzle criada com sucesso');
      console.log('Schema carregado:', Object.keys(schema));
    } catch (error) {
      console.error('Erro ao criar instância do Drizzle:', error);
      throw error;
    }
  }

  return dbInstance;
}

// Função para executar queries SQL diretamente
export async function executeSql(sql: string, params: any[] = []) {
  const db = getDb();
  return await retryOperation(async () => {
    return await db.execute(sql, params);
  });
}

// Função para executar queries SQL e retornar resultados
export async function querySql<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!poolInstance) {
    getDb(); // Isso vai inicializar o pool se ainda não estiver inicializado
  }
  
  if (!poolInstance) {
    throw new Error('Pool de conexão não inicializado');
  }

  return retryOperation(async () => {
    try {
      console.log('[DB] Executando query:', sql);
      console.log('[DB] Parâmetros:', params);
      
      const result = await poolInstance!.query(sql, params);
      console.log('[DB] Resultado:', result.rows);
      
      return result.rows;
    } catch (error) {
      console.error('[DB] Erro ao executar query:', error);
      throw error;
    }
  });
}

// Função para fechar a conexão com o banco de dados
export async function closeDb() {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    dbInstance = null;
    console.log('Conexão com o banco de dados fechada');
  }
}