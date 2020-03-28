/*
  PTNK Chatible
  Copyright (C) 2018 - 2020 Le Bao Hiep (@hieplpvip)
  Original credit goes to Nguyen Xuan Son (a.k.a Nui or @ngxson)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.

                          FROM PTNK WITH LOVE
                               <3 LDQA
*/
'use strict';

// core
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const MongoClient = require('mongodb').MongoClient;

// custom
const la = require('./custom/lang');
const co = require('./custom/const');

// database
const tools = require('./db/dbtools');

// facebook api
const fb = require('./api/facebook');

// extensions
const gifts = require('./extension/gifts');
const logger = require('./extension/logger');
const admin = require('./extension/admin');
const cronjob = require('./extension/cronjob');

var MAINTAINING = false;

var mongo = null;

function setGender(id, gender_str, callback) {
  let genderid = 0;
  if (gender_str === la.KEYWORD_GENDER + 'nam') {
    genderid = 1;
  } else if (gender_str === la.KEYWORD_GENDER + 'nu') {
    genderid = 2;
  } else if (gender_str === la.KEYWORD_GENDER + 'khong') {
    genderid = 0;
  } else {
    callback(-1, id); // no valid value
    return;
  }
  mongo.collection('gender').updateOne({uid: id}, {$set: {uid: id, gender: genderid}}, {upsert: true}, (error) => {
    if (error) {
      callback(-2, id); // ERR writing to db
      console.log(error);
    } else {
      callback(genderid, id); // OK
    }
  });
}

function getGender(id, callback) {
  mongo.collection('gender').find({uid: id}).toArray((error, results) => {
    if (error) {
      callback(0);
      console.log(error);
    } else {
      if (results.length > 0) {
        callback(results[0].gender);
      } else {
        // if not found, fetch from facebook
        fb.getUserData(id, data => {
          data = JSON.parse(data);
          if (!data.gender) {
            setGender(id, la.KEYWORD_GENDER + 'khong', () => {});
            callback(0);
          } else if (data.gender === 'male') {
            setGender(id, la.KEYWORD_GENDER + 'nu', () => {});
            callback(2);
          } else if (data.gender === 'female')  {
            setGender(id, la.KEYWORD_GENDER + 'nam', () => {});
            callback(1);
          }
        });
      }
    }
  });
}

function connect2People(id, target, mygender, target_gender, wantedGender) {
  tools.deleteFromWaitRoom(mongo, target);
  tools.writeToChatRoom(mongo, id, target, mygender, target_gender, wantedGender);
  tools.updateLastTalk(mongo, id, target);
  logger.postLog(id, target);
  fb.sendTextMessage(id, la.START_CHAT);
  fb.sendTextMessage(target, la.START_CHAT);
}

function findPair(id, mygender) {
  // lấy list waitroom trước
  tools.getListWaitRoom(mongo, (list, genderlist) => {
    for (let i = 0; i <= list.length; i++) {
      if (i === list.length) {
        // nếu ko có ai phù hợp để ghép đôi, xin mời vào ngồi chờ
        if (mygender === 0) fb.sendTextMessage(id, la.BATDAU_WARN_GENDER);
        tools.writeToWaitRoom(mongo, id, mygender);
        fb.sendTextMessage(id, la.BATDAU_OKAY);
        return;
      }
      let target = list[i];
      let target_gender = genderlist[i];
      // kiểm tra xem có phải họ vừa chat xong ko?
      if (tools.findLastTalk(mongo, id, target) || tools.findLastTalk(mongo, target, id)) {
        // nếu có thì next
        continue;
      } else {
        let isPreferedGender = (mygender === 0 && target_gender === 0) ||
                               (mygender === 1 && target_gender === 2) ||
                               (mygender === 2 && target_gender === 1);
        if (list.length > co.MAX_PEOPLE_WAITROOM ||
            ((mygender === 0 || target_gender === 0) && Math.random() > 0.8)) {
          // kết nối nếu có quá nhiều người trong waitroom
          // hoặc kết nối với người chưa chọn giới tính
          connect2People(id, target, mygender, target_gender, isPreferedGender);
          return;
        } else {
          // được phép kén chọn giới tính
          if (isPreferedGender) {
            connect2People(id, target, mygender, target_gender, true);
            return;
          } else {
            // giới tính ko đúng mong muốn thì next
            continue;
          }
        }
      }
    }
  });
}

