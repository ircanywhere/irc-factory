var api = require(__dirname + '/api').api;

api.createClient('unique-key', {
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

/*var client = new Client('unique-key', );

Events.on('*.ctcp_request', function(m) {
	console.log(m);
});*/