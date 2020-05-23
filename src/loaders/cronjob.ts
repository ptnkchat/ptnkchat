/**
 * Cronjob loader
 * @packageDocumentation
 */

import Chatible from '../services/chatible';

/**
 * Run cronjob every minute.
 * Remove timeout users from wait room.
 */
const cronjobLoader = async (): Promise<void> => {
  setInterval(Chatible.removeTimeoutUser, 60000);
};

export default cronjobLoader;
