var should = require('should'),
	readWriteStream = require('../lib/stub.js').ReadWriteNetStream,
	irc = require('../lib/irc.js'),
	Events = irc.Events,
	Client = irc.Client;

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
			socket.connection.impl.rewrite(":sendak.freenode.net 001 testbot :Welcome to the freenode IRC Network testbot\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 002 testbot :Your host is sendak.freenode.net[130.239.18.172/6697], running version ircd-seven-1.1.3\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 003 testbot :This server was created Mon Dec 31 2012 at 22:37:58 CET\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 004 testbot sendak.freenode.net ircd-seven-1.1.3 DOQRSZaghilopswz CFILMPQSbcefgijklmnopqrstvz bkloveqjfI\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 005 testbot CHANTYPES=# EXCEPTS INVEX CHANMODES=eIbq,k,flj,CFLMPQScgimnprstz CHANLIMIT=#:120 PREFIX=(ov)@+ MAXLIST=bqeI:100 MODES=4 NETWORK=freenode KNOCKSTATUSMSG=@+ CALLERID=g :are supported by this server\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 005 testbot CASEMAPPING=rfc1459 CHARSET=ascii NICKLEN=16 CHANNELLEN=50 TOPICLEN=390 ETRACE CPRIVMSG CNOTICE DEAF=D MONITOR=100 FNC TARGMAX=NAMES:1,LIST:1,KICK:1,WHOIS:1,PRIVMSG:4,NOTICE:4,ACCEPT:,MONITOR: :are supported by this server\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 005 testbot EXTBAN=$,arxz WHOX CLIENTVER=3.0 SAFELIST ELIST=CTU :are supported by this server\r\n", 'utf-8');
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
			o.capabilities.network.nicklength.should.equal(16);
			o.capabilities.network.maxtargets.should.eql({NAMES: 1, LIST: 1, KICK: 1, WHOIS: 1, PRIVMSG: 4,
				NOTICE: 4, ACCEPT: 0, MONITOR: 0});
			done();
		});
	});

	it('registered event should have correct channel object', function (done) {
		Events.once('key.registered', function(o) {
			o.capabilities.channel.idlength.should.be.empty;
			o.capabilities.channel.limit.should.eql({'#': 120});
			o.capabilities.channel.length.should.equal(50);
			o.capabilities.channel.modes.should.equal(4);
			o.capabilities.channel.types.should.equal('#');
			o.capabilities.channel.kicklength.should.equal(0);
			o.capabilities.channel.topiclength.should.equal(390);
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
			socket.connection.impl.rewrite(":sendak.freenode.net 375 testbot :- sendak.freenode.net Message of the Day -\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 372 testbot :- Welcome to moorcock.freenode.net in Texas, USA. Thanks to\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 372 testbot :- Kodingen (http://kodingen.com) for sponsoring this server!\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 376 testbot :End of /MOTD command.\r\n", 'utf-8');
		}, 0);
	});

	it('motd should be correct', function (done) {
		Events.once('key.motd', function(o) {
			o.motd.should.eql(['- sendak.freenode.net Message of the Day -',
				'- Welcome to moorcock.freenode.net in Texas, USA. Thanks to',
				'- Kodingen (http://kodingen.com) for sponsoring this server!',
				'End of /MOTD command.']);
			done();
		});
	});
});

describe('nick event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa NICK :ricki\r\n", 'utf-8');
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
			o.newnick.should.equal('ricki');
			done();
		});
	});
});

describe('topic event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":sendak.freenode.net 332 testbot #ircanywhere :IRCAnywhere, moved to freenode. Development has restarted using meteor.js in 0.2.0 branch https://github.com/ircanywhere/ircanywhere/tree/0.2.0\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 333 testbot #ircanywhere rickibalboa!~ricki@unaffiliated/rickibalboa 1385050715\r\n", 'utf-8');
		}, 0);
	});

	it('topic event should have correct object format', function (done) {
		Events.once('key.topic', function(o) {
			o.should.have.properties('channel', 'topic', 'topicBy');
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
			o.topic.should.have.equal('IRCAnywhere, moved to freenode. Development has restarted using meteor.js in 0.2.0 branch https://github.com/ircanywhere/ircanywhere/tree/0.2.0');
			done();
		});
	});

	it('topic setter should be correct', function (done) {
		Events.once('key.topic', function(o) {
			o.topicBy.should.have.equal('rickibalboa!~ricki@unaffiliated/rickibalboa');
			done();
		});
	});
});


