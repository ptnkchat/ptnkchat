'use strict';

const MAX_CAT_IMG = 10229;
const MAX_DOG_IMG = 5250;
const fb = require('../api/facebook');

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getCatData(callback) {
  let img = randomIntFromInterval(1, MAX_CAT_IMG);
  let url = '';
  if (img <= 9360) {
    url = `nuimeow.github.io/jpg/${img}.jpg`;
  } else {
    url = `nuimeow.github.io/gif/${img}.gif`;
  }
  callback({
    'attachment': {
      'type': 'image',
      'payload': {
        'url': `https://${url}`
      }
    }
  });
}

function getDogData(callback) {
  let img = randomIntFromInterval(1, MAX_DOG_IMG);
  let url = '';
  if (img <= 5169) {
    url = `nuimeow.github.io/dog/jpg/${img}.jpg`;
  } else {
    url = `nuimeow.github.io/dog/jpg/${img}.gif`;
  }
  callback({
    'attachment': {
      'type': 'image',
      'payload': {
        'url': `https://${url}`
      }
    }
  });
}

function sendCatPic(id, id2, notInChat) {
  getCatData(data => {
    if (notInChat) data.quick_replies = fb.quickbtns;
    fb.sendFacebookApi(id, id, data);
    if (id2 !== null) fb.sendFacebookApi(id2, id2, data);
  });
}

function sendDogPic(id, id2, notInChat) {
  getDogData(data => {
    if (notInChat) data.quick_replies = fb.quickbtns;
    fb.sendFacebookApi(id, id, data);
    if (id2 !== null) fb.sendFacebookApi(id2, id2, data);
  });
}

module.exports = {
  getCatData: getCatData,
  getDogData: getDogData,
  sendCatPic: sendCatPic,
  sendDogPic: sendDogPic
};
