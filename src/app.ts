/**
 * This project is dedicated to Lam Dao Que Anh, my ex-crush and ex-lover.
 * You made me stronger and better than I could ever imagined.
 * @packageDocumentation
 */

// Load variables from .env
import dotenv from 'dotenv';
dotenv.config();

// Set NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import express from 'express';
import config from './config';
import dbLoader from './loaders/db';
import expressLoader from './loaders/express';
import cronjobLoader from './loaders/cronjob';
import fb from './utils/facebook';
import logger from './utils/logger';

/**
 * Start chatbot
 */
const startServer = async (): Promise<void> => {
  // Load database
  await dbLoader(config.MONGO_URI);

  // Load cronjob
  await cronjobLoader();

  // Load Express
  const app = express();
  await expressLoader(app);

  // Set messenger profile
  await fb.setMessengerProfile();

  // Set persona
  await fb.setPersona();

  // Check if admin password is set
  if (config.ADMIN_PASSWORD === '') {
    logger.logError('app::startServer', 'Admin password is not set!!!', null, true);
  }

  // Notify developer
  if (config.DEV_ID !== '') {
    await fb.sendTextMessage('', config.DEV_ID, `${config.APP_NAME} v${config.VERSION} is up`, false);
  }
};

startServer();
