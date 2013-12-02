var IrcSocket = require('simple-irc-socket'),
	IrcMessage = require('irc-message'),
	EventEmitter2 = require('eventemitter2').EventEmitter2,
	codes = require('./codes.js');
// include all our required libraries, the simple-irc-socket
// is from ircanywhere/simple-irc-socket and it's extended to include
// ssl support

var events = new EventEmitter2({
	wildcard: true,
	maxListeners: 0
});
// we create an event emitter here, but only one, and use it for every irc client we initiate
// that way we don't have 2 event emitters for each client and use an insane amount of memory
// when we scale up to hundreds of clients, we use namespaces for individual clients

var connection = IrcSocket({
	server: 'irc.freenode.net',
	nick: 'simpleircsocket',
	user: 'node',
	realname: 'node',
	port: 6667,
	debug: false,
	secure: false
});

connection.key = 'uniquekey';
connection.capCount = 0;
connection.nickModifier = 0;
connection._channelData = {};
connection._whoisData = {};
// setup a bunch of variables to manage the state of the connection

connection.once('ready', function () {
	connection.raw('JOIN #ircanywhere-test');
	connection.raw('WHOIS rickibalboa')
});

connection.on('message', function (line) {
	var message = this.parse(line);
	console.log(message);

	switch (message.command) {
		case 'RPL_WELCOME':
			this.capCount = 0;
			this.nick = message.args[0];
			events.emit([this.key, 'registered'], message);
			break;
		case 'RPL_MYINFO':
			this.supported.usermodes = message.args[3];
			break;
		case 'RPL_ISUPPORT':
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
							var type = ['a', 'b', 'c', 'd']
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
					events.emit([this.key, 'capabilities'], this.supported, message);
				}
				// only emit capabilities on the third time round (when we're done)
			break;
			case 'ERR_NICKNAMEINUSE':
				this.nickModifier++;
				var nickname = this.nick + this.nickModifier.toString();
				// create a new nickname

				this.raw(['NICK', nickname]);
				break;
			case 'ERR_NOMOTD':
				this.motd = [message.args[1]];
				events.emit([this.key, 'motd'], this.motd);
				break;
			case 'RPL_MOTDSTART':
				this.motd = [message.args[1]];
				break;
			case 'RPL_ENDOFMOTD':
			case 'RPL_MOTD':
				this.motd.push(message.args[1]);
				break;
			case 'RPL_NAMREPLY':
				this._addChannelData(message.args[2], 'names', message.args[3].split(' '));
				break;
			case 'RPL_ENDOFNAMES':
				events.emit([this.key, 'names'], this._getChannelData(message.args[1]));
				//this._clearChannelData(message.args[1]);
				break;
			case 'RPL_AWAY':
				this._addWhoisData(message.args[1], 'away', message.args[2]);
				break;
			case 'RPL_WHOISUSER':
				this._addWhoisData(message.args[1], 'user', message.args[2]);
				this._addWhoisData(message.args[1], 'host', message.args[3]);
				this._addWhoisData(message.args[1], 'realname', message.args[5]);
				break;
			case 'RPL_WHOISIDLE':
				this._addWhoisData(message.args[1], 'idle', message.args[2]);
				break;
			case 'RPL_WHOISCHANNELS':
				this._addWhoisData(message.args[1], 'channels', message.args[2].trim().split(/\s+/)); // XXX - clean this up?
				break;
			case 'RPL_WHOISSERVER':
				this._addWhoisData(message.args[1], 'server', message.args[2]);
				this._addWhoisData(message.args[1], 'serverinfo', message.args[3]);
				break;
			case 'RPL_WHOISMODES':
				this._addWhoisData(message.args[1], 'modes', message.args[2])
				break;
			case 'RPL_WHOISHOST':
				this._addWhoisData(message.args[1], 'host', message.args[2])
				break;
			case 'RPL_WHOISADMIN':
				this._addWhoisData(message.args[1], 'operator', message.args[2]);
				break;
			case 'RPL_WHOISOPERATOR':
				this._addWhoisData(message.args[1], 'operator', message.args[2]);
				break;
			case 'RPL_WHOISHELPOP':
				this._addWhoisData(message.args[1], 'helpop', message.args[2]);
				break;
			case 'RPL_WHOISBOT':
				this._addWhoisData(message.args[1], 'bot', message.args[2]);
				break;
			case 'RPL_WHOISSPECIAL':
				this._addWhoisData(message.args[1], 'special', message.args[2]);
				break;
			case 'RPL_WHOISSECURE':
				this._addWhoisData(message.args[1], 'secure', message.args[2]);
				break;
			case 'RPL_WHOISACCOUNT':
				this._addWhoisData(message.args[1], 'account', message.args[2]);
				this._addWhoisData(message.args[1], 'accountinfo', message.args[3]);
				break;
			case 'RPL_WHOISSECURE':
				this._addWhoisData(message.args[1], 'secure', message.args[2]);
				break;
			case 'RPL_ENDOFWHOIS':
				events.emit([this.key, 'whois'], this._getWhoisData(message.args[1]));
				this._clearWhoisData(message.args[1]);
				break;
	};
	// roll a switch on our message.command to determine what to do with it
	// usually I'd just implement a barebones irc socket and do all the handling in
	// ircanywhere main package but I'd rather offload stuff to here
});

