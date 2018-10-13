const dbmongo = require('./dbmongo');
const cache = require('./dbcache');
var cacheReady = false;
var mongo_private = null;

var init = function(mongo_) {
	if (mongo_) mongo_private = mongo_;
	cache.fetchToCache(mongo_private, function(ok) {
		if (ok) {
			cacheReady = true;
			delete mongo_private;
		} else {
			setTimeout(init, 10000);
		}
	})
}

module.exports = {
	init: init,
	initMongo: dbmongo.init,
	cacheReady: cacheReady,

	writeToWaitRoom: function(mongo, id, gender) {
		dbmongo.writeToWaitRoom(mongo, id, gender);
		var d = new Date();
		cache.wr_write(id, gender, d.getTime());
	},

	findInWaitRoom: function(mongo, id, callback) {
		if (cacheReady) {
			cache.wr_find(id, callback)
		} else {
			dbmongo.findInWaitRoom(mongo, id, callback)
		}
	},

	deleteFromWaitRoom: function(mongo, id) {
		dbmongo.deleteFromWaitRoom(mongo, id);
		cache.wr_del(id);
	},

	getListWaitRoom: function(mongo, callback) {
		if (cacheReady) {
			cache.wr_read(callback);
		} else {
			dbmongo.getListWaitRoom(mongo, callback);
		}
	},

	// chatroom tools
	writeToChatRoom: function(mongo, id1, id2, gender1, gender2, isWantedGender) {
		dbmongo.writeToChatRoom(mongo, id1, id2, gender1, gender2, isWantedGender);
		var d = new Date();
		cache.cr_write(id1, id2, gender1, gender2, isWantedGender, d.getTime());
	},

	// callback(id, haveToReview, role, data);
	findPartnerChatRoom: function(mongo, id, callback) {
		if (cacheReady) {
			cache.cr_find(id, callback)
		} else {
			dbmongo.findPartnerChatRoom(mongo, id, callback)
		}
	},

	deleteFromChatRoom: function(mongo, id, callback) {
		if (cacheReady) {
			dbmongo.deleteFromChatRoom(mongo, id, function(){});
			cache.cr_del(id, callback);
		} else {
			dbmongo.deleteFromChatRoom(mongo, id, callback);
			cache.cr_del(id, function(){});
		}
	},

	getListChatRoom: function(mongo, callback) {
		if (cacheReady) {
			cache.cr_read(callback);
		} else {
			dbmongo.getListChatRoom(mongo, callback)
		}
	},

	// LAST TALK
	findInLastTalk: function(mongo, id1, id2) {
		if (cacheReady) {
			return cache.lt_find(id1, id2);
		} else {
			return dbmongo.findInLastTalk(mongo, id1, id2);
		}
	},

	updateLastTalk: function(mongo, id1, id2) {
		dbmongo.updateLastTalk(mongo, id1, id2);
		dbmongo.updateLastTalk(mongo, id2, id1);
		cache.lt_write(id1, id2);
		cache.lt_write(id2, id1);
	},

	getStats: function() {
		var temp = cache.getStats();
		temp.cacheReady = cacheReady;
		return temp;
	},

	dropDatabase: function() {
		dbmongo.dropDatabase();
		cache.clear();
	}
};
