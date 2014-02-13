var should = require('should'),
	readWriteStream = require('../lib/stub.js').ReadWriteNetStream,
	irc = require('../lib/irc.js'),
	Events = irc.Events,
	Client = irc.Client;

/**
 * NOTE: These tests are here to make sure that irc-factory doesnt
 *		 crash when it's fed ridiclious or broken data and it's still
 *		 able to function.
 *
 *		 We don't care about validating the data to keep things as light
 *		 and fast as it can be. So if dodgy data is fed in some how
 *		 (think maliciously or poorly coded ircds), we wont crash but
 *		 the data might not be what you expected.
 *
 *		 So it's wise to validate the objects sent in through events
 */

var network = Object.freeze({
	nick : 'testbot',
	user : 'testuser',
	server : 'irc.freenode.net',
	realname: 'realbot',
	port: 6667,
	secure: false
});

var socket = new Client('key', network, readWriteStream);

describe('registered event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":sendak.freenode.net 001 testbot :Welcome to \n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 002 :\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 004 testbot sendak.freenode.net ircd-seven-1.1.3 DOQRSZaghilopswz CFILMPQSbcefgijklmnopqrstvz bkloveqjfI\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 005 testbot CHANTYPES=# EXCEPTS INVEX CHANMODES=eIbq,k,flj,CFLMPQScgimnprstz CHANLIMIT=#:120 PREFIX=(ov)@+ MAXLIST=bqeI:100 MODES=4 NETWORK=freenode KNOCKSTATUSMSG=@+ CALLERID=g :are supported by this server\r\n", 'utf-8');
		}, 0);
	});

	it('registered event should have correct object format', function (done) {
		Events.once('key.registered', function(o) {
			o.should.have.properties('nickname', 'capabilities', 'time', 'raw');
			o.capabilities.should.have.properties('network', 'channel', 'modes');
			o.capabilities.network.should.have.properties('name', 'hostname', 'ircd', 'nicklength', 'maxtargets');
			o.capabilities.channel.should.have.properties('idlength', 'limit', 'length', 'modes', 'types', 'kicklength', 'topiclength');
			o.capabilities.modes.should.have.properties('user', 'channel', 'param', 'types', 'prefixes', 'prefixmodes', 'maxlist');
			done();
		});
	});

	it('registered event should have correct network object', function (done) {
		Events.once('key.registered', function(o) {
			o.capabilities.network.name.should.equal('freenode');
			o.capabilities.network.hostname.should.equal('sendak.freenode.net');
			o.capabilities.network.ircd.should.equal('ircd-seven-1.1.3');
			o.capabilities.network.nicklength.should.equal(9);
			o.capabilities.network.maxtargets.should.be.empty;
			done();
		});
	});

	it('registered event should have correct channel object', function (done) {
		Events.once('key.registered', function(o) {
			o.capabilities.channel.idlength.should.be.empty;
			o.capabilities.channel.limit.should.eql({'#': 120});
			o.capabilities.channel.length.should.equal(200);
			o.capabilities.channel.modes.should.equal(4);
			o.capabilities.channel.types.should.equal('#');
			o.capabilities.channel.kicklength.should.equal(0);
			o.capabilities.channel.topiclength.should.equal(0);
			done();
		});
	});

	it('registered event should have correct modes object', function (done) {
		Events.once('key.registered', function(o) {
			o.capabilities.modes.user.should.equal('DOQRSZaghilopswz');
			o.capabilities.modes.channel.should.equal('CFILMPQSbcefgijklmnopqrstvz');
			o.capabilities.modes.param.should.equal('bkloveqjfI');
			o.capabilities.modes.types.a.should.equal('eIbq');
			o.capabilities.modes.types.b.should.equal('kov');
			o.capabilities.modes.types.c.should.equal('flj');
			o.capabilities.modes.types.d.should.equal('CFLMPQScgimnprstz');
			o.capabilities.modes.prefixes.should.equal('@+');
			o.capabilities.modes.prefixmodes.should.eql({'o': '@', 'v': '+'});
			o.capabilities.modes.maxlist.should.eql({bqeI: 100});
			done();
		});
	});
});

