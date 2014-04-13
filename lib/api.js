var child_process = {},
	axon = require('axon'),
	_ = require('lodash'),
	QueuePool = require(__dirname + '/queuepool').QueuePool,
	irc = require(__dirname + '/irc'),
	readWriteStream = require(__dirname + '/stub.js').ReadWriteNetStream,
	Events = irc.Events,
	Client = irc.Client,
	Clients = {};

function Api() {
	var self = this;

	this._keepOpen = false;
	this._eventQueue = [];
	this._rpcClients = 0;
	// some internal settings

	process.on('uncaughtException', function(err) {
		self.emit('uncaughtException', {message: JSON.stringify(err)});
		process.exit(0);
	});
};

// ========================================
// these functions allow us to create a forked process so we can reconnect
// to the forked process and allow the existance of persistent irc clients

Api.prototype.fork = function(exit, options) {
	child_process = require('child_process');

	var exit = exit || false,
		options = options || {rpc: 31930, events: 31920},
		cp = child_process.spawn('node', [__dirname + '/fork'], {
			detached: true,
			env: _.extend(process.env, {
				EVENTS_PORT: options.events,
				RPC_PORT: options.rpc
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
	var self = this;

	axon.codec.define('json', {
		encode: JSON.stringify,
		decode: JSON.parse
	});
	// setup a json codec

	this._events = axon.socket('push');
	this._events.bind(options.events);
	this._events.format('json');
	// setup the events socket

	this._events.on('connect', function() {
		self.emit('synchronize', {keys: _.keys(Clients)});
	});
	// setup some events for our outbound port

	this._rpc = axon.socket('sub-emitter');
	this._rpc.bind(options.rpc);
	// we also setup an inbound socket which uses the sub emitter

	this._rpc.on('createClient', function(key, client, dummy) {
		self.unhookEvent(key, '*');
		// do this first

		var user = self.createClient(key, client, dummy || false);
		// create the client

		if (!user) {
			return false;
		}
		// bail

		self.hookEvent(key, '*', function(object) {
			self.emit(this.event, {message: object});
		});
		// we're obviously using the rpc to create clients, so they don't
		// have an option to hook events, they just get the lot, and choose what they
		// wanna do with them on their incoming pipe
	});

	this._rpc.on('destroyClient', function(key) {
		self.destroyClient(key);
		// delete client
	});

	this._rpc.on('call', function(key, call, params) {
		if (!_.has(Clients, key)) {
			return false;
		}

		var client = Clients[key];
		// get the client object

		if (!_.has(Client.prototype, call)) {
			return false;
		}
		// property is undefined

		if (_.isArray(params)) {
			Client.prototype[call].apply(client.irc, params);
		} else {
			Client.prototype[call].call(client.irc, params);
		}
		// call the function
	});
};

Api.prototype.connect = function(options) {
	var self = this,
		interfaces = {
			events: axon.socket('pull'),
			rpc: axon.socket('pub-emitter')
		};
	// create these so our end-user doesn't have to

	axon.codec.define('json', {
		encode: JSON.stringify,
		decode: JSON.parse
	});
	// setup a json codec

	interfaces.rpc.connect(options.rpc);
	// setup our outgoing connection

	interfaces.events.connect(options.events);
	interfaces.events.format('json');
	// setup our incoming connection

	if (!options.automaticSetup) {
		return interfaces;
	}
	// just return interfaces if handleErrors is false

	interfaces.events.on('socket error', function(e) {
		if (e.syscall === 'connect' && e.code === 'ECONNREFUSED') {
			if (options.fork) {
				self.fork(false, options);
			} else {
				self.setupServer(options);
			}
		}
	});
	// socket error, host probably isn't setup, fork it

	return interfaces;
}

Api.prototype.emit = function(event, data) {
	if (this._events) {
		this._events.send(_.extend({event: event}, data));
	} else {
		Events.emit(event, data);
	}
}
// ========================================

// ========================================
// the following functions let us manage clients by creating
// them, and destroying them

Api.prototype.createClient = function(key, object, dummy) {
	var self = this,
		dummy = dummy || false,
		socket = (dummy) ? readWriteStream : undefined;
	// we can create a dummy client with stub.js for testing purposes

	if (_.has(Clients, key)) {
		return false;
	}
	// check if a client with this key exists, don't bother throwing, too risky to be
	// exiting the process over this sort of stuff.

	Clients[key] = {
		key: key,
		options: object,
		dummy: dummy,
		irc: new Client(key, object, socket),
		events: {}
	};

	this.hookEvent(key, 'failed', function(message) {
		self.destroyClient(key);
	});
	// hook onto a failed event and destroy the client

	this.hookEvent(key, 'throttled', function(message) {
		QueuePool.queuePause(object.server);
	});
	// hook onto a throttling event

	return Clients[key];
};

Api.prototype.destroyClient = function(key) {
	if (!_.has(Clients, key)) {
		return false;
	}
	// no client exists, lets bail

	Clients[key].irc.disconnect();
	// send a disconnect to be nice

	delete Clients[key].irc;
	delete Clients[key];

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

Error.prototype.toJSON = function () {
	var json =  {};
	Object.getOwnPropertyNames(this).forEach(addToJSON, this);
	return json;

	function addToJSON(name) {
		var pd = Object.getOwnPropertyDescriptor(this, name);
		pd.enumerable = true;
		Object.defineProperty(json, name, pd);
	}
}

exports.Api = Api;
exports.axon = axon;