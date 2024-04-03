import express from 'express';
import routes from './app/routes.js';
import http from 'http';
import https from 'https';

const app = express();

app.use('/', routes);

const redirectToHttps = (req, res) => {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
};

http.createServer(redirectToHttps).listen(80);

https.createServer({

}, app).listen(80); // Aqui, ambos HTTP e HTTPS estão ouvindo na porta 80

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Running on port ${port}.`);
});
