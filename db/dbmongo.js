'use strict';

const co = require('../custom/const');

var tables = ['chatroom', 'waitroom', 'gender', 'lasttalk', 'version'];

async function getCollectionNames(mongo) {
  let names = [];
  let cols = await mongo.collections();
  cols.forEach(col => {
    names.push(col.collectionName);
  });
  return names;
}

async function init(mongo) {
  try {
    let currentTables = await getCollectionNames(mongo);
    for (const tableName of tables) {
      if (currentTables.indexOf(tableName) === -1) {
        await mongo.createCollection(tableName);
      }
    }

    await mongo.collection('chatroom').createIndex({id1: 1, id2: 1}, {unique: true});
    await mongo.collection('waitroom').createIndex({uid: 1}, {unique: true});
    await mongo.collection('gender').createIndex({uid: 1}, {unique: true});
    await mongo.collection('lasttalk').createIndex({uid: 1}, {unique: true});
    await mongo.collection('version').updateOne({name: 'version'}, {$set: {name: 'version', value: co.VERSION}}, {upsert: true});

    return true;
  } catch(e) {
    return false;
  }
}

function dropDatabase(mongo) {
  mongo.dropDatabase();
}

function writeToWaitRoom(mongo, id, gender) {
  let d = new Date();
  mongo.collection('waitroom').updateOne({uid: +id}, {$set: {uid: +id, gender: gender, time: d.getTime()}}, {upsert: true}, (err) => {
    if (err) {
      console.log(`__writeToWaitRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => writeToWaitRoom(mongo, id, gender), 1000);
    }
  });
}

function findInWaitRoom(mongo, id, callback) {
  mongo.collection('waitroom').find({uid: +id}).toArray((err, results) => {
    if (err) {
      console.log(`__findInWaitRoom error: ${JSON.stringify(err)}`);
      callback(false);
    } else if (results.length > 0) {
      callback(true);
    } else {
      callback(false);
    }
  });
}

function deleteFromWaitRoom(mongo, id) {
  mongo.collection('waitroom').deleteMany({uid: +id}, (err) => {
    if (err) {
      console.log(`__deleteFromWaitRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => deleteFromWaitRoom(mongo, id), 1000);
    }
  });
}

function getListWaitRoom (mongo, callback) {
  mongo.collection('waitroom').find().toArray((err, results) => {
    if (err) {
      console.log(`__getListWaitRoom error: ${JSON.stringify(err)}`);
      callback([], []);
    } else {
      let files = [];
      let genderlist = [];
      let time = [];
      results.forEach((item, index) => {
        files[index] = item.uid + '';
        genderlist[index] = item.gender;
        time[index] = item.time;
      });
      callback(files, genderlist, time);
    }
  });
}

// chatroom tools
function writeToChatRoom(mongo, id1, id2, gender1, gender2, isWantedGender) {
  let d = new Date();
  let genderint = (isWantedGender ? 1 : 0);
  mongo.collection('chatroom').updateOne({id1: +id1, id2: +id2}, {$set: {id1: +id1, id2: +id2, starttime: d.getTime(), gender1: gender1, gender2: gender2, genderok: genderint}}, {upsert: true}, (err) => {
    if (err) {
      console.log(`__writeToChatRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => writeToChatRoom(mongo, id1, id2, gender1, gender2, isWantedGender), 1000);
    }
  });
}

// callback(id, role, data);
function findPartnerChatRoom(mongo, id, callback) {
  mongo.collection('chatroom').find({$or:[{id1: +id}, {id2: +id}]}).toArray((err, results) => {
    if (err) {
      console.log(`__findPartnerChatRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => findPartnerChatRoom(mongo, id, callback), 1000);
    } else if (results.length > 0) {
      if (results[0].id1 === id) {
        callback(results[0].id2, 1, results[0]);
      } else {
        callback(results[0].id1, 2, results[0]);
      }
    } else {
      callback(null, 1, {});
    }
  });
}

function deleteFromChatRoom(mongo, id, callback) {
  mongo.collection('chatroom').find({$or:[{id1: +id}, {id2: +id}]}).toArray((err, results) => {
    mongo.collection('chatroom').deleteMany({$or:[{id1: +id}, {id2: +id}]});
    if (err) {
      console.log(`__deleteFromChatRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => deleteFromChatRoom(mongo, id, callback), 1000);
    } else if (results[0]){
      callback();
    }
  });
}

function getListChatRoom(mongo, callback) {
  mongo.collection('chatroom').find().toArray((err, results) => {
    if (err) {
      console.log(`__getListChatRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => getListChatRoom(mongo, callback), 1000);
    } else {
      callback(results);
    }
  });
}

function findLastTalk(mongo, id1, id2) {
  mongo.collection('lasktalk').find({uid: +id1}).toArray((err, results) => {
    if (err) {
      console.log(`findLastTalk error: ${JSON.stringify(err)}`);
      return false;
    } else if (results.length > 0) {
      if (results[0].partner === id2) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  });
}

function updateLastTalk(mongo, id1, id2) {
  mongo.collection('lasttalk').updateOne({uid: +id1}, {$set: {uid: +id1, partner: +id2}}, {upsert: true}, (err) => {
    if (err) {
      console.log(`__updateLastTalk error: ${JSON.stringify(err)}`);
      setTimeout(() => updateLastTalk(mongo, id1, id2), 1000);
    }
  });
}

module.exports = {
  init: init,
  dropDatabase: dropDatabase,
  writeToWaitRoom: writeToWaitRoom,
  findInWaitRoom: findInWaitRoom,
  deleteFromWaitRoom: deleteFromWaitRoom,
  getListWaitRoom: getListWaitRoom,
  writeToChatRoom: writeToChatRoom,
  findPartnerChatRoom: findPartnerChatRoom,
  deleteFromChatRoom: deleteFromChatRoom,
  getListChatRoom: getListChatRoom,
  findLastTalk: findLastTalk,
  updateLastTalk: updateLastTalk
};
