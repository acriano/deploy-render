import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Configuração para arquivo único, sempre enviar index.html
  app.get("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const apiPattern = /^\/api\//;

      // Ignorar solicitações de API
      if (apiPattern.test(url)) {
        return next();
      }

      // Para os arquivos que existem fisicamente
      // 1. Primeiro, tente servir o arquivo diretamente se existir
      const publicDir = path.join(process.cwd(), "dist/public");
      const filePath = path.join(publicDir, url);
      
      // Servir index.html para rotas SPA
      let template = path.resolve(publicDir, "index.html");
      
      // Transformar o HTML com Vite
      template = await vite.transformIndexHtml(url, template);
      
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      console.error(`Erro ao processar ${req.url}:`, e);
      next(e);
    }
  });

  return { vite, server };
}

export function serveStatic(app: Express) {
  // Configuração de arquivos estáticos com fallback para SPA
  const publicDir = path.resolve(process.cwd(), "dist/public");
  
  // Servir arquivos estáticos
  app.use(express.static(publicDir, {
    index: false, // Não servir índice automaticamente
  }));
  
  // Todas as outras rotas vão para index.html (SPA)
  app.get("*", (req, res, next) => {
    const apiPattern = /^\/api\//;
    
    // Ignorar solicitações de API
    if (apiPattern.test(req.originalUrl)) {
      return next();
    }
    
    // Servir o index.html para todas as rotas de frontend
    res.sendFile(path.join(publicDir, "index.html"));
  });
  
  log(`📁 Servindo arquivos estáticos de ${publicDir}`);
  
  return app;
}
