import { pgTable, text, integer, real, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Tabela de usuários
export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email").unique(),
  phone: text("phone"),
  role: text("role").default("user"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de pontos de coleta
export const collectionPoints = pgTable("collection_points", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  schedule: text("schedule"),
  phone: text("phone"),
  website: text("website"),
  whatsapp: text("whatsapp"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(), // ✅ ADICIONAR ESTA LINHA
  createdBy: integer("created_by").references(() => users.id),
});

// Tabela de materiais aceitos nos pontos de coleta
export const acceptedMaterials = pgTable("accepted_materials", {
  id: integer("id").primaryKey(),
  collectionPointId: integer("collection_point_id").notNull().references(() => collectionPoints.id, { onDelete: "cascade" }),
  materialType: text("material_type").notNull(),
  description: text("description"),
}, (table) => {
  return {
    uniqueMaterial: unique().on(table.collectionPointId, table.materialType),
  };
});

// Tabela de agendamentos de coleta
export const collectionSchedules = pgTable("collection_schedules", {
  id: integer("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  collectionPointId: integer("collection_point_id").references(() => collectionPoints.id),
  collectorId: integer("collector_id").references(() => users.id),
  status: text("status").default("agendada"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  materialDescription: text("material_description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de materiais nos agendamentos de coleta
export const scheduleMaterials = pgTable("schedule_materials", {
  id: integer("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => collectionSchedules.id, { onDelete: "cascade" }),
  materialType: text("material_type").notNull(),
  quantity: real("quantity"),
  unit: text("unit").default("kg"),
});

// Tabela de comentários e avaliações
export const reviews = pgTable("reviews", {
  id: integer("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  collectionPointId: integer("collection_point_id").references(() => collectionPoints.id),
  collectorId: integer("collector_id").references(() => users.id),
  scheduleId: integer("schedule_id").references(() => collectionSchedules.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de horários de funcionamento
export const schedules = pgTable("schedules", {
  id: integer("id").primaryKey(),
  collectionPointId: integer("collection_point_id").notNull().references(() => collectionPoints.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
  isOpen: boolean("is_open").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de materiais nos pontos de coleta
export const collectionPointMaterials = pgTable("collection_point_materials", {
  id: integer("id").primaryKey(),
  collectionPointId: integer("collection_point_id").notNull().references(() => collectionPoints.id, { onDelete: "cascade" }),
  materialType: text("material_type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    uniqueMaterial: unique().on(table.collectionPointId, table.materialType),
  };
});

// Tabela de horários de operação
export const operatingHours = pgTable("operating_hours", {
  id: integer("id").primaryKey(),
  collectionPointId: integer("collection_point_id").notNull().references(() => collectionPoints.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
  isOpen: boolean("is_open").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Definição das relações
export const usersRelations = relations(users, ({ many }) => ({
  createdCollectionPoints: many(collectionPoints, { relationName: "userCreatedPoints" }),
  collectionSchedules: many(collectionSchedules, { relationName: "userSchedules" }),
  collectorSchedules: many(collectionSchedules, { relationName: "collectorSchedules" }),
  reviews: many(reviews, { relationName: "userReviews" }),
}));

export const collectionPointsRelations = relations(collectionPoints, ({ one, many }) => ({
  creator: one(users, {
    fields: [collectionPoints.createdBy],
    references: [users.id],
    relationName: "userCreatedPoints"
  }),
  acceptedMaterials: many(acceptedMaterials),
  schedules: many(collectionSchedules),
  reviews: many(reviews),
  operationSchedules: many(schedules),
  materials: many(collectionPointMaterials),
  operatingHours: many(operatingHours),
}));

export const collectionSchedulesRelations = relations(collectionSchedules, ({ one, many }) => ({
  user: one(users, {
    fields: [collectionSchedules.userId],
    references: [users.id],
    relationName: "userSchedules"
  }),
  collector: one(users, {
    fields: [collectionSchedules.collectorId],
    references: [users.id],
    relationName: "collectorSchedules"
  }),
  collectionPoint: one(collectionPoints, {
    fields: [collectionSchedules.collectionPointId],
    references: [collectionPoints.id],
  }),
  materials: many(scheduleMaterials),
  reviews: many(reviews),
}));

// Schemas para inserção
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  avatar: true,
});

export const insertCollectionPointSchema = createInsertSchema(collectionPoints).pick({
  name: true,
  shortName: true,
  address: true,
  latitude: true,
  longitude: true,
  schedule: true,
  phone: true,
  website: true,
  description: true,
  isActive: true,
  createdBy: true,
});

export const insertAcceptedMaterialSchema = createInsertSchema(acceptedMaterials).pick({
  collectionPointId: true,
  materialType: true,
  description: true,
});

export const insertCollectionScheduleSchema = createInsertSchema(collectionSchedules).pick({
  userId: true,
  collectionPointId: true,
  collectorId: true,
  status: true,
  scheduledDate: true,
  address: true,
  latitude: true,
  longitude: true,
  materialDescription: true,
});

export const insertScheduleMaterialSchema = createInsertSchema(scheduleMaterials).pick({
  scheduleId: true,
  materialType: true,
  quantity: true,
  unit: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  collectionPointId: true,
  collectorId: true,
  scheduleId: true,
  rating: true,
  comment: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  collectionPointId: true,
  dayOfWeek: true,
  openTime: true,
  closeTime: true,
  isOpen: true,
});

export const insertCollectionPointMaterialSchema = createInsertSchema(collectionPointMaterials).pick({
  collectionPointId: true,
  materialType: true,
  description: true,
});

export const insertOperatingHoursSchema = createInsertSchema(operatingHours).pick({
  collectionPointId: true,
  dayOfWeek: true,
  openTime: true,
  closeTime: true,
  isOpen: true,
});

// Types para inserção
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCollectionPoint = z.infer<typeof insertCollectionPointSchema>;
export type CollectionPoint = typeof collectionPoints.$inferSelect;

export type InsertAcceptedMaterial = z.infer<typeof insertAcceptedMaterialSchema>;
export type AcceptedMaterial = typeof acceptedMaterials.$inferSelect;

export type InsertCollectionSchedule = z.infer<typeof insertCollectionScheduleSchema>;
export type CollectionSchedule = typeof collectionSchedules.$inferSelect;

export type InsertScheduleMaterial = z.infer<typeof insertScheduleMaterialSchema>;
export type ScheduleMaterial = typeof scheduleMaterials.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

export type InsertCollectionPointMaterial = z.infer<typeof insertCollectionPointMaterialSchema>;
export type CollectionPointMaterial = typeof collectionPointMaterials.$inferSelect;

export type InsertOperatingHours = z.infer<typeof insertOperatingHoursSchema>;
export type OperatingHours = typeof operatingHours.$inferSelect;
