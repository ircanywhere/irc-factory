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

incoming.on('message', function(msg){
	console.log(msg);
});
// handle incoming events, we don't use an event emitter because
// of the fact we want queueing.

setTimeout(function() {
	outgoing.emit('createClient', {
		key: 'test',
		client: {
			nick : 'simpleircbot',
			user : 'testuser',
			server : 'irc.freenode.net',
			realname: 'realbot',
			port: 6667,
			secure: false
		}
	});
}, 1500);
// lets send an event for lulz