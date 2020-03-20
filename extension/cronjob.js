'use strict';

const co = require('../custom/const');
const la = require('../custom/lang');
const fb = require('../api/facebook');
var tools;
var mongo;

function everyMinute() {
  let d = new Date();
  tools.getListWaitRoom(mongo, (list, genderlist, timelist) => {
    timelist.forEach((time, i) => {
      if (d.getTime() - time > co.MAX_WAIT_TIME_MINUTES * 60000) {
        fb.sendButtonMsg(list[i], la.END_CHAT_FORCE, true, true);
        tools.deleteFromWaitRoom(mongo, list[i]);
      }
    });
  });
}

module.exports.init = (toolsObj, mongoObj) => {
  if (co.MAX_WAIT_TIME_MINUTES > 0) {
    tools = toolsObj;
    mongo = mongoObj;
    setInterval(everyMinute, 60000);
    setTimeout(everyMinute, 5000);
  }
};
