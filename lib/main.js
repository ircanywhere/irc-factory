var irc = require('./irc.js'),
	Events = irc.Events,
	Client = irc.Client;

var client = new Client('unique-key', {
	server: 'irc.freenode.net',
	nick: 'simpleircsocket',
	user: 'node',
	realname: 'node',
	port: 6667,
	secure: false
});

Events.on('*.*', function(m) {
	console.log(this.event, m);
});