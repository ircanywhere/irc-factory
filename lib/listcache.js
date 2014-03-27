var _ = require('lodash'),
	Events = require(__dirname + '/irc').Events;

function ListCache() {
	this.lists = {};
};

// ========================================
// this object manages list caching, in a normal single client
// scenario, grabbing the list on request is fine, but irc-factory
// isnt really designed for single client usage
// the ircanywhere use case requires lists to be available to all, for
// all networks.

ListCache.prototype.requestList = function(ircObject, params) {
	if (!Events) {
		Events = require(__dirname + '/irc').Events;
	}

	var self = this,
		name = ircObject.supported.network.name.toLowerCase();
	if (name === '') {
		return false;
	}

	if (!this.lists[name]) {
		this.createList(ircObject);
		ircObject.raw(['LIST', params]);
		// no cache is available? request one
	} else {
		Events.emit([ircObject.key, 'list'], this.returnList(ircObject));
		// looks like we already have a cached list
	}

	clearTimeout(this.lists[name].deleteTimer);
	this.lists[name].deleteTimer = setTimeout(function() {
		delete self.lists[name];
	}, 7200000);
	// lets set a timer to trash this data if its not been requested in a while (2hrs)
};

ListCache.prototype.returnList = function(ircObject) {
	var name = ircObject.supported.network.name.toLowerCase();
	if (name === '' || !this.lists[name]) {
		return false;
	}

	return this.lists[name];
};

ListCache.prototype.createList = function(ircObject) {
	var name = ircObject.supported.network.name.toLowerCase();
	if (name === '' || this.lists[name]) {
		return false;
	}

	this.lists[name] = {
		name: name,
		requestedAt: new Date(),
		deleteTimer: null,
		list: []
	};
};

ListCache.prototype.insertListData = function(ircObject, message) {
	var name = ircObject.supported.network.name.toLowerCase();
	if (name !== '' && !this.lists[name]) {
		this.createList(name);
	}

	this.lists[name].list.push({
		channel: message.params[1],
		users: message.params[2],
		topic: message.params[3]
	});
};
// ========================================

exports.ListCache = new ListCache();