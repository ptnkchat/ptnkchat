module.exports = {
  // NUICHATBOT TOKEN
  NCB_TOKEN : '',

  // HEROKU STUFFS
  APP_NAME : '',
  HEROKU_API_KEY : '',

  // MONGODB SETUP
  DB_CONFIG_URI : '',
  DB_NAME : '',

  // ANALYTICS
  HAS_POST_LOG : false,
  POST_LOG_ID : '',
  POST_LOG_P1 : '',
  POST_LOG_P2 : '',
  POST_LOG_NAME1 : '',
  POST_LOG_NAME2 : '',

  // GOOGLE FORMS
  REPORT_LINK : '',

  // OTHERS
  MAX_PEOPLE_WAITROOM : 20,   // Số người tối đa trong phòng chờ
  MAX_WAIT_TIME_MINUTES : 60, // Số phút tối đa 1 người đc phép trong phòng chờ.
                              // Đặt 0 để cho phép đợi bao lâu cũng đc

  // ADMIN
  ADMIN_PASSWORD : '',            // Password để login vào trang admin
  MAX_SESSION_MINUTES : 30,       // Thời gian 1 session
  DEV_ID : 0,
  VERSION : require('project-version')
};
