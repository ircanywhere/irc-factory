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
    nick: 'simple-irc-socket-bot',
    user: 'node',
    realname: 'node',
    port: 6667,
    debug: false,
    secure: false
});

connection.key = 'uniquekey';
connection.capCount = 0;
// give the client its unique key

connection.once('ready', function () {
    connection.raw("JOIN #ircanywhere-test");
});

connection.on('data', function (line) {
	console.log(line);
	var message = this.parse(line);

	switch (message.command) {
		case 'RPL_WELCOME':
			this.capCount = 0;
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
	};
	// roll a switch on our message.command to determine what to do with it
	// usually I'd just implement a barebones irc socket and do all the handling in
	// ircanywhere main package but I'd rather offload stuff to here
});

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

events.on('*.*', function(m) {
	console.log(this.event, m);
});