import {
  users, type User, type InsertUser,
  collectionPoints, type CollectionPoint, type InsertCollectionPoint,
  acceptedMaterials, type AcceptedMaterial, type InsertAcceptedMaterial,
  collectionSchedules, type CollectionSchedule, type InsertCollectionSchedule,
  scheduleMaterials, type ScheduleMaterial, type InsertScheduleMaterial,
  reviews, type Review, type InsertReview,
  schedules, type Schedule, type InsertSchedule,
  collectionPointMaterials, type CollectionPointMaterial, type InsertCollectionPointMaterial,
  operatingHours, type OperatingHours, type InsertOperatingHours
} from "@shared/schema";
import { getDb } from "./db";
import { eq, and, inArray, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Pontos de coleta
  getAllCollectionPoints(): Promise<CollectionPoint[]>;
  getCollectionPoint(id: number): Promise<CollectionPoint | undefined>;
  createCollectionPoint(point: InsertCollectionPoint): Promise<CollectionPoint>;
  updateCollectionPoint(id: number, point: Partial<InsertCollectionPoint> & { imageUrl?: string }): Promise<CollectionPoint | undefined>;
  deleteCollectionPoint(id: number): Promise<void>;

  // Materiais aceitos
  getAcceptedMaterials(collectionPointId: number): Promise<AcceptedMaterial[]>;
  addAcceptedMaterial(material: InsertAcceptedMaterial): Promise<AcceptedMaterial>;
  removeAcceptedMaterial(id: number): Promise<void>;

  // Agendamentos
  getUserSchedules(userId: number): Promise<CollectionSchedule[]>;
  getCollectorSchedules(collectorId: number): Promise<CollectionSchedule[]>;
  getCollectionPointSchedules(collectionPointId: number): Promise<CollectionSchedule[]>;
  createSchedule(schedule: InsertCollectionSchedule): Promise<CollectionSchedule>;
  updateScheduleStatus(id: number, status: string): Promise<CollectionSchedule | undefined>;

  // Materiais do agendamento
  addScheduleMaterial(material: InsertScheduleMaterial): Promise<ScheduleMaterial>;
  getScheduleMaterials(scheduleId: number): Promise<ScheduleMaterial[]>;

  // Avaliações
  createReview(review: InsertReview): Promise<Review>;
  getCollectionPointReviews(collectionPointId: number): Promise<Review[]>;
  getUserReviews(userId: number): Promise<Review[]>;

  // Horários de funcionamento
  getSchedules(collectionPointId: number): Promise<Schedule[]>;
  addSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  removeSchedule(id: number): Promise<void>;

  // Materiais do ponto de coleta
  getCollectionPointMaterials(collectionPointId: number): Promise<CollectionPointMaterial[]>;
  addCollectionPointMaterial(material: InsertCollectionPointMaterial): Promise<CollectionPointMaterial>;
  removeCollectionPointMaterial(id: number): Promise<void>;

  getReviews(collectionPointId: number): Promise<Review[]>;
  addReview(review: InsertReview): Promise<Review>;
  removeReview(id: number): Promise<void>;

  getOperatingHours(collectionPointId: number): Promise<OperatingHours[]>;
  addOperatingHours(hours: InsertOperatingHours): Promise<OperatingHours>;
  updateOperatingHours(id: number, hours: Partial<InsertOperatingHours>): Promise<OperatingHours>;
  removeOperatingHours(id: number): Promise<void>;

  checkMaterialExists(collectionPointId: number, materialType: string): Promise<boolean>;
}

// Funções auxiliares para o arquivo de rotas
export const getCollectionPoints = async () => {
  const db = getDb();
  return await db.select().from(collectionPoints);
};

export const getCollectionPointById = async (id: number) => {
  const db = getDb();
  const points = await db.select().from(collectionPoints).where(eq(collectionPoints.id, id));
  return points[0];
};

