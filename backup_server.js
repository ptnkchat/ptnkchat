'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const la = require('./custom/lang');
const co = require('./custom/const');
const app = express();

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	res.send('');
});

app.post('/webhook/', function(req, res) {
	var messaging_events = req.body.entry[0].messaging;
	for (let i = 0; i < messaging_events.length; i++) {
		var event = req.body.entry[0].messaging[i]
		var sender = event.sender.id
		if (event.read || (event.message && event.message.delivery)) {
			res.sendStatus(200);
			return;
		}
		sendTextMessage(sender, la.ERR_SERVER);
	}
	res.sendStatus(200);
});

function sendTextMessage(receiver, text) {
	let messageData = {text:text}

	request({
		url: 'http://api.chatbot.ngxson.com/graph/me/messages',
		qs: {access_token: co.NCB_TOKEN},
		method: 'POST',
		json: {
			recipient: {id: receiver},
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

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})

// auto exit after 10 secs
setTimeout(function() {
	process.exit(1);
}, 10000);