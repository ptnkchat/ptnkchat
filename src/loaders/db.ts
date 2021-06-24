/**
 * Database loader
 * @packageDocumentation
 */

import mongoose from 'mongoose';
import db from '../db';
import logger from '../utils/logger';
import { sleep } from '../utils/helpers';

const _connect = async (mongoURI: string, shouldNotifyDev: boolean): Promise<boolean> => {
  let ret = false;
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log('[loader::_connect] Connected with MongoDB');

    const tmp: boolean = await db.initCache();
    if (!tmp) {
      throw Error('Failed to initialize cache');
    }
    console.log('[loader::_connect] Initialized cache');

    ret = true;
  } catch (err) {
    logger.logError('loader::_connect', 'Failed to load database', err, shouldNotifyDev);
  }
  return ret;
};

/**
 * Connect Mongoose with MongoDB server and initialize cache
 * @param mongoURI - URI to MongoDB server
 */
const dbLoader = async (mongoURI: string): Promise<void> => {
  // Try until success
  let shouldNotifyDev = true;
  while (true) {
    const attempt: boolean = await _connect(mongoURI, shouldNotifyDev);
    if (attempt) {
      break;
    }

    // Only notify dev for the first time to avoid sending too many messages
    // and get blocked
    shouldNotifyDev = false;

    // Retry in 5 seconds
    await sleep(5000);
  }
};

export default dbLoader;
