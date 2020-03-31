'use strict';

const co = require('../custom/const');
const la = require('../custom/lang');
const request = require('request');
var heroku = null;

if (co.HEROKU_API_KEY) {
  const Heroku = require('heroku-client');
  heroku = new Heroku({token: co.HEROKU_API_KEY});
}

var persistent_menu = [
  {
    'locale': 'default',
    'composer_input_disabled': false,
    'call_to_actions': [
      {
        'title': 'chức năng',
        'type': 'nested',
        'call_to_actions': [
          {
            'title': 'meow',
            'type': 'postback',
            'payload': la.KEYWORD_CAT
          }, {
            'title': 'gauw',
            'type': 'postback',
            'payload': la.KEYWORD_DOG
          }, {
            'title': 'tìm nam',
            'type': 'postback',
            'payload': la.KEYWORD_GENDER + 'nam'
          }, {
            'title': 'tìm nữ',
            'type': 'postback',
            'payload': la.KEYWORD_GENDER + 'nu'
          }, {
            'title': 'kết thúc',
            'type': 'postback',
            'payload': la.KEYWORD_KETTHUC
          }
        ]
      }, {
        'title': 'trợ giúp',
        'type': 'postback',
        'payload': la.KEYWORD_HELP
      }, {
        'title': 'gửi phản hồi',
        'type': 'web_url',
        'url': co.REPORT_LINK
      }
    ]
  }
];

var quickbtns = [
  {
    'content_type': 'text',
    'title': 'tìm nam',
    'payload': la.KEYWORD_GENDER + 'nam'
  }, {
    'content_type': 'text',
    'title': 'tìm nữ',
    'payload': la.KEYWORD_GENDER + 'nu'
  }, {
    'content_type': 'text',
    'title': 'meow',
    'payload': la.KEYWORD_CAT
  }, {
    'content_type': 'text',
    'title': 'gauw',
    'payload': la.KEYWORD_DOG
  }, {
    'content_type': 'text',
    'title': 'trợ giúp',
    'payload': la.KEYWORD_HELP
  }
];

module.exports.quickbtns_mini = [
  {
    'content_type': 'text',
    'title': 'meow',
    'payload': la.KEYWORD_CAT
  },{
    'content_type': 'text',
    'title': 'gauw',
    'payload': la.KEYWORD_DOG
  },{
    'content_type': 'text',
    'title': 'trợ giúp',
    'payload': la.KEYWORD_HELP
  }
];

function setPersistentMenu() {
  request({
    url: 'http://api.chatbot.ngxson.com/graph/me/messenger_profile',
    qs: {access_token: co.NCB_TOKEN},
    method: 'POST',
    json: {
      'get_started': {
        'payload': 'ʬ'
      },
      'persistent_menu': persistent_menu
    }
  }, (error, response) => {
    console.log(`setPersistentMenu: ${JSON.stringify(response.body)}`);
  });
}

function sendFacebookApi(sender, receiver, messageData, dontSendErr = false) {
  if (messageData.text || messageData.attachment) {
    if (messageData.text && messageData.text.length > 639) {
      sendFacebookApi(sender, sender, {text: la.ERR_TOO_LONG}, true);
      return;
    }

    request({
      url: 'http://api.chatbot.ngxson.com/graph/me/messages',
      qs: {access_token: co.NCB_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: receiver},
        message: messageData,
        messaging_type: 'MESSAGE_TAG',
        tag: 'NON_PROMOTIONAL_SUBSCRIPTION'
      }
    }, (error, response) => {
      if (error) {
        console.log(`Error sending messages: ${JSON.stringify(error)}`);
      } else if (response.body.error && response.body.error.code && !dontSendErr) {
        console.log(`${sender} vs ${receiver} error: ${JSON.stringify(response.body.error)}`);
        if (response.body.error.code === 200 && sender !== receiver)
          sendFacebookApi(sender, sender, {text: la.ERR_200}, true);
        else if (response.body.error.code === 10 && sender !== receiver)
          sendFacebookApi(sender, sender, {text: la.ERR_10}, true);
        else if (co.HEROKU_API_KEY && response.body.error.code === 5)
          heroku.delete(`/apps/${co.APP_NAME}/dynos`, () => {});
      }
    });
  } else {
    console.log('__sendMessage: err: neither text nor attachment');
    console.log(messageData);
  }
}

function sendTextMessage(receiver, txt) {
  sendFacebookApi(receiver, receiver, {text: txt});
}

function sendButtonMsg(receiver, txt, showStartBtn, showHelpBtn, showRpBtn = false) {
  let btns = [];
  if (showStartBtn) btns.push({
    'type': 'postback',
    'title': 'Bắt đầu chat',
    'payload': 'batdau'
  });
  if (showHelpBtn) btns.push({
    'type': 'postback',
    'title': 'Xem trợ giúp',
    'payload': 'trogiup'
  });
  else btns.push({
    'type': 'web_url',
    'title': 'Gửi phản hồi',
    'url': co.REPORT_LINK
  });
  if (showRpBtn)
    btns.push({
      'type': 'web_url',
      'title': 'Gửi phản hồi',
      'url': co.REPORT_LINK
    });
  sendFacebookApi(receiver, receiver, {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'button',
        'text': txt,
        'buttons': btns
      }
    },
    'quick_replies': quickbtns
  });
}

function sendSeenIndicator(receiver) {
  request({
    url: 'http://api.chatbot.ngxson.com/graph/me/messages',
    qs: {access_token: co.NCB_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: receiver},
      sender_action: 'mark_seen',
      messaging_type: 'MESSAGE_TAG',
      tag: 'NON_PROMOTIONAL_SUBSCRIPTION'
    }
  });
}

function getUserData(id, callback) {
  request({
    url: 'http://api.chatbot.ngxson.com/graph/' + id,
    qs: {
      access_token: co.NCB_TOKEN,
      fields: 'name,first_name,last_name,profile_pic,gender'
    },
    method: 'GET'
  }, (error, response, body) => {
    if (error) callback('{error: true}');
    else callback(body);
  });
}

function sendImageVideoReport(msg_data, sender, receiver) {
  if (msg_data.sticker_id || !msg_data.mid) return;
  let type = 'ảnh';
  if (msg_data.attachments[0].type === 'video') type = 'video';
  else if (msg_data.attachments[0].type === 'audio') return;
  sendFacebookApi(sender, receiver, {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'button',
        'text': '[BOT] Bạn đã nhận 1 ' + type,
        'buttons': [
          {
            'type': 'web_url',
            'title': 'Báo cáo/Report',
            'url': co.REPORT_LINK
          }
        ]
      }
    }
  });
}

module.exports = {
  persistent_menu: persistent_menu,
  quickbtns: quickbtns,
  setPersistentMenu: setPersistentMenu,
  sendFacebookApi: sendFacebookApi,
  sendTextMessage: sendTextMessage,
  sendButtonMsg: sendButtonMsg,
  sendSeenIndicator: sendSeenIndicator,
  getUserData: getUserData,
  sendImageVideoReport: sendImageVideoReport
};
