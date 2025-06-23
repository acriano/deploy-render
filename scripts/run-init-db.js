import { initDatabase } from '../server/init-db.js';

initDatabase()
  .then(() => console.log('Banco de dados inicializado com sucesso!'))
  .catch(err => {
    console.error('Erro ao inicializar banco de dados:', err);
    process.exit(1);
  });