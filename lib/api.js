var child_process = require('child_process'),
	axon = require('axon'),
	_ = require('underscore'),
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

	this._forked = false;
	// forked
};

// ========================================
// these functions allow us to create a forked process so we can reconnect
// to the forked process and allow the existance of persistent irc clients

Api.prototype.fork = function(exit, options) {
	this.forked = true;

	var exit = exit || false,
		options = options || {incoming: 31930, outgoing: 31920},
		cp = child_process.spawn('node', [__dirname + '/fork'], {
		detached: true,
		env: _.extend(process.env, {
			INCOMING_PORT: options.incoming,
			OUTGOING_PORT: options.outgoing
		})
	});
	// fork the fork.js process which setups up a server to create a client on

	cp.on('error', function(err) {
		throw err;
	});

	cp.unref();
	// unref it so when this process dies, ^ that one stays open

	if (exit) {
		process.exit(0);
	}
	// have we been asked to exit?

	return cp;
};

Api.prototype.setupServer = function(options) {
	var self = this,
		options = options || {incoming: process.env.INCOMING_PORT, outgoing: process.env.OUTGOING_PORT};

	axon.codec.define('json', {
		encode: JSON.stringify,
		decode: JSON.parse
	});
	// setup a json codec

	this._outbound = axon.socket('push');
	this._outbound.bind(options.outgoing);
	this._outbound.format('json');
	// our outbound port is 31920
	// ON THEIR SIDE IT WILL BE INCOMING

	this._outbound.on('connect', function() {
		self.forked = true;
		self._outbound.send({event: 'synchronize', keys: _.keys(self._clients)});
	});
	// setup some events for our outbound port

	this._inbound = axon.socket('sub-emitter');
	this._inbound.bind(options.incoming);
	// we also setup an inbound socket which uses the sub emitter

	this._inbound.on('createClient', function(key, client, dummy) {
		var user = self.createClient(key, client, dummy || false);
		// create the client

		if (!user) {
			return false;
		}
		// bail

		self.unhookEvent([key, '*']);
		self.hookEvent(key, '*', function(object) {
			self._outbound.send({event: this.event, message: object});
		});
		// we're obviously using the rpc to create clients, so they don't
		// have an option to hook events, they just get the lot, and choose what they
		// wanna do with them on their incoming pipe
	});

	this._inbound.on('destroyClient', function(key) {
		self.destroyClient(key);
		// delete client

		self.unhookEvent([key, '*']);
		// delete the hook
	});

	this._inbound.on('call', function(key, call, params) {
		if (!(key in self._clients)) {
			return false;
		}
		// invalid key

		var client = self._clients[key];
		// get the client object

		if (!(call in client.irc)) {
			return false;
		}
		// property is undefined

		client.irc[call].call(client.irc, params);
		// call the function
	});
};

Api.prototype.connect = function(options) {
	this._forked = true;

	var interfaces = {
		incoming: axon.socket('pull'),
		outgoing: axon.socket('pub-emitter')
	};
	// create these so our end-user doesn't have to

	axon.codec.define('json', {
		encode: JSON.stringify,
		decode: JSON.parse
	});
	// setup a json codec

	interfaces.incoming.connect(options.incoming);
	interfaces.incoming.format('json');
	// setup our incoming connection

	interfaces.outgoing.connect(options.outgoing);
	// setup our outgoing connection

	return interfaces;
}
// ========================================

// ========================================
// the following functions let us manage clients by creating
// them, and destroying them

Api.prototype.createClient = function(key, object, dummy) {
	var dummy = dummy || false,
		socket = (dummy) ? readWriteStream : undefined;
	// we can create a dummy client with stub.js for testing purposes

	if (this._forked) {
		throw new Error('You are using api.prototype.createClient directly when you have a socket server setup, please use outgoing.emit() interface');
	}
	// tut tut

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

	return ret;
};

Api.prototype.destroyClient = function(key) {
	if (this._forked) {
		throw new Error('You are using api.prototype.destroyClient directly when you have a socket server setup, please use outgoing.emit() interface');
	}

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

	if (this._forked) {
		throw new Error('You are using api.prototype.hookEvent directly when you have a socket server setup, please use outgoing.emit() interface');
	}

	if (once) {
		Events.once([key, e], callback);
	} else {
		Events.off([key, e], callback);
		Events.on([key, e], callback);
	}
	// add the hook
};

Api.prototype.unhookEvent = function(key, e, callback) {
	if (this._forked) {
		throw new Error('You are using api.prototype.unhookEvent directly when you have a socket server setup, please use outgoing.emit() interface');
	}

	if (!callback) {
		Events.removeAllListeners([key, e]);
	} else {
		Events.off([key, e], callback);
	}
	// add the hook
};
// ========================================

exports.Api = Api;
exports.axon = axon;