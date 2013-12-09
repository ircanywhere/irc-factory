var irc = require(__dirname + '/irc'),
	readWriteStream = require(__dirname + '/stub.js').ReadWriteNetStream,
	Events = irc.Events,
	Client = irc.Client;

function Api() {
	this._keepOpen = false;
	this._clients = {};
	// an internal array to store our clients
};

// ========================================
// the following functions let us manage clients by creating
// them, and destroying them

Api.prototype.createClient = function(key, object, dummy) {
	var dummy = dummy || false,
		socket = (dummy) ? readWriteStream : undefined;
	// we can create a dummy client with stub.js for testing purposes

	if (key in this._clients) {
		return false;
	}
	// check if a client with this key exists, don't bother throwing, too risky to be
	// exiting the process over this sort of stuff.

	var ret = {
		key: key,
		options: object,
		dummy: dummy,
		irc: new Client(key, object, socket),
		events: {}
	};

	this._clients[key] = ret;

	if (dummy) {
		this._keepOpen;

		setInterval(function() {}, 3600000);
	}
	// we've been told to open a dummy so lets keep the script hanging around
	// XXX - not sure if this is a good approach tbh

	return ret;
};

Api.prototype.destroyClient = function(key) {
	if (!key in this._clients) {
		return false;
	}
	// no client exists, lets bail

	var client = this._clients[key];
	// find the client in our clients object

	client.irc.disconnect();
	// send a disconnect to be nice

	delete this._clients[key];
	// delete the object completely.

	return true;
};
// ========================================

// ========================================
// the following functions handle hooking onto events
// and unhooking them

Api.prototype.hookEvent = function(key, e, callback, once) {
	var once = once || false;
	// check for once at the end, if so only apply event once

	if (!key in this._clients) {
		return false;
	}
	// no client, just exit quietly

	var client = this._clients[key];
	// find the client in our clients object

	if (!once) {
		client.events[e] = callback;
	}
	// push an event to the array so we know how many we've got

	if (once) {
		Events.once([client.key, e], callback);
	} else {
		Events.on([client.key, e], callback);
	}
	// add the hook
};

Api.prototype.unhookEvent = function(key, e) {
	if (!key in this._clients) {
		return false;
	}
	// no client, just exit quietly

	var client = this._clients[key];
	// find the client in our clients object

	if (e in client.events) {
		delete client.events[e];
	}
	// delete the event if it exists, if it doesn't exist it's been pushed on once
	// so we'll never need to call unhookEvent()

	Events.off([client.key, e], callback);
	// add the hook
};
// ========================================

exports.api = new Api();
exports.events = Events;