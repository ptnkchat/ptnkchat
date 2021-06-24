/**
 * Everything related to admin page is done here.
 * @packageDocumentation
 */

import pidusage from 'pidusage';

import db from '../db';
import lang from '../lang';
import fb from '../utils/facebook';
import GenderEnum from '../enums/GenderEnum';
import { ChatRoomEntry, WaitRoomEntry, GenderEntry, LastPersonEntry } from '../interfaces/DatabaseEntry';
import { AdminReplyProps } from '../interfaces/AdminReplyProps';

/**
 * Return a list of current users in chat room
 */
const readChatRoom = async (): Promise<AdminReplyProps> => {
  const chatRoomList: ChatRoomEntry[] = await db.getListChatRoom();
  return { success: true, error: false, chatRoom: chatRoomList };
};

/**
 * Return a list of current users in wait room
 */
const readWaitRoom = async (): Promise<AdminReplyProps> => {
  const waitRoomList: WaitRoomEntry[] = await db.getListWaitRoom();
  return { success: true, error: false, waitRoom: waitRoomList };
};

/**
 * Create backup
 */
const createBackup = async (): Promise<AdminReplyProps> => {
  const chatRoomList: ChatRoomEntry[] = await db.getListChatRoom();
  const waitRoomList: WaitRoomEntry[] = await db.getListWaitRoom();
  const genderList: GenderEntry[] = await db.getListGender();
  const lastPersonList: LastPersonEntry[] = await db.getListLastPerson();

  return {
    success: true,
    error: false,
    chatRoom: chatRoomList,
    waitRoom: waitRoomList,
    gender: genderList,
    lastPerson: lastPersonList,
  };
};

/**
 * Restore database from backup
 * @param data - Backup data
 */
const restoreBackup = async (data: AdminReplyProps): Promise<AdminReplyProps> => {
  if (!Array.isArray(data.chatRoom)) {
    return { success: false, error: true, errorType: 'Invalid chat room data' };
  }

  if (!Array.isArray(data.waitRoom)) {
    return { success: false, error: true, errorType: 'Invalid wait room data' };
  }

  if (!Array.isArray(data.gender)) {
    return { success: false, error: true, errorType: 'Invalid gender data' };
  }

  if (!Array.isArray(data.lastPerson)) {
    return { success: false, error: true, errorType: 'Invalid last person data' };
  }

  await db.resetDatabase();

  data.chatRoom.forEach(async (entry: ChatRoomEntry) => {
    await db.writeToChatRoom(entry.id1, entry.id2, entry.gender1, entry.gender2, entry.time);
  });

  data.waitRoom.forEach(async (entry: WaitRoomEntry) => {
    await db.writeToWaitRoom(entry.id, entry.gender, entry.time);
  });

  data.gender.forEach(async (entry: GenderEntry) => {
    await db.setGender(entry.id, entry.gender);
  });

  data.lastPerson.forEach(async (entry: LastPersonEntry) => {
    await db.updateLastPerson(entry.id1, entry.id2);
  });

  return { success: true, error: false };
};

/**
 * Return stats of server
 */
const readStats = async (): Promise<AdminReplyProps> => {
  const stat = await pidusage(process.pid);

  let sec = Math.floor(process.uptime());

  const d = Math.floor(sec / (24 * 60 * 60));
  sec -= d * (24 * 60 * 60);

  const h = Math.floor(sec / (60 * 60));
  sec -= h * (60 * 60);

  const m = Math.floor(sec / 60);
  sec -= m * 60;

  return {
    success: true,
    error: false,
    cpu: `${stat.cpu.toFixed(1)}%`,
    mem: `${(stat.memory / 1024 / 1024).toFixed(1)}MB`,
    uptime: `${0 < d ? d + ' day ' : ''}${h}h ${m}m ${sec}s`,
  };
};

/**
 * Forcefully connect two users (only if neither of them is in chat room)
 * @param id1 - ID of first user
 * @param id2 - ID of second user
 * @param gender1 - Gender of first user
 * @param gender2 - Gender of second user
 */
const forceMatch = async (
  id1: string,
  id2: string,
  gender1: GenderEnum,
  gender2: GenderEnum,
): Promise<AdminReplyProps> => {
  await db.removeFromWaitRoom(id1);
  await db.removeFromWaitRoom(id2);

  const partner1: string | null = await db.findPartnerChatRoom(id1);
  const partner2: string | null = await db.findPartnerChatRoom(id2);
  if (partner1 === null && partner2 === null) {
    await db.writeToChatRoom(id1, id2, gender1, gender2);
  }

  return { success: true, error: false };
};

/**
 * Remove user from wait room and chat room.
 * If that user is connected with another one, remove that one too.
 * @param id - ID of user
 */
const forceRemove = async (id: string): Promise<AdminReplyProps> => {
  const partner = await db.findPartnerChatRoom(id);
  if (partner) {
    await fb.sendTextButtons(id, lang.END_CHAT_PARTNER, true, true, true, true, false);
    await fb.sendTextButtons(partner, lang.END_CHAT_PARTNER, true, true, true, true, false);
  } else {
    await fb.sendTextButtons(id, lang.END_CHAT_FORCE, true, false, true, true, false);
  }
  await db.removeFromChatRoom(id);
  await db.removeFromWaitRoom(id);

  return { success: true, error: false };
};

const getUserData = async (id: string): Promise<AdminReplyProps> => {
  const ret = await fb.getUserData(id);
  if (ret.error) {
    return { success: false, error: true };
  } else {
    return { success: true, error: false, userProfile: ret };
  }
};

/**
 * Delete everything in database
 */
const resetDatabase = async (): Promise<AdminReplyProps> => {
  await db.resetDatabase();
  return { success: true, error: false };
};

export default {
  readChatRoom,
  readWaitRoom,
  createBackup,
  restoreBackup,
  readStats,
  forceMatch,
  forceRemove,
  getUserData,
  resetDatabase,
};