function processEndChat(id1, id2) {
  tools.deleteFromChatRoom(mongo, id1, () => {
    fb.sendButtonMsg(id1, la.END_CHAT, true, true, true);
    fb.sendButtonMsg(id2, la.END_CHAT_PARTNER, true, true, true);
  });
}

function forwareMessage(sender, receiver, data) {
  if (data.attachments) {
    if (data.attachments[0]) {
      let messageData = {};
      let type = data.attachments[0].type;
      if (type === 'fallback') {
        if (data.text)
          messageData.text = data.text;
        else
          messageData.text = la.ATTACHMENT_LINK + data.attachments[0].url;
      } else if (!data.attachments[0].payload || !data.attachments[0].payload.url) {
        fb.sendTextMessage(sender, la.ERR_ATTACHMENT);
        return;
      } else if (type === 'image' || type === 'video' || type === 'audio' || type === 'file') {
        messageData.attachment = {
          'type': type,
          'payload': {
            'url': data.attachments[0].payload.url
          }
        };
        //fb.sendImageVideoReport(data, sender, receiver);
      } else {
        fb.sendTextMessage(sender, la.ERR_ATTACHMENT);
        return;
      }
      fb.sendFacebookApi(sender, receiver, messageData);
    }

    for (let i = 1; i < data.attachments.length; i++) {
      let type = data.attachments[i].type;
      if (type === 'image' || type === 'video' || type === 'audio' || type === 'file') {
        fb.sendFacebookApi(sender, receiver, {
          attachment: {
            'type': type,
            'payload': {
              'url': data.attachments[i].payload.url
            }
          }
        });
      }
    }
  } else {
    fb.sendFacebookApi(sender, receiver, {text: data.text});
  }
}

