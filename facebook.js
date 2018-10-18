var http = require('http');
var co = require('./custom/const');
const la = require('./custom/lang');
const request = require('request');
var heroku = null;

if (co.HEROKU_API_KEY) {
    var Heroku = require('heroku-client');
    heroku = new Heroku({token: co.HEROKU_API_KEY});
}

exports.getFbData = function(id, callback) {
	request({
		url: 'http://api.chatbot.ngxson.com/graph/' + id,
		qs: {access_token: co.NCB_TOKEN},
		method: 'GET'
		}, function(error, response, body) {
			if (error) callback('{error: true}');
			else callback(body);
		})
}

exports.setupFBApi = function() {
	request({
		url: 'http://api.chatbot.ngxson.com/graph/me/messenger_profile',
		qs: {access_token: co.NCB_TOKEN},
		method: 'POST',
		json: {
			"get_started": {
				"payload": "ʬ"
			},
			"persistent_menu": exports.persistent_menu
		}
	}, function(error, response, body) {console.log('set_persistent_menu: ' + JSON.stringify(response.body))})
}

exports.persistent_menu = [
	{
		"locale": "default",
		"composer_input_disabled": false,
		"call_to_actions": [
			{
				"title": "chức năng",
				"type": "nested",
				"call_to_actions": [
					{
						"title": "ảnh mèo",
						"type": "postback",
						"payload": la.KEYWORD_CAT
					},{
						"title": "ảnh cún",
						"type": "postback",
						"payload": la.KEYWORD_DOG
					},{
						"title": "tìm nam",
						"type": "postback",
						"payload": la.KEYWORD_GENDER + 'nam'
					},{
						"title": "tìm nữ",
						"type": "postback",
						"payload": la.KEYWORD_GENDER + 'nu'
					},{
						"title": "kết thúc",
						"type": "postback",
						"payload": la.KEYWORD_KETTHUC
					}
				]
			},{
				"title": "trợ giúp",
				"type": "postback",
				"payload": la.KEYWORD_HELP
			},{
				"title": "gửi phản hồi",
				"type": "web_url",
				"url": co.REPORT_LINK
			}
		]
	}
];

exports.quickbtns = [
	{
		"content_type": "text",
		"title": "tìm nam",
		"payload": la.KEYWORD_GENDER + 'nam'
	},{
		"content_type": "text",
		"title": "tìm nữ",
		"payload": la.KEYWORD_GENDER + 'nu'
	},{
		"content_type": "text",
		"title": "meow",
		"payload": la.KEYWORD_CAT
	},{
		"content_type": "text",
		"title": "gauw",
		"payload": la.KEYWORD_DOG
	},{
		"content_type": "text",
		"title": "trợ giúp",
		"payload": la.KEYWORD_HELP
	}
];

exports.quickbtns_mini = [
	{
		"content_type": "text",
		"title": "meow",
		"payload": la.KEYWORD_CAT
	},{
		"content_type": "text",
		"title": "gauw",
		"payload": la.KEYWORD_DOG
	},{
		"content_type": "text",
		"title": "trợ giúp",
		"payload": la.KEYWORD_HELP
	}
];

var sendFacebookApi = function (sender, receiver, messageData, dontSendErr = false, callback = null) {
	if (messageData.text || messageData.attachment) {
		if (messageData.text && messageData.text.length > 639) {
			sendFacebookApi(sender, sender, {text: la.ERR_TOO_LONG}, null, true);
			return;
		}

		request({
			url: 'http://api.chatbot.ngxson.com/graph/me/messages',
			qs: {access_token: co.NCB_TOKEN},
			method: 'POST',
			json: {
				recipient: {id: receiver},
				message: messageData,
				messaging_type: "RESPONSE"
			}
		}, function(error, response, body) {
			if (error) {
				console.log('Error sending messages: ', error)
			} else if (response.body.error && response.body.error.code && !dontSendErr) {
				console.log(sender + ' vs ' + receiver + ' Error: ', response.body.error);
				if (response.body.error.code == 200 && sender != receiver)
					sendFacebookApi(sender, sender, {text: la.ERR_200}, null, true);
				else if (response.body.error.code == 230 && sender != receiver)
					sendFacebookApi(sender, sender, {text: la.ERR_230}, null, true);
				else if (co.HEROKU_API_KEY && response.body.error.code == 5)
					heroku.delete('/apps/' + co.APP_NAME + '/dynos/web.1', function (err, app) {});
			}
		})
	} else {
		console.log('__sendMessage: err: neither text nor attachment');
		console.log(messageData);
	}
	if(callback && typeof callback === 'function')
		callback();
}
exports.sendFacebookApi = sendFacebookApi;

exports.sendSeenIndicator = function (receiver) {
	request({
		url: 'http://api.chatbot.ngxson.com/graph/me/messages',
		qs: {access_token: co.NCB_TOKEN},
		method: 'POST',
		json: {
			recipient: {id: receiver},
			sender_action: "mark_seen",
			messaging_type: "RESPONSE"
		}
	}, function(error, response, body) {})
}

exports.sendImageVideoReport = function(msg_data, sender, receiver) {
	if (msg_data.sticker_id || !msg_data.mid) return;
	var type = 'ảnh';
	if (msg_data.attachments[0].type == 'video') type = 'video';
	else if (msg_data.attachments[0].type == 'audio') return;
	sendFacebookApi(sender, receiver, {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "button",
				"text": "[BOT] Bạn đã nhận 1 " + type,
				"buttons": [
					{
						"type": "web_url",
						"title": "Báo cáo/Report",
						"url": co.REPORT_LINK
					}
				]
			}
		}
	});
}
