var IrcSocket = require('simple-irc-socket'),
	IrcMessage = require('irc-message'),
	EventEmitter2 = require('eventemitter2').EventEmitter2,
	codes = require(__dirname + '/codes.js');
// include all our required libraries, the simple-irc-socket
// is from ircanywhere/simple-irc-socket and it's extended to include
// ssl support

var Events = new EventEmitter2({
	wildcard: true,
	maxListeners: 0
});
// we create an event emitter here, but only one, and use it for every irc client we initiate
// that way we don't have 2 event emitters for each client and use an insane amount of memory
// when we scale up to hundreds of clients, we use namespaces for individual clients

function Client(key, options, GenericSocket)
{
	var self = this,
		genericSocket = GenericSocket || undefined;
	
	self.connection = IrcSocket(options, genericSocket);
	self.options = options;
	self.supported = self._defaultSupported();
	self.key = key;

	self._capCount = 0;
	self._nickModifier = 0;
	self._cap = {};
	self._data = {
		user: {},
		channel: {},
		server: {}
	};
	// setup a bunch of variables to manage the state of the connection

	self.connection.connect();
	// connect the socket

	self.connection.once('ready', function () {
		//
	});

	self.connection.on('data', function (line) {
		var message = self._parse(line);
		console.log(line);

		if (message.command in self._ircEvents) {
			self._ircEvents[message.command].call(self, message);
		}
		// we were using a switch here but it's a bit grim
		// so we're storing the numerics as functions in _ircEvents and
		// calling the nessicary event
	});
};

// ========================================
// Setup an irc events object, using this over a switch, seems much cleaner
// the huge switch was something I hated about node-irc.

