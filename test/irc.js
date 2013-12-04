var sinon = require('sinon'),
	should = require('should'),
	MockGenericSocket = require('../lib/stub.js');
	irc = require('../lib/irc.js'),
	Events = irc.Events,
	Client = irc.Client;

var network = Object.freeze({
    nick : 'testbot',
    user : 'testuser',
    server : 'irc.test.net',
    realname: 'realbot',
    port: 6667,
    secure: false
});

describe('IRC Events', function () {
	function setup() {
		MockGenericSocket.messages = [
			":irc.test.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost\r\n",
		];
		// set our messages for this test

		var socket = new Client('key', network, MockGenericSocket);
		// create a dud client
	};

	it('registered event should have nick property', function (done) {
		setup();
		Events.once('key.registered', function(o) {
			o.should.have.property('nick');
			done();
		});
	});

	it('registered event nick property should equal testbot', function (done) {
		setup();
		Events.once('key.registered', function(o) {
			o.nick.should.equal('testbot');
			done();
		});
	});
	// run tests
});