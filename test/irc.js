var should = require('should'),
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

describe('registered event', function () {
	function setup() {
		MockGenericSocket.messages = [
			':irc.test.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost',
		];
		var socket = new Client('key', network, MockGenericSocket);
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
});

describe('capabilities event', function () {
	function setup() {
		MockGenericSocket.messages = [
			':irc.test.net 004 testbot moorcock.freenode.net ircd-seven-1.1.3 DOQRSZaghilopswz CFILMPQSbcefgijklmnopqrstvz bkloveqjfI',
			':irc.test.net 005 testbot CHANTYPES=# EXCEPTS INVEX CHANMODES=eIbq,k,flj,CFLMPQScgimnprstz CHANLIMIT=#:120 PREFIX=(ov)@+ MAXLIST=bqeI:100 MODES=4 NETWORK=freenode KNOCKSTATUSMSG=@+ CALLERID=g :are supported by this server',
			':irc.test.net 005 testbot CASEMAPPING=rfc1459 CHARSET=ascii NICKLEN=16 CHANNELLEN=50 TOPICLEN=390 ETRACE CPRIVMSG CNOTICE DEAF=D MONITOR=100 FNC TARGMAX=NAMES:1,LIST:1,KICK:1,WHOIS:1,PRIVMSG:4,NOTICE:4,ACCEPT:,MONITOR: :are supported by this server',
			':irc.test.net 005 testbot EXTBAN=$,arxz WHOX CLIENTVER=3.0 SAFELIST ELIST=CTU :are supported by this server'
		];
		var socket = new Client('key', network, MockGenericSocket);
	};

	it('capabilities event should have correct object format', function (done) {
		setup();
		Events.once('key.capabilities', function(o) {
			o.should.have.property('channel');
			o.channel.should.have.property('idlength');
			o.channel.should.have.property('limit');
			o.channel.should.have.property('modes');
			o.channel.should.have.property('prefixes');
			o.channel.should.have.property('types');
			o.should.have.property('kicklength');
			o.should.have.property('maxlist');
			o.should.have.property('maxtargets');
			o.should.have.property('modes');
			o.should.have.property('modeForPrefix');
			o.should.have.property('prefixForMode');
			o.should.have.property('nicklength');
			o.should.have.property('topiclength');
			o.should.have.property('usermodes');
			o.should.have.property('name');
			done();
		});
	});

	it('capabilities event should have correct channel object', function (done) {
		setup();
		Events.once('key.capabilities', function(o) {
			o.channel.idlength.should.be.empty;
			o.channel.length.should.equal(50);
			o.channel.limit.should.eql({'#': 120});
			o.channel.modes.a.should.equal('eIbq');
			o.channel.modes.b.should.equal('kov');
			o.channel.modes.c.should.equal('flj');
			o.channel.modes.d.should.equal('CFLMPQScgimnprstz');
			o.channel.prefixes.should.equal('@+');
			o.channel.types.should.equal('#');
			done();
		});
	});

	it('capabilities event should have correct values', function (done) {
		setup();
		Events.once('key.capabilities', function(o) {
			o.kicklength.should.equal(0);
			o.maxlist.should.eql({bqeI: 100});
			o.maxtargets.should.eql({NAMES: 1, LIST: 1, KICK: 1, WHOIS: 1, PRIVMSG: 4,
				NOTICE: 4, ACCEPT: 0, MONITOR: 0});
			o.modes.should.equal(3);
			o.modeForPrefix.should.eql({'@': 'o', '+': 'v'});
			o.prefixForMode.should.eql({'o': '@', 'v': '+'});
			o.nicklength.should.equal(16);
			o.topiclength.should.equal(390);
			o.usermodes.should.equal('DOQRSZaghilopswz');
			o.name.should.equal('freenode');
			done();
		});
	});
});