Client.prototype._ircEvents = {
	CAP: function(message) {
		var capabilities = message.args[2].trim().replace(/(?:^| )[\-~=]/, '').split(' '),
			enable = ['away-notify'];
		// which capabilities should we try to enable, for now just away notify, until others are supported

		if (this.options.sasl && this.options.password !== null) {
			// we check for sasl AND password, so we can let users put passwords in without
			// connecting via sasl, such as genuinely passworded ircds
			enable.push('sasl');
		}

		switch(message.args[1]) {
			case 'LS':
				this._cap = {};
				// reset the object, if we just store it in this, we might end up with repeat values on a reconnect

				this._cap.requested = [];
				for (var capab in capabilities) {
					if (enable.indexOf(capabilities[capab]) !== -1) {
						this._cap.requested.push(capabilities[capab]);
					}
				}
				// we need to figure out if we can enable any of the capabilities the server supports

				if (this._cap.requested.length == 0) {
					this.connection.raw(['CAP', 'END']);
					this._cap.handshake = false;
				} else {
					this.connection.raw(['CAP', 'REQ', this._cap.requested.join(' ')]);
					this._cap.handshake = true;
				}
				// here the server is going to tell us what capabilities it supports
				break;
			case 'ACK':
				if (capabilities.length > 0) {
					this._cap.enabled = capabilities;
					// these are the capabilities that are enabled

					if (this._cap.enabled.length > 0) {
						this._cap.sasl = true;
						this.connection.raw(['AUTHENTICATE', 'PLAIN']);
						// we need to figure out if this is SASL, if not
						// we're done and can close the handshake, below;
					} else {
						this.connection.raw(['CAP', 'END']);
						this._cap.handshake = false;
					}
				}
				break;
			case 'NAK':
				this.connection.raw(['CAP', 'END']);
				this._cap.handshake = false;
				// we've been denied the request, lets end.
				break;
		}
	},
	
	AUTHENTICATE: function(message) {
		if (message.args[0] == '+') {
			var username = this.options.saslUsername || this.nick,
				password = this.options.password,
				tmp = new Buffer(username + '\0' + username + '\0' + password).toString('base64');
			// encode the base64 hash to send to the server

			this.connection.raw(['AUTHENTICATE', tmp]);
			// we've got the go ahead to attempt to authenticate.
			// at the request of Techman (y) I've implemented the ability to sasl auth via
			// a different username unlike basically every client out there
			// we do this with this.options.saslUsername, if it's not present just use nickname
		} else {
			this.connection.raw(['CAP', 'END']);
			this._cap.handshake = false;
			this._cap.sasl = false;
		}
	},

	RPL_SASLAUTHENTICATED: function (message) {
		this.connection.raw(['CAP', 'END']);
		this._cap.handshake = false;
		this._cap.sasl = true;
	},

	RPL_SASLLOGGEDIN: function(message) {
		if (!this._cap.handshake) {
			this.connection.raw(['CAP', 'END']);
		}
	},

	ERR_SASLNOTAUTHORISED: function(message) {
		this.connection.raw(['CAP', 'END']);
		this._cap.handshake = false;
	},

	ERR_SASLNOTAUTHORISED: function(message) {
		this.connection.raw(['CAP', 'END']);
		this._cap.handshake = false;
	},

	RPL_WELCOME: function(message) {
		this._capCount = 0;
		this.nick = message.args[0];
		Events.emit([this.key, 'registered'], {'nickname': this.nick});
	},

	RPL_MYINFO: function(message) {
		this.supported.usermodes = message.args[3];
	},

	RPL_ISUPPORT: function(message) {
		this._capCount++;
		for (var argi in message.args) {
			var arg = message.args[argi],
				match;

			if (match = arg.match(/([A-Z]+)=(.*)/)) {
				var param = match[1];
				var value = match[2];
				switch (param) {
					case 'NETWORK':
						this.supported.name = value;
						break;
					case 'CHANLIMIT':
						var values = value.split(',');
						for (var vali in values) {
							var val = values[vali].split(':');
							this.supported.channel.limit[val[0]] = parseInt(val[1]);
						}
						break;
					case 'CHANMODES':
						value = value.split(',');
						var type = ['a', 'b', 'c', 'd'];
						for (var i = 0; i < type.length; i++) {
							this.supported.channel.modes[type[i]] += value[i];
						}
						break;
					case 'CHANTYPES':
						this.supported.channel.types = value;
						break;
					case 'CHANNELLEN':
						this.supported.channel.length = parseInt(value);
						break;
					case 'IDCHAN':
						var values = value.split(',');
						for (var vali in values) {
							var val = values[vali].split(':');
							this.supported.channel.idlength[val[0]] = val[1];
						}
						break;
					case 'KICKLEN':
						this.supported.kicklength = value;
						break;
					case 'MAXLIST':
						var values = value.split(',');
						for (var vali in values) {
							var val = values[vali].split(':');
							this.supported.maxlist[val[0]] = parseInt(val[1]);
						}
						break;
					case 'NICKLEN':
						this.supported.nicklength = parseInt(value);
						break;
					case 'PREFIX':
						if (match = value.match(/\((.*?)\)(.*)/)) {
							match[1] = match[1].split('');
							match[2] = match[2].split('');
							while (match[1].length) {
								this.supported.modeForPrefix[match[2][0]] = match[1][0];
								this.supported.channel.modes.b += match[1][0];
								this.supported.channel.prefixes += match[2][0];
								this.supported.prefixForMode[match[1].shift()] = match[2].shift();
							}
						}
						break;
					case 'STATUSMSG':
						break;
					case 'TARGMAX':
						var values = value.split(',');
						for (var vali in values) {
							var val = values[vali].split(':');
							val[1] = (!val[1]) ? 0 : parseInt(val[1]);
							this.supported.maxtargets[val[0]] = val[1];
						}
						break;
					case 'TOPICLEN':
						this.supported.topiclength = parseInt(value);
						break;
				}
			}
		}

		if (this._capCount == 3) {
			Events.emit([this.key, 'capabilities'], this.supported);
			this.supported = this._defaultSupported();
			this._capCount = 0;
		}
		// only emit capabilities on the third time round (when we're done)
	},

	ERR_NICKNAMEINUSE: function(message) {
		this._nickModifier++;
		var nickname = this.nick + this._nickModifier.toString();
		// create a new nickname

		this.connection.raw(['NICK', nickname]);
	},

	ERR_NOMOTD: function(message) {
		this.motd = message.args[1];
		Events.emit([this.key, 'motd'], this.motd);
	},

	RPL_ENDOFMOTD: function(message) {
		this.motd.push(message.args[1]);
		Events.emit([this.key, 'motd'], this.motd);
	},

	RPL_MOTDSTART: function(message) {
		this.motd = [message.args[1]];
	},

	RPL_MOTD: function(message) {
		this.motd.push(message.args[1]);
	},

	RPL_NAMREPLY: function(message) {
		this._addData('channel', message.args[2], 'names', message.args[3].split(/ +/));
	},

	RPL_ENDOFNAMES: function(message) {
		var target = message.args[1];

		Events.emit([this.key, 'names'], this._getData('channel', target));
		this._clearData('channel', target);
	},

	RPL_AWAY: function(message) {
		this._addData('user', message.args[1], 'away', message.args[2]);
	},

	RPL_WHOISUSER: function(message) {
		this._addData('user', message.args[1], 'username', message.args[2]);
		this._addData('user', message.args[1], 'hostname', message.args[3]);
		this._addData('user', message.args[1], 'realname', message.args[5]);
	},
	
	RPL_WHOISIDLE: function(message) {
		this._addData('user', message.args[1], 'idle', message.args[2]);
	},
	
	RPL_WHOISCHANNELS: function(message) {
		this._addData('user', message.args[1], 'channels', message.args[2].trim().split(/ +/));
	},
	
	RPL_WHOISSERVER: function(message) {
		var target = message.args[1];

		this._addData('user', target, 'server', message.args[2]);
		this._addData('user', target, 'serverinfo', message.args[3]);
	},
	
	RPL_WHOISMODES: function(message) {
		this._addData('user', message.args[1], 'modes', message.args[2])
	},
	
	RPL_WHOISHOST: function(message) {
		this._addData('user', message.args[1], 'host', message.args[2])
	},
	
	RPL_WHOISADMIN: function(message) {
		this._addData('user', message.args[1], 'operator', message.args[2]);
	},
	
	RPL_WHOISOPERATOR: function(message) {
		this._addData('user', message.args[1], 'operator', message.args[2]);
	},
	
	RPL_WHOISHELPOP: function(message) {
		this._addData('user', message.args[1], 'helpop', message.args[2]);
	},
	
	RPL_WHOISBOT: function(message) {
		this._addData('user', message.args[1], 'bot', message.args[2]);
	},
	
	RPL_WHOISSPECIAL: function(message) {
		this._addData('user', message.args[1], 'special', message.args[2]);
	},
	
	RPL_WHOISSECURE: function(message) {
		this._addData('user', message.args[1], 'secure', message.args[2]);
	},
	
	RPL_WHOISACCOUNT: function(message) {
		var target = message.args[1];

		this._addData('user', target, 'account', message.args[2]);
		this._addData('user', target, 'accountinfo', message.args[3]);
	},
	
	RPL_WHOISSECURE: function(message) {
		this._addData('user', message.args[1], 'secure', message.args[2]);
	},
	
	RPL_ENDOFWHOIS: function(message) {
		var target = message.args[1];

		Events.emit([this.key, 'whois'], this._getData('user', target));
		this._clearData('user', target);
	},

	RPL_WHOREPLY: function(message) {
		var target = message.args[1];

		this._addData('channel', target, 'who', [{
			channel: target,
			prefix: message.args[2] + '@' + message.args[3],
			nickname: message.args[5],
			mode: message.args[6],
			extra: message.args[7] || '',
		}]);
	},

	RPL_ENDOFWHO: function(message) {
		var target = message.args[1];

		Events.emit([this.key, 'who'], this._getData('channel', target));
		this._clearData('channel', target);
	},

	RPL_LISTSTART: function(message) {

	},

	RPL_LIST: function(message) {
		// XXX - Efficiently handle LIST
	},

	RPL_LISTEND: function(message) {

	},

	RPL_LINKS: function(message) {
		this._addData('server', message.args[0], 'links', [{
			server: message.args[1],
			link: message.args[2],
			description: message.args[3]
		}]);
	},

	RPL_ENDOFLINKS: function(message) {
		var target = message.args[0];

		Events.emit([this.key, 'links'], this._getData('server', target));
		this._clearData('server', target);
	},

	RPL_BANLIST: function(message) {
		var channel = message.args[1];

		this._addData('channel', channel, 'banlist', [{
			channel: channel,
			nickname: message.args[3],
			hostname: message.args[2],
            timestamp: message.args[4]
		}]);
	},

	RPL_ENDOFBANLIST: function(message) {
		var target = message.args[1];

		Events.emit([this.key, 'banlist'], this._getData('channel', target));
		this._clearData('channel', target);
	},

	RPL_INVITELIST: function(message) {
		var channel = message.args[1];

		this._addData('channel', channel, 'invitelist', [{
			channel: channel,
			nickname: message.args[3],
			hostname: message.args[2],
            timestamp: message.args[4]
		}]);
	},

	RPL_ENDOFINVITELIST: function(message) {
		Events.emit([this.key, 'invitelist'], this._getData('channel', target));
		this._clearData('channel', target);
	},

	RPL_EXCEPTLIST: function(message) {
		var channel = message.args[1];

		this._addData('channel', channel, 'exceptlist', [{
			channel: channel,
			nickname: message.args[3],
			hostname: message.args[2],
            timestamp: message.args[4]
		}]);
	},

	RPL_ENDOFEXCEPTLIST: function(message) {
		Events.emit([this.key, 'exceptlist'], this._getData('channel', target));
		this._clearData('channel', target);
	},

	RPL_QUIETLIST: function(message) {
		var channel = message.args[1];

		this._addData('channel', channel, 'quietlist', [{
			channel: channel,
			nickname: message.args[3],
			hostname: message.args[2],
            timestamp: message.args[4]
		}]);
	},

	RPL_ENDOFQUIETLIST: function(message) {
		Events.emit([this.key, 'quietlist'], this._getData('channel', target));
		this._clearData('channel', target);
	},

	RPL_TOPICWHOTIME: function(message) {
		var target = message.args[1];

		this._addData('channel', target, 'topicBy', message.args[2]);
		// set topic by, all the other stuff such as topic should be here aswell

		Events.emit([this.key, 'topic'], this._getData('channel', target));
		this._clearData('channel', target);
		// emit it and clear, we dont output directly cause we need to get properties from earlier
	},

	RPL_TOPIC: function(message) {
		this._addData('channel', message.args[1], 'topic', message.args[2]);
		// set the topic from RPL, usually on JOIN or TOPIC
		// we use _addChannelData because we need to store it temporarily between commands :3
	},

	RPL_NOTOPIC: function(message) {
		Events.emit([this.key, 'topic'], {'channel': message.args[0], 'topic': '', 'topicBy': ''});
	},

	TOPIC: function(message) {
		Events.emit([this.key, 'topic'], {'channel': message.args[0], 'topic': message.args[1], 'topicBy': message.nickname});
	},

	RPL_CHANNELMODEIS: function(message) {
		Events.emit([this.key, 'mode'], {'channel': message.args[1], 'mode': message.args.slice(2).join(' ')});
	},

	MODE: function(message) {
		var target = message.args[0],
			mode = message.args.slice(1).join(' ');

		if (target == this.nick || target == this.options.nick) {
			Events.emit([this.key, 'usermode'], {'nickname': target, 'mode': mode});
		} else {
			Events.emit([this.key, 'mode'], {'nickname': message.nickname, 'username': message.username, 'hostname': message.hostname, 'channel': target, 'mode': mode});
			this._clearData('channel', target);
		}
	},

	NICK: function(message) {
		if (message.nickname == this.nick)
			this.nick = message.args[0];
		// we've changed our own nick, update our internal record

		Events.emit([this.key, 'nick'], {'nickname': message.nickname, 'username': message.username, 'hostname': message.hostname, 'newnick': this.nick, });
	},

	JOIN: function(message) {
		Events.emit([this.key, 'join'], {'nickname': message.nickname, 'username': message.username, 'hostname': message.hostname, 'channel': message.args[0]});
		// our node-irc implementation did shit like, checking for netsplits
		// i'm not going to add this at the moment, cause it was touchy
	},

	PART: function(message) {
		Events.emit([this.key, 'part'], {'nickname': message.nickname, 'username': message.username, 'hostname': message.hostname, 'channel': message.args[0], 'message': message.args[1] || ''});
	},

	KICK: function(message) {
		Events.emit([this.key, 'kick'], {'nickname': message.nickname, 'username': message.username, 'hostname': message.hostname, 'kicked': message.args[1], 'channel': message.args[0], 'message': message.args[2] || ''});
	},

	QUIT: function(message) {
		Events.emit([this.key, 'quit'], {'nickname': message.nickname, 'username': message.username, 'hostname': message.hostname, 'message': message.args[0] || ''});
	},

	INVITE: function(message) {
		Events.emit([this.key, 'invite'], {'nickname': message.nickname, 'username': message.username, 'hostname': message.hostname, 'channel': message.args[1]});
	},

	NOTICE: function(message) {
		Events.emit([this.key, 'notice'], {'nickname': message.nickname, 'username': message.username, 'hostname': message.hostname, 'target': message.args[0], 'message': message.args[1]});
		// XXX - Handle ctcps
	},

	PRIVMSG: function(message) {
		var to = message.args[0],
			text = message.args[1];

		if (text[0] === '\1' && text.lastIndexOf('\1') > 0) {
			this._handleCTCP(message, text, 'PRIVMSG');
		} else {
			Events.emit([this.key, 'privmsg'], {'nickname': message.nickname, 'username': message.username, 'hostname': message.hostname, 'target': message.args[0], 'message': message.args[1]});
		}
		// ctcp or normal message?
	},
};
// ========================================

