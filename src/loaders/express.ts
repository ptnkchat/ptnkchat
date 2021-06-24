/**
 * Express loader
 * @packageDocumentation
 */

import express from 'express';
import cors from 'cors';
import config from '../config';
import admin from '../api/routes/admin';
import webhook from '../api/routes/webhook';
import { IncomingMessage } from 'http';

/**
 * Load Express
 * @param app - Main Express application
 */
const expressLoader = async (app: express.Application): Promise<void> => {
  // Middleware that transforms the raw string of req.body into json
  app.use(
    express.json({
      verify(req: IncomingMessage & { rawBody: Buffer }, res, buf) {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  // Enable Cross Origin Resource Sharing to all origins by default
  app.use(cors());

  // Load API routes
  app.use('/admin', admin);
  app.use('/webhook', webhook);

  // Show status
  app.get('/', (req: express.Request, res: express.Response) => {
    res.send(`${config.APP_NAME} v${config.VERSION} is up`);
  });

  // Store port in Express settings
  app.set('port', process.env.PORT || 5000);

  app.listen(app.get('port'), () => {
    console.log(`v${config.VERSION} running on port ${app.get('port')}`);
  });
};

export default expressLoader;