describe('motd event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":sendak.freenode.net 375\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 372 testbot :- Welcome to moorcock.freenode.net in Texas, USA. Thanks to\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 372 testbot :- Kodingen (http://kodingen.com) for sponsoring this server!\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 376 testbot :End of /MOTD command.\r\n", 'utf-8');
		}, 0);
	});

	it('motd should be correct', function (done) {
		Events.once('key.motd', function(o) {
			o.motd.should.eql(['- Welcome to moorcock.freenode.net in Texas, USA. Thanks to',
				'- Kodingen (http://kodingen.com) for sponsoring this server!',
				'End of /MOTD command.']);
			done();
		});
	});
});

describe('nick event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa NICK :\r\n", 'utf-8');
		}, 0);
	});

	it('nick event should have correct object format', function (done) {
		Events.once('key.nick', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'newnick', 'time');
			done();
		});
	});

	it('new nickname should be correct', function (done) {
		Events.once('key.nick', function(o) {
			o.newnick.should.be.empty;
			done();
		});
	});
});

describe('topic event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":sendak.freenode.net 332 testbot\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 333 testbot #ircanywhere rick;3\r\n", 'utf-8');
		}, 0);
	});

	it('topic event should have correct object format', function (done) {
		Events.once('key.topic', function(o) {
			o.should.have.properties('channel', 'topicBy');
			done();
		});
	});

	it('channel should be correct', function (done) {
		Events.once('key.topic', function(o) {
			o.channel.should.equal('#ircanywhere');
			done();
		});
	});

	it('topic should be correct', function (done) {
		Events.once('key.topic', function(o) {
			o.should.not.have.property('topic');
			done();
		});
	});

	it('topic setter should be correct', function (done) {
		Events.once('key.topic', function(o) {
			o.topicBy.should.have.equal('rick;3');
			done();
		});
	});
});

describe('topic_change event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa~ricki@unaffiliated/rickibalboa TOPIC #ir/';canywhere\r\n", 'utf-8');
		}, 0);
	});

	it('topic event should have correct object format', function (done) {
		Events.once('key.topic_change', function(o) {
			o.should.have.properties('channel', 'topicBy');
			done();
		});
	});

	it('channel should be correct', function (done) {
		Events.once('key.topic_change', function(o) {
			o.channel.should.equal('#ir/\';canywhere');
			done();
		});
	});

	it('topic should be correct', function (done) {
		Events.once('key.topic_change', function(o) {
			o.should.not.have.property('topic');
			done();
		});
	});

	it('topic setter should be correct', function (done) {
		Events.once('key.topic_change', function(o) {
			o.topicBy.should.have.equal('undefined!undefined@undefined');
			// because rickibalboa~ricki@unaffiliated/rickibalboa cannot be parsed properly!
			done();
		});
	});
});

describe('names event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":sendak.freenode.net 353 testbot #ircanywhere Not-002 @rickibalboa @Gnasher Venko [D3M0N] lyska @ChanServ LoganLK JakeXKS Techman TkTech zz_Trinexx Tappy\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 366 testbot :End of /NAMES list.\r\n", 'utf-8');
		}, 0);
	});

	it('names event should have correct object format', function (done) {
		Events.once('key.names', function(o) {
			o.should.equal(false);
			done();
		});
	});

	it('channel should be correct', function (done) {
		Events.once('key.names', function(o) {
			o.should.not.have.properties('channel', 'names');
			done();
		});
	});
});

describe('who event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~testuser sendak.freenode.net testbot H realuser\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere 198.199.82.216 hubbard.freenode.net Not-002 H :0 Notifico! - http://n.tkte.ch/\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~ricki unaffiliated/rickibalboa leguin.freenode.net rickibalboa :0 Ricki\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere Three net card.freenode.net Gnasher H@ :0\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 315 testbot #ircanywhere :End of /WHO list.\r\n", 'utf-8');
		}, 0);
	});

	it('who event should have correct object format', function (done) {
		Events.once('key.who', function(o) {
			o.should.have.properties('channel', 'who');
			done();
		});
	});

	it('channel should be correct', function (done) {
		Events.once('key.who', function(o) {
			o.channel.should.equal('#ircanywhere');
			done();
		});
	});

	it('who array should be correct', function (done) {
		Events.once('key.who', function(o) {
			o.who.should.have.a.lengthOf(4);
			o.who[0].channel.should.equal('#ircanywhere');
			o.who[0].prefix.should.equal('~testuser@sendak.freenode.net');
			o.who[0].nickname.should.equal('H');
			o.who[0].mode.should.equal('realuser');
			o.who[0].extra.should.equal('');
			done();
		});
	});
});