// ========================================
// Features supported by the server
// (initial values are RFC 1459 defaults. Zeros signify no default or unlimited value)

Client.prototype._defaultSupported = function() {
	return {
		channel: {
			idlength: {},
			length: 200,
			limit: {},
			modes: {
				a: '',
				b: '',
				c: '',
				d: ''
			},
			prefixes: '',
			types: '&#'
		},
		kicklength: 0,
		maxlist: {},
		maxtargets: {},
		modes: 3,
		modeForPrefix: {},
		prefixForMode: {},
		nicklength: 9,
		topiclength: 0,
		usermodes: '',
		name: ''
	};
};
// ========================================

// ========================================
// the following 3 functions are based on the ones from
// node-irc

Client.prototype._addData = function(type, name, key, value) {
	if (type == 'user') {
		var obj = {nickname: name};
	} else if (type == 'channel') {
		var obj = {channel: name};
	} else {
		var obj = {};
	}
	// create a default object template

	name = name.toLowerCase();

	this._data[type][name] = this._data[type][name] || obj;

	if (key in this._data[type][name] && Array.isArray(this._data[type][name][key]))
		this._data[type][name][key].push.apply(this._data[type][name][key], value);
	else
		this._data[type][name][key] = value;
    // we can merge objects together unlike node-irc by passing value in as an array
    // which can also have multiple objects in, to save us from looping, let V8 do the work.
};

