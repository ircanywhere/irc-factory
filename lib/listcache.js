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

ListCache.prototype.requestList = function(ircObject, search, page, limit) {
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
		ircObject.raw(['LIST']);
		
		Events.once([ircObject.key, 'listend'], function() {
			self.filterList(ircObject, search, page, limit);
		});
		// no cache is available? request one and wait to filter it
	} else {
		self.filterList(ircObject, search, page, limit);
		// looks like we already have a cached list, pass it straight to filter
	}

	clearTimeout(this.lists[name].deleteTimer);
	this.lists[name].deleteTimer = setTimeout(function() {
		delete self.lists[name];
	}, 7200000);
	// lets set a timer to trash this data if its not been requested in a while (2hrs)
};

ListCache.prototype.returnList = function(ircObject) {
	return this.lists[name];
};

ListCache.prototype.filterList = function(ircObject, search, page, limit) {
	var name = ircObject.supported.network.name.toLowerCase(),
		regex = new RegExp('(' + search + ')', 'i'),
		list = this.lists[name];

	if (name === '' || !list) {
		return false;
	}
	// make sure the list exists

	var buffer = _.sortBy(list.list, function(channel) {
		return 0 - channel.users;
	});
	// sort it

	// XXX - filter out +Ops modes (and any others)

	buffer = _.filter(buffer, function(channel) {
		return regex.test(channel.channel);
	});
	// filter via the search parameters

	buffer = _.take(_.rest(buffer, (page - 1) * limit), limit);
	// paginate

	Events.emit([ircObject.key, 'list'], buffer);
	// emit the list event
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