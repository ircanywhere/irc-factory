var api = require(__dirname + '/api').api;

var cli = api.createClient('unique-key', {
	server: 'irc.freenode.net',
	nick: 'simpleircsocket',
	user: 'node',
	realname: 'node',
	port: 6667,
	secure: false,
	capab: true,
	sasl: false,
	password: null
}, false);

api.hookEvent('unique-key', 'capabilities', function(m) {
	console.log(m);
});