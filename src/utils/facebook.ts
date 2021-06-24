/**
 * Wrapper for Facebook Graph API
 * @packageDocumentation
 */

import config from '../config';
import lang from '../lang';
import logger from './logger';
import phin from 'phin';
import Heroku from 'heroku-client';
import {
  SendRequest,
  SendMessageObject,
  SendQuickReply,
  SendResponse,
  MessengerProfileResponse,
  UserProfileResponse,
  GetPersonasResponse,
  PostPersonasResponse,
} from '../interfaces/FacebookAPI';

const u = (path: string): string => config.GRAPH_API + path;

let personaID = '';

const heroku = config.HEROKU_API_KEY !== '' ? new Heroku({ token: config.HEROKU_API_KEY }) : null;

const persistent_menu = [
  {
    locale: 'default',
    composer_input_disabled: false,
    call_to_actions: [
      {
        title: 'meow',
        type: 'postback',
        payload: lang.KEYWORD_CAT,
      },
      {
        title: 'gauw',
        type: 'postback',
        payload: lang.KEYWORD_DOG,
      },
      {
        title: 'tìm nam',
        type: 'postback',
        payload: lang.KEYWORD_GENDER + lang.KEYWORD_GENDER_MALE,
      },
      {
        title: 'tìm nữ',
        type: 'postback',
        payload: lang.KEYWORD_GENDER + lang.KEYWORD_GENDER_FEMALE,
      },
      {
        title: 'kết thúc',
        type: 'postback',
        payload: lang.KEYWORD_END,
      },
      {
        title: 'trợ giúp',
        type: 'postback',
        payload: lang.KEYWORD_HELP,
      },
      {
        title: 'gửi phản hồi',
        type: 'web_url',
        url: config.REPORT_LINK,
      },
    ],
  },
];

const quick_buttons_generic: Array<SendQuickReply> = [
  {
    content_type: 'text',
    title: 'meow',
    payload: lang.KEYWORD_CAT,
  },
  {
    content_type: 'text',
    title: 'gauw',
    payload: lang.KEYWORD_DOG,
  },
  {
    content_type: 'text',
    title: 'trợ giúp',
    payload: lang.KEYWORD_HELP,
  },
];

const quick_buttons_genders: Array<SendQuickReply> = [
  {
    content_type: 'text',
    title: 'tìm nam',
    payload: lang.KEYWORD_GENDER + lang.KEYWORD_GENDER_MALE,
  },
  {
    content_type: 'text',
    title: 'tìm nữ',
    payload: lang.KEYWORD_GENDER + lang.KEYWORD_GENDER_FEMALE,
  },
];

const setPersona = async (): Promise<void> => {
  // Check if persona is already set up
  let setUp = false;

  try {
    const res = await phin({
      url: u(`/me/personas?access_token=${config.PAGE_ACCESS_TOKEN}`),
      method: 'get',
      parse: 'json',
    });

    const body: GetPersonasResponse = res.body as GetPersonasResponse;

    if (!Array.isArray(body.data)) {
      logger.logError('facebook::setPersona', 'Failed to get personas', body, true);
    } else {
      for (let i = 0; i < body.data.length; i++) {
        if (body.data[i].name === 'Đối chat') {
          setUp = true;
          personaID = body.data[i].id;
          break;
        }
      }
    }
  } catch (err) {
    logger.logError('facebook::setPersona::getPersonas', 'Failed to send request to Facebook', err, true);
  }

  if (setUp) {
    console.log('setPersona succeed. Use existing persona ID.');
    return;
  }

  const payload = {
    name: 'Đối chat',
    profile_picture_url: config.PERSONA_PROFILE_PICTURE,
  };

  try {
    const res = await phin({
      url: u(`/me/personas?access_token=${config.PAGE_ACCESS_TOKEN}`),
      method: 'POST',
      parse: 'json',
      data: payload,
    });

    const body: PostPersonasResponse = res.body as PostPersonasResponse;

    if (typeof body.id !== 'string') {
      logger.logError('facebook::setPersona', 'Failed to get persona ID', null, true);
      return;
    }

    personaID = body.id;
    console.log('setPersona succeed. Set up new persona.');
  } catch (err) {
    logger.logError('facebook::setPersona', 'Failed to send request to Facebook', err, true);
  }
};

