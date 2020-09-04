import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../../config';
import logger from '../../utils/logger';

const verifyXHub = (req: Request, res: Response, next: NextFunction): void => {
  if (config.APP_SECRET === '') {
    next();
    return;
  }

  const rawBody = (req as Request & { rawBody: Buffer }).rawBody;

  const sig = req.get('X-Hub-Signature') || '';
  const hmac = crypto.createHmac('sha1', config.APP_SECRET);
  const digest = Buffer.from('sha1=' + hmac.update(rawBody).digest('hex'), 'utf8');
  const checksum = Buffer.from(sig, 'utf8');
  if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
    logger.logError('xHub::verifyXHub', 'Invalid signature', null, true);
    res.status(403).send('Invalid signature');
    return;
  }
  next();
};

export default verifyXHub;
