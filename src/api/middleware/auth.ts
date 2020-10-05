import { Request, Response, NextFunction } from 'express';
import CryptoJS from 'crypto-js';
import config from '../../config';
import { AdminReplyProps } from '../../interfaces/AdminReplyProps';

const HASHED_PASS = CryptoJS.SHA256(config.ADMIN_PASSWORD).toString();

/**
 * Check authorization token in header `X-Auth-Token`
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction): Response<AdminReplyProps> | void => {
  const token = req.header('X-Auth-Token');
  if (!token) {
    return res.send({ error: true, errortype: 'auth' });
  }

  try {
    const bytes = CryptoJS.AES.decrypt(token, HASHED_PASS);
    const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    const now = new Date();

    if (
      now.getTime() - data.time < config.MAX_SESSION_MINUTES * 60 * 1000 &&
      data.hash === CryptoJS.SHA256(data.time + '' + HASHED_PASS).toString()
    ) {
      next();
    } else {
      res.send({ error: true, errortype: 'auth' });
    }
  } catch (err) {
    res.send({ error: true, errortype: 'auth' });
  }
};

export default authMiddleware;
