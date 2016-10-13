require('newrelic');
import express from 'express';
import fs from 'fs';
import morgan from 'morgan';
import logger from './api/common/log';
import nocache from 'nocache';
import hpp from 'hpp';
import cors from 'cors';
import referrerPolicy from 'referrer-policy';
import bodyParser from 'body-parser';
import config from 'config3';
import expressPromiseRouter from 'express-promise-router';
import https from 'https';
import http from 'http';
import forceSSL from 'express-force-ssl';
import helmet from 'helmet';
import redis from './config/redis';
import csvimport from './config/import';
import * as routes from './config/routes';
import xFrameOptions from 'x-frame-options';
//import './config/seed'

export const app = express();

if(process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  app.set('forceSSLOptions', {
    enable301Redirects: true,
    trustXFPHeader: true,
    httpsPort: 4443,
    sslRequiredMessage: 'SSL Required.'
  });
  app.use(forceSSL);
}

app.use(helmet());
//app.use(xFrameOptions());
app.use(nocache());
app.use(referrerPolicy());

app.set('superSecret', config.LOCALTABLE_SECRET);
//app.use('/api', morgan('combined', {stream: logger.asStream('info')}));
app.use(morgan('combined'));

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(hpp());


app.use(function (req, res, next) {
  res.set(`X-Powered-By`, `TacticalMastery`);
  next();
});

/*function logResponseBody(req, res, next) {
  var oldWrite = res.write,
    oldEnd = res.end;

  var chunks = [];

  res.write = function (chunk) {
    chunks.push(new Buffer(chunk));

    oldWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk)
      chunks.push(new Buffer(chunk));

    var body = Buffer.concat(chunks).toString('utf8');
    logger.info(body);

    oldEnd.apply(res, arguments);
  };

  next();
}

app.use(logResponseBody);*/

// route with appropriate version prefix
/*Object.keys(routes).forEach(r => {
  const router = expressPromiseRouter();
  // pass promise route to route assigner
  routes[r](router);
  // '/' + v1_0 -> v1.0, prefix for routing middleware
  app.use(`/api/${r.replace('_', '.')}`, router);
});*/

app.use(function (err, req, res, next) {
  if (err) {
    console.log(err);
    if (typeof err.status != "undefined")   res.status(err.status);
    res.error(err.message || err);
  }
});

var https_port = (process.env.HTTPS_PORT || 4443);
var http_port = (process.env.HTTP_PORT || 4000);

if(process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
  var options = {
    //new location of evssl certs
    cert: fs.readFileSync('/etc/ssl/evssl/tacticalmastery.com.bundle.crt'),
    key: fs.readFileSync('/etc/ssl/evssl/tacticalmastery.com.key'),
    requestCert: false,
    rejectUnauthorized: false
  };
  https.createServer(options,app).listen(https_port);
  console.log("HTTPS Server Started at port : " + https_port);
}

http.createServer(app).listen(http_port);
console.log("Server Started at port : " + http_port);
