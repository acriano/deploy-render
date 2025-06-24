#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando configuração do deploy...\n');

const checks = [
  {
    name: 'package.json',
    path: '../package.json',
    required: true,
    check: (content) => {
      const pkg = JSON.parse(content);
      return pkg.scripts && pkg.scripts['start:prod'];
    }
  },
  {
    name: 'render.yaml',
    path: '../render.yaml',
    required: true,
    check: (content) => {
      return content.includes('recycleczs-backend') && 
             content.includes('npm run start:prod');
    }
  },
  {
    name: 'Dockerfile',
    path: '../Dockerfile',
    required: false,
    check: (content) => {
      return content.includes('node:20') && (content.includes('npm start') || content.includes('npm run start:prod'));
    }
  },
  {
    name: 'drizzle.config.ts',
    path: '../drizzle.config.ts',
    required: true,
    check: (content) => {
      return content.includes('postgresql') && content.includes('process.env');
    }
  },
  {
    name: 'server/config/database.ts',
    path: '../server/config/database.ts',
    required: true,
    check: (content) => {
      return content.includes('pg-promise') && content.includes('testConnection');
    }
  },
  {
    name: 'scripts/init-production.js',
    path: './init-production.js',
    required: true,
    check: (content) => {
      return content.includes('initProduction') && content.includes('migrate');
    }
  }
];

let allPassed = true;

for (const check of checks) {
  const filePath = path.join(__dirname, check.path);
  
  try {
    if (!fs.existsSync(filePath)) {
      if (check.required) {
        console.log(`❌ ${check.name} - ARQUIVO NÃO ENCONTRADO (OBRIGATÓRIO)`);
        allPassed = false;
      } else {
        console.log(`⚠️  ${check.name} - ARQUIVO NÃO ENCONTRADO (OPCIONAL)`);
      }
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const isValid = check.check(content);

    if (isValid) {
      console.log(`✅ ${check.name} - OK`);
    } else {
      console.log(`❌ ${check.name} - CONFIGURAÇÃO INVÁLIDA`);
      allPassed = false;
    }

  } catch (error) {
    console.log(`❌ ${check.name} - ERRO AO LER ARQUIVO: ${error.message}`);
    allPassed = false;
  }
}

console.log('\n📋 Checklist de Variáveis de Ambiente:');
console.log('   NODE_ENV=production');
console.log('   PORT=5000');
console.log('   POSTGRES_HOST=[seu-host]');
console.log('   POSTGRES_PORT=5432');
console.log('   POSTGRES_DB=recyclecs');
console.log('   POSTGRES_USER=[seu-usuario]');
console.log('   POSTGRES_PASSWORD=[sua-senha]');
console.log('   JWT_SECRET=[gerado automaticamente]');
console.log('   SESSION_SECRET=[gerado automaticamente]');

console.log('\n🚀 Próximos Passos:');
console.log('   1. Configure as variáveis de ambiente no Render');
console.log('   2. Conecte seu repositório no Render');
console.log('   3. Configure o Root Directory como: deploy-render/deploy-render');
console.log('   4. Configure o Build Command como: npm install');
console.log('   5. Configure o Start Command como: npm run start:prod');

if (allPassed) {
  console.log('\n🎉 TUDO PRONTO! Seu projeto está configurado para deploy no Render!');
} else {
  console.log('\n⚠️  ALGUNS PROBLEMAS ENCONTRADOS. Verifique os arquivos marcados com ❌');
}

console.log('\n📖 Consulte o arquivo README-DEPLOY.md para instruções detalhadas.'); 