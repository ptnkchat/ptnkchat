/**
 * Caching database in memory with MegaHash
 * @packageDocumentation
 */

import MegaHash from 'megahash';
import { Mutex } from 'async-mutex';

import { ChatRoomEntry, WaitRoomEntry, GenderEntry, LastPersonEntry } from '../../interfaces/DatabaseEntry';
import GenderEnum from '../../enums/GenderEnum';
import logger from '../../utils/logger';

const waitRoomCache = new MegaHash();
const chatRoomCache = new MegaHash();
const genderCache = new MegaHash();
const lastPersonCache = new MegaHash();

// Use mutex to avoid race conditions
const waitRoomCacheMutex = new Mutex();
const chatRoomCacheMutex = new Mutex();
const genderCacheMutex = new Mutex();
const lastPersonCacheMutex = new Mutex();

interface PartnerProps {
  partner: string;
  myGender: GenderEnum;
  partnerGender: GenderEnum;
  time: Date;
  main: boolean;
}

interface WaitingProps {
  gender: GenderEnum;
  time: Date;
}

/**
 * Add user to wait room
 * @param id - ID of user
 * @param gender - Gender of user
 * @param time - Time
 */
const waitRoomWrite = async (id: string, gender: GenderEnum, time: Date): Promise<void> => {
  const entry: WaitingProps = { gender, time };

  const release = await waitRoomCacheMutex.acquire();
  try {
    waitRoomCache.set(id, entry);
  } catch (err) {
    logger.logError('cache::waitRoomWrite', 'This should never happen', err, true);
  } finally {
    release();
  }
};

/**
 * Check if user is in wait room
 * @param id - ID of user
 */
const waitRoomFind = async (id: string): Promise<boolean> => {
  let res = false;

  const release = await waitRoomCacheMutex.acquire();
  try {
    res = waitRoomCache.has(id);
  } catch (err) {
    logger.logError('cache::waitRoomFind', 'This should never happen', err, true);
  } finally {
    release();
  }

  return res;
};

/**
 * Remove user from wait room
 * @param id - ID of user
 */
const waitRoomRemove = async (id: string): Promise<void> => {
  const release = await waitRoomCacheMutex.acquire();
  try {
    waitRoomCache.remove(id);
  } catch (err) {
    logger.logError('cache::waitRoomRemove', 'This should never happen', err, true);
  } finally {
    release();
  }
};

/**
 * Return a list of current users in wait room
 */
const waitRoomRead = async (): Promise<WaitRoomEntry[]> => {
  const ret: WaitRoomEntry[] = [];

  const release = await waitRoomCacheMutex.acquire();
  try {
    let key = waitRoomCache.nextKey();
    while (key) {
      const temp: WaitingProps = waitRoomCache.get(key);
      ret.push({
        id: key,
        gender: temp.gender,
        time: new Date(temp.time),
      });

      key = waitRoomCache.nextKey(key);
    }
  } catch (err) {
    logger.logError('cache::waitRoomRead', 'This should never happen', err, true);
  } finally {
    release();
  }

  return ret;
};

/**
 * Add paired users to chat room
 * @param id1 - ID of first user
 * @param id2 - ID of second user
 * @param gender1 - Gender of first user
 * @param gender2 - Gender of second user
 * @param time - Time when paired
 */
const chatRoomWrite = async (
  id1: string,
  id2: string,
  gender1: GenderEnum,
  gender2: GenderEnum,
  time: Date,
): Promise<void> => {
  const partner1: PartnerProps = {
    partner: id2,
    myGender: gender1,
    partnerGender: gender2,
    main: true,
    time,
  };

  const partner2: PartnerProps = {
    partner: id1,
    myGender: gender2,
    partnerGender: gender1,
    main: false,
    time,
  };

  const release = await chatRoomCacheMutex.acquire();
  try {
    chatRoomCache.set(id1, partner1);
    chatRoomCache.set(id2, partner2);
  } catch (err) {
    logger.logError('cache::chatRoomWrite', 'This should never happen', err, true);
  } finally {
    release();
  }
};

/**
 * Return partner of user. If user is not in chat room, return `null`.
 * @param id - ID of user
 */
const chatRoomFind = async (id: string): Promise<string | null> => {
  let ret: string | null = null;

  const release = await chatRoomCacheMutex.acquire();
  try {
    if (chatRoomCache.has(id)) {
      ret = chatRoomCache.get(id).partner;
    }
  } catch (err) {
    logger.logError('cache::chatRoomFind', 'This should never happen', err, true);
  } finally {
    release();
  }

  return ret;
};

/**
 * Remove paired users from chat room
 * @param id - ID of one of two users
 */
const chatRoomRemove = async (id: string): Promise<void> => {
  const release = await chatRoomCacheMutex.acquire();
  try {
    if (chatRoomCache.has(id)) {
      const partner = chatRoomCache.get(id).partner;
      chatRoomCache.remove(id);
      chatRoomCache.remove(partner);
    }
  } catch (err) {
    logger.logError('cache::chatRoomRemove', 'This should never happen', err, true);
  } finally {
    release();
  }
};

/**
 * Return a list of current users in chat room
 */
