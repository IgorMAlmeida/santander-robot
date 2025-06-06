import express from 'express';
import routes from './app/routes.js';

const app = express(); 

app.use(express.json());

app.use('/', routes);
const port = process.env.PORT || 3050;
app.listen(port, function() {
    console.log('Running on port ' + port);
});