describe('topic_change event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa TOPIC #ircanywhere :IRCAnywhere, moved to freenode. Development has restarted using meteor.js in 0.2.0 branch https://github.com/ircanywhere/ircanywhere/tree/0.2.0\r\n", 'utf-8');
		}, 0);
	});

	it('topic event should have correct object format', function (done) {
		Events.once('key.topic_change', function(o) {
			o.should.have.properties('channel', 'topic', 'topicBy');
			done();
		});
	});

	it('channel should be correct', function (done) {
		Events.once('key.topic_change', function(o) {
			o.channel.should.equal('#ircanywhere');
			done();
		});
	});

	it('topic should be correct', function (done) {
		Events.once('key.topic_change', function(o) {
			o.topic.should.have.equal('IRCAnywhere, moved to freenode. Development has restarted using meteor.js in 0.2.0 branch https://github.com/ircanywhere/ircanywhere/tree/0.2.0');
			done();
		});
	});

	it('topic setter should be correct', function (done) {
		Events.once('key.topic_change', function(o) {
			o.topicBy.should.have.equal('rickibalboa!~ricki@unaffiliated/rickibalboa');
			done();
		});
	});
});

describe('names event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":sendak.freenode.net 353 testbot = #ircanywhere :testbot Not-002 @rickibalboa @Gnasher Venko [D3M0N] lyska @ChanServ LoganLK JakeXKS Techman TkTech zz_Trinexx Tappy\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 366 testbot #ircanywhere :End of /NAMES list.\r\n", 'utf-8');
		}, 0);
	});

	it('names event should have correct object format', function (done) {
		Events.once('key.names', function(o) {
			o.should.have.properties('channel', 'names');
			done();
		});
	});

	it('channel should be correct', function (done) {
		Events.once('key.names', function(o) {
			o.channel.should.equal('#ircanywhere');
			done();
		});
	});

	it('names array should be correct', function (done) {
		Events.once('key.names', function(o) {
			o.names.should.have.eql(['testbot', 'Not-002', '@rickibalboa',  '@Gnasher', 'Venko', '[D3M0N]', 'lyska', '@ChanServ', 'LoganLK', 'JakeXKS',  'Techman', 'TkTech', 'zz_Trinexx', 'Tappy' ]);
			done();
		});
	});
});

describe('who event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~testuser unaffiliated/testbot sendak.freenode.net testbot H :0 realuser\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~notifico 198.199.82.216 hubbard.freenode.net Not-002 H :0 Notifico! - http://n.tkte.ch/\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~ricki unaffiliated/rickibalboa leguin.freenode.net rickibalboa H@ :0 Ricki\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere Three host-92-3-234-146.as43234.net card.freenode.net Gnasher H@ :0 Dave\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere venko Colchester-LUG/Legen.dary rothfuss.freenode.net Venko H :0 venko\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~D3M0N irc.legalizeourmarijuana.us leguin.freenode.net [D3M0N] H :0 The Almighty D3V1L!\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~lyska op.op.op.oppan.ganghamstyle.pw hobana.freenode.net lyska H :0 Sam Dodrill <niichan@ponychat.net>\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ChanServ services. services. ChanServ H@ :0 Channel Services\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~LoganLK 162.243.133.98 rothfuss.freenode.net LoganLK H :0 Logan\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere sid15915 gateway/web/irccloud.com/x-uvcbvvujowjeeaga leguin.freenode.net JakeXKS G :0 Jake\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere sid11863 gateway/web/irccloud.com/x-qaysfvklhrsppher leguin.freenode.net Techman G :0 Michael Hazell\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~TkTech irc.tkte.ch kornbluth.freenode.net TkTech H :0 TkTech\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~Trinexx tecnode-gaming.com wolfe.freenode.net zz_Trinexx H :0 Jake\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 352 testbot #ircanywhere ~Tappy 2605:6400:2:fed5:22:fd8f:98fd:7a74 morgan.freenode.net Tappy H :0 Tappy\r\n", 'utf-8');
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
			o.who.should.have.a.lengthOf(14);
			o.who[0].channel.should.equal('#ircanywhere');
			o.who[0].prefix.should.equal('~testuser@unaffiliated/testbot');
			o.who[0].nickname.should.equal('testbot');
			o.who[0].mode.should.equal('H');
			o.who[0].extra.should.equal('0 realuser');
			done();
		});
	});
});