describe('whois event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":sendak.freenode.net 311 testbot rickibalboa ~ricki Ricki\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 319 testbot rickibalboa :@#ircanywhere\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 312 testbot rickibalboa leguin.freenode.net\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 671 testbot is using a secure connection\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 330 testbot rickibalboa rickibalboa :is logged in as\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 318 testbot rickibalboa :End of /WHOIS list.\r\n", 'utf-8');
		}, 0);
	});

	it('whois event should have correct object format', function (done) {
		Events.once('key.whois', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'channels', 'server');
			o.should.not.have.property('realname');
			done();
		});
	});

	it('whois object should be correct', function (done) {
		Events.once('key.whois', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('Ricki');
			o.channels.should.eql(['@#ircanywhere']);
			o.server.should.equal('leguin.freenode.net');
			done();
		});
	});
});

describe('links event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":adams.freenode.net 364 testbot services. IRC Services\r\n", 'utf-8');
			socket.connection.impl.rewrite(":adams.freenode.net 364 testbot adams.freenode.net :Budapest, HU, EU\r\n", 'utf-8');
			socket.connection.impl.rewrite(":adams.freenode.net 365 testbot * :End of /LINKS list.\r\n", 'utf-8');
		}, 0);
	});

	it('links object should have correct format', function (done) {
		Events.once('key.links', function(o) {
			o.should.have.properties('links');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.links', function(o) {
			o.links.should.have.a.lengthOf(2);
			o.links[0].server.should.equal('services.');
			o.links[0].link.should.equal('IRC');
			o.links[0].description.should.equal('Services');
			done();
		});
	});
});

describe('list event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":leguin.freenode.net 322 testbot #puppet 1058 \r\n", 'utf-8');
			socket.connection.impl.rewrite(":leguin.freenode.net 322 testbot ##linux : Welcome to ##Linux! Freenode's general Linux support/discussion channel. | Channel website and rules: http://www.linuxassist.net | Our pastebin http://paste.linuxassist.net | Spammers or trolls? use !ops <troll's nick> <reason>\". | For op assistance, join ##linux-ops. Feel at home and enjoy your stay.\r\n", 'utf-8');
			socket.connection.impl.rewrite(":leguin.freenode.net 322 testbot 1082 :Welcome to #git, the place for git-related help and tomato soup | Current stable version: 1.8.5.1 : | Start here: http://jk.gs/git | Seeing \"Cannot send to channel\" or unable to change nick? /msg gitinfo .voice | git-hg: Don\'t you know that\'s poison?\r\n", 'utf-8');
			socket.connection.impl.rewrite(":leguin.freenode.net 323 testbot :End of /LIST\r\n", 'utf-8');
		}, 0);
	});

	it('list object should have correct format', function (done) {
		Events.once('key.list', function(o) {
			o.should.have.property('list');
			done();
		});
	});

	it('list object should be correct', function (done) {
		Events.once('key.list', function(o) {
			o.list.should.have.a.lengthOf(3);
			o.list[0].channel.should.equal('#puppet');
			o.list[0].users.should.equal('1058');
			o.list[0].should.not.have.property('topic');
			done();
		});
	});
});

describe('banlist event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":leguin.freenode.net 367 rickibalboa #ircanywhere rickibalboa!~ricki@unaffiliated/rickibalboa :\r\n", 'utf-8');
			socket.connection.impl.rewrite(":leguin.freenode.net 368 rickibalboa #ircanywhere :End of Channel Ban List\r\n", 'utf-8');
		}, 0);
	});

	it('banlist object should have correct format', function (done) {
		Events.once('key.banlist', function(o) {
			o.should.have.properties('banlist');
			done();
		});
	});

	it('banlist object should be correct', function (done) {
		Events.once('key.banlist', function(o) {
			o.banlist.should.have.a.lengthOf(1);
			o.banlist[0].channel.should.equal('#ircanywhere');
			o.banlist[0].setby.should.equal('');
			o.banlist[0].hostname.should.equal('rickibalboa!~ricki@unaffiliated/rickibalboa');
			o.banlist[0].should.not.have.property('timestamp');
			done();
		});
	});
});

