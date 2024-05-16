const https = require('https');
const fs = require('fs');
const helmet = require('helmet');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();

// Setting certificate info
const options = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/certificate.pem')
};

// Setting http headers
app.use(helmet());

app.use(bodyParser.urlencoded({ extended: false }));
app.set('trust proxy', 1); // Trust first proxy

// Setting session settings
app.use(session({
  secret: 'my-long-random-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } // Set secure cookie for HTTPS
}));

// Diverting all request traffic to routes.js
app.use('/', routes);

// Starting server
const port = 3000;
const sslPort = 3001;

app.listen(port, () => console.log(`App listening on port ${port}!`));
https.createServer(options, app).listen(sslPort, () => console.log(`App listening on port ${sslPort} (HTTPS)!`));
