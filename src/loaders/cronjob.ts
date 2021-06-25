/**
 * Cronjob loader
 * @packageDocumentation
 */

import config from '../config';
import Chatible from '../services/chatible';

/**
 * Run cronjob every minute.
 * Remove timeout users from wait room.
 */
const cronjobLoader = async (): Promise<void> => {
  if (config.MAX_WAIT_TIME_MINUTES > 0) {
    setInterval(Chatible.removeTimeoutUser, 60000);
  }
};

export default cronjobLoader;
