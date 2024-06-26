import express from 'express';
import routes from './app/routes.js';

const app = express(); 

app.use(express.json());

app.use('/', routes);

app.listen(3050, function() {
    console.log('Running on port 3050.');
});