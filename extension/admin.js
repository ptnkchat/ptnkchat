'use strict';

const la = require('../custom/lang');
const co = require('../custom/const');
const facebook = require('../api/facebook');
const pidusage = require('pidusage');
const broadcast = require('./broadcast');
const CryptoJS = require('crypto-js');
const HASHED_PASS = CryptoJS.SHA256(co.ADMIN_PASSWORD).toString();
var tools;
var mongo;

function doAuth(token) {
  if (!token) return false;
  try {
    let bytes = CryptoJS.AES.decrypt(token, HASHED_PASS);
    let data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    let d = new Date();
    return (d.getTime() - data.time < co.MAX_SESSION_MINUTES * 60 * 1000 &&
            data.hash === CryptoJS.SHA256(data.time + '' + HASHED_PASS).toString());
  } catch (e) {
    return false;
  }
}

module.exports.init = (app, toolsObj, mongoObj) => {
  tools = toolsObj;
  mongo = mongoObj;
  if (co.ADMIN_PASSWORD === '') return;

  app.post('/admin/auth/', (req, res) => {
    if (!doAuth(req.body.token)) {
      res.send('ERR_AUTH');
      return;
    }
    res.send('OK');
  });

  app.post('/admin/edit/chatroom/', (req, res) => {
    var data = req.body;
    if (!doAuth(data.token)) {
      res.send('ERR_AUTH');
      return;
    }
    try {
      if (data.type === 'cradd') {
        if (isNaN(data.id1) || isNaN(data.id2)) return;
        var id1 = data.id1;
        var id2 = data.id2;
        tools.deleteFromWaitRoom(mongo, id1);
        tools.deleteFromWaitRoom(mongo, id2);
        tools.findPartnerChatRoom(mongo, id1, (partner_id1) => {
          tools.findPartnerChatRoom(mongo, id2, (partner_id2) => {
            if (!partner_id1 && !partner_id2) tools.writeToChatRoom(mongo, id1, id2, data.gender1, data.gender2, false);
          });
        });
      } else if (data.type === 'del') {
        if (isNaN(data.id)) return;
        tools.findPartnerChatRoom(mongo, data.id, (partner) => {
          if (partner) {
            facebook.sendButtonMsg(data.id, la.END_CHAT_PARTNER, true, true, true);
            facebook.sendButtonMsg(partner, la.END_CHAT_PARTNER, true, true, true);
          } else {
            facebook.sendButtonMsg(data.id, la.END_CHAT_FORCE, true, true);
          }
        });
        tools.deleteFromChatRoom(mongo, data.id, () => {});
        tools.deleteFromWaitRoom(mongo, data.id);
      }
    } catch (e) {
      console.log(e);
    }
    res.send('OK');
  });

  app.post('/admin/read/', (req, res) => {
    if (!doAuth(req.body.token)) {
      res.send('ERR_AUTH');
      return;
    }
    var out = {
      waitroom: {},
      chatroom: {}
    };

    tools.getListWaitRoom(mongo, (list, genderlist, timelist) => {
      out.waitroom.ids = list;
      out.waitroom.gender = genderlist;
      out.waitroom.time = timelist;

      tools.getListChatRoom(mongo, (listt) => {
        out.chatroom.ids = listt;

        pidusage(process.pid, (err, stat) => {
          var sec = Math.floor(process.uptime());
          var d   = Math.floor(sec / (24 * 60 * 60));
          sec    -= d * (24 * 60 * 60);
          var h   = Math.floor(sec / (60 * 60));
          sec    -= h * (60 * 60);
          var m   = Math.floor(sec / (60));
          sec    -= m * (60);
          var pstat = `CPU: ${stat.cpu.toFixed(1)}%, Mem: ${(stat.memory / 1024 / 1024).toFixed(1)}MB, Uptime: ${(0 < d) ? (d + ' day ') : ''}${h}h ${m}m ${sec}s`;
          out.pstat = pstat;
          res.send(JSON.stringify(out));
        });
      });
    });
  });

  app.post('/admin/userinfo/', (req, res) => {
    if (!doAuth(req.body.token) || isNaN(req.body.id)) {
      res.send('ERR_AUTH');
      return;
    }
    try {
      facebook.getFbData(req.body.id, (data) => {
        res.send(data);
      });
    } catch (e) {
      res.send('{error: true}');
    }
  });

  app.post('/admin/send/broadcast/', (req, res) => {
    if (!doAuth(req.body.token)) {
      res.send('ERR_AUTH');
      return;
    }
    try {
      broadcast.sendBroadcast(co.NCB_TOKEN, req.body.text, (success) => {
        if (success) res.send('OK');
        else res.send('ERR');
      });
    } catch (e) {
      res.send(`Error broadcasting: ${JSON.stringify(e)}`);
    }
  });

  app.post('/admin/db/reset/', (req, res) => {
    if (!doAuth(req.body.token)) {
      res.send('ERR_AUTH');
      return;
    }
    try {
      tools.dropDatabase(mongo);
      res.send('OK');
    } catch (e) {
      res.send(`Error resetting database: ${JSON.stringify(e)}`);
    }
  });

  app.post('/admin/version/', (req, res) => {
    res.send(co.VERSION);
  });
};
