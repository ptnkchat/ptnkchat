'use strict';

// core
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const fs = require('fs');
const cors = require('cors');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const xhub = require('express-x-hub');

// custom
const la = require('./custom/lang');
const co = require('./custom/const');

// parts
const tools = require('./dbtools');
const gendertool = require('./gender');
const facebook = require('./facebook');

// extensions
const gifts = require('./extension/gifts');
const logger = require('./extension/logger');
const admin = require('./extension/admin');
const cronjob = require('./extension/cronjob');

var sendFacebookApi = facebook.sendFacebookApi;

var MAINTAINING = false;

var mongo = {}

function connectToMongo() {
	MongoClient.connect(co.DB_CONFIG_URI.replace('/test', '/' + co.DB_NAME), {useNewUrlParser: true}, function(err, mdb) {
		if (err) {
			console.log(err);
			setTimeout(connectToMongo, 1000);
		} else {
			mongo.conn = mdb.db(co.DB_NAME);
			tools.initMongo(mongo, function() {
				tools.init(mongo);
				initChatbot();
			});
		}
	});
}
connectToMongo();

facebook.setupFBApi();

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({limit: '5mb', extended: false}));
app.use(bodyParser.json({limit: '5mb'}));
app.use(cors());

// index
app.get('/', function(req, res) {
	res.send(co.APP_NAME + ' is up');
});

// xử lí tin nhắn
app.post('/webhook/', function(req, res) {
	var messaging_events = req.body.entry[0].messaging;
	res.sendStatus(200);
	for (var i = 0; i < messaging_events.length; i++) {
		var event = messaging_events[i]
		//console.log(event);
		if (event.read) event.message = {
			text: ""
		};
		//if (event.message.attachments) console.log(event.message.attachments[0]);
		var sender = event.sender.id;
		if (event.postback)
			if (event.postback.payload) event['message'] = {
				"text": event.postback.payload
			};
		if (event.message) {
			// pre test
			if (event.message.delivery) continue;
			var text = '';
			if (event.message.quick_reply && event.message.quick_reply.payload)
				text = event.message.quick_reply.payload;
			else if (event.message.text)
				text = event.message.text;

			if (text === la.KEYWORD_MAINTAIN && sender == co.DEV_ID) {
				MAINTAINING = !MAINTAINING;
				return;
			}

			if (MAINTAINING) {
				sendTextMessage(sender, la.BAO_TRI);
				return;
			}

			// fetch person state
			tools.findInWaitRoom(mongo, sender, function(waitstate) {
				tools.findPartnerChatRoom(mongo, sender, function(sender2, haveToReview, role, data) {
					var command = '';
					if (text.length < 20)
						command = text.toLowerCase().replace(/ /g, '');

					if (command == 'ʬ') {
						sendButtonMsg(sender, la.FIRST_COME, true, true);
						return;
					}

					// ko ở trong CR lẫn WR
					if (!waitstate && sender2 == null) {
						if (command === la.KEYWORD_BATDAU) {
							gendertool.getGender(mongo, sender, function(genderid) {
								findPair(sender, genderid);
							}, facebook);
						} else if (command.startsWith(la.KEYWORD_GENDER)) {
							gendertool.setGender(mongo, sender, command, genderWriteCallback);
						} else if (command === la.KEYWORD_HELP) {
							sendButtonMsg(sender, la.HELP_TXT, true, false);
						} else if (command === la.KEYWORD_CAT) {
							gifts.sendCatPic(sender, null, true);
						} else if (command === la.KEYWORD_DOG) {
							gifts.sendDogPic(sender, null, true);
						} else if (!event.read) {
							sendButtonMsg(sender, la.HUONG_DAN, true, true);
						}
					}

					// đã vào WR và đang đợi
					else if (waitstate && sender2 == null) {
						if (command === la.KEYWORD_KETTHUC) {
							tools.deleteFromWaitRoom(mongo, sender)
							sendButtonMsg(sender, la.END_CHAT, true, true);
						} else if (command === la.KEYWORD_HELP) {
							sendButtonMsg(sender, la.HELP_TXT, false, false);
						} else if (command === la.KEYWORD_CAT) {
							gifts.sendCatPic(sender, null, true);
						} else if (command === la.KEYWORD_DOG) {
							gifts.sendDogPic(sender, null, true);
						} else if (!event.read) {
							sendButtonMsg(sender, la.WAITING, false, true);
						}
					}

					// đang chat
					else if (!waitstate && sender2 != null) {
						if (command === la.KEYWORD_KETTHUC) {
							processEndChat(sender, sender2);
						} else if (command === la.KEYWORD_BATDAU) {
							sendTextMessage(sender, la.BATDAU_ERR_ALREADY);
						} else if (command === la.KEYWORD_HELP) {
							sendButtonMsg(sender, la.HELP_TXT, false, false);
						} else if (command === la.KEYWORD_CAT) {
							sendMessage(sender, sender2, event.message);
							gifts.sendCatPic(sender, sender2, false);
						} else if (command === la.KEYWORD_DOG) {
							sendMessage(sender, sender2, event.message);
							gifts.sendDogPic(sender, sender2, false);
						} else {
							if (event.read) {
								facebook.sendSeenIndicator(sender2);
							} else if (text.toLowerCase().startsWith('[bot]')) {
								sendTextMessage(sender, la.ERR_FAKE_MSG);
							} else {
								sendMessage(sender, sender2, event.message);
							}
						}

					} else {
						sendTextMessage(sender, la.ERR_UNKNOWN);
						tools.deleteFromWaitRoom(mongo, sender);
						tools.deleteFromChatRoom(mongo, sender, function(t) {});
					}
				});
			});
			continue
		}
	}
});

