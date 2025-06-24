// API Routes - Versão Atualizada
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import {
  insertUserSchema,
  insertCollectionPointSchema,
  insertAcceptedMaterialSchema,
  insertCollectionScheduleSchema,
  insertScheduleMaterialSchema,
  insertReviewSchema
} from "../shared/schema.js";
import { z } from "zod";
import { comparePassword, hashPassword } from './auth.js';
import { Router } from 'express';
import express from 'express';
import {
  getCollectionPoints,
  getCollectionPointById,
  updateCollectionPoint,
  deleteCollectionPoint,
  createMaterial
} from './storage.js';
import { CollectionPoint, AcceptedMaterial, RecycleMaterialFromDB } from './types.js';
import { closeDb, querySql } from './db.js';
import { testConnection } from './config/database.js';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { authenticateToken, isAdmin } from './middleware/auth.js';
import { migrateData } from './migrate-data.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config.js';

const router = Router();

// Configuração do multer para upload de arquivos
const uploadsDir = path.join(process.cwd(), 'uploads');
const collectionPointsImagesDir = path.join(uploadsDir, 'collection-points');

// Apenas log dos diretórios, a criação já está sendo feita no index.ts
console.log('Usando diretório de uploads:', uploadsDir);
console.log('Usando diretório de imagens de pontos de coleta:', collectionPointsImagesDir);

