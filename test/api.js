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
			client.irc.connection.impl.rewrite(":sendak.freenode.net 001 testbot :Welcome to the freenode IRC Network testbot\r\n", 'utf-8');
			client.irc.connection.impl.rewrite(":sendak.freenode.net 002 testbot :Your host is sendak.freenode.net[130.239.18.172/6697], running version ircd-seven-1.1.3\r\n", 'utf-8');
			client.irc.connection.impl.rewrite(":sendak.freenode.net 003 testbot :This server was created Mon Dec 31 2012 at 22:37:58 CET\r\n", 'utf-8');
			client.irc.connection.impl.rewrite(":sendak.freenode.net 004 testbot sendak.freenode.net ircd-seven-1.1.3 DOQRSZaghilopswz CFILMPQSbcefgijklmnopqrstvz bkloveqjfI\r\n", 'utf-8');
			client.irc.connection.impl.rewrite(":sendak.freenode.net 005 testbot CHANTYPES=# EXCEPTS INVEX CHANMODES=eIbq,k,flj,CFLMPQScgimnprstz CHANLIMIT=#:120 PREFIX=(ov)@+ MAXLIST=bqeI:100 MODES=4 NETWORK=freenode KNOCKSTATUSMSG=@+ CALLERID=g :are supported by this server\r\n", 'utf-8');
			client.irc.connection.impl.rewrite(":sendak.freenode.net 005 testbot CASEMAPPING=rfc1459 CHARSET=ascii NICKLEN=16 CHANNELLEN=50 TOPICLEN=390 ETRACE CPRIVMSG CNOTICE DEAF=D MONITOR=100 FNC TARGMAX=NAMES:1,LIST:1,KICK:1,WHOIS:1,PRIVMSG:4,NOTICE:4,ACCEPT:,MONITOR: :are supported by this server\r\n", 'utf-8');
			client.irc.connection.impl.rewrite(":sendak.freenode.net 005 testbot EXTBAN=$,arxz WHOX CLIENTVER=3.0 SAFELIST ELIST=CTU :are supported by this server\r\n", 'utf-8');
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