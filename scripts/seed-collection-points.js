// Importações usando ES modules
import { getDb } from '../server/db.js';
import { collectionPoints, acceptedMaterials } from '../shared/schema.ts';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Script para popular o banco de dados com pontos de coleta de exemplo
async function main() {
  try {
    console.log('Conectando ao banco de dados...');
    const db = getDb();

    // Dados de exemplo para pontos de coleta
    const examplePoints = [
      {
        name: 'EcoPoint Centro',
        shortName: 'Centro',
        address: 'Rua Principal, 123 - Centro',
        latitude: -23.550520,
        longitude: -46.633308,
        schedule: 'Segunda a Sexta: 8h às 18h',
        phone: '(11) 1234-5678',
        website: 'https://ecopoint.com.br',
        description: 'Ponto de coleta de materiais recicláveis no centro da cidade',
        isActive: true
      },
      {
        name: 'Recicla Zona Sul',
        shortName: 'Zona Sul',
        address: 'Av. Paulista, 1000 - Bela Vista',
        latitude: -23.563090,
        longitude: -46.654390,
        schedule: 'Segunda a Sábado: 9h às 19h',
        phone: '(11) 9876-5432',
        website: 'https://recicla.com.br',
        description: 'Centro de coleta de materiais recicláveis na Zona Sul',
        isActive: true
      },
      {
        name: 'Verde Norte',
        shortName: 'Zona Norte',
        address: 'Rua Augusta, 500 - Consolação',
        latitude: -23.547500,
        longitude: -46.651090,
        schedule: 'Terça a Domingo: 10h às 20h',
        phone: '(11) 4567-8901',
        website: 'https://verde.com.br',
        description: 'Ponto de coleta especializado em plásticos e metais',
        isActive: true
      },
      {
        name: 'EcoLeste',
        shortName: 'Zona Leste',
        address: 'Av. São João, 1500 - República',
        latitude: -23.545000,
        longitude: -46.641090,
        schedule: 'Segunda a Sexta: 7h às 17h',
        phone: '(11) 2345-6789',
        website: 'https://ecoleste.com.br',
        description: 'Centro de coleta com foco em papel e papelão',
        isActive: true
      },
      {
        name: 'Recicla Oeste',
        shortName: 'Zona Oeste',
        address: 'Rua da Consolação, 2000 - Consolação',
        latitude: -23.548000,
        longitude: -46.649090,
        schedule: 'Segunda a Sábado: 8h às 18h',
        phone: '(11) 3456-7890',
        website: 'https://reciclaoeste.com.br',
        description: 'Ponto de coleta completo para todos os tipos de materiais',
        isActive: true
      }
    ];

    // Verificar se já existem pontos de coleta
    const existingPoints = await db.select().from(collectionPoints);
    if (existingPoints.length > 0) {
      console.log(`Já existem ${existingPoints.length} pontos de coleta no banco de dados.`);
      return;
    }

    console.log('Adicionando pontos de coleta de exemplo...');
    for (const point of examplePoints) {
      await db.insert(collectionPoints).values(point);
    }

    console.log('Pontos de coleta adicionados com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar pontos de coleta:', error);
    process.exit(1);
  }
}

main(); 