const chatRoomRead = async (): Promise<ChatRoomEntry[]> => {
  const ret: ChatRoomEntry[] = [];

  const release = await chatRoomCacheMutex.acquire();
  try {
    let key = chatRoomCache.nextKey();
    while (key) {
      const temp: PartnerProps = chatRoomCache.get(key);
      if (temp.main) {
        ret.push({
          id1: key,
          id2: temp.partner,
          gender1: temp.myGender,
          gender2: temp.partnerGender,
          time: new Date(temp.time),
        });
      }

      key = chatRoomCache.nextKey(key);
    }
  } catch (err) {
    logger.logError('cache::chatRoomRead', 'This should never happen', err, true);
  } finally {
    release();
  }

  return ret;
};

/**
 * Save gender in cache
 * @param id - ID of user
 * @param gender - Gender of user
 */
const genderWrite = async (id: string, gender: GenderEnum): Promise<void> => {
  const release = await genderCacheMutex.acquire();
  try {
    genderCache.set(id, gender);
  } catch (err) {
    logger.logError('cache::genderWrite', 'This should never happen', err, true);
  } finally {
    release();
  }
};

/**
 * Get gender of user
 * Return `null` if not available.
 * @param id - ID of user
 */
const genderFind = async (id: string): Promise<GenderEnum | null> => {
  let ret: GenderEnum | null = null;

  const release = await genderCacheMutex.acquire();
  try {
    ret = genderCache.has(id) ? genderCache.get(id) : null;
  } catch (err) {
    logger.logError('cache::genderFind', 'This should never happen', err, true);
  } finally {
    release();
  }

  return ret;
};

/**
 * Return gender data
 */
const genderRead = async (): Promise<GenderEntry[]> => {
  const ret: GenderEntry[] = [];

  const release = await genderCacheMutex.acquire();
  try {
    let key = genderCache.nextKey();
    while (key) {
      const gender: GenderEnum = genderCache.get(key);
      ret.push({ id: key, gender });
      key = chatRoomCache.nextKey(key);
    }
  } catch (err) {
    logger.logError('cache::genderRead', 'This should never happen', err, true);
  } finally {
    release();
  }

  return ret;
};

/**
 * Check if `user1` has just been paired with `user2`
 * @param id1 - ID of `user1`
 * @param id2 - ID of `user2`
 */
const lastPersonCheck = async (id1: string, id2: string): Promise<boolean> => {
  let ret = false;

  const release = await lastPersonCacheMutex.acquire();
  try {
    ret = lastPersonCache.has(id1) && lastPersonCache.get(id1) === id2;
  } catch (err) {
    logger.logError('cache::lastPersonCheck', 'This should never happen', err, true);
  } finally {
    release();
  }

  return ret;
};

/**
 * Set `user2` as the last person paired with `user1`
 * @param id1 - ID of `user1`
 * @param id2 - ID of `user2`
 */
const lastPersonWrite = async (id1: string, id2: string): Promise<void> => {
  const release = await lastPersonCacheMutex.acquire();
  try {
    lastPersonCache.set(id1, id2);
  } catch (err) {
    logger.logError('cache::lastPersonWrite', 'This should never happen', err, true);
  } finally {
    release();
  }
};

/**
 * Return last person data
 */
const lastPersonRead = async (): Promise<LastPersonEntry[]> => {
  const ret: LastPersonEntry[] = [];

  const release = await lastPersonCacheMutex.acquire();
  try {
    let key = lastPersonCache.nextKey();
    while (key) {
      const id2: string = lastPersonCache.get(key);
      ret.push({ id1: key, id2 });
      key = lastPersonCache.nextKey(key);
    }
  } catch (err) {
    logger.logError('cache::lastPersonRead', 'This should never happen', err, true);
  } finally {
    release();
  }

  return ret;
};

/**
 * Clear all caches
 */
const clear = async (): Promise<void> => {
  let release;

  release = await waitRoomCacheMutex.acquire();
  try {
    waitRoomCache.clear();
  } catch (err) {
    logger.logError('cache::clear::waitRoom', 'This should never happen', err, true);
  } finally {
    release();
  }

  release = await chatRoomCacheMutex.acquire();
  try {
    chatRoomCache.clear();
  } catch (err) {
    logger.logError('cache::clear::chatRoom', 'This should never happen', err, true);
  } finally {
    release();
  }

  release = await lastPersonCacheMutex.acquire();
  try {
    lastPersonCache.clear();
  } catch (err) {
    logger.logError('cache::clear::lastPerson', 'This should never happen', err, true);
  } finally {
    release();
  }

  release = await genderCacheMutex.acquire();
  try {
    genderCache.clear();
  } catch (err) {
    logger.logError('cache::clear::gender', 'This should never happen', err, true);
  } finally {
    release();
  }
};

export default {
  waitRoomWrite,
  waitRoomFind,
  waitRoomRemove,
  waitRoomRead,

  chatRoomWrite,
  chatRoomFind,
  chatRoomRemove,
  chatRoomRead,

  genderWrite,
  genderFind,
  genderRead,

  lastPersonCheck,
  lastPersonWrite,
  lastPersonRead,

  clear,
};
