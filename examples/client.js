var factory = require('../lib/api'), // this should be 'irc-factory' in your project
	api = new factory.Api();

var client = api.createClient('test', {
	nick : 'simpleircbot',
	user : 'testuser',
	server : 'irc.freenode.net',
	realname: 'realbot',
	port: 6667,
	secure: false
});

api.hookEvent('test', '*', function(message) {
	console.log(this.event);
});

api.hookEvent('test', 'registered', function(message) {
	client.irc.join('#ircanywhere-test');
	//client.irc.privmsg('#ircanywhere-test', 'hey this is ^9a test');
	client.irc.list();

	setTimeout(function() {
		console.log('requesting list again');
		client.irc.list();
	}, 60000);
});