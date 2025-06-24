#!/usr/bin/env node

console.log('🧪 Testando dependências...');

try {
  console.log('📦 Testando import do drizzle-orm/postgres-js...');
  const { drizzle } = await import('drizzle-orm/postgres-js');
  console.log('✅ drizzle-orm/postgres-js - OK');

  console.log('📦 Testando import do @neondatabase/serverless...');
  const postgres = await import('@neondatabase/serverless');
  console.log('✅ @neondatabase/serverless - OK');

  console.log('📦 Testando import do drizzle-orm/postgres-js/migrator...');
  const { migrate } = await import('drizzle-orm/postgres-js/migrator');
  console.log('✅ drizzle-orm/postgres-js/migrator - OK');

  console.log('🎉 Todas as dependências estão funcionando!');
} catch (error) {
  console.error('❌ Erro ao testar dependências:', error);
  process.exit(1);
} 