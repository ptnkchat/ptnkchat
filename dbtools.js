'use strict';

const dbmongo = require('./dbmongo');
const cache = require('./dbcache');
var cacheReady = false;

var init = (mongo) => {
	cache.fetchToCache(mongo, ok => {
		if (ok) {
			cacheReady = true;
		} else {
			setTimeout(() => init(mongo), 1000);
		}
	})
}

module.exports = {
	init: init,
	initMongo: dbmongo.init,
	cacheReady: cacheReady,

	writeToWaitRoom: (mongo, id, gender) => {
		dbmongo.writeToWaitRoom(mongo, id, gender);
		let d = new Date();
		cache.wr_write(id, gender, d.getTime());
	},

	findInWaitRoom: (mongo, id, callback) => {
		if (cacheReady) {
			cache.wr_find(id, callback)
		} else {
			dbmongo.findInWaitRoom(mongo, id, callback)
		}
	},

	deleteFromWaitRoom: (mongo, id) => {
		dbmongo.deleteFromWaitRoom(mongo, id);
		cache.wr_del(id);
	},

	getListWaitRoom: (mongo, callback) => {
		if (cacheReady) {
			cache.wr_read(callback);
		} else {
			dbmongo.getListWaitRoom(mongo, callback);
		}
	},

	// chatroom tools
	writeToChatRoom: (mongo, id1, id2, gender1, gender2, isWantedGender) => {
		dbmongo.writeToChatRoom(mongo, id1, id2, gender1, gender2, isWantedGender);
		let d = new Date();
		cache.cr_write(id1, id2, gender1, gender2, isWantedGender, d.getTime());
	},

	// callback(id, role, data);
	findPartnerChatRoom: (mongo, id, callback) => {
		if (cacheReady) {
			cache.cr_find(id, callback)
		} else {
			dbmongo.findPartnerChatRoom(mongo, id, callback)
		}
	},

	deleteFromChatRoom: (mongo, id, callback) => {
		if (cacheReady) {
			dbmongo.deleteFromChatRoom(mongo, id, () => {});
			cache.cr_del(id, callback);
		} else {
			dbmongo.deleteFromChatRoom(mongo, id, callback);
			cache.cr_del(id, () => {});
		}
	},

	getListChatRoom: (mongo, callback) => {
		if (cacheReady) {
			cache.cr_read(callback);
		} else {
			dbmongo.getListChatRoom(mongo, callback)
		}
	},

	// LAST TALK
	findInLastTalk: (mongo, id1, id2) => {
		if (cacheReady) {
			return cache.lt_find(id1, id2);
		} else {
			return dbmongo.findInLastTalk(mongo, id1, id2);
		}
	},

	updateLastTalk: (mongo, id1, id2) => {
		dbmongo.updateLastTalk(mongo, id1, id2);
		dbmongo.updateLastTalk(mongo, id2, id1);
		cache.lt_write(id1, id2);
		cache.lt_write(id2, id1);
	},

	dropDatabase: () => {
		dbmongo.dropDatabase();
		cache.clear();
	}
};