/**
 * Set messenger profile
 */
const setMessengerProfile = async (): Promise<void> => {
  const payload = {
    get_started: {
      payload: 'ʬ',
    },
    persistent_menu,
  };

  try {
    const res = await phin({
      url: u(`/me/messenger_profile?access_token=${config.PAGE_ACCESS_TOKEN}`),
      method: 'POST',
      parse: 'json',
      data: payload,
    });

    const body: MessengerProfileResponse = res.body as MessengerProfileResponse;

    if (body.result === 'success') {
      console.log('setMessengerProfile succeed');
    } else {
      logger.logError('facebook::setMessengerProfile', 'Failed to set messenger profile', body, true);
    }
  } catch (err) {
    logger.logError('facebook::setMessengerProfile', 'Failed to send request to Facebook', err, true);
  }
};

/**
 * Send message to user
 * @param receiver - ID of receiver
 * @param messageData - Message data
 * @param usePersona - Should send with persona
 * @param origSender - ID of original sender (see code for better understanding)
 */
const sendMessage = async (
  receiver: string,
  messageData: SendMessageObject,
  usePersona: boolean,
  origSender = '',
): Promise<void> => {
  if (messageData.text || messageData.attachment) {
    if (messageData.text && messageData.text.length > config.MAX_MESSAGE_LENGTH) {
      if (origSender !== '') {
        await sendMessage(origSender, { text: lang.ERR_TOO_LONG }, false);
      }
      return;
    }

    const payload: SendRequest = {
      recipient: { id: receiver },
      message: messageData,
      messaging_type: 'MESSAGE_TAG',
      tag: 'ACCOUNT_UPDATE',
    };

    if (usePersona && personaID !== '') {
      payload.persona_id = personaID;
    }

    try {
      const res = await phin({
        url: u(`/me/messages?access_token=${config.PAGE_ACCESS_TOKEN}`),
        method: 'POST',
        parse: 'json',
        data: payload,
      });

      const body: SendResponse = res.body as SendResponse;

      if (body.error && body.error.code) {
        logger.logError(
          'facebook::sendMessage',
          `${origSender === '' ? 'bot' : origSender} to ${receiver} failed`,
          body,
        );

        const errorCode = body.error.code;
        if (errorCode === 5) {
          // do something
          if (heroku !== null) {
            await heroku.delete(`/apps/${config.APP_NAME}/dynos`);
          }
        } else if (origSender !== '') {
          if (errorCode === 200 || errorCode === 551) {
            await sendMessage(origSender, { text: lang.ERR_200 }, false);
          } else if (errorCode === 10) {
            await sendMessage(origSender, { text: lang.ERR_10 }, false);
          }
        }
      }
    } catch (err) {
      // FIX-ME: sendMessage should retry on timeout. Currently it just logs error and returns.
      // Timeout happens very rarely, though.
      logger.logError('facebook::sendMessage', 'Failed to send request to Facebook', err, true);
    }
  } else {
    logger.logError('facebook::sendMessage', 'Got invalid messageData. Skipped!!!', messageData, true);
  }
};

/**
 * Send attachment
 * @param sender - ID of sender (`''` if sent by bot)
 * @param receiver - ID of receiver
 * @param type - Type of attachment (`image`, `video`, `audio`, `file`)
 * @param url - URL of attachment
 * @param showGenericButton - Should show generic button
 * @param showGenderButton - Should show gender button
 * @param usePersona - Should send with persona
 */
