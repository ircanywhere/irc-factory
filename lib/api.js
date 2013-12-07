var irc = require(__dirname + '/irc'),
	stub = require(__dirname + '/stub.js'),
	streamer = require(__dirname + '/streamer.js'),
	Events = irc.Events,
	Client = irc.Client;

function Api() {
	this._clients = {};
	// an internal array to store our clients
};

// ========================================
// the following functions let us manage clients by creating
// them, and destroying them

Api.prototype.createClient = function(key, object, dummy) {
	var dummy = dummy || false,
		socket = (dummy) ? stub.Socket : undefined;
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

	};

	this._clients[key] = new Client(key, object, socket);

	
};
// ========================================

exports.api = new Api();
exports.events = Events;