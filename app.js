import express from 'express';
import routes from './app/routes.js';
import dotenv from 'dotenv';
import { initDatabase } from './app/utils/tokenDatabase.js';
import { initTokenCleanup } from './app/utils/tokenCleanup.js';

dotenv.config();

initDatabase()
  .then(() => {
    console.log('Token database initialized successfully');
    initTokenCleanup();
  })
  .catch(err => {
    console.error('Failed to initialize token database:', err);
  });

const app = express(); 

app.use(express.json());

app.use('/', routes);

app.listen(3050, function() {
    console.log('Running on port 3050.');
});