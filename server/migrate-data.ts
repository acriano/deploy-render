import { getDb, executeSql, querySql } from './db';
import { sql } from 'drizzle-orm';
import { users, collectionPoints, acceptedMaterials, schedules, reviews } from '@shared/schema';

async function migrateUsers() {
  console.log('Migrando usuários...');
  const sqliteUsers = await querySql('SELECT * FROM users');
  
  for (const user of sqliteUsers) {
    await executeSql(`
      INSERT INTO users (id, name, email, password, role, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, [
      user.id,
      user.name || '',
      user.email || '',
      user.password,
      user.role || 'user',
      user.createdAt
    ]);
  }
  console.log(`${sqliteUsers.length} usuários migrados.`);
}

async function migrateCollectionPoints() {
  console.log('Migrando pontos de coleta...');
  const sqlitePoints = await querySql('SELECT * FROM collection_points');
  
  for (const point of sqlitePoints) {
    await executeSql(`
      INSERT INTO collection_points (
        id, name, address, latitude, longitude, short_name,
        schedule, phone, website, description,
        is_active, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING
    `, [
      point.id,
      point.name,
      point.address,
      point.latitude,
      point.longitude,
      point.shortName,
      point.schedule,
      point.phone,
      point.website,
      point.description,
      point.isActive,
      point.createdAt
    ]);
  }
  console.log(`${sqlitePoints.length} pontos de coleta migrados.`);
}

async function migrateAcceptedMaterials() {
  console.log('Migrando materiais aceitos...');
  const sqliteMaterials = await querySql('SELECT * FROM accepted_materials');
  
  for (const material of sqliteMaterials) {
    await executeSql(`
      INSERT INTO accepted_materials (
        id, collection_point_id, material_type, description
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [
      material.id,
      material.collectionPointId,
      material.materialType,
      material.description
    ]);
  }
  console.log(`${sqliteMaterials.length} materiais aceitos migrados.`);
}

async function migrateSchedules() {
  console.log('Migrando agendamentos...');
  const sqliteSchedules = await querySql('SELECT * FROM schedules');
  
  for (const schedule of sqliteSchedules) {
    await executeSql(`
      INSERT INTO schedules (
        id, collection_point_id, day_of_week, open_time, close_time, is_open, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [
      schedule.id,
      schedule.collectionPointId,
      schedule.dayOfWeek,
      schedule.openTime,
      schedule.closeTime,
      schedule.isOpen,
      schedule.createdAt
    ]);
  }
  console.log(`${sqliteSchedules.length} agendamentos migrados.`);
}

async function migrateReviews() {
  console.log('Migrando avaliações...');
  const sqliteReviews = await querySql('SELECT * FROM reviews');
  
  for (const review of sqliteReviews) {
    await executeSql(`
      INSERT INTO reviews (
        id, collection_point_id, user_id, rating,
        comment, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [
      review.id,
      review.collectionPointId,
      review.userId,
      review.rating,
      review.comment,
      review.createdAt
    ]);
  }
  console.log(`${sqliteReviews.length} avaliações migradas.`);
}

export async function migrateData() {
  try {
    console.log('Iniciando migração de dados...');
    
    await migrateUsers();
    await migrateCollectionPoints();
    await migrateAcceptedMaterials();
    await migrateSchedules();
    await migrateReviews();
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
    throw error;
  }
} 