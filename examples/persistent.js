var factory = require('../lib/api'), // this should be 'irc-factory' in your project
	axon = factory.axon,
	api = new factory.Api();

var options = {
		events: 31920,
		rpc: 31930,
		automaticSetup: true,
		fork: true
	},
	interfaces = api.connect(options),
	events = interfaces.events,
	rpc = interfaces.rpc;

events.on('message', function(msg) {
	if (msg.event == 'synchronize') {
		if (msg.keys.length == 0) {
			setTimeout(createClient, 1500);
			// no client lets create one in 1.5 seconds
		}
		return;
	}

	if (msg.event[0] == 'test' && msg.event[1] == 'registered') {
		rpc.emit('call', 'test', 'join', ['#ircanywhere-test']);
		rpc.emit('call', 'test', 'privmsg', ['#ircanywhere-test', 'hey this is a test']);
	}

	console.log(msg);
});
// handle incoming events, we don't use an event emitter because
// of the fact we want queueing.

function createClient() {
	rpc.emit('createClient', 'test', {
		nick : 'simpleircbot',
		user : 'testuser',
		server : 'irc.freenode.net',
		realname: 'realbot',
		port: 6667,
		secure: false
	});
};
// create a client