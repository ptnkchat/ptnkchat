'use strict';

const MegaHash = require('megahash');

var waitroom = new MegaHash();
var pair1 = new MegaHash();
var pair2 = new MegaHash();
var lasttalk = new MegaHash();

function Partner1(partner, mygender, partner_gender, genderok, starttime) {
  this.partner = '' + partner;
  this.mygender = mygender;
  this.partner_gender = partner_gender;
  this.genderok = genderok;
  this.starttime = starttime;
}

function Partner2(partner, mygender, partner_gender, genderok, starttime) {
  this.partner = '' + partner;
  this.mygender = mygender;
  this.partner_gender = partner_gender;
  this.genderok = genderok;
  this.starttime = starttime;
}

function wr_write(id, gender, time) {
  waitroom.set('' + id, {gender: gender, time: time});
}

function wr_find(id, callback) {
  if (waitroom.has('' + id)) {
    callback(true);
  } else {
    callback(false);
  }
}

function wr_del(id) {
  waitroom.delete('' + id);
}

function wr_read(callback) {
  let ids = []; let genders = []; let time = [];
  let key = waitroom.nextKey();
  while (key) {
    let temp = waitroom.get(key);
    ids.push(key);
    genders.push(temp.gender);
    time.push(temp.time);
  key = waitroom.nextKey(key);
  }
  callback(ids, genders, time);
}

function cr_write(id1, id2, gender1, gender2, isWantedGender, starttime) {
  let genderok = isWantedGender ? 1 : 0;
  pair1.set('' + id1, new Partner1(id2, gender1, gender2, genderok, starttime));
  pair2.set('' + id2, new Partner2(id1, gender2, gender1, genderok, starttime));
}

function findInCR(id, cr, number) {
  if (cr.has(id)) {
    let temp = cr.get(id);
    return [temp.partner, number, temp];
  } else {
    return null;
  }
}

function cr_find(id, callback) {
  id = '' + id;
  let temp = findInCR(id, pair1, 1);
  if (temp !== null) {
    callback(temp[0], temp[1], temp[2]);
  } else {
    temp = findInCR(id, pair2, 2);
    if (temp !== null) {
      callback(temp[0], temp[1], temp[2]);
    } else {
      callback(null, 1, {});
    }
  }
}

function cr_del(id, callback) {
  if (pair1.has('' + id)) {
    let temp = pair1.get('' + id);
    pair2.delete(temp.partner);
    pair1.delete('' + id);
  } else if (pair2.has('' + id)) {
    let temp = pair2.get('' + id);
    pair1.delete(temp.partner);
    pair2.delete('' + id);
  }
  callback();
}

function cr_read(callback) {
  let ret = [];
  let key = pair1.nextKey();
  while (key) {
    let temp = pair1.get(key);
    ret.push({'id1': key, 'id2': temp.partner, 'gender1': temp.mygender, 'gender2': temp.partner_gender, 'genderok': temp.genderok, 'starttime': temp.starttime});
  key = pair1.nextKey(key);
  }
  callback(ret);
}

function lt_find(id1, id2) {
  id1 = id1 + '' ; id2 = id2 + '';
  if (lasttalk.has(id1)) {
    return (lasttalk.get(id1) === id2);
  }
}

function lt_write(id1, id2) {
  lasttalk.set('' + id1, '' + id2);
}

function clear() {
  waitroom.clear();
  pair1.clear();
  pair2.clear();
  lasttalk.clear();
}

async function fetchToCache(mongo) {
  try {
    clear();
    let cr = await mongo.collection('chatroom').find().toArray();
    cr.forEach(item => {
      cr_write(item.id1, item.id2, item.gender1, item.gender2, item.genderok, item.starttime);
    });
    let wr = await mongo.collection('waitroom').find().toArray();
    wr.forEach(item => {
      wr_write(item.uid, item.gender, item.time);
    });
    let lt = await mongo.collection('lasttalk').find().toArray();
    lt.forEach(item => {
      lt_write(item.uid, item.partner);
    });
    return true;
  } catch(e) {
    return false;
  }
}

module.exports = {
  wr_write: wr_write,
  wr_find: wr_find,
  wr_del: wr_del,
  wr_read: wr_read,
  cr_write: cr_write,
  cr_find: cr_find,
  cr_del: cr_del,
  cr_read: cr_read,
  lt_find: lt_find,
  lt_write: lt_write,
  clear: clear,
  fetchToCache: fetchToCache
};