export const updateCollectionPoint = async (id: number, point: any) => {
  const db = getDb();
  // Buscar o ponto existente para garantir fallback
  const existing = await getCollectionPointById(id);
  if (!existing) {
    throw new Error('Ponto de coleta não encontrado para atualização');
  }
  // Montar objeto de atualização com todos os campos do schema
  const updateData: any = {
    name: point.name !== undefined ? point.name : existing.name,
    address: point.address !== undefined ? point.address : existing.address,
    latitude: point.latitude !== undefined ? Number(point.latitude) : existing.latitude,
    longitude: point.longitude !== undefined ? point.longitude : existing.longitude,
    shortName: point.shortName !== undefined ? point.shortName : (existing.shortName ?? null),
    schedule: point.schedule !== undefined ? point.schedule : (existing.schedule ?? null),
    phone: point.phone !== undefined ? point.phone : (existing.phone ?? null),
    website: point.website !== undefined ? point.website : (existing.website ?? null),
    whatsapp: point.whatsapp !== undefined ? point.whatsapp : (existing.whatsapp ?? null),
    description: point.description !== undefined ? point.description : (existing.description ?? null),
    isActive: point.isActive !== undefined ? point.isActive : (existing.isActive ?? true),
    imageUrl: point.imageUrl !== undefined ? point.imageUrl : (existing.imageUrl ?? null)
  };
  console.log('[DEBUG] updateCollectionPoint - Dados enviados para o banco:', updateData);
  await db.update(collectionPoints)
    .set(updateData)
    .where(eq(collectionPoints.id, id));
  return await getCollectionPointById(id);
};

export const deleteCollectionPoint = async (id: number) => {
  const db = getDb();
  await db.delete(collectionPoints).where(eq(collectionPoints.id, id));
};

export const createMaterial = async (material: InsertAcceptedMaterial) => {
  try {
    const db = getDb();
    console.log('Criando material com dados:', material);
    
    const [newMaterial] = await db
      .insert(acceptedMaterials)
      .values({
        collectionPointId: material.collectionPointId,
        materialType: material.materialType,
        description: material.description ?? null
      })
      .returning();
      
    console.log('Material criado com sucesso:', newMaterial);
    return newMaterial;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Erro ao criar material:', error.message);
    } else {
      console.error('Erro ao criar material:', error);
    }
    throw error;
  }
};

export const getMaterialsByPointId = async (collectionPointId: number) => {
  const db = getDb();
  return await db
    .select()
    .from(acceptedMaterials)
    .where(eq(acceptedMaterials.collectionPointId, collectionPointId));
};

export const deleteMaterial = async (id: number) => {
  const db = getDb();
  await db
    .delete(acceptedMaterials)
    .where(eq(acceptedMaterials.id, id));
};

