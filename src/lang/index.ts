import config from '../config';

export default {
  MAINTENANCE: '[BOT] Server hiện đang bảo trì...',

  FIRST_COME: '[BOT] Chào mừng bạn đến với ' + config.APP_DISPLAY_NAME + '. Trước khi bắt đầu, hãy chắc chắn rằng bạn đã chọn đúng giới tính người muốn chat cùng.\n\nẤn trợ giúp (hoặc gửi trogiup) để xem thêm.',

  INSTRUCTION: '[BOT] Gửi batdau hoặc bấm vào nút để tìm bạn chat.',

  HELP_TXT: '[BOT] Danh sách các lệnh:\n' +
            '- batdau: Bắt đầu tìm bạn chat\n' +
            '- ketthuc: Kết thúc chat\n' +
            '- trogiup: Xem trợ giúp\n' +
            '- meow: Xem ảnh mèo\n' +
            '- gauw: Xem ảnh cún\n\n' +
            'Các lệnh có thể dùng khi đang không chat:\n' +
            '- timnu: Tìm nữ chat cùng\n' +
            '- timnam: Tìm nam chat cùng',

  START_OKAY: '[BOT] OK! Chúng mình sẽ thông báo khi tìm được.',
  START_WARN_GENDER: '[BOT] Lưu ý: Bạn không chọn giới tính. Có thể bạn sẽ phải đợi lâu hơn.',
  START_ERR_ALREADY: '[BOT] Bạn không thể batdau khi chưa ketthuc...',

  WAITING: '[BOT] Đang tìm bạn chat... Nếu bạn muốn đổi giới tính, gửi ketthuc sau đó chọn giới tính mới.',
  CONNECTED: '[BOT] Connected! Nếu muốn kết thúc, hãy gửi ketthuc',

  END_CHAT: '[BOT] End chat!\nGửi batdau hoặc bấm vào nút để tìm bạn chat.',
  END_CHAT_PARTNER: '[BOT] Bạn ý đã ngắt kết nối :(\nGửi batdau hoặc bấm vào nút để tìm bạn chat.',
  END_CHAT_FORCE: '[BOT] Hiện tại không có ai đang online cả. Bạn hãy thử lại sau nhé :(',

  ERR_ATTACHMENT: '[BOT] Lỗi: Chatbot chưa hỗ trợ gửi dạng dữ liệu này',
  ATTACHMENT_LINK: '[BOT] Bạn ý đã gửi 1 đường link: ',

  GENDER_ERR: '[BOT] Lỗi: Giới tính nhập vào không hợp lệ!\n\nẤn trợ giúp (hoặc gửi trogiup) để xem thêm.',
  GENDER_WRITE_OK: '[BOT] Bạn đã chọn giới tính mong muốn tìm được là: ',
  GENDER_WRITE_WARN: '\n\nLưu ý: Tùy chọn này chỉ có tác dụng với PHẦN LỚN các cuộc nói chuyện.',
  GENDER_ARR_UNKNOWN: 'cả hai',
  GENDER_ARR_MALE: 'nam',
  GENDER_ARR_FEMALE: 'nữ',

  KEYWORD_START: 'batdau',
  KEYWORD_END: 'ketthuc',
  KEYWORD_GENDER: 'tim',
  KEYWORD_GENDER_MALE: 'nam',
  KEYWORD_GENDER_FEMALE: 'nu',
  KEYWORD_GENDER_BOTH: 'namnu',
  KEYWORD_HELP: 'trogiup',
  KEYWORD_CAT: 'meow',
  KEYWORD_DOG: 'gauw',

  ERR_FAKE_MSG: '[BOT] Lỗi: Bạn không được giả mạo tin nhắn của bot!',
  ERR_DATABASE: '[BOT] Lỗi: Không thể kết nối với database. Hãy báo cho admin!',
  ERR_TOO_LONG: '[BOT] Lỗi: Tin nhắn quá dài (nhiều hơn 2000 ký tự). Hãy chia nhỏ tin nhắn và gửi dần.',
  ERR_200: '[BOT] Bạn chat không thể nhận tin nhắn do đã xóa inbox hoặc block page.',
  ERR_10: '[BOT] Bạn chat không thể nhận tin nhắn do 2 bạn không nói chuyện trong 24h. Gửi ketthuc để kết thúc chat.',
  ERR_SERVER: '[BOT] Có lỗi xảy ra với chatbot. Tin nhắn của bạn chưa được xử lý. Bạn hãy thử lại sau 1 phút nữa nhé.',
  ERR_UNKNOWN: '[BOT] Server xảy ra lỗi nhưng không nghiêm trọng lắm\nHãy gửi ketthuc để thoát ra và thử lại',
};
