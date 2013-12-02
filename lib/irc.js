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
// give the client its unique key

connection.once('ready', function () {
    connection.raw("JOIN #ircanywhere-test");
});

connection.on('data', function (line) {
	var message = this.parse(line);

	switch (message.command) {
		case 'RPL_WELCOME':
			events.emit([this.key, 'registered'], message);
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

events.on('gary.*', function(m) {
	console.log(this.event, m);
});