'use strict';

const HashTable = require('hashtable');

var waitroom = new HashTable();
waitroom.max_load_factor(10);
waitroom.rehash(5);

var pair1 = new HashTable();
pair1.max_load_factor(10);
pair1.rehash(100);

var pair2 = new HashTable();
pair2.max_load_factor(10);
pair2.rehash(100);

var lasttalk = new HashTable();
lasttalk.max_load_factor(10);
lasttalk.rehash(100);

var Partner1 = function(partner, mygender, partner_gender, genderok, starttime) {
	this.partner = '' + partner;
	this.mygender = mygender;
	this.partner_gender = partner_gender;
	this.genderok = genderok;
	this.starttime = starttime;
}

var Partner2 = function(partner, mygender, partner_gender, genderok, starttime) {
	this.partner = '' + partner;
	this.mygender = mygender;
	this.partner_gender = partner_gender;
	this.genderok = genderok;
	this.starttime = starttime;
}

var wr_write = (id, gender, time) => {
	waitroom.put('' + id, {gender: gender, time: time});
}

var wr_find = (id, callback) => {
	if (waitroom.has('' + id)) {
		callback(true);
	} else {
		callback(false);
	}
}

var wr_del = id => {
	waitroom.remove('' + id);
}

var wr_read = callback => {
	let ids = []; let genders = []; let time = [];
	let db = shuffle(waitroom.keys());
	for (let i = 0; i < db.length; i++) {
		ids.push(db[i]);
		let temp = waitroom.get(db[i]);
		genders.push(temp.gender);
		time.push(temp.time);
	}
	callback(ids, genders, time);
}

var cr_write = (id1, id2, gender1, gender2, isWantedGender, starttime) => {
	var genderok = isWantedGender ? 1 : 0;
	pair1.put('' + id1, new Partner1(id2, gender1, gender2, genderok, starttime));
	pair2.put('' + id2, new Partner2(id1, gender2, gender1, genderok, starttime));
}

var cr_find = (id, callback) => {
	id = '' + id;
	var temp = findInCR(id, pair1, 1);
	if (temp != null) {
		callback(temp[0], temp[1], temp[2]);
	} else {
		temp = findInCR(id, pair2, 2);
		if (temp != null) {
			callback(temp[0], temp[1], temp[2]);
		} else {
			callback(null, 1, {});
		}
	}
}

var cr_del = (id, callback) => {
	if (pair1.has('' + id)) {
		var temp = pair1.get('' + id);
		pair2.remove(temp.partner);
		pair1.remove('' + id);
	} else if (pair2.has('' + id)) {
		var temp = pair2.get('' + id);
		pair1.remove(temp.partner);
		pair2.remove('' + id);
	}
	callback();
}

function findInCR(id, cr, number) {
	if (cr.has(id)) {
		var temp = cr.get(id);
		return [temp.partner, number, temp];
	} else {
		return null;
	}
}

var cr_read = callback => {
	var ret = [];
	var db = pair1.keys();
	for (var i = 0; i < db.length; i++) {
		var temp = pair1.get(db[i]);
		ret.push({'id1': db[i], 'id2': temp.partner, 'gender1': temp.mygender, 'gender2': temp.partner_gender, 'genderok': temp.genderok, 'starttime': temp.starttime});
	}
	callback(ret);
}

var lt_find = (id1, id2) => {
	id1 = id1 + '' ; id2 = id2 + '';
	if (lasttalk.has(id1)) {
		return (lasttalk.get(id1) === id2);
	}
}

var lt_write = (id1, id2) => {
	lasttalk.put('' + id1, '' + id2);
}

var fetchToCache = (mongo, callback) => {
	mongo.conn.collection('chatroom').find().toArray((err, results) => {
		if (err) {
			console.log(err);
			callback(false);
		} else {
			results.forEach((item, index) => {
				cr_write(item.id1, item.id2, item.gender1, item.gender2, item.genderok, item.starttime);
			});
			mongo.conn.collection('waitroom').find().toArray((err1, results1) => {
				if (err1) {
					console.log(err1);
					callback(false);
				} else {
					results1.forEach(item => {
						wr_write(item.uid, item.gender, item.time);
					});
					mongo.conn.collection('lasttalk').find().toArray((err2, results2) => {
						if (err2) {
							console.log(err2);
							callback(false);
						} else {
							results2.forEach(item => {
								lt_write(item.uid, item.partner);
							});
							callback(true);
						}
					});
				}
			});
		}
	});
}

var clear = () => {
	waitroom.clear();
	pair1.clear();
	pair2.clear();
	lasttalk.clear();
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
	fetchToCache: fetchToCache,
	clear: clear
};

function shuffle(array) {
	var m = array.length, t, i;
	while (m) {
		i = Math.floor(Math.random() * m--);
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
	return array;
}