// ========================================
// Features supported by the server
// (initial values are RFC 1459 defaults. Zeros signify no default or unlimited value)

IrcSocket.prototype.supported = {
	channel: {
		idlength: [],
		length: 200,
		limit: [],
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
	maxlist: [],
	maxtargets: [],
	modes: 3,
	modeForPrefix: {},
	prefixForMode: {},
	nicklength: 9,
	topiclength: 0,
	usermodes: '',
	name: ''
};
// ========================================

// ========================================
// the following 3 functions are taken from
// node-irc, although I'm not a fan of much
// of this code it seems to be the best way

IrcSocket.prototype._addWhoisData = function (nick, key, value, onlyIfExists) {
	nick = nick.toLowerCase();
	if (onlyIfExists && !this._whoisData[nick])
		return;

	this._whoisData[nick] = this._whoisData[nick] || {
		nick: nick
	};

	this._whoisData[nick][key] = value;
};

IrcSocket.prototype._getWhoisData = function (_nick) {
	var nick = _nick.toLowerCase();
	this._addWhoisData(nick, 'nick', _nick);
	return this._whoisData[nick];
};

IrcSocket.prototype._clearWhoisData = function (nick) {
	nick = nick.toLowerCase();
	delete this._whoisData[nick];
};
// ========================================

// ========================================
// the following 2 functions are based on _addWhoisData from
// node-irc and are for channel data, it creates and deletes
// data on demand so it doesn't always have an up to date channel object

IrcSocket.prototype._addChannelData = function(channel, key, value, onlyIfExists) {
	channel = channel.toLowerCase();
	if (onlyIfExists && !this._channelData[channel])
		return;

	this._channelData[channel] = this._channelData[channel] || {
		channel: channel
	};

	if (key in this._channelData[channel] && Array.isArray(this._channelData[channel][key]))
		this._channelData[channel][key].concat(value);
	else
		this._channelData[channel][key] = value;
};

IrcSocket.prototype._getChannelData = function (_channel) {
	var channel = _channel.toLowerCase();
	this._addChannelData(channel, 'channel', _channel);
	return this._channelData[channel];
};
// ========================================

// ========================================
// extend our IrcSocket to contain a function that will parse
// our line into a usable object with IrcMessage and will convert
// the numeric to a valid command

IrcSocket.prototype.parse = function(line) {
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

events.on('*.*', function(m) {
	console.log(this.event, m);
});