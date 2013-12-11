var axon = require('axon'),
	incoming = axon.socket('pull'),
	outgoing = axon.socket('pub-emitter');

axon.codec.define('json', {
	encode: JSON.stringify,
	decode: JSON.parse
});
// setup a json codec

incoming.connect(31920);
incoming.format('json');
// setup our incoming connection

outgoing.connect(31930);
// setup our outgoing connection

incoming.on('message', function(msg) {
	if (msg.event == 'synchronize') {
		if (msg.keys.length == 0) {
			setTimeout(createClient, 1500);
			// no client lets create one in 1.5 seconds
		}
		console.log(msg);
		return;
	}

	if (msg.event[0] == 'test' && msg.event[1] == 'motd') {
		outgoing.emit('call', 'test', 'raw', ['JOIN #ircanywhere-test']);
	}

	console.log(msg);
});
// handle incoming events, we don't use an event emitter because
// of the fact we want queueing.

function createClient() {
	outgoing.emit('createClient', 'test', {
		nick : 'simpleircbot',
		user : 'testuser',
		server : 'irc.freenode.net',
		realname: 'realbot',
		port: 6667,
		secure: false
	});
};
// create a client