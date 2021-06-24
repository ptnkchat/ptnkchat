export interface SendButton {
  type?: string;
  url?: string;
  title?: string;
  payload?: string;
}

export interface SendAttachmentPayload {
  url?: string;
  is_reusable?: boolean;
  template_type?: string;
  text?: string;
  buttons?: Array<SendButton>;
}

export interface SendAttachment {
  type: string;
  payload: SendAttachmentPayload;
}

export interface SendQuickReply {
  content_type: string;
  title?: string;
  payload?: string | number;
  image_url?: string;
}

export interface SendRecipientObject {
  id: string;
  user_ref?: string;
  post_id?: string;
  comment_id?: string;
}

export interface SendMessageObject {
  text?: string;
  attachment?: SendAttachment;
  quick_replies?: Array<SendQuickReply>;
  metadata?: string;
}

export interface SendRequest {
  messaging_type: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  recipient: SendRecipientObject;
  message?: SendMessageObject;
  persona_id?: string;
  sender_action?: 'typing_on' | 'typing_off' | 'mark_seen';
  notification_type?: 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH';
  tag?: 'CONFIRMED_EVENT_UPDATE' | 'POST_PURCHASE_UPDATE' | 'ACCOUNT_UPDATE' | 'HUMAN_AGENT';
}

export interface SendResponse {
  recipient_id: string;
  message_id: string;
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode: number;
    fbtrace_id: string;
  };
}

export interface PostPersonasResponse {
  id: string;
}

export interface GetPersonasResponse {
  data: [
    {
      name: string;
      profile_picture_url: string;
      id: string;
    },
  ];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
  };
}

export interface MessengerProfileResponse {
  result: string;
}

export interface UserProfileResponse {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
  locale?: string;
  timezone?: string;
  gender?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export interface WebhookMessageAttachment {
  type: string;
  payload: {
    url: string;
    title: string;
    sticker_id: string;
  };
}

export interface WebhookMessagingReferral {
  source: string;
  type: string;
  ref: string;
  referer_uri: string;
}

export interface WebhookMessageObject {
  mid?: string;
  text: string;
  is_echo?: boolean;
  app_id?: string;
  metadata?: string;
  quick_reply?: {
    payload: string;
  };
  reply_to?: {
    mid: string;
  };
  attachments?: Array<WebhookMessageAttachment>;
}

export interface WebhookMessagingEvent {
  sender: {
    id: string;
    user_ref: string;
  };
  recipient: {
    id: string;
  };
  message: WebhookMessageObject;
  delivery: {
    mids: string[];
    watermark: number;
  };
  postback: {
    title: string;
    payload: string;
    referral: WebhookMessagingReferral;
  };
  read: {
    watermark: number;
  };
  reaction: {
    reaction: 'smile' | 'angry' | 'sad' | 'wow' | 'love' | 'like' | 'dislike';
    emoji: string;
    action: 'react' | 'unreact';
    mid: string;
  };
  referral: WebhookMessagingReferral;
  account_linking: {
    status: 'linked' | 'unlinked';
    authorization_code: string;
  };
  optin: {
    ref: string;
    user_ref: string;
  };
  timestamp: number;
}

export interface WebhookEntry {
  id: string;
  time: number;
  messaging: Array<WebhookMessagingEvent>;
}

export interface WebhookEvent {
  object: string;
  entry: Array<WebhookEntry>;
}
