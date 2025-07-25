import express from 'express';
import routes from './app/routes.js';
import dotenv from 'dotenv';
import { initDatabase } from './app/utils/tokenDatabase.js';
import { initTokenCleanup } from './app/utils/tokenCleanup.js';
import { initializeDatabase } from './app/database/init.js';

dotenv.config();
async function startServerMyslq() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

initDatabase()
  .then(() => {
    console.log('Token database initialized successfully');
    initTokenCleanup();
  })
  .catch(err => {
    console.error('Failed to initialize token database:', err);
  });

const app = express(); 

startServerMyslq();
app.use(express.json());

app.use('/', routes);

app.listen(3050, function() {
    console.log('Running on port 3000.');
});