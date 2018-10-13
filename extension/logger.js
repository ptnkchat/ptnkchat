const co = require('../custom/const');
const facebook = require('../facebook');

function postLog(id1, id2) {
	var data = 'entry.' + co.POST_LOG_P1 + '=' + id1 + '&entry.' + co.POST_LOG_P2 + '=' + id2;

	facebook.getFbData(id1, function(info1) {
		info1 = JSON.parse(info1);
		data += '&entry.' + co.POST_LOG_NAME1 + '=';
		if (info1.error)
			data += 'error';
		else
			data += encodeURI(info1.last_name + ' ' + info1.first_name);

		facebook.getFbData(id2, function(info2) {
			info2 = JSON.parse(info2);
			data += '&entry.' + co.POST_LOG_NAME2 + '=';
			if (info2.error)
				data += 'error';
			else
				data += encodeURI(info2.last_name + ' ' + info2.first_name);

				// Send to Google Forms
				var requ = require('https').request({
					host: 'docs.google.com',
					port: '443',
					path: '/forms/d/e/' + co.POST_LOG_ID + '/formResponse',
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': data.length
					}
				});
				requ.write(data);
				requ.end();
		});
	});
}

function postErr() {
	//TODO
}

module.exports = {
	postLog: postLog
};