function processEvent(event) {
  if (event.read) event.message = {
    text: ''
  };
  let sender = event.sender.id;
  if (event.postback && event.postback.payload)
    event.message = {'text': event.postback.payload};
  if (event.message) {
    // pre test
    if (event.message.delivery)
      return;

    let text = '';
    if (event.message.quick_reply && event.message.quick_reply.payload)
      text = event.message.quick_reply.payload;
    else if (event.message.text)
      text = event.message.text;

    if (text === la.KEYWORD_MAINTAIN && sender === co.DEV_ID) {
      MAINTAINING = !MAINTAINING;
      return;
    }

    if (MAINTAINING) {
      fb.sendTextMessage(sender, la.BAO_TRI);
      return;
    }

    // fetch person state
    tools.findInWaitRoom(mongo, sender, (waitstate) => {
      tools.findPartnerChatRoom(mongo, sender, (sender2) => {
        let command = '';
        if (text.length < 20)
          command = text.toLowerCase().replace(/ /g, '');

        if (command === 'ʬ') {
          fb.sendButtonMsg(sender, la.FIRST_COME, true, true);
          return;
        }

        if (!waitstate && sender2 === null) {
          // ko ở trong CR lẫn WR
          if (command === la.KEYWORD_BATDAU) {
            getGender(sender, (genderid) => {
              findPair(sender, genderid);
            });
          } else if (command.startsWith(la.KEYWORD_GENDER)) {
            setGender(sender, command, (ret, id) => {
              switch (ret) {
                case -2:
                  fb.sendTextMessage(id, la.DATABASE_ERR);
                  break;
                case -1:
                  fb.sendButtonMsg(id, la.GENDER_ERR, false, true);
                  break;
                default:
                  fb.sendTextMessage(id, la.GENDER_WRITE_OK + la.GENDER_ARR[ret] + la.GENDER_WRITE_WARN);
                  findPair(id, ret);
              }
            });
          } else if (command === la.KEYWORD_HELP) {
            fb.sendButtonMsg(sender, la.HELP_TXT, true, false);
          } else if (command === la.KEYWORD_CAT) {
            gifts.sendCatPic(sender, null, true);
          } else if (command === la.KEYWORD_DOG) {
            gifts.sendDogPic(sender, null, true);
          } else if (!event.read) {
            fb.sendButtonMsg(sender, la.HUONG_DAN, true, true);
          }
        } else if (waitstate && sender2 === null) {
          // đã vào WR và đang đợi
          if (command === la.KEYWORD_KETTHUC) {
            tools.deleteFromWaitRoom(mongo, sender);
            fb.sendButtonMsg(sender, la.END_CHAT, true, true);
          } else if (command === la.KEYWORD_HELP) {
            fb.sendButtonMsg(sender, la.HELP_TXT, false, false);
          } else if (command === la.KEYWORD_CAT) {
            gifts.sendCatPic(sender, null, true);
          } else if (command === la.KEYWORD_DOG) {
            gifts.sendDogPic(sender, null, true);
          } else if (!event.read) {
            fb.sendButtonMsg(sender, la.WAITING, false, true);
          }
        } else if (!waitstate && sender2 !== null) {
          // đang chat
          if (command === la.KEYWORD_KETTHUC) {
            processEndChat(sender, sender2);
          } else if (command === la.KEYWORD_BATDAU) {
            fb.sendTextMessage(sender, la.BATDAU_ERR_ALREADY);
          } else if (command === la.KEYWORD_HELP) {
            fb.sendButtonMsg(sender, la.HELP_TXT, false, false);
          } else if (command === la.KEYWORD_CAT) {
            forwareMessage(sender, sender2, event.message);
            gifts.sendCatPic(sender, sender2, false);
          } else if (command === la.KEYWORD_DOG) {
            forwareMessage(sender, sender2, event.message);
            gifts.sendDogPic(sender, sender2, false);
          } else {
            if (event.read) {
              fb.sendSeenIndicator(sender2);
            } else if (text.trim().toLowerCase().startsWith('[bot]')) {
              fb.sendTextMessage(sender, la.ERR_FAKE_MSG);
            } else {
              forwareMessage(sender, sender2, event.message);
            }
          }
        } else {
          fb.sendTextMessage(sender, la.ERR_UNKNOWN);
          tools.deleteFromWaitRoom(mongo, sender);
          tools.deleteFromChatRoom(mongo, sender, () => {});
        }
      });
    });
  }
}

function connectToMongo(prev) {
  return new Promise(async (current) => {
    const resolve = () => (prev && prev()) || current();

    try {
      let mdb = await MongoClient.connect(co.DB_CONFIG_URI, {useNewUrlParser: true, useUnifiedTopology: true});
      mongo = mdb.db(co.DB_NAME);
      resolve();
    } catch(e) {
      console.log(`Error connecting to Mongo: ${e}`);
      setTimeout(() => connectToMongo(resolve), 1000);
    }
  });
}

async function initChatbot() {
  app.set('port', (process.env.PORT || 5000));
  app.use(bodyParser.urlencoded({limit: '5mb', extended: false}));
  app.use(bodyParser.json({limit: '5mb'}));
  app.use(cors());

  await connectToMongo();
  await tools.init(mongo);
  admin.init(app, tools, mongo);
  cronjob.init(tools, mongo);
  fb.setPersistentMenu();

  app.get('/', (req, res) => {
    res.send(`${co.APP_NAME} is up`);
  });

  app.post('/webhook/', (req, res) => {
    res.sendStatus(200);
    let messaging_events = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++)
      processEvent(messaging_events[i]);
  });

  app.listen(app.get('port'), () => {
    console.log(`running on port ${app.get('port')}`);
  });

  if (co.DEV_ID !== 0) {
    fb.sendTextMessage(co.DEV_ID, `${co.APP_NAME} is up`);
  }
}

initChatbot();
