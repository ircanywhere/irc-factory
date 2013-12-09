var should = require('should'),
	Api = require(__dirname + '/../lib/api').Api,
	api = new Api();

describe('api.createClient() tests', function () {
	var client,
		ecount = 0;

	before(function() {
		client = api.createClient('key', {
		    nick : 'testbot',
		    user : 'testuser',
		    server : 'irc.freenode.net',
		    realname: 'realbot',
		    port: 6667,
		    secure: false
		}, true);
	});

	beforeEach(function() {
		setTimeout(function() {
			client.irc.connection.impl.rewrite(":sendak.freenode.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost\r\n", 'utf-8');
			client.irc.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa NOTICE testbot :hi, just sending you a notice\r\n", 'utf-8');
			client.irc.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa NOTICE testbot :hi, just sending you a notice again\r\n", 'utf-8');
		}, 0);
	});

	it('client should have been created properly', function(done) {
		client.key.should.equal('key');
		client.options.nick.should.equal('testbot');
		client.events.should.be.empty;
		done();
	});

	it('once events should fire when client is created via api', function(done) {
		api.hookEvent('key', 'registered', function(o) {
			o.should.have.property('nickname');
			done();
		}, true);
	});

	it('multiple events should fire when client is created via api', function(done) {
		api.hookEvent('key', 'notice', function(o) {
			o.should.have.property('nickname');
			o.username.should.equal('~ricki');
			ecount++;

			if (ecount == 2)
				done();
		});
	});
});

describe('api.destroyClient() tests', function() {
	var client;

	before(function() {
		client = api.createClient('key', {
		    nick : 'testbot',
		    user : 'testuser',
		    server : 'irc.freenode.net',
		    realname: 'realbot',
		    port: 6667,
		    secure: false
		}, true);
	});

	it('client should have been removed', function(done) {
		(api.destroyClient('key')).should.equal(true);
		done();
	});

	it('client should be inaccessible', function(done) {
		(api.destroyClient('key')).should.equal(false);
		done();
	});
});