Client.prototype._getData = function(type, name) {
	name = name.toLowerCase();
	return this._data[type][name];
};

Client.prototype._clearData = function(type, name) {
	name = name.toLowerCase();
	delete this._data[type][name];
};
// ========================================

// ========================================
// The below functions are utility functions which handle things like sending
// out a ctcp, handling incoming ctcps, things that simple-irc-socket can't and
// doesn't really need to do :)

Client.prototype._CTCPReply = function(to, type, text)
{
	this.connection.raw(['NOTICE', to.toUpperCase(), '\1' + type + ' ' + text + '\1']);
}

Client.prototype._handleCTCP = function (message, text, type)
{
	text = text.slice(1);
	text = text.slice(0, text.indexOf('\1'));

	var parts = text.split(/ +/),
		to = message.args[0];

	if (type === 'PRIVMSG' && parts[0].toUpperCase() === 'ACTION') {
		Events.emit([this.key, 'action'], {'nickname': from, 'username': message.username, 'hostname': message.hostname, 'target': to, 'message': parts.slice(1).join(' ')});
		// handle actions here
	} else if (type === 'PRIVMSG' && parts[0].toUpperCase() === 'VERSION') {
		Events.emit([this.key, 'ctcp'], {'nickname': from, 'username': message.username, 'hostname': message.hostname, 'type': 'VERSION', 'target': to});
		// handle versions here. We send this to the host and let them reply by sending
		// a ctcp reply back like so: Client._CTCPReply(to, 'VERSION', 'Awesomebot 1.0');
		// we prepend "; irc-factory 0.1.2" to the end in ctcpReply
	} else {
		Events.emit([this.key, 'ctcp'], {'nickname': from, 'username': message.username, 'hostname': message.hostname, 'target': to, 'type': parts[0].toUpperCase(), 'message': parts.slice(1).join(' ')});
		// handle all other ctcp requests
	}
}
// ========================================

// ========================================
// extend our IrcSocket to contain a function that will parse
// our line into a usable object with IrcMessage and will convert
// the numeric to a valid command

Client.prototype._parse = function(line) {
	var message = new IrcMessage(line);

	if (message.prefixIsUserHostmask()) {
		var hostmask = message.parseHostmask();
		message.nickname = hostmask.nickname;
		message.username = hostmask.username;
		message.hostname = hostmask.hostname;
	} else {
		message.server = message.prefix;
	}

	if (codes[message.command]) {
		message.command = codes[message.command];
	}

	return message;
};
// ========================================

exports.Events = Events;
exports.Client = Client;