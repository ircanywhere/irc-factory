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
		connection = IrcSocket(options, genericSocket);

	self.options = options;
	self.supported = self._defaultSupported();
	self.key = key;
	self.capCount = 0;
	self.nickModifier = 0;
	self._channelData = {};
	self._whoisData = {};
	// setup a bunch of variables to manage the state of the connection

	connection.connect();
	// connect the socket

	connection.once('ready', function () {
		connection.raw('JOIN #ircanywhere-test');
		connection.raw('MODE #ircanywhere-test');
	});

	connection.on('data', function (line) {
		var message = self._parse(line);
		//console.log(line);

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
	'RPL_WELCOME': function(message) {
		this.capCount = 0;
		this.nick = message.args[0];
		Events.emit([this.key, 'registered'], {nick: this.nick});
	},

	'RPL_MYINFO': function(message) {
		this.supported.usermodes = message.args[3];
	},

	'RPL_ISUPPORT': function(message) {
		this.capCount++;
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

		if (this.capCount == 3) {
			Events.emit([this.key, 'capabilities'], this.supported);
			this.supported = this._defaultSupported();
		}
		// only emit capabilities on the third time round (when we're done)
	},

	'ERR_NICKNAMEINUSE': function(message) {
		this.nickModifier++;
		var nickname = this.nick + this.nickModifier.toString();
		// create a new nickname

		this.raw(['NICK', nickname]);
	},

	'ERR_NOMOTD': function(message) {
		this.motd = message.args[1];
		Events.emit([this.key, 'motd'], this.motd);
	},

	'RPL_ENDOFMOTD': function(message) {
		this.motd.push(message.args[1]);
		Events.emit([this.key, 'motd'], this.motd);
	},

	'RPL_MOTDSTART': function(message) {
		this.motd = [message.args[1]];
	},

	'RPL_MOTD': function(message) {
		this.motd.push(message.args[1]);
	},

	'RPL_NAMREPLY': function(message) {
		this._addChannelData(message.args[2], 'names', message.args[3].split(' '));
	},

	'RPL_ENDOFNAMES': function(message) {
		var target = message.args[1];

		Events.emit([this.key, 'names'], this._getChannelData(target));
		this._clearChannelData(target);
	},

	'RPL_AWAY': function(message) {
		this._addWhoisData(message.args[1], 'away', message.args[2]);
	},

	'RPL_WHOISUSER': function(message) {
		this._addWhoisData(message.args[1], 'user', message.args[2]);
		this._addWhoisData(message.args[1], 'host', message.args[3]);
		this._addWhoisData(message.args[1], 'realname', message.args[5]);
	},
	
	'RPL_WHOISIDLE': function(message) {
		this._addWhoisData(message.args[1], 'idle', message.args[2]);
	},
	
	'RPL_WHOISCHANNELS': function(message) {
		this._addWhoisData(message.args[1], 'channels', message.args[2].trim().split(/\s+/)); // XXX - clean this up?
	},
	
	'RPL_WHOISSERVER': function(message) {
		var target = message.args[1];

		this._addWhoisData(target, 'server', message.args[2]);
		this._addWhoisData(target, 'serverinfo', message.args[3]);
	},
	
	'RPL_WHOISMODES': function(message) {
		this._addWhoisData(message.args[1], 'modes', message.args[2])
	},
	
	'RPL_WHOISHOST': function(message) {
		this._addWhoisData(message.args[1], 'host', message.args[2])
	},
	
	'RPL_WHOISADMIN': function(message) {
		this._addWhoisData(message.args[1], 'operator', message.args[2]);
	},
	
	'RPL_WHOISOPERATOR': function(message) {
		this._addWhoisData(message.args[1], 'operator', message.args[2]);
	},
	
	'RPL_WHOISHELPOP': function(message) {
		this._addWhoisData(message.args[1], 'helpop', message.args[2]);
	},
	
	'RPL_WHOISBOT': function(message) {
		this._addWhoisData(message.args[1], 'bot', message.args[2]);
	},
	
	'RPL_WHOISSPECIAL': function(message) {
		this._addWhoisData(message.args[1], 'special', message.args[2]);
	},
	
	'RPL_WHOISSECURE': function(message) {
		this._addWhoisData(message.args[1], 'secure', message.args[2]);
	},
	
	'RPL_WHOISACCOUNT': function(message) {
		var target = message.args[1];

		this._addWhoisData(target, 'account', message.args[2]);
		this._addWhoisData(target, 'accountinfo', message.args[3]);
	},
	
	'RPL_WHOISSECURE': function(message) {
		this._addWhoisData(message.args[1], 'secure', message.args[2]);
	},
	
	'RPL_ENDOFWHOIS': function(message) {
		var target = message.args[1];

		Events.emit([this.key, 'whois'], this._getWhoisData(target));
		this._clearWhoisData(target);
	},

	'RPL_WHOREPLY': function(message) {
		var target = message.args[1],
			whoObject = {
			chan: target,
			prefix: message.args[2] + '@' + message.args[3],
			nick: message.args[5],
			mode: message.args[6],
			extra: message.args[7] || '',
		}

		this._addChannelData(target, 'who', [whoObject]);
	},

	'RPL_ENDOFWHO': function(message) {
		var target = message.args[1];

		Events.emit([this.key, 'who'], this._getChannelData(target));
		this._clearChannelData(target);
	},

	'RPL_TOPICWHOTIME': function(message) {
		var target = message.args[1];

		this._addChannelData(target, 'topicBy', message.args[2]);
		// set topic by, all the other shit should be here aswell
		Events.emit([this.key, 'topic'], this._getChannelData(target));
		this._clearChannelData(target);
		// emit it and clear
	},

	'RPL_TOPIC': function(message) {
		this._addChannelData(message.args[1], 'topic', message.args[2]);
		// set the topic from RPL, usually on JOIN or TOPIC
	},

	'TOPIC': function(message) {
		var target = message.args[0];

		this._addChannelData(target, 'topic', message.args[1]);
		this._addChannelData(target, 'topicBy', message.nickname);
		// set topic by, all the other shit should be here aswell
		Events.emit([this.key, 'topic'], this._getChannelData(target));
		this._clearChannelData(target);
		// someone has set a new topic it seems
	},

	'RPL_CHANNELMODEIS': function(message) {
		var target = message.args[1];

		this._addChannelData(target, 'mode', message.args.slice(2).join(' '));
		// add the mode to the channel record
		Events.emit([this.key, 'mode'], this._getChannelData(target));
		this._clearChannelData(target);
		// emit the mode usually when we doe "/mode #channel"
	},

	'MODE': function(message) {
		var target = message.args[0],
			mode = message.args.slice(1).join(' ');

		if (target == this.nick || target == this.options.nick) {
			this._addWhoisData(target, 'mode', mode);
			Events.emit([this.key, 'usermode'], this._getWhoisData(target));
			this._clearWhoisData(target);
			// we're dealing with a user mode, specifically ours
		} else {
			this._addChannelData(target, 'mode', mode);
			this._addChannelData(target, 'modeBy', message.nickname);
			Events.emit([this.key, 'mode'], this._getChannelData(target));
			this._clearChannelData(target);
			// channel mode
		}
	}
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
// the following 3 functions are taken from
// node-irc, although I'm not a fan of much
// of this code it seems to be the best way

Client.prototype._addWhoisData = function (nick, key, value) {
	nick = nick.toLowerCase();

	this._whoisData[nick] = this._whoisData[nick] || {
		nick: nick
	};

	this._whoisData[nick][key] = value;
};

Client.prototype._getWhoisData = function (_nick) {
	var nick = _nick.toLowerCase();
	return this._whoisData[nick];
};

Client.prototype._clearWhoisData = function (nick) {
	nick = nick.toLowerCase();
	delete this._whoisData[nick];
};
// ========================================

// ========================================
// the following 2 functions are based on _addWhoisData from
// node-irc and are for channel data, it creates and deletes
// data on demand so it doesn't always have an up to date channel object

Client.prototype._addChannelData = function(channel, key, value) {
	channel = channel.toLowerCase();

	this._channelData[channel] = this._channelData[channel] || {
		channel: channel
	};

	if (key in this._channelData[channel] && Array.isArray(this._channelData[channel][key]))
		this._channelData[channel][key].push.apply(this._channelData[channel][key], value);
	else
		this._channelData[channel][key] = value;
	// we can merge objects together unlike node-irc by passing value in as an array
	// which can also have multiple objects in, to save us from looping, let V8 do the work.
};

Client.prototype._getChannelData = function (_channel) {
	var channel = _channel.toLowerCase();
	return this._channelData[channel];
};

Client.prototype._clearChannelData = function (channel) {
	channel = channel.toLowerCase();
	delete this._channelData[channel];
};
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