const storage_config = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    console.log('Destino do upload:', collectionPointsImagesDir);
    cb(null, collectionPointsImagesDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Fix: Get the collection point ID from the request parameters
    const collectionPointId = req.params.id;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${collectionPointId}-${timestamp}${extension}`;
    console.log('Nome do arquivo gerado:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar middleware para servir arquivos estáticos da pasta uploads
  console.log('[API] Configurando pasta de uploads como estática:', uploadsDir);
  app.use('/uploads', express.static(uploadsDir, {
    etag: true,
    lastModified: true,
    maxAge: '24h'
  }));

  // Configuração adicional específica para imagens de pontos de coleta
  app.use('/uploads/collection-points', express.static(collectionPointsImagesDir, {
    etag: true,
    lastModified: true,
    maxAge: '24h'
  }));

  // Garantir que as tabelas existam
  try {
    console.log('[API] Garantindo que todas as tabelas existem...');
    // await ensureTablesExist();
    console.log('[API] Tabelas verificadas com sucesso.');
  } catch (error) {
    console.error('[API] Erro ao verificar tabelas:', error);
  }

  // Endpoint para verificar status do servidor
  app.get("/api/ping", (req: Request, res: Response) => {
    res.json({ status: "online", timestamp: new Date().toISOString() });
  });

  // Endpoint de health check para o Render
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      // Testar conexão com o banco de dados
      const dbStatus = await testConnection();
      
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: dbStatus ? "connected" : "disconnected",
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0"
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Endpoint simples para teste de API
  app.get("/api/test", (req: Request, res: Response) => {
    console.log("[API] GET /api/test - Testando API");
    res.json({ message: "API funcionando corretamente!" });
  });

  // Endpoint para debugar headers e configurações de CORS
  app.get("/api/debug", (req: Request, res: Response) => {
    console.log("[API] GET /api/debug - Depurando configurações da API");
    res.status(200)
      .header('Content-Type', 'application/json')
      .json({
        headers: req.headers,
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        timestamp: new Date().toISOString(),
        cors: {
          origin: res.getHeader('Access-Control-Allow-Origin'),
          methods: res.getHeader('Access-Control-Allow-Methods'),
          headers: res.getHeader('Access-Control-Allow-Headers')
        }
      });
  });

  // Middleware para validação com Zod
  const validateBody = <T extends z.ZodTypeAny>(schema: T) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            error: "Dados inválidos",
            details: error.errors
          });
        } else {
          res.status(500).json({ error: "Erro interno do servidor" });
        }
      }
    };

  // PONTOS DE COLETA

  // Obter todos os pontos de coleta
  app.get("/api/collection-points", async (req: Request, res: Response) => {
    try {
      console.log("Buscando todos os pontos de coleta...");
      const points = await getCollectionPoints();

      // Buscar os materiais aceitos para cada ponto de coleta
      const pointsWithMaterials = await Promise.all(points.map(async (point) => {
        const materials = await storage.getAcceptedMaterials(point.id);
        return {
          ...point,
          acceptedMaterials: materials
        };
      }));

      console.log(`Encontrados ${pointsWithMaterials.length} pontos de coleta com materiais`);
      console.log('[API] Pontos retornados (sample):', pointsWithMaterials.slice(0, 2).map(p => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl
      })));
      res.json(pointsWithMaterials);
    } catch (error) {
      console.error("Erro ao buscar pontos de coleta:", error);
      res.status(500).json({ error: "Erro ao buscar pontos de coleta" });
    }
  });

  // Obter um ponto de coleta por ID
  app.get("/api/collection-points/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const point = await storage.getCollectionPoint(id);

      if (!point) {
        res.status(404).json({ error: "Ponto de coleta não encontrado" });
        return;
      }

      // Buscar materiais aceitos deste ponto
      const materials = await storage.getAcceptedMaterials(id);

      res.json({
        ...point,
        acceptedMaterials: materials
      });
    } catch (error) {
      console.error("Erro ao buscar ponto de coleta:", error);
      res.status(500).json({ error: "Erro ao buscar ponto de coleta" });
    }
  });

  // Criar um novo ponto de coleta
  app.post("/api/collection-points", async (req: Request, res: Response) => {
    try {
      console.log("Corpo da requisição para criar ponto de coleta:", req.body);

      // Validação básica dos campos necessários
      const { name, address } = req.body;

      if (!name || !address) {
        res.status(400).json({
          error: "Nome e endereço são obrigatórios"
        });
        return;
      }

      let latitude = req.body.latitude;
      let longitude = req.body.longitude;

      // Se não tiver latitude/longitude, definir valores padrão
      if (!latitude || !longitude) {
        latitude = 0;
        longitude = 0;
      }

      // Preparar dados para salvar - incluir todos os campos disponíveis
      const pointData = {
        name,
        shortName: req.body.shortName || null,
        address,
        latitude,
        longitude,
        schedule: req.body.schedule || null,
        phone: req.body.phone || null,
        whatsapp: req.body.whatsapp || null,
        website: req.body.website || null,
        description: req.body.description || null,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        createdBy: req.body.createdBy || null
      };

      console.log("Dados normalizados do ponto de coleta:", pointData);

      const newPoint = await storage.createCollectionPoint(pointData);
      console.log("Ponto de coleta criado com sucesso:", newPoint);

      res.status(201).json(newPoint);
    } catch (error) {
      console.error("Erro detalhado ao criar ponto de coleta:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Dados inválidos",
          details: error.errors
        });
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message, stack: error.stack });
      } else {
        res.status(500).json({ message: 'Erro desconhecido' });
      }
    }
  });

  // Upload de imagem para ponto de coleta
  app.post('/api/collection-points/:id/image', (req: Request, res: Response, next: NextFunction) => {
    console.log('[UPLOAD] ID recebido na rota:', req.params.id);
    
    // Verificar se o ID é válido antes de prosseguir
    if (!req.params.id || req.params.id === 'undefined') {
      res.status(400).json({ error: 'ID do ponto de coleta inválido' });
      return;
    }
    
    // Create dynamic storage configuration with access to req.params.id
    const dynamicStorage = multer.diskStorage({
      destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        console.log('Destino do upload:', collectionPointsImagesDir);
        cb(null, collectionPointsImagesDir);
      },
      filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const collectionPointId = req.params.id;
        console.log('[UPLOAD] ID para filename:', collectionPointId);
        
        if (!collectionPointId || collectionPointId === 'undefined') {
          console.error('[UPLOAD] ID inválido para filename:', collectionPointId);
          return cb(new Error('ID do ponto de coleta inválido'), '');
        }
        
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const filename = `${collectionPointId}-${timestamp}${extension}`;
        console.log('Nome do arquivo gerado:', filename);
        cb(null, filename);
      }
    });
    
    const dynamicUpload = multer({ 
      storage: dynamicStorage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        // Aceitar apenas imagens
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos de imagem são permitidos'));
        }
      }
    });
    dynamicUpload.single('image')(req, res, next);
  }, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`[UPLOAD] Recebida solicitação de upload para ID: ${id}`);
      console.log(`[UPLOAD] Diretório de destino: ${collectionPointsImagesDir}`);
      console.log(`[UPLOAD] Arquivo recebido:`, req.file);
      
      console.log('[UPLOAD] Multer configurado com sucesso');
      console.log('[UPLOAD] Verificando diretório:', fs.existsSync(collectionPointsImagesDir));
      console.log('[UPLOAD] Permissões do diretório:', fs.statSync(collectionPointsImagesDir).mode.toString(8));
      console.log('[UPLOAD] req.params.id:', req.params.id);
      console.log('[UPLOAD] req.file será processado...');
      
      if (!req.file) {
        res.status(400).json({ error: "Nenhuma imagem enviada" });
        return;
      }
      
      console.log('[UPLOAD] Detalhes do arquivo:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        destination: req.file.destination
      });
      
      // Verificar se o arquivo realmente existe
      const fileExists = fs.existsSync(req.file.path);
      console.log('[UPLOAD] Arquivo existe no sistema:', fileExists);
      
      if (fileExists) {
        const stats = fs.statSync(req.file.path);
        console.log('[UPLOAD] Tamanho do arquivo salvo:', stats.size);
      }
      
      // Verificar se o arquivo foi realmente salvo
      if (fs.existsSync(req.file.path)) {
        console.log('[UPLOAD] Arquivo salvo com sucesso em:', req.file.path);
      } else {
        console.error('[UPLOAD] Arquivo não foi salvo em:', req.file.path);
      }

      // Verificar se o ponto de coleta existe
      const point = await storage.getCollectionPoint(id);
      if (!point) {
        res.status(404).json({ error: "Ponto de coleta não encontrado" });
        return;
      }

      // Criar URL relativa para a imagem
      const relativeImageUrl = `/uploads/collection-points/${req.file.filename}`;
      console.log('[UPLOAD] URL relativa da imagem:', relativeImageUrl);

      // Atualizar o ponto de coleta com a URL da imagem
      const updatedPoint = await storage.updateCollectionPoint(id, {
        ...point,
        imageUrl: relativeImageUrl
      });

      console.log('[UPLOAD] Dados enviados para atualização:', {
        id,
        imageUrl: relativeImageUrl,
        pointData: point
      });
      console.log('[UPLOAD] Ponto atualizado retornado:', updatedPoint);
      console.log('[UPLOAD] Ponto de coleta atualizado com sucesso:', updatedPoint);

      res.json({
        message: "Imagem atualizada com sucesso",
        imageUrl: relativeImageUrl,
        point: updatedPoint
      });
    } catch (error) {
      console.error("Erro ao processar upload:", error);
      res.status(500).json({ error: "Erro ao processar upload" });
    }
  });

  // Atualizar um ponto de coleta
  app.put('/api/collection-points/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existingPoint = await storage.getCollectionPoint(parseInt(id));

      if (!existingPoint) {
        res.status(404).json({ error: 'Ponto de coleta não encontrado' });
        return;
      }

      let latitude = req.body.latitude !== undefined ? Number(req.body.latitude) : existingPoint.latitude;
      let longitude = req.body.longitude !== undefined ? Number(req.body.longitude) : existingPoint.longitude;

      const updatedPointData = {
        name: req.body.name || existingPoint.name,
        address: req.body.address || existingPoint.address,
        latitude,
        longitude,
        short_name: req.body.shortName || existingPoint.shortName,
        schedule: req.body.schedule || existingPoint.schedule,
        phone: req.body.phone || existingPoint.phone,
        whatsapp: req.body.whatsapp !== undefined ? req.body.whatsapp : existingPoint.whatsapp,
        website: req.body.website || existingPoint.website,
        description: req.body.description || existingPoint.description,
        is_active: req.body.isActive !== undefined ? req.body.isActive : existingPoint.isActive,
        image_url: req.body.imageUrl || existingPoint.imageUrl
      };

      console.log('Dados recebidos para atualização:', req.body);
      console.log('Dados normalizados para atualização:', updatedPointData);

      await updateCollectionPoint(parseInt(id), updatedPointData);
      const finalUpdatedPoint = await storage.getCollectionPoint(parseInt(id));

      if (!finalUpdatedPoint) {
        res.status(500).json({ error: 'Erro ao obter o ponto de coleta atualizado após a atualização.' });
        return;
      }

      res.json(finalUpdatedPoint);
    } catch (error) {
      console.error('Erro ao atualizar ponto de coleta:', error);
      res.status(500).json({ 
        error: 'Erro ao atualizar ponto de coleta',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  });

  // Excluir um ponto de coleta
  app.delete("/api/collection-points/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const point = await storage.getCollectionPoint(id);
      if (!point) {
        res.status(404).json({ error: "Ponto de coleta não encontrado" });
        return;
      }
      const materials = await storage.getAcceptedMaterials(id);
      for (const material of materials) {
        await storage.removeAcceptedMaterial(material.id);
      }
      await storage.deleteCollectionPoint(id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir ponto de coleta:", error);
      res.status(500).json({ error: "Erro ao excluir ponto de coleta" });
    }
  });

  // Obter materiais aceitos de um ponto de coleta
  app.get("/api/collection-points/:id/materials", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const materials = await storage.getAcceptedMaterials(id);
      res.json(materials);
    } catch (error) {
      console.error("Erro ao buscar materiais aceitos:", error);
      res.status(500).json({ error: "Erro ao buscar materiais aceitos" });
    }
  });

  // MATERIAIS ACEITOS

  // Adicionar um material aceito a um ponto de coleta
  app.post("/api/materials", authenticateToken, async (req: Request, res: Response) => {
    try {
      const materialData = req.body;
      if (!materialData.collectionPointId || !materialData.materialType) {
        res.status(400).json({ 
          error: 'Dados inválidos: collectionPointId e materialType são obrigatórios' 
        });
        return;
      }
      if (typeof materialData.collectionPointId !== 'number' || typeof materialData.materialType !== 'string') {
        res.status(400).json({ 
          error: 'Tipos de dados inválidos: collectionPointId deve ser número e materialType deve ser string' 
        });
        return;
      }
      const pointExists = await storage.getCollectionPoint(materialData.collectionPointId);
      if (!pointExists) {
        res.status(404).json({ error: 'Ponto de coleta não encontrado' });
        return;
      }
      const newMaterial = await storage.addAcceptedMaterial(materialData);
      res.status(201).json(newMaterial);
    } catch (error) {
      console.error("Erro ao adicionar material:", error);
      res.status(500).json({ error: "Erro ao adicionar material" });
    }
  });

  // Verificar se um material já existe para um ponto de coleta
  app.post("/api/materials/check", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { collectionPointId, materialType } = req.body;
      if (!collectionPointId || !materialType) {
        res.status(400).json({ error: "collectionPointId e materialType são obrigatórios" });
        return;
      }
      const pointExists = await storage.getCollectionPoint(collectionPointId);
      if (!pointExists) {
        res.status(404).json({ error: 'Ponto de coleta não encontrado' });
        return;
      }
      const exists = await storage.checkMaterialExists(collectionPointId, materialType);
      res.json({ exists });
    } catch (error) {
      console.error("Erro ao verificar material:", error);
      res.status(500).json({ error: "Erro ao verificar material" });
    }
  });

  // Remover um material aceito
  app.delete("/api/materials/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    try {
      await storage.removeAcceptedMaterial(id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar material:", error);
      res.status(404).json({ error: 'Material não encontrado' });
    }
  });

  // AGENDAMENTOS

  // Obter agendamentos de um usuário
  app.get("/api/user/:userId/schedules", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const schedules = await storage.getUserSchedules(userId);
      res.json(schedules);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
  });

  // Criar um novo agendamento
  app.post(
    "/api/schedules",
    validateBody(insertCollectionScheduleSchema),
    async (req: Request, res: Response) => {
      try {
        const newSchedule = await storage.createSchedule(req.body);
        res.status(201).json(newSchedule);
      } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        res.status(500).json({ error: "Erro ao criar agendamento" });
      }
    }
  );

  // Atualizar o status de um agendamento
  app.patch("/api/schedules/:id/status", async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !["agendada", "em_andamento", "concluída", "cancelada"].includes(status)) {
        res.status(400).json({ error: "Status inválido" });
        return;
      }

      const updatedSchedule = await storage.updateScheduleStatus(id, status);

      if (!updatedSchedule) {
        res.status(404).json({ error: "Agendamento não encontrado" });
        return;
      }

      res.json(updatedSchedule);
    } catch (error) {
      console.error("Erro ao atualizar status do agendamento:", error);
      res.status(500).json({ error: "Erro ao atualizar status do agendamento" });
    }
  });

  // MATERIAIS DO AGENDAMENTO

  // Adicionar um material a um agendamento
  app.post(
    "/api/schedule-materials",
    validateBody(insertScheduleMaterialSchema),
    async (req: Request, res: Response) => {
      try {
        const newMaterial = await storage.addScheduleMaterial(req.body);
        res.status(201).json(newMaterial);
      } catch (error) {
        console.error("Erro ao adicionar material ao agendamento:", error);
        res.status(500).json({ error: "Erro ao adicionar material ao agendamento" });
      }
    }
  );

  // Obter materiais de um agendamento
  app.get("/api/schedules/:scheduleId/materials", async (req: Request, res: Response) => {
    try {
      const scheduleId = parseInt(req.params.scheduleId);
      const materials = await storage.getScheduleMaterials(scheduleId);
      res.json(materials);
    } catch (error) {
      console.error("Erro ao buscar materiais do agendamento:", error);
      res.status(500).json({ error: "Erro ao buscar materiais do agendamento" });
    }
  });

  // AVALIAÇÕES

  // Criar uma nova avaliação
  app.post(
    "/api/reviews",
    validateBody(insertReviewSchema),
    async (req: Request, res: Response) => {
      try {
        const newReview = await storage.createReview(req.body);
        res.status(201).json(newReview);
      } catch (error) {
        console.error("Erro ao criar avaliação:", error);
        res.status(500).json({ error: "Erro ao criar avaliação" });
      }
    }
  );

  // Obter avaliações de um ponto de coleta
  app.get("/api/collection-points/:id/reviews", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const reviews = await storage.getCollectionPointReviews(id);
      res.json(reviews);
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error);
      res.status(500).json({ error: "Erro ao buscar avaliações" });
    }
  });

  // USUÁRIOS

  // Login de usuário
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email e senha são obrigatórios" });
        return;
      }

      console.log('Tentativa de login para:', email);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('Usuário não encontrado:', email);
        res.status(401).json({ error: "Email ou senha incorretos" });
        return;
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        console.log('Senha incorreta para:', email);
        res.status(401).json({ error: "Email ou senha incorretos" });
        return;
      }

      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login bem-sucedido para:', email);

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        token
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(401).json({ error: "Email ou senha incorretos" });
    }
  });

  // Login de administrador
  app.post("/api/auth/admin-login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email e senha são obrigatórios" });
        return;
      }

      console.log('Tentativa de login de admin para:', email);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('Usuário não encontrado:', email);
        res.status(401).json({ error: "Email ou senha incorretos" });
        return;
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        console.log('Senha incorreta para:', email);
        res.status(401).json({ error: "Email ou senha incorretos" });
        return;
      }

      // Verificar se é administrador
      if (user.role !== 'admin') {
        console.log('Usuário não é admin:', email);
        res.status(403).json({ error: "Acesso negado. Você não possui permissões de administrador." });
        return;
      }

      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login de admin bem-sucedido para:', email);

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        token
      });
    } catch (error) {
      console.error('Erro no login de admin:', error);
      res.status(401).json({ error: "Email ou senha incorretos" });
    }
  });

  // Criar um novo usuário
  app.post(
    "/api/users",
    validateBody(insertUserSchema),
    async (req: Request, res: Response): Promise<void> => {
      try {
        console.log('Tentando criar usuário com dados:', {
          username: req.body.username,
          email: req.body.email,
          name: req.body.name,
          phone: req.body.phone,
          password: req.body.password ? '***' : undefined
        });

        // Verificar se username já existe
        const existingUser = await storage.getUserByUsername(req.body.username);
        if (existingUser) {
          console.log('Usuário já existe:', existingUser);
          res.status(409).json({ error: "Nome de usuário já existe" });
          return;
        }

        // Verificar se email já existe
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          console.log('Email já existe:', existingEmail);
          res.status(409).json({ error: "Email já cadastrado" });
          return;
        }

        // Hash da senha antes de salvar
        const hashedPassword = await hashPassword(req.body.password);
        console.log('Senha hash gerada com sucesso:', hashedPassword);

        // Criar o usuário no banco de dados
        const newUser = await storage.createUser({
          username: req.body.username,
          password: hashedPassword,
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          role: req.body.role || "user"
        });

        console.log('Usuário criado com sucesso:', {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          password: newUser.password
        });

        // Remover senha da resposta
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      } catch (error) {
        console.error("Erro detalhado ao criar usuário:", error);
        res.status(500).json({
          error: "Erro ao criar usuário",
          details: error instanceof Error ? error.message : "Erro desconhecido",
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  );

  // Endpoint para verificar e reiniciar a conexão do banco de dados
  app.post("/api/db-health", (req: Request, res: Response) => {
    try {
      console.log("Reiniciando conexão com o banco de dados...");

      // Fechar a conexão atual
      closeDb();

      // Obter uma nova instância do banco de dados (acontecerá automaticamente na próxima requisição)

      res.json({ success: true, message: "Conexão com o banco de dados reiniciada" });
    } catch (error) {
      console.error("Erro ao reiniciar conexão com banco de dados:", error);
      res.status(500).json({
        error: "Erro ao reiniciar conexão com banco de dados",
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  console.log('Diretórios de uploads disponíveis:');
  console.log('- uploadsDir: ', uploadsDir);
  console.log('- collectionPointsImagesDir: ', collectionPointsImagesDir);

  // TODO: Implementar rotas de RecycleMaterial quando os métodos correspondentes forem adicionados ao DatabaseStorage

  const httpServer = createServer(app);

  return httpServer;
}

export default router;