describe('whois event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":sendak.freenode.net 311 testbot rickibalboa ~ricki unaffiliated/rickibalboa * :Ricki\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 319 testbot rickibalboa :@#ircanywhere\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 312 testbot rickibalboa leguin.freenode.net :Ume?, SE, EU\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 671 testbot rickibalboa :is using a secure connection\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 330 testbot rickibalboa rickibalboa :is logged in as\r\n", 'utf-8');
			socket.connection.impl.rewrite(":sendak.freenode.net 318 testbot rickibalboa :End of /WHOIS list.\r\n", 'utf-8');
		}, 0);
	});

	it('whois event should have correct object format', function (done) {
		Events.once('key.whois', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'realname', 'channels', 'server', 'serverinfo', 'secure');
			done();
		});
	});

	it('whois object should be correct', function (done) {
		Events.once('key.whois', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.realname.should.equal('Ricki');
			o.channels.should.eql(['@#ircanywhere']);
			o.server.should.equal('leguin.freenode.net');
			o.serverinfo.should.equal('Ume?, SE, EU');
			o.secure.should.equal('is using a secure connection');
			done();
		});
	});
});

describe('links event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":adams.freenode.net 364 testbot services. adams.freenode.net :1 Atheme IRC Services\r\n", 'utf-8');
			socket.connection.impl.rewrite(":adams.freenode.net 364 testbot adams.freenode.net adams.freenode.net :0 Budapest, HU, EU\r\n", 'utf-8');
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
			o.links[0].link.should.equal('adams.freenode.net');
			o.links[0].description.should.equal('1 Atheme IRC Services');
			done();
		});
	});
});

describe('list event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":leguin.freenode.net 322 testbot #puppet 1058 :Puppet Enterprise 3.1.0: http://bit.ly/PE_31 | Puppet 3.3.2: http://bit.ly/QUjTW0 |  Help: http://{ask,docs}.puppetlabs.com | Bugs & Feature Requests: http://bit.ly/aoNNEP\r\n", 'utf-8');
			socket.connection.impl.rewrite(":leguin.freenode.net 322 testbot ##linux 1368 : Welcome to ##Linux! Freenode's general Linux support/discussion channel. | Channel website and rules: http://www.linuxassist.net | Our pastebin http://paste.linuxassist.net | Spammers or trolls? use !ops <troll's nick> <reason>\". | For op assistance, join ##linux-ops. Feel at home and enjoy your stay.\r\n", 'utf-8');
			socket.connection.impl.rewrite(":leguin.freenode.net 322 testbot #git 1082 :Welcome to #git, the place for git-related help and tomato soup | Current stable version: 1.8.5.1 | Start here: http://jk.gs/git | Seeing \"Cannot send to channel\" or unable to change nick? /msg gitinfo .voice | git-hg: Don\'t you know that\'s poison?\r\n", 'utf-8');
			socket.connection.impl.rewrite(":leguin.freenode.net 323 testbot :End of /LIST\r\n", 'utf-8');
		}, 0);
	});

	it('list object should have correct format', function (done) {
		Events.once('key.list', function(o) {
			o.should.have.properties('list');
			done();
		});
	});

	it('list object should be correct', function (done) {
		Events.once('key.list', function(o) {
			o.list.should.have.a.lengthOf(3);
			o.list[0].channel.should.equal('#puppet');
			o.list[0].users.should.equal('1058');
			o.list[0].topic.should.equal('Puppet Enterprise 3.1.0: http://bit.ly/PE_31 | Puppet 3.3.2: http://bit.ly/QUjTW0 |  Help: http://{ask,docs}.puppetlabs.com | Bugs & Feature Requests: http://bit.ly/aoNNEP');
			done();
		});
	});
});

describe('banlist event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":leguin.freenode.net 367 rickibalboa #ircanywhere *!*@91.210.* rickibalboa!~ricki@unaffiliated/rickibalboa 1387220316:\r\n", 'utf-8');
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
			o.banlist[0].setby.should.equal('rickibalboa!~ricki@unaffiliated/rickibalboa');
			o.banlist[0].hostname.should.equal('*!*@91.210.*');
			done();
		});
	});
});

describe('user mode event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":testbot MODE testbot :+i\r\n", 'utf-8');
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
			o.mode.should.equal('+i');
			done();
		});
	});
});

describe('mode event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rothfuss.freenode.net 324 testbot #ircanywhere-test +nst\r\n", 'utf-8');
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
			o.channel.should.equal('#ircanywhere-test');
			o.mode.should.equal('+nst');
			done();
		});
	});
});

describe('mode change event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa MODE #ircanywhere-test +i\r\n", 'utf-8');
		}, 0);
	});

	it('mode object should have correct format', function (done) {
		Events.once('key.mode_change', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'channel', 'mode');
			done();
		});
	});

	it('channel and mode should be correct', function (done) {
		Events.once('key.mode_change', function(o) {
			o.channel.should.equal('#ircanywhere-test');
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.mode.should.equal('+i');
			done();
		});
	});
});

