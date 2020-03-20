'use strict';

const co = require('../custom/const');
const fb = require('../api/facebook');

module.exports.postLog = (id1, id2) => {
  let data = `entry.${co.POST_LOG_P1}=${id1}&entry.${co.POST_LOG_P2}=${id2}`;

  fb.getUserData(id1, info1 => {
    info1 = JSON.parse(info1);
    data += `&entry.${co.POST_LOG_NAME1}=`;
    if (info1.error)
      data += 'error';
    else
      data += encodeURI(info1.name);

    fb.getUserData(id2, info2 => {
      info2 = JSON.parse(info2);
      data += `&entry.${co.POST_LOG_NAME2}=`;
      if (info2.error)
        data += 'error';
      else
        data += encodeURI(info2.name);

        // Send to Google Forms
        let requ = require('https').request({
          host: 'docs.google.com',
          port: '443',
          path: `/forms/d/e/${co.POST_LOG_ID}/formResponse`,
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
};