export class DatabaseStorage implements IStorage {
  // Métodos de Usuário
  async getUser(id: number): Promise<User | undefined> {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log('Iniciando busca de usuário por email:', email);
      console.log('Executando query no banco de dados...');

      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      console.log('Query executada com sucesso');
      console.log('Resultado da query:', user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        password: user.password ? '[HASH PRESENTE]' : '[SEM HASH]'
      } : 'Nenhum usuário encontrado');

      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const db = getDb();
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning();
      if (!user) throw new Error('Falha ao criar usuário: nenhum usuário retornado');
      return user;
    } catch (error) {
      throw error;
    }
  }

  // Métodos de Pontos de Coleta
  async getAllCollectionPoints(): Promise<CollectionPoint[]> {
    const db = getDb();
    return await db
      .select()
      .from(collectionPoints)
      .orderBy(desc(collectionPoints.createdAt));
  }

  async getCollectionPoint(id: number): Promise<CollectionPoint | undefined> {
    const db = getDb();
    const [point] = await db
      .select()
      .from(collectionPoints)
      .where(eq(collectionPoints.id, id));
    return point;
  }

  async createCollectionPoint(point: InsertCollectionPoint): Promise<CollectionPoint> {
    try {
      const db = getDb();
      const [newPoint] = await db
        .insert(collectionPoints)
        .values(point)
        .returning();
      if (!newPoint) throw new Error('Falha ao criar ponto de coleta: nenhum ponto retornado');
      return newPoint;
    } catch (error) {
      throw error;
    }
  }

  async updateCollectionPoint(id: number, point: Partial<InsertCollectionPoint> & { imageUrl?: string }): Promise<CollectionPoint | undefined> {
    try {
      console.log('Iniciando atualização do ponto de coleta com ID:', id);
      console.log('Dados de atualização:', point);
  
      const db = getDb();
      
      // Preparar objeto de atualização
      const updateData: any = {};
      
      if (point.name !== undefined) updateData.name = point.name;
      if (point.shortName !== undefined) updateData.shortName = point.shortName;
      if (point.address !== undefined) updateData.address = point.address;
      if (point.latitude !== undefined) updateData.latitude = point.latitude;
      if (point.longitude !== undefined) updateData.longitude = point.longitude;
      if (point.schedule !== undefined) updateData.schedule = point.schedule;
      if (point.phone !== undefined) updateData.phone = point.phone;
      if (point.website !== undefined) updateData.website = point.website;
      if (point.description !== undefined) updateData.description = point.description;
      if (point.isActive !== undefined) updateData.isActive = point.isActive;
      if (point.imageUrl !== undefined) {
        console.log('Atualizando URL da imagem para:', point.imageUrl);
        updateData.imageUrl = point.imageUrl;
      }
      updateData.updatedAt = new Date();
  
      if (Object.keys(updateData).length === 0) {
        console.log('Nenhum campo para atualizar');
        const point = await this.getCollectionPoint(id);
        return point;
      }
  
      console.log('Dados para atualização:', updateData);
  
      // Executar atualização usando Drizzle
      const [updatedPoint] = await db
        .update(collectionPoints)
        .set(updateData)
        .where(eq(collectionPoints.id, id))
        .returning();
  
      console.log('Ponto de coleta atualizado com sucesso:', updatedPoint);
      return updatedPoint;
    } catch (error) {
      console.error('Erro ao atualizar ponto de coleta:', error);
      throw error;
    }
  }

  async deleteCollectionPoint(id: number): Promise<void> {
    try {
      // Excluir o ponto de coleta do banco de dados
      const db = getDb();
      await db
        .delete(collectionPoints)
        .where(eq(collectionPoints.id, id));

      console.log(`Ponto de coleta ID ${id} excluído com sucesso.`);
    } catch (error) {
      console.error(`Erro ao excluir ponto de coleta ID ${id}:`, error);
      throw error;
    }
  }

  // Métodos de Materiais Aceitos
  async getAcceptedMaterials(collectionPointId: number): Promise<AcceptedMaterial[]> {
    const db = getDb();
    return await db
      .select()
      .from(acceptedMaterials)
      .where(eq(acceptedMaterials.collectionPointId, collectionPointId));
  }

  async addAcceptedMaterial(material: InsertAcceptedMaterial): Promise<AcceptedMaterial> {
    const db = getDb();
    const [newMaterial] = await db
      .insert(acceptedMaterials)
      .values(material)
      .returning();
    return newMaterial;
  }

  async removeAcceptedMaterial(id: number): Promise<void> {
    const db = getDb();
    await db
      .delete(acceptedMaterials)
      .where(eq(acceptedMaterials.id, id));
  }

  // Métodos de Agendamentos
  async getUserSchedules(userId: number): Promise<CollectionSchedule[]> {
    const db = getDb();
    return await db
      .select()
      .from(collectionSchedules)
      .where(eq(collectionSchedules.userId, userId))
      .orderBy(desc(collectionSchedules.scheduledDate));
  }

  async getCollectorSchedules(collectorId: number): Promise<CollectionSchedule[]> {
    const db = getDb();
    return await db
      .select()
      .from(collectionSchedules)
      .where(eq(collectionSchedules.collectorId, collectorId))
      .orderBy(desc(collectionSchedules.scheduledDate));
  }

  async getCollectionPointSchedules(collectionPointId: number): Promise<CollectionSchedule[]> {
    const db = getDb();
    return await db
      .select()
      .from(collectionSchedules)
      .where(eq(collectionSchedules.collectionPointId, collectionPointId))
      .orderBy(desc(collectionSchedules.scheduledDate));
  }

  async createSchedule(schedule: InsertCollectionSchedule): Promise<CollectionSchedule> {
    const db = getDb();
    const [newSchedule] = await db
      .insert(collectionSchedules)
      .values(schedule)
      .returning();
    return newSchedule;
  }

  async updateScheduleStatus(id: number, status: string): Promise<CollectionSchedule | undefined> {
    const db = getDb();
    const [updatedSchedule] = await db
      .update(collectionSchedules)
      .set({
        status: status as any,
        completedDate: status === "concluída" ? new Date() : null
      })
      .where(eq(collectionSchedules.id, id))
      .returning();
    return updatedSchedule;
  }

  // Métodos de Materiais do Agendamento
  async getScheduleMaterials(scheduleId: number): Promise<ScheduleMaterial[]> {
    const db = getDb();
    return await db
      .select()
      .from(scheduleMaterials)
      .where(eq(scheduleMaterials.scheduleId, scheduleId));
  }

  async addScheduleMaterial(scheduleMaterial: InsertScheduleMaterial): Promise<ScheduleMaterial> {
    const db = getDb();
    const [newScheduleMaterial] = await db
      .insert(scheduleMaterials)
      .values(scheduleMaterial)
      .returning();
    return newScheduleMaterial;
  }

  async removeScheduleMaterial(id: number): Promise<void> {
    const db = getDb();
    await db
      .delete(scheduleMaterials)
      .where(eq(scheduleMaterials.id, id));
  }

  // Métodos de Avaliações
  async createReview(review: InsertReview): Promise<Review> {
    const db = getDb();
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }

  async getCollectionPointReviews(collectionPointId: number): Promise<Review[]> {
    const db = getDb();
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.collectionPointId, collectionPointId))
      .orderBy(desc(reviews.createdAt));
  }

  async getUserReviews(userId: number): Promise<Review[]> {
    const db = getDb();
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  // Horários de funcionamento
  async getSchedules(collectionPointId: number): Promise<Schedule[]> {
    const db = getDb();
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.collectionPointId, collectionPointId))
      .orderBy(schedules.dayOfWeek);
  }

  async addSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const db = getDb();
    const [newSchedule] = await db
      .insert(schedules)
      .values(schedule)
      .returning();
    return newSchedule;
  }

  async updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const db = getDb();
    const [updatedSchedule] = await db
      .update(schedules)
      .set({
        ...schedule,
        updatedAt: new Date()
      })
      .where(eq(schedules.id, id))
      .returning();
    return updatedSchedule;
  }

  async removeSchedule(id: number): Promise<void> {
    const db = getDb();
    await db
      .delete(schedules)
      .where(eq(schedules.id, id));
  }

  // Métodos de Materiais do ponto de coleta
  async getCollectionPointMaterials(collectionPointId: number): Promise<CollectionPointMaterial[]> {
    const db = getDb();
    return await db
      .select()
      .from(collectionPointMaterials)
      .where(eq(collectionPointMaterials.collectionPointId, collectionPointId));
  }

  async addCollectionPointMaterial(material: InsertCollectionPointMaterial): Promise<CollectionPointMaterial> {
    const db = getDb();
    const [newMaterial] = await db
      .insert(collectionPointMaterials)
      .values(material)
      .returning();
    return newMaterial;
  }

  async removeCollectionPointMaterial(id: number): Promise<void> {
    const db = getDb();
    await db
      .delete(collectionPointMaterials)
      .where(eq(collectionPointMaterials.id, id));
  }

  async getReviews(collectionPointId: number): Promise<Review[]> {
    const db = getDb();
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.collectionPointId, collectionPointId))
      .orderBy(desc(reviews.createdAt));
  }

  async addReview(review: InsertReview): Promise<Review> {
    const db = getDb();
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }

  async removeReview(id: number): Promise<void> {
    const db = getDb();
    await db
      .delete(reviews)
      .where(eq(reviews.id, id));
  }

  async getOperatingHours(collectionPointId: number): Promise<OperatingHours[]> {
    const db = getDb();
    return await db
      .select()
      .from(operatingHours)
      .where(eq(operatingHours.collectionPointId, collectionPointId))
      .orderBy(operatingHours.dayOfWeek);
  }

  async addOperatingHours(hours: InsertOperatingHours): Promise<OperatingHours> {
    const db = getDb();
    const [newHours] = await db
      .insert(operatingHours)
      .values(hours)
      .returning();
    return newHours;
  }

  async updateOperatingHours(id: number, hours: Partial<InsertOperatingHours>): Promise<OperatingHours> {
    const db = getDb();
    const [updatedHours] = await db
      .update(operatingHours)
      .set({
        ...hours,
        updatedAt: new Date()
      })
      .where(eq(operatingHours.id, id))
      .returning();
    return updatedHours;
  }

  async removeOperatingHours(id: number): Promise<void> {
    const db = getDb();
    await db
      .delete(operatingHours)
      .where(eq(operatingHours.id, id));
  }

  async checkMaterialExists(collectionPointId: number, materialType: string): Promise<boolean> {
    try {
      console.log("[Storage] Verificando existência do material:", { collectionPointId, materialType });
      
      const db = getDb();
      const result = await db
        .select({ id: acceptedMaterials.id })
        .from(acceptedMaterials)
        .where(
          and(
            eq(acceptedMaterials.collectionPointId, collectionPointId),
            eq(acceptedMaterials.materialType, materialType)
          )
        )
        .limit(1);
      
      const exists = result.length > 0;
      console.log("[Storage] Resultado da verificação:", { exists, result });
      
      return exists;
    } catch (error) {
      console.error("[Storage] Erro ao verificar existência do material:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

export async function addAcceptedMaterial(collectionPointId: number, materialType: string, description?: string) {
  try {
    const db = getDb();
    const [result] = await db.insert(collectionPointMaterials).values({
      collectionPointId,
      materialType,
      description: description ?? null
    }).returning();
    return result;
  } catch (error) {
    console.error('Erro ao adicionar material:', error);
    throw error;
  }
}

export async function updateSchedule(id: number, status: string) {
  try {
    const db = getDb();
    const [result] = await db.update(schedules)
      .set({
        updatedAt: new Date()
      })
      .where(eq(schedules.id, id))
      .returning();
    return result;
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
}

export async function addScheduleMaterial(scheduleId: number, materialType: string, quantity: number, unit: string) {
  try {
    const db = getDb();
    const [result] = await db.insert(scheduleMaterials).values({
      scheduleId,
      materialType,
      quantity,
      unit
    }).returning();
    return result;
  } catch (error) {
    console.error('Erro ao adicionar material ao agendamento:', error);
    throw error;
  }
}

export async function updateScheduleMaterial(id: number, data: Partial<ScheduleMaterial>) {
  try {
    const db = getDb();
    const [result] = await db.update(scheduleMaterials)
      .set(data)
      .where(eq(scheduleMaterials.id, id))
      .returning();
    return result;
  } catch (error) {
    console.error('Erro ao atualizar material do agendamento:', error);
    throw error;
  }
}

export async function addReview(userId: number, collectionPointId: number, rating: number, comment?: string) {
  try {
    const db = getDb();
    const [result] = await db.insert(reviews).values({
      userId,
      collectionPointId,
      rating,
      comment: comment ?? null
    }).returning();
    return result;
  } catch (error) {
    console.error('Erro ao adicionar avaliação:', error);
    throw error;
  }
}

export async function updateReview(id: number, data: Partial<Review>) {
  try {
    const db = getDb();
    const [result] = await db.update(reviews)
      .set(data)
      .where(eq(reviews.id, id))
      .returning();
    return result;
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    throw error;
  }
}
