'use strict';

/*
 * Module gửi broadcast_messages
    sendBroadcast(access_token, text, success => {
      success = true nếu gửi thành công
      success = false nếu gửi lỗi
    });
 */
const request = require('request');

function getCreativeId (access_token, message) {
  return new Promise((resolve, reject) => {
    request({
      url: 'http://api.chatbot.ngxson.com/graph/me/message_creatives?access_token=' + access_token,
      method: 'POST',
      json: {
        'messages': [message]
      }
    }, (err, res) => {
      if (err) {
        reject();
        return;
      }
      if (res && res.body && res.body.message_creative_id) {
        resolve(res.body.message_creative_id);
      } else {
        console.log(JSON.stringify(res.body));
        reject();
      }
    });
  });
}

function handleCreativeId(access_token, cid, callback) {
  request({
    url: 'http://api.chatbot.ngxson.com/graph/me/broadcast_messages?access_token=' + access_token,
    method: 'POST',
    json: {
      'message_creative_id': cid
    }
  }, (err, res) => {
    if (err) {
      callback({
        success: false,
        error: 'Something went wrong! Try again later!'
      });
      return;
    }
    if (res && res.body && res.body.broadcast_id) {
      callback({
        success: true,
        broadcast_id: res.body.broadcast_id
      });
    } else {
      callback({
        success: false,
        error: 'Something went wrong! Try again later!'
      });
    }
  });
}

function sendBroadcast(access_token, text, callback) {
  request({
    url: 'http://api.chatbot.ngxson.com/graph/me/message_creatives?access_token=' + access_token,
    method: 'POST',
    json: {
      'messages': [{
        'text': text
      }]
    }
  }, (err, res) => {
    if (err) {
      callback(false);
      return;
    }
    if (res && res.body && res.body.message_creative_id) {
      handleCreativeId(access_token, res.body.message_creative_id, callback);
    } else {
      console.log(JSON.stringify(res.body));
      callback(false);
    }
  });
}

function send(access_token, message, custom_label_id) {
  return new Promise((resolve, reject) => {
    getCreativeId(access_token, message).then(creative_id => {
      if (!creative_id) {
        reject();
        return;
      }
      let data = {
        message_creative_id: creative_id
      };
      if (custom_label_id) data.custom_label_id = custom_label_id;
      request({
        url: 'http://api.chatbot.ngxson.com/graph/me/broadcast_messages?access_token=' + access_token,
        method: 'POST',
        json: data
      }, (err, res) => {
        if (err) {
          reject();
          return;
        }
        if (res && res.body && res.body.broadcast_id) {
          resolve({
            success: true,
            broadcast_id: res.body.broadcast_id
          });
        } else {
          reject();
        }
      });
    });
  });
}

module.exports = {
  sendBroadcast: sendBroadcast,
  send: send
};
