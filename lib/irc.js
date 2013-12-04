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

	self.supported = self.defaultSupported();
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
	});

	connection.on('data', function (line) {
		//console.log(line);
		var message = self.parse(line);

		switch (message.command) {
			// WELCOME AND CAPABILIES
			case 'RPL_WELCOME':
				self.capCount = 0;
				self.nick = message.args[0];
				Events.emit([self.key, 'registered'], {nick: self.nick});
				break;
			case 'RPL_MYINFO':
				self.supported.usermodes = message.args[3];
				break;
			case 'RPL_ISUPPORT':
				self.capCount++;
				for (var argi in message.args) {
					var arg = message.args[argi],
						match;

					if (match = arg.match(/([A-Z]+)=(.*)/)) {
						var param = match[1];
						var value = match[2];
						switch (param) {
							case 'NETWORK':
								self.supported.name = value;
								break;
							case 'CHANLIMIT':
								var values = value.split(',');
								for (var vali in values) {
									var val = values[vali].split(':');
									self.supported.channel.limit[val[0]] = parseInt(val[1]);
								}
								break;
							case 'CHANMODES':
								value = value.split(',');
								var type = ['a', 'b', 'c', 'd'];
								for (var i = 0; i < type.length; i++) {
									self.supported.channel.modes[type[i]] += value[i];
								}
								break;
							case 'CHANTYPES':
								self.supported.channel.types = value;
								break;
							case 'CHANNELLEN':
								self.supported.channel.length = parseInt(value);
								break;
							case 'IDCHAN':
								var values = value.split(',');
								for (var vali in values) {
									var val = values[vali].split(':');
									self.supported.channel.idlength[val[0]] = val[1];
								}
								break;
							case 'KICKLEN':
								self.supported.kicklength = value;
								break;
							case 'MAXLIST':
								var values = value.split(',');
								for (var vali in values) {
									var val = values[vali].split(':');
									self.supported.maxlist[val[0]] = parseInt(val[1]);
								}
								break;
							case 'NICKLEN':
								self.supported.nicklength = parseInt(value);
								break;
							case 'PREFIX':
								if (match = value.match(/\((.*?)\)(.*)/)) {
									match[1] = match[1].split('');
									match[2] = match[2].split('');
									while (match[1].length) {
										self.supported.modeForPrefix[match[2][0]] = match[1][0];
										self.supported.channel.modes.b += match[1][0];
										self.supported.channel.prefixes += match[2][0];
										self.supported.prefixForMode[match[1].shift()] = match[2].shift();
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
									self.supported.maxtargets[val[0]] = val[1];
								}
								break;
							case 'TOPICLEN':
								self.supported.topiclength = parseInt(value);
								break;
							}
						}
					}

					if (self.capCount == 3) {
						Events.emit([self.key, 'capabilities'], self.supported);
						self.supported = self.defaultSupported();
					}
					// only emit capabilities on the third time round (when we're done)
				break;
				// END WELCOME AND CAPABILITIES

				// ERRORS
				case 'ERR_NICKNAMEINUSE':
					self.nickModifier++;
					var nickname = self.nick + self.nickModifier.toString();
					// create a new nickname

					self.raw(['NICK', nickname]);
					break;
				// END ERRORS

				// MOTD
				case 'RPL_ENDOFMOTD':
				case 'ERR_NOMOTD':
					self.motd.push(message.args[1]);
					Events.emit([self.key, 'motd'], self.motd);
					break;
				case 'RPL_MOTDSTART':
					self.motd = [message.args[1]];
					break;
				case 'RPL_MOTD':
					self.motd.push(message.args[1]);
					break;
				// END MOTD

				// NAMES
				case 'RPL_NAMREPLY':
					self._addChannelData(message.args[2], 'names', message.args[3].split(' '));
					break;
				case 'RPL_ENDOFNAMES':
					Events.emit([self.key, 'names'], self._getChannelData(message.args[1]));
					self._clearChannelData(message.args[1]);
					break;
				// END NAMES

				// WHOIS
				case 'RPL_AWAY':
					self._addWhoisData(message.args[1], 'away', message.args[2]);
					break;
				case 'RPL_WHOISUSER':
					self._addWhoisData(message.args[1], 'user', message.args[2]);
					self._addWhoisData(message.args[1], 'host', message.args[3]);
					self._addWhoisData(message.args[1], 'realname', message.args[5]);
					break;
				case 'RPL_WHOISIDLE':
					self._addWhoisData(message.args[1], 'idle', message.args[2]);
					break;
				case 'RPL_WHOISCHANNELS':
					self._addWhoisData(message.args[1], 'channels', message.args[2].trim().split(/\s+/)); // XXX - clean this up?
					break;
				case 'RPL_WHOISSERVER':
					self._addWhoisData(message.args[1], 'server', message.args[2]);
					self._addWhoisData(message.args[1], 'serverinfo', message.args[3]);
					break;
				case 'RPL_WHOISMODES':
					self._addWhoisData(message.args[1], 'modes', message.args[2])
					break;
				case 'RPL_WHOISHOST':
					self._addWhoisData(message.args[1], 'host', message.args[2])
					break;
				case 'RPL_WHOISADMIN':
					self._addWhoisData(message.args[1], 'operator', message.args[2]);
					break;
				case 'RPL_WHOISOPERATOR':
					self._addWhoisData(message.args[1], 'operator', message.args[2]);
					break;
				case 'RPL_WHOISHELPOP':
					self._addWhoisData(message.args[1], 'helpop', message.args[2]);
					break;
				case 'RPL_WHOISBOT':
					self._addWhoisData(message.args[1], 'bot', message.args[2]);
					break;
				case 'RPL_WHOISSPECIAL':
					self._addWhoisData(message.args[1], 'special', message.args[2]);
					break;
				case 'RPL_WHOISSECURE':
					self._addWhoisData(message.args[1], 'secure', message.args[2]);
					break;
				case 'RPL_WHOISACCOUNT':
					self._addWhoisData(message.args[1], 'account', message.args[2]);
					self._addWhoisData(message.args[1], 'accountinfo', message.args[3]);
					break;
				case 'RPL_WHOISSECURE':
					self._addWhoisData(message.args[1], 'secure', message.args[2]);
					break;
				case 'RPL_ENDOFWHOIS':
					Events.emit([self.key, 'whois'], self._getWhoisData(message.args[1]));
					self._clearWhoisData(message.args[1]);
					break;
				// END WHOIS

				// WHO
				case 'RPL_WHOREPLY':
					var whoObject = {
						chan: message.args[1],
						prefix: message.args[2] + '@' + message.args[3],
						nick: message.args[5],
						mode: message.args[6],
						extra: message.args[7] || '',
					}

					self._addChannelData(message.args[1], 'who', [whoObject]);
					break;
				case 'RPL_ENDOFWHO':
					Events.emit([self.key, 'who'], self._getChannelData(message.args[1]));
					self._clearChannelData(message.args[1]);
					break;
				// END WHO

				// LIST
				// XXX - Finish, hmm.. start even
				// END LIST

				// TOPIC
				case 'RPL_TOPICWHOTIME':
					self._addChannelData(message.args[1], 'topicBy', message.args[2]);
					// set topic by, all the other shit should be here aswell
					Events.emit([self.key, 'topic'], self._getChannelData(message.args[1]));
					self._clearChannelData(message.args[1]);
					// emit it and clear
					break;
				case 'RPL_TOPIC':
					self._addChannelData(message.args[1], 'topic', message.args[2]);
					// set the topic from RPL, usually on JOIN or TOPIC
					break;
				case 'TOPIC':
					self._addChannelData(message.args[0], 'topic', message.args[1]);
					self._addChannelData(message.args[0], 'topicBy', message.nickname);
					// set topic by, all the other shit should be here aswell
					Events.emit([self.key, 'topic'], self._getChannelData(message.args[0]));
					self._clearChannelData(message.args[1]);
					// someone has set a new topic it seems
					break;
				// END TOPIC
		};
		// roll a switch on our message.command to determine what to do with it
		// usually I'd just implement a barebones irc socket and do all the handling in
		// ircanywhere main package but I'd rather offload stuff to here
	});
};

// ========================================
// Features supported by the server
// (initial values are RFC 1459 defaults. Zeros signify no default or unlimited value)

Client.prototype.defaultSupported = function() {
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

Client.prototype.parse = function(line) {
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