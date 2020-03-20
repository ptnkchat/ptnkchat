'use strict';

const dbmongo = require('./dbmongo');
const cache = require('./dbcache');

var cacheReady = false;

function initCache(mongo, prev) {
  return new Promise(async (current) => {
    const resolve = () => (prev && prev()) || current();

    let ok = await cache.fetchToCache(mongo);
    if (ok) {
      cacheReady = true;
      resolve();
    } else {
      setTimeout(() => initCache(mongo, resolve), 1000);
    }
  });
}

function initMongo(mongo, prev) {
  return new Promise(async (current) => {
    const resolve = () => (prev && prev()) || current();

    let ok = await cache.fetchToCache(mongo);
    if (ok) {
      resolve();
    } else {
      setTimeout(() => initMongo(mongo, resolve), 1000);
    }
  });
}

async function init(mongo) {
  await initMongo(mongo);
  await initCache(mongo);
}

function writeToWaitRoom(mongo, id, gender) {
  let d = new Date();
  cache.wr_write(id, gender, d.getTime());
  dbmongo.writeToWaitRoom(mongo, id, gender);
}

function findInWaitRoom(mongo, id, callback) {
  if (cacheReady) {
    cache.wr_find(id, callback);
  } else {
    dbmongo.findInWaitRoom(mongo, id, callback);
  }
}

function deleteFromWaitRoom(mongo, id) {
  dbmongo.deleteFromWaitRoom(mongo, id);
  cache.wr_del(id);
}

function getListWaitRoom(mongo, callback) {
  if (cacheReady) {
    cache.wr_read(callback);
  } else {
    dbmongo.getListWaitRoom(mongo, callback);
  }
}

// chatroom tools
function writeToChatRoom(mongo, id1, id2, gender1, gender2, isWantedGender) {
  dbmongo.writeToChatRoom(mongo, id1, id2, gender1, gender2, isWantedGender);
  let d = new Date();
  cache.cr_write(id1, id2, gender1, gender2, isWantedGender, d.getTime());
}

// callback(id, role, data);
function findPartnerChatRoom(mongo, id, callback) {
  if (cacheReady) {
    cache.cr_find(id, callback);
  } else {
    dbmongo.findPartnerChatRoom(mongo, id, callback);
  }
}

function deleteFromChatRoom(mongo, id, callback) {
  if (cacheReady) {
    dbmongo.deleteFromChatRoom(mongo, id, () => {});
    cache.cr_del(id, callback);
  } else {
    dbmongo.deleteFromChatRoom(mongo, id, callback);
    cache.cr_del(id, () => {});
  }
}

function getListChatRoom(mongo, callback) {
  if (cacheReady) {
    cache.cr_read(callback);
  } else {
    dbmongo.getListChatRoom(mongo, callback);
  }
}

function findLastTalk(mongo, id1, id2) {
  if (cacheReady) {
    return cache.lt_find(id1, id2);
  } else {
    return dbmongo.findLastTalk(mongo, id1, id2);
  }
}

function updateLastTalk(mongo, id1, id2) {
  dbmongo.updateLastTalk(mongo, id1, id2);
  dbmongo.updateLastTalk(mongo, id2, id1);
  cache.lt_write(id1, id2);
  cache.lt_write(id2, id1);
}

function dropDatabase(mongo) {
  dbmongo.dropDatabase(mongo);
  cache.clear();
}

module.exports = {
  init: init,
  writeToWaitRoom: writeToWaitRoom,
  findInWaitRoom: findInWaitRoom,
  deleteFromWaitRoom: deleteFromWaitRoom,
  getListWaitRoom: getListWaitRoom,
  writeToChatRoom: writeToChatRoom,
  findPartnerChatRoom: findPartnerChatRoom,
  deleteFromChatRoom: deleteFromChatRoom,
  getListChatRoom: getListChatRoom,
  findLastTalk: findLastTalk,
  updateLastTalk: updateLastTalk,
  dropDatabase: dropDatabase
};
