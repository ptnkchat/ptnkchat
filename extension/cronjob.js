const co = require('../custom/const');
const la = require('../custom/lang');
const request = require('request');
var tools;
var sqlconn;
var sendButtonMsg;

var everyMinute = () => {
	var d = new Date();
	tools.getListWaitRoom(sqlconn, (list, genderlist, timelist) => {
		timelist.forEach((time, i) => {
			if (d.getTime() - time > co.MAX_WAIT_TIME_MINUTES * 60000) {
				sendButtonMsg(list[i], la.END_CHAT_FORCE, true, true);
				tools.deleteFromWaitRoom(sqlconn, list[i]);
			}
		});
	})
}

var init = (toolsObj, sqlconnObj, sendButtonMsgObj) => {
	if (co.MAX_WAIT_TIME_MINUTES > 0) {
		tools = toolsObj;
		sqlconn = sqlconnObj;
		sendButtonMsg = sendButtonMsgObj;
		setInterval(everyMinute, 60000);
		setTimeout(everyMinute, 5000);
	}
}

module.exports = {
	init:init
};
