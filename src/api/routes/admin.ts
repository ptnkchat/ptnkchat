import { Router } from 'express';

import Admin from '../../services/admin';
import auth from '../middleware/auth';

import config from '../../config';

import { AdminReplyProps } from '../../interfaces/AdminReplyProps';

const router = Router();

router.post('/edit/chatroom', auth, async (req, res) => {
  const data = req.body;
  let ret: AdminReplyProps = { success: false, error: true };
  if (data.type === 'match') {
    ret = await Admin.forceMatch(data.id1, data.id2, data.gender1, data.gender2);
  } else if (data.type === 'remove') {
    ret = await Admin.forceRemove(data.id);
  }
  res.send(ret);
});

router.post('/db/reset', auth, async (req, res) => {
  res.send(await Admin.resetDatabase());
});

router.post('/userinfo', auth, async (req, res) => {
  res.send(await Admin.getUserData(req.body.id));
});

router.get('/auth', auth, (req, res) => {
  res.send({ success: true, version: config.VERSION });
});

router.get('/read/chatroom', auth, async (req, res) => {
  res.send(await Admin.readChatRoom());
});

router.get('/read/waitroom', auth, async (req, res) => {
  res.send(await Admin.readWaitRoom());
});

router.get('/read/stats', auth, async (req, res) => {
  res.send(await Admin.readStats());
});

router.get('/backup', auth, async (req, res) => {
  res.send(await Admin.createBackup());
});

router.post('/restore', auth, async (req, res) => {
  res.send(await Admin.restoreBackup(req.body));
});

router.get('/version', (req, res) => {
  res.send(config.VERSION);
});

export default router;
