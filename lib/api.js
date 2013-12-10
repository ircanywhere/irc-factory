var child_process = require('child_process'),
	axon = require('axon'),
	net = require('net'),
	irc = require(__dirname + '/irc'),
	readWriteStream = require(__dirname + '/stub.js').ReadWriteNetStream,
	Events = irc.Events,
	Client = irc.Client;

function Api() {
	this._keepOpen = false;
	this._clients = {};
	this._eventQueue = [];
	this._rpcClients = 0;
	// some internal settings
};

// ========================================
// these functions allow us to create a forked process so we can reconnect
// to the forked process and allow the existance of persistent irc clients

Api.prototype.fork = function(exit) {
	var exit = exit || false,
		cp = child_process.spawn('node', [__dirname + '/fork'], {
		detached: true,
		env: process.env
	});
	// fork the fork.js process which setups up a server to create a client on

	cp.unref();
	// unref it so when this process dies, ^ that one stays open

	if (exit) {
		process.exit(0);
	}
	// have we been asked to exit?

	return cp;
};

Api.prototype.setupServer = function(options) {
	var self = this;

	axon.codec.define('json', {
		encode: JSON.stringify,
		decode: JSON.parse
	});
	// setup a json codec

	this._outbound = axon.socket('push');
	this._outbound.bind(31920);
	this._outbound.format('json');
	// our outbound port is 31920

	this._inbound = axon.socket('sub-emitter');
	this._inbound.bind(31930);
	// we also setup an inbound socket which uses the sub emitter

	this._inbound.on('createClient', function(options) {
		if (!options.key || !options.client) {
			return false;
		}
		// checking the incoming options, we need a key and an object

		var user = self.createClient(options.key, options.client, options.dummy || false);
		// create the client

		self.hookEvent(options.key, '*', function(object) {
			self._outbound.send({event: this.event, message: object});
		});
		// we're obviously using the rpc to create clients, so they don't
		// have an option to hook events, they just get the lot, and choose what they
		// wanna do with them on their incoming pipe
	});

	this._inbound.on('destroyClient', function(options) {
		if (!options.key) {
			return false;
		}
		// checking the incoming options, we need a key

		self.destroyClient(options.key);
		// delete client

		self.unhookEvent([options.key, '*']);
		// delete the hook
	});
};
// ========================================

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
		this._keepOpen = true;
	}
	// we've been told to open a dummy so lets keep the script hanging around
	// XXX - not sure if this is a good approach tbh - needs finished properly

	return ret;
};

Api.prototype.destroyClient = function(key) {
	if (!(key in this._clients)) {
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

	if (once) {
		Events.once([key, e], callback);
	} else {
		Events.off([key, e], callback);
		Events.on([key, e], callback);
	}
	// add the hook
};

Api.prototype.unhookEvent = function(key, e, callback) {
	if (!callback) {
		Events.removeAllListeners([key, e]);
	} else {
		Events.off([key, e], callback);
	}
	// add the hook
};
// ========================================

exports.Api = Api;