const sendAttachment = async (
  sender: string,
  receiver: string,
  type: string,
  url: string,
  showGenericButton: boolean,
  showGenderButton: boolean,
  usePersona: boolean,
): Promise<void> => {
  let quick_replies: Array<SendQuickReply> = [];
  if (showGenericButton) {
    quick_replies = quick_replies.concat(quick_buttons_generic);
  }
  if (showGenderButton) {
    quick_replies = quick_replies.concat(quick_buttons_genders);
  }

  const message: SendMessageObject = {
    attachment: {
      type,
      payload: { url },
    },
  };

  if (showGenericButton || showGenderButton) {
    message.quick_replies = quick_replies;
  }

  await sendMessage(receiver, message, usePersona, sender);
};

/**
 * Send text message
 * @param sender - ID of sender (`''` if sent by bot)
 * @param receiver - ID of receiver
 * @param text - Text to send
 * @param usePersona - Should send with persona
 */
const sendTextMessage = async (sender: string, receiver: string, text: string, usePersona: boolean): Promise<void> => {
  await sendMessage(receiver, { text }, usePersona, sender);
};

/**
 * Send text message with buttons
 * @param receiver - ID of receiver
 * @param text - Text to send
 * @param showStartButton - Should show start button
 * @param showReportButton - Should show report button
 * @param showGenericButton - Should show generic button
 * @param showGenderButton - Should show gender button
 * @param usePersona - Should send with persona
 */
const sendTextButtons = async (
  receiver: string,
  text: string,
  showStartButton: boolean,
  showReportButton: boolean,
  showGenericButton: boolean,
  showGenderButton: boolean,
  usePersona: boolean,
): Promise<void> => {
  const buttons = [];

  if (showStartButton) {
    buttons.push({ type: 'postback', title: 'Bắt đầu chat', payload: lang.KEYWORD_START });
  }

  if (showReportButton) {
    buttons.push({ type: 'web_url', title: 'Gửi phản hồi', url: config.REPORT_LINK });
  }

  let quick_replies: Array<SendQuickReply> = [];
  if (showGenericButton) {
    quick_replies = quick_replies.concat(quick_buttons_generic);
  }
  if (showGenderButton) {
    quick_replies = quick_replies.concat(quick_buttons_genders);
  }

  const messageData: SendMessageObject = {};

  if (showGenericButton || showGenderButton) {
    messageData.quick_replies = quick_replies;
  }

  if (showStartButton || showReportButton) {
    messageData.attachment = {
      type: 'template',
      payload: {
        template_type: 'button',
        text,
        buttons,
      },
    };
  } else {
    messageData.text = text;
  }

  await sendMessage(receiver, messageData, usePersona);
};

/**
 * Send seed indicator
 * @param receiver - ID of receiver
 */
const sendSeenIndicator = async (receiver: string): Promise<void> => {
  const payload: SendRequest = {
    recipient: { id: receiver },
    sender_action: 'mark_seen',
    messaging_type: 'MESSAGE_TAG',
    tag: 'ACCOUNT_UPDATE',
  };

  try {
    await phin({
      url: u(`/me/messages?access_token=${config.PAGE_ACCESS_TOKEN}`),
      method: 'POST',
      parse: 'json',
      data: payload,
    });
  } catch (err) {
    logger.logError('facebook::sendSeenIndicator', 'Failed to send request to Facebook', err, true);
  }
};

/**
 * Get user information from Facebook
 * @param id - ID of user
 */
const getUserData = async (id: string): Promise<UserProfileResponse> => {
  try {
    const res = await phin({
      url: u(`/${id}?access_token=${config.PAGE_ACCESS_TOKEN}&fields=name,first_name,last_name,profile_pic,gender`),
      method: 'GET',
      parse: 'json',
    });

    return res.body as UserProfileResponse;
  } catch (err) {
    logger.logError('facebook::getUserData', 'Failed to send request to Facebook', err, true);
    return { error: { message: 'Failed to send request to Facebook' } };
  }
};

export default {
  setPersona,
  setMessengerProfile,
  sendAttachment,
  sendTextMessage,
  sendTextButtons,
  sendSeenIndicator,
  getUserData,
};