describe('join event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa JOIN #ircanywhere-test\r\n", 'utf-8');
		}, 0);
	});

	it('join object should have correct format', function (done) {
		Events.once('key.join', function(o) {
			o.should.have.properties('channel', 'username', 'hostname', 'nickname');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.join', function(o) {
			o.channel.should.equal('#ircanywhere-test');
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
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa PART #ircanywhere-test :with a message\r\n", 'utf-8');
		}, 0);
	});

	it('part object should have correct format', function (done) {
		Events.once('key.part', function(o) {
			o.should.have.properties('channel', 'username', 'hostname', 'nickname', 'message');
			done();
		});
	});

	it('channel and nick should be correct', function (done) {
		Events.once('key.part', function(o) {
			o.channel.should.equal('#ircanywhere-test');
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			done();
		});
	});

	it('message should be correct', function (done) {
		Events.once('key.part', function(o) {
			o.message.should.equal('with a message');
			done();
		});
	});
});

describe('kick event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa KICK #ircanywhere-test testbot :bye mate\r\n", 'utf-8');
		}, 0);
	});

	it('kick object should have correct format', function (done) {
		Events.once('key.kick', function(o) {
			o.should.have.properties('channel', 'username', 'hostname', 'nickname', 'kicked', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.kick', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.channel.should.equal('#ircanywhere-test');
			o.kicked.should.equal('testbot');
			o.message.should.equal('bye mate');
			done();
		});
	});
});

describe('quit event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa QUIT :Ping timeout: 240 seconds\r\n", 'utf-8');
		}, 0);
	});

	it('quit object should have correct format', function (done) {
		Events.once('key.quit', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.quit', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.message.should.equal('Ping timeout: 240 seconds');
			done();
		});
	});
});

describe('invite event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa INVITE testbot :#ircanywhere-test\r\n", 'utf-8');
		}, 0);
	});

	it('invite object should have correct format', function (done) {
		Events.once('key.invite', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'channel');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.invite', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.channel.should.equal('#ircanywhere-test');
			done();
		});
	});
});

describe('away/unaway event as per away-notify', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa AWAY :im going away\r\n", 'utf-8');
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa AWAY :\r\n", 'utf-8');
		}, 0);
	});

	it('away object should have correct format', function (done) {
		Events.once('key.away', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'message');
			done();
		});
	});

	it('unaway object should have correct format', function (done) {
		Events.once('key.unaway', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname');
			o.should.not.have.property('message');
			done();
		});
	});

	it('away values should be correct', function (done) {
		Events.once('key.away', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.message.should.equal('im going away');
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
});

describe('privmsg event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa PRIVMSG #ircanywhere-test :hey there, this is a privmsg\r\n", 'utf-8');
		}, 0);
	});

	it('privmsg object should have correct format', function (done) {
		Events.once('key.privmsg', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'target', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.privmsg', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.target.should.equal('#ircanywhere-test');
			o.message.should.equal('hey there, this is a privmsg');
			done();
		});
	});
});

describe('notice event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa NOTICE testbot :hi, just sending you a notice\r\n", 'utf-8');
		}, 0);
	});

	it('notice object should have correct format', function (done) {
		Events.once('key.notice', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'target', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.notice', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.target.should.equal('testbot');
			o.message.should.equal('hi, just sending you a notice');
			done();
		});
	});
});

describe('action event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa PRIVMSG #ircanywhere-test :+ACTION hey just an action test here\r\n", 'utf-8');
		}, 0);
	});

	it('action object should have correct format', function (done) {
		Events.once('key.action', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'target', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.action', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.target.should.equal('#ircanywhere-test');
			o.message.should.equal('hey just an action test here');
			done();
		});
	});
});

describe('ctcp request event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa PRIVMSG testbot :+VERSION\r\n", 'utf-8');
		}, 0);
	});

	it('ctcp request object should have correct format', function (done) {
		Events.once('key.ctcp_request', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'type', 'target');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.ctcp_request', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.type.should.equal('VERSION');
			o.target.should.equal('testbot');
			done();
		});
	});
});

describe('ctcp response event', function () {
	beforeEach(function() {
		setTimeout(function() {
			socket.connection.impl.rewrite(":rickibalboa!~ricki@unaffiliated/rickibalboa NOTICE testbot :VERSION HexChat 2.9.5 [x64] / Windows 8 [3.43GHz]\r\n", 'utf-8');
		}, 0);
	});

	it('ctcp response object should have correct format', function (done) {
		Events.once('key.ctcp_response', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'type', 'target', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		Events.once('key.ctcp_response', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.type.should.equal('VERSION');
			o.target.should.equal('testbot');
			o.message.should.equal('HexChat 2.9.5 [x64] / Windows 8 [3.43GHz]');
			done();
		});
	});
});