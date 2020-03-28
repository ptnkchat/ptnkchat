'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const request = require('request');
const la = require('./custom/lang');
const co = require('./custom/const');
const app = express();

function sendTextMessage(receiver, text) {
  let messageData = {text: text};
  request({
    url: 'http://api.chatbot.ngxson.com/graph/me/messages',
    qs: {access_token: co.NCB_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: receiver},
      message: messageData,
      messaging_type: 'RESPONSE'
    }
  }, (error, response) => {
    if (error) {
      console.log(`Error sending messages: ${JSON.stringify(error)}`);
    } else if (response.body.error) {
      console.log(`Error: ${JSON.stringify(response.body.error)}`);
    }
  });
}

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send(`${co.APP_NAME} is down!!!`);
});

app.post('/webhook/', (req, res) => {
  res.sendStatus(200);
  let messaging_events = req.body.entry[0].messaging;
  for (let i = 0; i < messaging_events.length; i++) {
    let event = req.body.entry[0].messaging[i];
    let sender = event.sender.id;
    if (event.read || (event.message && event.message.delivery)) {
      return;
    }
    sendTextMessage(sender, la.ERR_SERVER);
  }
});

// spin spin sugar
app.listen(app.get('port'), () => {
  console.log(`running on port ${app.get('port')}`);
})

// auto exit after 10 secs
setTimeout(() => {
  process.exit(1);
}, 10000);