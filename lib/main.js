var irc = require('./irc.js'),
	Events = irc.Events,
	Client = irc.Client;

var client = new Client('unique-key', {
	server: 'irc.freenode.net',
	nick: 'simpleircsocket',
	user: 'node',
	realname: 'node',
	port: 6667,
	secure: false,
	capab: true,
	sasl: true,
	password: 'lol'
});

Events.on('*.links', function(m) {
	console.log(this.event, m);
});