describe('user mode event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":testbot MODE testbot\r\n", 'utf-8');
		}, 0);
	});

	it('mode object should have correct format', function (done) {
		Events.once('key.usermode', function(o) {
			o.should.have.properties('nickname', 'mode');
			done();
		});
	});

	it('nick and mode should be correct', function (done) {
		Events.once('key.usermode', function(o) {
			o.nickname.should.equal('testbot');
			o.mode.should.be.empty;
			done();
		});
	});
});

describe('mode event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rothfuss.freenode.net 324 testbot\ '#ircanywhere-test :+nst\r\n", 'utf-8');
		}, 0);
	});

	it('mode object should have correct format', function (done) {
		Events.once('key.mode', function(o) {
			o.should.have.properties('channel', 'mode', 'time', 'raw');
			done();
		});
	});

	it('channel and mode should be correct', function (done) {
		Events.once('key.mode', function(o) {
			o.channel.should.equal('\'#ircanywhere-test');
			o.mode.should.equal('+nst');
			done();
		});
	});
});

describe('mode change event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa~ricki@unaffiliated/rickibalboa MODE #ircanywhere#-test +'i\r\n", 'utf-8');
		}, 0);
	});

	it('mode object should have correct format', function (done) {
		Events.once('key.mode_change', function(o) {
			o.should.have.properties('channel', 'mode');
			o.should.not.have.properties('nickname', 'username', 'hostname');
			done();
		});
	});

	it('channel and mode should be correct', function (done) {
		Events.once('key.mode_change', function(o) {
			o.channel.should.equal('#ircanywhere#-test');
			o.mode.should.equal('+\'i');
			done();
		});
	});
});

describe('join event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa JOIN\r\n", 'utf-8');
		}, 0);
	});

	it('join object should have correct format', function (done) {
		Events.once('key.join', function(o) {
			o.should.have.properties('username', 'hostname', 'nickname');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.join', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			done();
		});
	});
});

describe('part event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~rickiunaffiliated/rickibalboa PART #ircanywhere-test\r\n", 'utf-8');
		}, 0);
	});

	it('part object should have correct format', function (done) {
		Events.once('key.part', function(o) {
			o.should.have.properties('channel');
			o.should.not.have.properties('username', 'hostname', 'nickname');
			done();
		});
	});

	it('channel and nick should be correct', function (done) {
		Events.once('key.part', function(o) {
			o.channel.should.equal('#ircanywhere-test');
			done();
		});
	});
});

describe('kick event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa KICK :k\r\n", 'utf-8');
		}, 0);
	});

	it('kick object should have correct format', function (done) {
		Events.once('key.kick', function(o) {
			o.should.have.properties('channel', 'username', 'hostname', 'nickname');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.kick', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.channel.should.equal('k');
			done();
		});
	});
});

describe('quit event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa QUIT\r\n", 'utf-8');
		}, 0);
	});

	it('quit object should have correct format', function (done) {
		Events.once('key.quit', function(o) {
			o.should.have.properties('message');
			o.should.not.have.properties('username', 'hostname', 'nickname');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.quit', function(o) {
			o.message.should.be.empty;
			done();
		});
	});
});

describe('invite event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa INVITE #testbot\r\n", 'utf-8');
		}, 0);
	});

	it('invite object should have correct format', function (done) {
		Events.once('key.invite', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname');
			o.should.not.have.properties('channel');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.invite', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			done();
		});
	});
});

describe('away/unaway event as per away-notify', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa AWAY\r\n", 'utf-8');
			socket.connection.impl.rewrite(":rickibalboa AWAY :hi\r\n", 'utf-8');
		}, 0);
	});

	it('unaway object should have correct format', function (done) {
		Events.once('key.unaway', function(o) {
			o.should.not.have.properties('nickname', 'username', 'hostname', 'message');
			done();
		});
	});

	it('unaway values should be correct', function (done) {
		Events.once('key.unaway', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			done();
		});
	});

	it('away object should have correct format', function (done) {
		Events.once('key.away', function(o) {
			o.should.have.properties('message');
			done();
		});
	});

	it('away values should be correct', function (done) {
		Events.once('key.away', function(o) {
			o.message.should.equal('hi');
			done();
		});
	});
});

