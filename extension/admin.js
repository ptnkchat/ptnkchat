const la = require('../custom/lang');
const co = require('../custom/const');
const facebook = require('../facebook');
const pusage = require('pidusage-fork');
const request = require('request');
var SHA256 = require('crypto-js/sha256');
var CryptoJS = require('crypto-js');
var broadcast = require('./broadcast');
var HASHED_PASS = SHA256(co.ADMIN_PASSWORD).toString();
var tools;
var sqlconn;

var init = function(app, toolsObj, sqlconnObj) {
	tools = toolsObj;
	sqlconn = sqlconnObj;
	if (co.ADMIN_PASSWORD == '') return;

	app.post('/admin/auth/', function(req, res) {
		if (!doAuth(req.body['token'])) {
			res.send('ERR_AUTH');
			return;
		}
		res.send('OK');
	});

	app.post('/admin/edit/chatroom/', function(req, res) {
		var data = req.body;
		if (!doAuth(data['token'])) {
			res.send('ERR_AUTH');
			return;
		}
		try {
			if (data['type'] == 'del') {
				if (isNaN(data['id'])) return;
				tools.findPartnerChatRoom(sqlconn, data['id'], function(partner) {
					if (partner) {
						sendTextMessage(data['id'], la.END_CHAT_PARTNER);
						sendTextMessage(partner, la.END_CHAT_PARTNER);
					}
					else
						sendTextMessage(data['id'], la.END_CHAT_FORCE);
				});
				tools.deleteFromChatRoom(sqlconn, data['id'], function() {});
				tools.deleteFromWaitRoom(sqlconn, data['id']);
			}
		} catch (e) {
			console.log(e)
		}
		res.send('OK');
	});

	app.post('/admin/read/', function(req, res) {
		if (!doAuth(req.body['token'])) {
			res.send('ERR_AUTH');
			return;
		}
		var out = {
			waitroom: {},
			chatroom: {}
		};

		tools.getListWaitRoom(sqlconn, function(list, genderlist, timelist) {
			out.waitroom.ids = list;
			out.waitroom.gender = genderlist;
			out.waitroom.time = timelist;

			tools.getListChatRoom(sqlconn, function(listt) {
				out.chatroom.ids = listt;

				pusage.stat(process.pid, function(err, stat) {
					var sec = Math.floor(process.uptime());
					var d   = Math.floor(sec / (24 * 60 * 60));
					sec    -= d * (24 * 60 * 60);
					var h   = Math.floor(sec / (60 * 60));
					sec    -= h * (60 * 60);
					var m   = Math.floor(sec / (60));
					sec    -= m * (60);
					var pstat = 'CPU: ' + stat.cpu.toFixed(1) + '%, Mem: ' + (stat.memory / 1024 / 1024).toFixed(1) + 'MB, Uptime: '
						+ ((0 < d) ? (d + ' day ') : '') + h + 'h ' + m + 'm ' + sec + 's';
					out.pstat = pstat;
					res.send(JSON.stringify(out));
				});
			})
		})
	});

	app.post('/admin/userinfo/', function(req, res) {
		if (!doAuth(req.body['token']) || isNaN(req.body['id'])) {
			res.send('ERR_AUTH');
			return;
		}
		try {
			facebook.getFbData(req.body['id'], function(data) {
				res.send(data);
			});
		} catch (e) {
			res.send('');
		}
	});

	app.post('/admin/send/broadcast/', function(req, res) {
		if (!doAuth(req.body['token'])) {
			res.send('ERR_AUTH');
			return;
		}
		try {
			broadcast.sendBroadcast(co.NCB_TOKEN, req.body['text'], function(success) {
				if (success) res.send('OK');
				else res.send('ERR');
			});
		} catch (e) {
			res.send('ERR: ' + e);
		}
	});

	app.post('/admin/version/', function(req, res) {
		res.send(co.VERSION);
	});
}

function doAuth(token) {
	if (!token) return false;
	try {
		var bytes = CryptoJS.AES.decrypt(token, HASHED_PASS);
		var data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
		var d = new Date();
		return (d.getTime() - data.time < 24 * 60 * 60000 &&
			data.hash == SHA256(data.time + '' + HASHED_PASS).toString())
	} catch (e) {
		return false;
	}
}

function sendTextMessage(receiver, text) {
	let messageData = {text: text}

	request({
		url: 'http://api.chatbot.ngxson.com/graph/me/messages',
		qs: {access_token:co.NCB_TOKEN},
		method: 'POST',
		json: {
			recipient: {id:receiver},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

module.exports = {
	init: init
};