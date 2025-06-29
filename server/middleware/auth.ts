import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { JWT_SECRET } from '../config.js';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  console.log('\n=== Iniciando autenticação ===');
  console.log('URL da requisição:', req.url);
  console.log('Método da requisição:', req.method);
  console.log('Headers completos:', JSON.stringify(req.headers, null, 2));
  
  const authHeader = req.headers['authorization'];
  console.log('Authorization header:', authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Token extraído:', token ? 'Token presente' : 'Token ausente');

  if (!token) {
    console.log('Token não fornecido');
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  try {
    console.log('Verificando token...');
    console.log('JWT_SECRET usado:', JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
    console.log('Token decodificado:', JSON.stringify(decoded, null, 2));

    console.log('Buscando usuário no banco de dados...');
    const db = getDb();
    db.select().from(users).where(eq(users.id, decoded.id)).then(rows => {
      const user = rows[0];
      console.log('Usuário encontrado:', user ? JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role
      }, null, 2) : 'Usuário não encontrado');

      if (!user) {
        console.log('Usuário não encontrado no banco de dados');
        res.status(401).json({ error: 'Usuário não encontrado' });
        return;
      }

      (req as any).user = user;
      console.log('Autenticação bem-sucedida');
      next();
    }).catch(error => {
      console.error('Erro ao buscar usuário no banco de dados:', error);
      res.status(500).json({ error: 'Erro interno de autenticação' });
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    if (error instanceof jwt.TokenExpiredError) {
      console.log('Token expirado');
      res.status(401).json({ error: 'Token expirado' });
      return;
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('Token inválido');
      res.status(401).json({ error: 'Token inválido' });
      return;
    }
    res.status(403).json({ error: 'Token inválido' });
    return;
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  console.log('\n=== Verificando permissões de administrador ===');
  console.log('URL da requisição:', req.url);
  console.log('Método da requisição:', req.method);
  console.log('Headers completos:', JSON.stringify(req.headers, null, 2));
  
  const user = (req as any).user;
  console.log('Usuário atual:', user ? JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    token: req.headers.authorization ? 'Token presente' : 'Token ausente'
  }, null, 2) : 'Usuário não definido');

  if (!user) {
    console.log('Usuário não autenticado');
    res.status(401).json({ error: 'Usuário não autenticado' });
    return;
  }

  console.log('Verificando role do usuário:', user.role);
  console.log('Role esperada:', 'admin');
  console.log('Role atual:', user.role);
  console.log('São iguais?', user.role === 'admin');

  if (user.role !== 'admin') {
    console.log('Usuário não é administrador');
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  console.log('Permissões de administrador verificadas com sucesso');
  next();
}; 