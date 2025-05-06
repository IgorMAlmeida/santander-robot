import express from 'express';
import routes from './app/routes.js';
import cron from 'node-cron';
import { consultOleUserBank } from './app/jobs/consultOleUserBank.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express(); 

app.use(express.json());

app.use('/', routes);

if (process.env.ENVIRONMENT === 'production') {
  cron.schedule("* * * * *", consultOleUserBank);
}

app.listen(3050, function() {
    console.log('Running on port 3050.');
});