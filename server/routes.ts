// API Routes - Versão Atualizada
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertCollectionPointSchema,
  insertAcceptedMaterialSchema,
  insertCollectionScheduleSchema,
  insertScheduleMaterialSchema,
  insertReviewSchema
} from "@shared/schema";
import { z } from "zod";
import { comparePassword, hashPassword } from './auth';
import { Router } from 'express';
import express from 'express';
import {
  getCollectionPoints,
  getCollectionPointById,
  updateCollectionPoint,
  deleteCollectionPoint,
  createMaterial
} from './storage';
import { CollectionPoint, AcceptedMaterial } from './types';
import { closeDb, querySql } from './db';
import { testConnection } from './config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { authenticateToken, isAdmin } from './middleware/auth';
import { migrateData } from './migrate-data';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config';

const router = Router();

// Configuração do multer para upload de arquivos
const uploadsDir = path.join(process.cwd(), 'uploads');
const collectionPointsImagesDir = path.join(uploadsDir, 'collection-points');

// Apenas log dos diretórios, a criação já está sendo feita no index.ts
console.log('Usando diretório de uploads:', uploadsDir);
console.log('Usando diretório de imagens de pontos de coleta:', collectionPointsImagesDir);

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Destino do upload:', collectionPointsImagesDir);
    cb(null, collectionPointsImagesDir);
  },
  filename: (req, file, cb) => {
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
  fileFilter: (req, file, cb) => {
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
  app.get("/api/ping", (req, res) => {
    res.json({ status: "online", timestamp: new Date().toISOString() });
  });

  // Endpoint de health check para o Render
  app.get("/api/health", async (req, res) => {
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
  app.get("/api/test", (req, res) => {
    console.log("[API] GET /api/test - Testando API");
    return res.json({ message: "API funcionando corretamente!" });
  });

  // Endpoint para debugar headers e configurações de CORS
  app.get("/api/debug", (req, res) => {
    console.log("[API] GET /api/debug - Depurando configurações da API");
    return res.status(200)
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
    (req: Request, res: Response, next: Function) => {
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
  app.get("/api/collection-points", async (req, res) => {
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
  app.get("/api/collection-points/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const point = await storage.getCollectionPoint(id);

      if (!point) {
        return res.status(404).json({ error: "Ponto de coleta não encontrado" });
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
  app.post("/api/collection-points", async (req, res) => {
    try {
      console.log("Corpo da requisição para criar ponto de coleta:", req.body);

      // Validação básica dos campos necessários
      const { name, address } = req.body;

      if (!name || !address) {
        return res.status(400).json({
          error: "Nome e endereço são obrigatórios"
        });
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

      return res.status(201).json(newPoint);
    } catch (error) {
      console.error("Erro detalhado ao criar ponto de coleta:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
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
  app.post('/api/collection-points/:id/image', (req, res, next) => {
    console.log('[UPLOAD] ID recebido na rota:', req.params.id);
    
    // Verificar se o ID é válido antes de prosseguir
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID do ponto de coleta inválido' });
    }
    
    // Create dynamic storage configuration with access to req.params.id
    const dynamicStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        console.log('Destino do upload:', collectionPointsImagesDir);
        cb(null, collectionPointsImagesDir);
      },
      filename: (req, file, cb) => {
        const collectionPointId = req.params.id;
        console.log('[UPLOAD] ID para filename:', collectionPointId);
        
        if (!collectionPointId || collectionPointId === 'undefined') {
          console.error('[UPLOAD] ID inválido para filename:', collectionPointId);
          return cb(new Error('ID do ponto de coleta inválido'));
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
      fileFilter: (req, file, cb) => {
        // Aceitar apenas imagens
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos de imagem são permitidos'));
        }
      }
    });
    dynamicUpload.single('image')(req, res, next);
  }, async (req, res) => {
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
        console.error('[UPLOAD] Nenhum arquivo recebido');
        console.log('[UPLOAD] req.file é undefined - upload falhou');
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
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
        console.error(`[UPLOAD] Ponto de coleta ID ${id} não encontrado`);
        return res.status(404).json({ error: "Ponto de coleta não encontrado" });
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

      return res.json({
        message: "Imagem enviada com sucesso",
        imageUrl: relativeImageUrl,
        point: updatedPoint
      });
    } catch (error) {
      console.error('[UPLOAD] Erro completo:', error);
      return res.status(500).json({ error: "Erro ao processar upload" });
    }
  });

  // Atualizar um ponto de coleta
  app.put('/api/collection-points/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existingPoint = await getCollectionPointById(parseInt(id));

      if (!existingPoint) {
        return res.status(404).json({ error: 'Ponto de coleta não encontrado' });
      }

      // Garantir que latitude e longitude sejam números
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

      // Atualizar o ponto
      await updateCollectionPoint(parseInt(id), updatedPointData);
      
      // Buscar o ponto atualizado
      const finalUpdatedPoint = await getCollectionPointById(parseInt(id));

      if (!finalUpdatedPoint) {
        return res.status(500).json({ error: 'Erro ao obter o ponto de coleta atualizado após a atualização.' });
      }

      res.json(finalUpdatedPoint); // Retorna o objeto do ponto de coleta atualizado
    } catch (error) {
      console.error('Erro ao atualizar ponto de coleta:', error);
      res.status(500).json({ 
        error: 'Erro ao atualizar ponto de coleta',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  });

  // Excluir um ponto de coleta
  app.delete("/api/collection-points/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Verificar se o ponto existe
      const point = await storage.getCollectionPoint(id);
      if (!point) {
        return res.status(404).json({ error: "Ponto de coleta não encontrado" });
      }

      // Primeiro, excluir todos os materiais aceitos associados ao ponto
      const materials = await storage.getAcceptedMaterials(id);
      console.log(`Excluindo ${materials.length} materiais associados ao ponto ${id}`);

      for (const material of materials) {
        console.log(`Excluindo material ID ${material.id} (${material.materialType}) do ponto ${id}`);
        await storage.removeAcceptedMaterial(material.id);
      }

      // Agora, excluir o ponto de coleta
      await storage.deleteCollectionPoint(id);
      console.log(`Ponto de coleta ${id} excluído com sucesso`);

      return res.status(204).send();
    } catch (error) {
      console.error("Erro ao excluir ponto de coleta:", error);
      res.status(500).json({ error: "Erro ao excluir ponto de coleta" });
    }
  });

  // Obter materiais aceitos de um ponto de coleta
  app.get("/api/collection-points/:id/materials", async (req, res) => {
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
  app.post("/api/materials", authenticateToken, async (req, res) => {
    try {
      const materialData = req.body;
      console.log("[API] Dados do material recebidos:", materialData);
      
      // Validar dados obrigatórios
      if (!materialData.collectionPointId || !materialData.materialType) {
        console.log("[API] Dados inválidos:", materialData);
        return res.status(400).json({ 
          error: 'Dados inválidos: collectionPointId e materialType são obrigatórios' 
        });
      }

      // Validar tipos de dados
      if (typeof materialData.collectionPointId !== 'number' || typeof materialData.materialType !== 'string') {
        console.log("[API] Tipos de dados inválidos:", {
          collectionPointId: typeof materialData.collectionPointId,
          materialType: typeof materialData.materialType
        });
        return res.status(400).json({ 
          error: 'Tipos de dados inválidos: collectionPointId deve ser número e materialType deve ser string' 
        });
      }

      // Verificar se o ponto de coleta existe
      const pointExists = await storage.getCollectionPointById(materialData.collectionPointId);
      if (!pointExists) {
        console.log("[API] Ponto de coleta não encontrado:", materialData.collectionPointId);
        return res.status(404).json({ 
          error: 'Ponto de coleta não encontrado' 
        });
      }
      
      const newMaterial = await storage.addAcceptedMaterial({
        collectionPointId: materialData.collectionPointId,
        materialType: materialData.materialType,
        description: materialData.description || null
      });
      
      console.log("[API] Material processado com sucesso:", newMaterial);
      res.status(201).json(newMaterial);
    } catch (error) {
      console.error("[API] Erro ao processar material:", error);
      
      // Verificar se é erro de constraint de unicidade
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: 'Este material já está associado a este ponto de coleta' 
        });
      }
      
      res.status(500).json({ 
        error: 'Erro ao processar material',
        details: error.message 
      });
    }
  });

  // Verificar se um material já existe para um ponto de coleta
  app.post("/api/materials/check", authenticateToken, async (req, res) => {
    try {
      const { collectionPointId, materialType } = req.body;
      console.log("[API] Verificando material:", { collectionPointId, materialType });

      if (!collectionPointId || !materialType) {
        console.log("[API] Dados inválidos:", { collectionPointId, materialType });
        return res.status(400).json({ 
          error: "collectionPointId e materialType são obrigatórios" 
        });
      }

      // Verificar se o ponto de coleta existe
      const pointExists = await storage.getCollectionPointById(collectionPointId);
      if (!pointExists) {
        console.log("[API] Ponto de coleta não encontrado:", collectionPointId);
        return res.status(404).json({ 
          error: 'Ponto de coleta não encontrado' 
        });
      }

      const exists = await storage.checkMaterialExists(collectionPointId, materialType);
      console.log("[API] Resultado da verificação:", { exists });
      
      res.json({ exists });
    } catch (error) {
      console.error("[API] Erro ao verificar material:", error);
      res.status(500).json({ 
        error: "Erro ao verificar material",
        details: error.message 
      });
    }
  });

  // Remover um material aceito
  app.delete("/api/materials/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      await deleteMaterial(id);
      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar material:", error);
      res.status(404).json({ error: 'Material não encontrado' });
    }
  });

  // AGENDAMENTOS

  // Obter agendamentos de um usuário
  app.get("/api/user/:userId/schedules", async (req, res) => {
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
    async (req, res) => {
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
  app.patch("/api/schedules/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !["agendada", "em_andamento", "concluída", "cancelada"].includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
      }

      const updatedSchedule = await storage.updateScheduleStatus(id, status);

      if (!updatedSchedule) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
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
    async (req, res) => {
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
  app.get("/api/schedules/:scheduleId/materials", async (req, res) => {
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
    async (req, res) => {
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
  app.get("/api/collection-points/:id/reviews", async (req, res) => {
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
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      console.log('Tentativa de login:', { email, password: password ? '***' : undefined });

      if (!email || !password) {
        console.log('Email ou senha não fornecidos');
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      // Buscar usuário pelo email
      console.log('Buscando usuário no banco de dados...');
      const user = await storage.getUserByEmail(email);

      console.log('Usuário encontrado:', user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        password: user.password ? '***' : undefined
      } : 'Usuário não encontrado');

      if (!user) {
        console.log('Usuário não encontrado no banco de dados');
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }

      // Verificar senha usando bcrypt
      console.log('Verificando senha...');
      console.log('Senha fornecida:', password ? '***' : undefined);
      console.log('Hash armazenado:', user.password ? '***' : undefined);
      const isPasswordValid = await comparePassword(password, user.password);
      console.log('Resultado da verificação de senha:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('Senha inválida');
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;
      console.log('Login bem sucedido para usuário:', {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        username: userWithoutPassword.username
      });
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  // Login exclusivo para administradores
  app.post("/api/auth/admin-login", async (req, res) => {
    try {
      const { email, password } = req.body;

      console.log('Tentativa de login de administrador:', { email, password: password ? '***' : undefined });

      if (!email || !password) {
        console.log('Email ou senha não fornecidos');
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      // Buscar usuário pelo email
      console.log('Buscando usuário administrador no banco de dados...');
      const user = await storage.getUserByEmail(email);

      console.log('Usuário encontrado:', user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        password: user.password ? '***' : undefined
      } : 'Usuário não encontrado');

      if (!user) {
        console.log('Usuário não encontrado no banco de dados');
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }

      // Verificar se o usuário é um administrador
      if (user.role !== 'admin') {
        console.log('Usuário não é administrador:', user.role);
        return res.status(403).json({ error: "Acesso negado. Você não possui permissões de administrador." });
      }

      // Verificar senha usando bcrypt
      console.log('Verificando senha...');
      console.log('Senha fornecida:', password ? '***' : undefined);
      console.log('Hash armazenado:', user.password ? '***' : undefined);
      const isPasswordValid = await comparePassword(password, user.password);
      console.log('Resultado da verificação de senha:', isPasswordValid);

      if (!isPasswordValid) {
        console.log('Senha inválida');
        return res.status(401).json({ error: "Email ou senha incorretos" });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;
      console.log('Login bem sucedido para administrador:', {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        username: userWithoutPassword.username,
        role: userWithoutPassword.role
      });
      res.json({ ...userWithoutPassword, token });
    } catch (error) {
      console.error("Erro ao fazer login de administrador:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  // Criar um novo usuário
  app.post(
    "/api/users",
    validateBody(insertUserSchema),
    async (req, res) => {
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
          return res.status(409).json({ error: "Nome de usuário já existe" });
        }

        // Verificar se email já existe
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          console.log('Email já existe:', existingEmail);
          return res.status(409).json({ error: "Email já cadastrado" });
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
  app.post("/api/db-health", (req, res) => {
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
        message: error instanceof Error ? error.message : error.message
      });
    }
  });



  console.log('Diretórios de uploads disponíveis:');
  console.log('- uploadsDir: ', uploadsDir);
  console.log('- collectionPointsImagesDir: ', collectionPointsImagesDir);

  // === API de Materiais Recicláveis ===
  
  // Listar todos os materiais recicláveis
  app.get("/api/recycle-materials", async (req, res) => {
    try {
      console.log("[API] Listando todos os materiais recicláveis");
      
      const materials = await querySql(`
        SELECT * FROM recycle_materials
        ORDER BY name ASC
      `);
      
      // Log detalhado para depuração
      console.log('[API][DEBUG] Materiais recebidos do banco:', JSON.stringify(materials, null, 2));
      
      if (!materials || materials.length === 0) {
        return res.status(200)
          .header('Content-Type', 'application/json')
          .json([]);
      }
      
      // Converter os itens para o formato correto
      const formattedMaterials = materials.map((material: any) => {
        try {
          // Se os campos são arrays do PostgreSQL, convertê-los para strings JSON primeiro
          const recyclableItems = Array.isArray(material.recyclable_items) 
            ? material.recyclable_items 
            : JSON.parse(material.recyclable_items || '[]');
          
          const nonRecyclableItems = Array.isArray(material.non_recyclable_items)
            ? material.non_recyclable_items
            : JSON.parse(material.non_recyclable_items || '[]');

          // Se os campos são strings JSON, fazer o parse
          const recyclable = typeof recyclableItems === 'string' 
            ? JSON.parse(recyclableItems) 
            : recyclableItems;

          const nonRecyclable = typeof nonRecyclableItems === 'string'
            ? JSON.parse(nonRecyclableItems)
            : nonRecyclableItems;

          return {
            id: material.id,
            name: material.name,
            description: material.description,
            color: material.color || "#6CB33F",
            youtubeUrl: material.youtube_url || "",
            items: {
              recyclable,
              nonRecyclable,
              howToPrepare: material.how_to_prepare || ""
            },
            createdAt: material.created_at,
            updatedAt: material.updated_at
          };
        } catch (error) {
          console.error(`[API] Erro ao processar material ${material.id}:`, error);
          return null;
        }
      }).filter(Boolean);
      
      return res.status(200)
        .header('Content-Type', 'application/json')
        .json(formattedMaterials);
    } catch (error) {
      console.error("[API] Erro ao listar materiais recicláveis:", error);
      return res.status(500)
        .header('Content-Type', 'application/json')
        .json({ error: "Erro ao listar materiais recicláveis" });
    }
  });

  // Obter um material reciclável específico
  app.get("/api/recycle-materials/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`[API] Buscando material reciclável com ID: ${id}`);
      
      const material = await querySql(`
        SELECT * FROM recycle_materials
        WHERE id = $1
      `, [id]);
      
      if (!material || material.length === 0) {
        return res.status(404)
          .header('Content-Type', 'application/json')
          .json({ error: "Material não encontrado" });
      }
      
      try {
        const formattedMaterial = {
          id: material[0].id,
          name: material[0].name,
          description: material[0].description,
          color: material[0].color || "#6CB33F",
          youtubeUrl: material[0].youtube_url || "",
          items: {
            recyclable: JSON.parse(material[0].recyclable_items || '[]'),
            nonRecyclable: JSON.parse(material[0].non_recyclable_items || '[]'),
            howToPrepare: material[0].how_to_prepare || ""
          },
          createdAt: material[0].created_at,
          updatedAt: material[0].updated_at
        };
        
        return res.status(200)
          .header('Content-Type', 'application/json')
          .json(formattedMaterial);
      } catch (error) {
        console.error(`[API] Erro ao processar material ${id}:`, error);
        return res.status(500)
          .header('Content-Type', 'application/json')
          .json({ error: "Erro ao processar material" });
      }
    } catch (error) {
      console.error(`[API] Erro ao buscar material ${req.params.id}:`, error);
      return res.status(500)
        .header('Content-Type', 'application/json')
        .json({ error: "Erro ao buscar material" });
    }
  });

  // Criar um novo material reciclável
  app.post("/api/recycle-materials", async (req, res) => {
    try {
      const { id, name, description, items } = req.body;
      
      if (!id || !name || !description) {
        return res.status(400)
          .header('Content-Type', 'application/json')
          .json({ error: "Campos obrigatórios: id, name, description" });
      }
      
      console.log("[API] Criando novo material reciclável:", { id, name });
      
      // Verificar se já existe um material com esse ID
      const existingMaterial = await querySql(`
        SELECT id FROM recycle_materials WHERE id = $1
      `, [id]);
      
      if (existingMaterial && existingMaterial.length > 0) {
        return res.status(409)
          .header('Content-Type', 'application/json')
          .json({ error: "Já existe um material com esse ID" });
      }
      
      // Inserir o novo material
      await querySql(`
        INSERT INTO recycle_materials (
          id, name, description, color, youtube_url, 
          recyclable_items, non_recyclable_items, how_to_prepare, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        id,
        name,
        description,
        req.body.color || "#6CB33F",
        req.body.youtubeUrl || "",
        JSON.stringify(items.recyclable || []),
        JSON.stringify(items.nonRecyclable || []),
        items.howToPrepare || ""
      ]);
      
      // Retornar o material criado
      const newMaterial = {
        id,
        name,
        description,
        color: req.body.color || "#6CB33F",
        youtubeUrl: req.body.youtubeUrl || "",
        items: {
          recyclable: items.recyclable || [],
          nonRecyclable: items.nonRecyclable || [],
          howToPrepare: items.howToPrepare || ""
        }
      };
      
      console.log("[API] Material reciclável criado com sucesso:", newMaterial);
      return res.status(201)
        .header('Content-Type', 'application/json')
        .json(newMaterial);
    } catch (error) {
      console.error("[API] Erro ao criar material reciclável:", error);
      return res.status(500)
        .header('Content-Type', 'application/json')
        .json({ error: "Erro ao criar material reciclável" });
    }
  });

  // Atualizar um material reciclável
  app.put("/api/recycle-materials/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`[API] Atualizando material reciclável com ID: ${id}`, req.body);
      
      // Verificar se o material existe
      const existingMaterial = await querySql(`
        SELECT id FROM recycle_materials WHERE id = $1
      `, [id]);
      
      if (!existingMaterial || existingMaterial.length === 0) {
        return res.status(404)
          .header('Content-Type', 'application/json')
          .json({ error: "Material não encontrado" });
      }
      
      const { name, description, items } = req.body;
      
      if (!name || !description) {
        return res.status(400)
          .header('Content-Type', 'application/json')
          .json({ error: "Campos obrigatórios: name, description" });
      }
      
      // Atualizar o material
      await querySql(`
        UPDATE recycle_materials SET
          name = $1,
          description = $2,
          color = $3,
          youtube_url = $4,
          recyclable_items = $5,
          non_recyclable_items = $6,
          how_to_prepare = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
      `, [
        name,
        description,
        req.body.color || "#6CB33F",
        req.body.youtubeUrl || "",
        JSON.stringify(items.recyclable || []),
        JSON.stringify(items.nonRecyclable || []),
        items.howToPrepare || "",
        id
      ]);
      
      // Retornar o material atualizado
      const updatedMaterial = {
        id,
        name,
        description,
        color: req.body.color || "#6CB33F",
        youtubeUrl: req.body.youtubeUrl || "",
        items: {
          recyclable: items.recyclable || [],
          nonRecyclable: items.nonRecyclable || [],
          howToPrepare: items.howToPrepare || ""
        }
      };
      
      console.log("[API] Material reciclável atualizado com sucesso:", updatedMaterial);
      return res.status(200)
        .header('Content-Type', 'application/json')
        .json(updatedMaterial);
    } catch (error) {
      console.error(`[API] Erro ao atualizar material ${req.params.id}:`, error);
      return res.status(500)
        .header('Content-Type', 'application/json')
        .json({ error: "Erro ao atualizar material reciclável" });
    }
  });

  // Excluir um material reciclável
  app.delete("/api/recycle-materials/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`[API] Excluindo material reciclável com ID: ${id}`);
      
      // Verificar se o material existe
      const existingMaterial = await querySql(`
        SELECT id FROM recycle_materials WHERE id = $1
      `, [id]);
      
      if (!existingMaterial || existingMaterial.length === 0) {
        return res.status(404)
          .header('Content-Type', 'application/json')
          .json({ error: "Material não encontrado" });
      }
      
      // Excluir o material
      await querySql(`
        DELETE FROM recycle_materials
        WHERE id = $1
      `, [id]);
      
      console.log(`[API] Material reciclável ${id} excluído com sucesso`);
      return res.status(200)
        .header('Content-Type', 'application/json')
        .json({ success: true, message: "Material excluído com sucesso" });
    } catch (error) {
      console.error(`[API] Erro ao excluir material ${req.params.id}:`, error);
      return res.status(500)
        .header('Content-Type', 'application/json')
        .json({ error: "Erro ao excluir material" });
    }
  });

  // Rota para atualizar um ponto de coleta
  app.put('/api/collection-points/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existingPoint = await getCollectionPointById(parseInt(id));

      if (!existingPoint) {
        return res.status(404).json({ error: 'Ponto de coleta não encontrado' });
      }

      // Garantir que latitude e longitude sejam números
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

      // Atualizar o ponto
      await updateCollectionPoint(parseInt(id), updatedPointData);
      
      // Buscar o ponto atualizado
      const finalUpdatedPoint = await getCollectionPointById(parseInt(id));

      if (!finalUpdatedPoint) {
        return res.status(500).json({ error: 'Erro ao obter o ponto de coleta atualizado após a atualização.' });
      }

      res.json(finalUpdatedPoint); // Retorna o objeto do ponto de coleta atualizado
    } catch (error) {
      console.error('Erro ao atualizar ponto de coleta:', error);
      res.status(500).json({ 
        error: 'Erro ao atualizar ponto de coleta',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  });

  // Rota para excluir um material aceito
  app.delete('/collection-points/:id/materials/:materialId', authenticateToken, async (req, res) => {
    try {
      const { id, materialId } = req.params;
      const material = await querySql(`
        SELECT id FROM accepted_materials WHERE id = $1 AND collection_point_id = $2
      `, [parseInt(materialId), parseInt(id)]);

      if (!material || material.length === 0) {
        return res.status(404).json({ error: 'Material não encontrado' });
      }

      console.log(`Excluindo material ID ${material[0].id} (${material[0].materialType}) do ponto ${id}`);
      await querySql(`
        DELETE FROM accepted_materials WHERE id = $1 AND collection_point_id = $2
      `, [parseInt(materialId), parseInt(id)]);
      res.json({ message: 'Material removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover material:', error);
      res.status(500).json({ 
        error: 'Erro ao remover material',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

export default router;
