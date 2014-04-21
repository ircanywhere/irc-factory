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
		key = ircObject.key;

	if (key === '') {
		return false;
	}

	if (!this.lists[key]) {
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

	clearTimeout(this.lists[key].deleteTimer);
	this.lists[key].deleteTimer = setTimeout(function() {
		delete self.lists[key];
	}, 600000);
	// lets set a timer to trash this data if its not been requested in a while (10min)
	// the only reason we cache it is to prevent people doing /list then /list, then /list
	// and blocking the process
};

ListCache.prototype.filterList = function(ircObject, search, page, limit) {
	var key = ircObject.key,
		regex = new RegExp('(' + search + ')', 'i'),
		list = this.lists[key];

	if (key === '' || !list) {
		return false;
	}
	// make sure the list exists

	var output = {
		list: [],
		raw: [],
		search: search.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\$&").replace(/\(\.\*\)/g, '*'),
		page: page,
		limit: limit,
		time: new Date()
	};

	var clone = _.cloneDeep(list.list);
	var buffer = _.sortBy(clone, function(channel) {
		return 0 - channel.users;
	});
	// sort it

	buffer = _.filter(buffer, function(channel) {
		return regex.test(channel.channel);
	});
	// filter via the search parameters

	buffer = _.take(_.rest(buffer, (page - 1) * limit), limit);
	// paginate

	for (var c in buffer) {
		var channel = buffer[c];
		output.raw.push(channel.raw);
		delete buffer[c].raw;
	}
	// i don't really like this, but we pull .raw from channel objects
	// and push it into the output

	Events.emit([ircObject.key, 'list'], _.extend(output, {
		list: buffer
	}));
	// emit the list event
};

ListCache.prototype.createList = function(ircObject) {
	var key = ircObject.key;
	if (key === '' || this.lists[key]) {
		return false;
	}

	this.lists[key] = {
		key: key,
		requestedAt: new Date(),
		deleteTimer: null,
		list: []
	};
};

ListCache.prototype.insertListData = function(ircObject, message) {
	var key = ircObject.key;
	if (key !== '' && !this.lists[key]) {
		this.createList(key);
	}

	this.lists[key].list.push({
		channel: message.params[1],
		users: message.params[2],
		topic: message.params[3],
		raw: message.raw
	});
};
// ========================================

exports.ListCache = new ListCache();