function processEndChat(id1, id2) {
	tools.deleteFromChatRoom(mongo, id1, function(t) {
		sendButtonMsg(id1, la.END_CHAT, true, true, true);
		sendButtonMsg(id2, la.END_CHAT_PARTNER, true, true, true);
	});
}

function genderWriteCallback(ret, id) {
	switch (ret) {
		case -2:
			sendTextMessage(id, la.SQL_ERR);
			break;
		case -1:
			sendButtonMsg(id, la.GENDER_ERR, false, true);
			break;
		default:
			sendTextMessage(id, la.GENDER_WRITE_OK + la.GENDER_ARR[ret] + la.GENDER_WRITE_WARN, function() {
				findPair(id, ret);
			});
	}
}

var findPair = function(id, mygender) {
	// lấy list waitroom trước
	tools.getListWaitRoom(mongo, function(list, genderlist) {
		for (var i = 0; i <= list.length; i++) {
			if (i == list.length) {
				// nếu ko có ai phù hợp để ghép đôi, xin mời vào ngồi chờ
				if (mygender == 0) sendTextMessage(id, la.BATDAU_WARN_GENDER);
				tools.writeToWaitRoom(mongo, id, mygender);
				sendTextMessage(id, la.BATDAU_OKAY);
				return;
			}
			var target = list[i];
			var target_gender = genderlist[i];
			// kiểm tra xem có phải họ vừa chat xong ko?
			if (tools.findInLastTalk(mongo, id, target) || tools.findInLastTalk(mongo, target, id)) {
				// nếu có thì next
				continue;
			} else {
				var isPreferedGender = (mygender == 0 && target_gender == 0) ||
					(mygender == 1 && target_gender == 2) ||
					(mygender == 2 && target_gender == 1);
				if (list.length > co.MAX_PEOPLE_WAITROOM || ((mygender == 0 || target_gender == 0) && Math.random() > 0.8)) {
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
	})
}

var connect2People = function(id, target, mygender, target_gender, wantedGender) {
	tools.deleteFromWaitRoom(mongo, target);
	tools.writeToChatRoom(mongo, id, target, mygender, target_gender, wantedGender);
	tools.updateLastTalk(mongo, id, target);
	logger.postLog(id, target);
	sendTextMessage(id, la.START_CHAT);
	sendTextMessage(target, la.START_CHAT);
}

var sendTextMessage = function(sender, txt, callback) {
	sendFacebookApi(sender, sender, {text: txt}, false, callback);
}

var sendButtonMsg = function(sender, txt, showStartBtn, showHelpBtn, showRpBtn = false) {
	var btns = [];
	if (showStartBtn) btns.push({
		"type": "postback",
		"title": "Bắt đầu chat",
		"payload": "batdau"
	});
	if (showHelpBtn) btns.push({
		"type": "postback",
		"title": "Xem trợ giúp",
		"payload": "trogiup"
	});
	else btns.push({
		"type": "web_url",
		"title": "Gửi phản hồi",
		"url": co.REPORT_LINK
	});
	if (showRpBtn)
		btns.push({
			"type": "web_url",
			"title": "Gửi phản hồi",
			"url": co.REPORT_LINK
		});
	sendFacebookApi(sender, sender, {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "button",
				"text": txt,
				"buttons": btns
			}
		},
		"quick_replies": facebook.quickbtns
	});
}

var sendMessage = function(sender, receiver, data) {
	var messageData = {
		text: data.text
		//"quick_replies":facebook.quickbtns_mini
	};

	if (data.attachments) {
		if (data.attachments[0]) {
			var type = data.attachments[0].type;
			if (type == "fallback") {
				if (data.text)
					messageData['text'] = data.text;
				else
					messageData['text'] = la.ATTACHMENT_LINK + data.attachments[0].url;
			} else if (!data.attachments[0].payload || !data.attachments[0].payload.url) {
				sendTextMessage(sender, la.ERR_ATTACHMENT);
				return;
			} else if (type == 'image' || type == 'video' || type == 'audio') {
				messageData.text = undefined;
				messageData.attachment = {
					"type": type,
					"payload": {
						"url": data.attachments[0].payload.url
					}
				}
				//facebook.sendImageVideoReport(data, sender, receiver);
			} else if (type == 'file') {
				messageData.text = la.ATTACHMENT_FILE + data.attachments[0].payload.url;
			} else {
				sendTextMessage(sender, la.ERR_ATTACHMENT);
				return;
			}
			sendFacebookApi(sender, receiver, messageData);
		}

		for (var i = 1; i < data.attachments.length; i++) {
			var type2 = data.attachments[i].type;
			if (type2 == 'image' || type2 == 'video' || type2 == 'audio') {
				sendFacebookApi(sender, receiver, {
					attachment: {
						"type": type2,
						"payload": {
							"url": data.attachments[i].payload.url
						}
					}
				});
			}
		}
	} else {
		sendFacebookApi(sender, receiver, messageData);
	}
}

function initChatbot() {
	admin.init(app, tools, mongo);
	cronjob.init(tools, mongo, sendButtonMsg);
	app.listen(app.get('port'), function() {
		console.log('running on port', app.get('port'));
	})
}

if (co.DEV_ID != 0) sendTextMessage(co.DEV_ID, co.APP_NAME + ' is up');