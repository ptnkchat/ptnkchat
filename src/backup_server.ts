/**
 * Backup server in case main server crashes.
 * This automatically exits after 10 seconds.
 */

import express from 'express';
import cors from 'cors';
import phin from 'phin';
import lang from './lang';
import config from './config';
import logger from './utils/logger';
import { SendRequest, SendResponse, WebhookEvent, WebhookEntry, WebhookMessagingEvent } from './interfaces/FacebookAPI';

const u = (path: string): string => config.GRAPH_API + path;

const app = express();

/**
 * Send text message
 * @param receiver - ID of receiver
 * @param text - Text to send
 */
const sendTextMessage = async (receiver: string, text: string): Promise<void> => {
  try {
    const payload: SendRequest = {
      recipient: { id: receiver },
      message: { text },
      messaging_type: 'MESSAGE_TAG',
      tag: 'ACCOUNT_UPDATE',
    };

    const res = await phin({
      url: u(`/me/messages?access_token=${config.PAGE_ACCESS_TOKEN}`),
      method: 'POST',
      parse: 'json',
      data: payload,
    });

    const body: SendResponse = res.body as SendResponse;

    if (body.error) {
      logger.logError('backupServer::sendTextMessage', 'Failed to send message', body.error);
    }
  } catch (err) {
    logger.logError('backupServer::sendTextMessage', 'Failed to send request to Facebook', err);
  }
};

app.set('port', process.env.PORT || 5000);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send(`${config.APP_NAME} is down!!!`);
});

app.post('/webhook', (req, res) => {
  res.sendStatus(200);
  const data: WebhookEvent = req.body;
  data.entry.forEach((entry: WebhookEntry) => {
    entry.messaging.forEach((event: WebhookMessagingEvent) => {
      const sender = event.sender.id;
      if (event.read || event.delivery || (event.message && event.message.is_echo === true)) {
        return;
      }
      sendTextMessage(sender, lang.ERR_SERVER);
    });
  });
});

app.listen(app.get('port'), () => {
  console.log(`v${config.VERSION} running on port ${app.get('port')}`);
});

setTimeout(() => {
  process.exit(1);
}, 10000);
