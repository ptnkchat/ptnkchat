'use strict';

const co = require('../custom/const');

var tables = ['chatroom', 'waitroom', 'gender', 'lasttalk', 'version'];

var init = (mongo, callback) => {
  getCollectionNames(mongo, currentTables => {
    let doneAdd = 0;
    let needToAdd = [];

    tables.forEach(tableName => {
      if (currentTables.indexOf(tableName) == -1) {
        needToAdd.push(tableName);
      }
    });

    if (needToAdd.length == 0) {
      callback();
      return;
    }

    needToAdd.forEach(tableName => {
      initTable(tableName);
    });

    function initTable(name) {
      mongo.conn.createCollection(name, (err, res) => {
        doneAdd++;
        if (doneAdd == needToAdd.length) {
          mongo.conn.collection('chatroom').createIndex({id1: 1, id2: 1}, {unique: true});
          mongo.conn.collection('waitroom').createIndex({uid: 1}, {unique: true});
          mongo.conn.collection('gender').createIndex({uid: 1}, {unique: true});
          mongo.conn.collection('lasttalk').createIndex({uid: 1}, {unique: true});
          mongo.conn.collection('version').updateOne({name: 'version'}, {$set: {name: 'version', value: co.VERSION}}, {upsert: true});
          callback();
        }
      });
    }
  });
}

var dropDatabase = mongo => {
  mongo.conn.dropDatabase();
}

var getCollectionNames = (mongo, callback) => {
  let names = [];
  mongo.conn.collections((e, cols) => {
    cols.forEach(col => {
      names.push(col.collectionName);
    });
    callback(names);
  });
}

var writeToWaitRoom = (mongo, id, gender) => {
  let d = new Date();
  mongo.conn.collection('waitroom').insertOne({uid: +id, gender: gender, time: d.getTime()}, (err, results, fields) => {
    if (err) {
      console.log(`__writeToWaitRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => writeToWaitRoom(mongo, id, gender), 1000);
    }
  });
}

var findInWaitRoom = (mongo, id, callback) => {
  mongo.conn.collection('waitroom').find({uid: +id}).toArray((err, results, fields) => {
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

var deleteFromWaitRoom = (mongo, id) => {
  mongo.conn.collection('waitroom').deleteMany({uid: +id}, (err, results, fields) => {
    if (err) {
      console.log(`__deleteFromWaitRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => deleteFromWaitRoom(mongo, id), 1000);
    }
  });
}

var getListWaitRoom = (mongo, callback) => {
  mongo.conn.collection('waitroom').find().toArray((err, results, fields) => {
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
var writeToChatRoom = (mongo, id1, id2, gender1, gender2, isWantedGender) => {
  let d = new Date();
  let genderint = (isWantedGender ? 1 : 0);
  mongo.conn.collection('chatroom').insertOne(
    {id1: +id1, id2: +id2, starttime: d.getTime(), gender1: gender1, gender2: gender2, genderok: genderint}, (err, results, fields) => {
      if (err) {
        console.log(`__writeToChatRoom error: ${JSON.stringify(err)}`);
        setTimeout(() => writeToChatRoom(mongo, id1, id2, gender1, gender2, isWantedGender), 1000);
      }
  });
}

// callback(id, role, data);
var findPartnerChatRoom = (mongo, id, callback) => {
  mongo.conn.collection('chatroom').find({$or:[{id1: +id}, {id2: +id}]}).toArray((err, results, fields) => {
    if (err) {
      console.log(`__findPartnerChatRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => findPartnerChatRoom(mongo, id, callback), 1000);
    } else if (results.length > 0) {
      if (results[0].id1 == id) {
        callback(results[0].id2, 1, results[0]);
      } else {
        callback(results[0].id1, 2, results[0]);
      }
    } else {
      callback(null, 1, {});
    }
  });
}

var deleteFromChatRoom = (mongo, id, callback) => {
  mongo.conn.collection('chatroom').find({$or:[{id1: +id}, {id2: +id}]}).toArray((err, results, fields) => {
    mongo.conn.collection('chatroom').deleteMany({$or:[{id1: +id}, {id2: +id}]});
    if (err) {
      console.log(`__deleteFromChatRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => deleteFromChatRoom(mongo, id, callback), 1000);
    } else if (results[0]){
      callback();
    }
  });
}

var getListChatRoom = (mongo, callback) => {
  mongo.conn.collection('chatroom').find().toArray((err, results, fields) => {
    if (err) {
      console.log(`__getListChatRoom error: ${JSON.stringify(err)}`);
      setTimeout(() => getListChatRoom(mongo, callback), 1000);
    } else {
      callback(results);
    }
  });
}

// LAST TALK
var findInLastTalk = (mongo, id1, id2) => {
  mongo.conn.collection('lasktalk').find({uid: +id1}).toArray((err, results, fields) => {
    if (err) {
      console.log(`__findInLastTalk error: ${JSON.stringify(err)}`);
      return false;
    } else if (results.length > 0) {
      if (results[0].partner == id2) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  });
}

var updateLastTalk = (mongo, id1, id2) => {
  mongo.conn.collection('lasttalk').updateOne({uid: id1}, {$set: {uid: id1, partner: id2}},
    {upsert: true}, (err, results, fields) => {
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
  findInLastTalk: findInLastTalk,
  updateLastTalk: updateLastTalk
};
