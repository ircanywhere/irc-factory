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
}, true);

api.hookEvent('unique-key', '*', function(m) {
	console.log(m);
});

var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

var instream = fs.createReadStream(__dirname + '/../test/dummy.data');
var outstream = new stream;
var rl = readline.createInterface(instream, outstream);

rl.on('line', function(line) {
	cli.irc.connection.impl.rewrite(line + "\r\n", 'utf8');
	// process line here
});

rl.on('close', function() {
	// do something on finish here
});