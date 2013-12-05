var should = require('should'),
	MockSocket = require('../lib/stub.js').Socket,
	Stream = require('../lib/stub.js').Stream,
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

describe('registered event', function () {
	function setup() {
		Stream.write(':sendak.freenode.net 001 testbot :Welcome to the Test IRC Network testbot!testuser@localhost');
		var socket = new Client('key', network, MockSocket);
	};

	it('registered event should have nickname property', function (done) {
		setup();
		Events.once('key.registered', function(o) {
			o.should.have.property('nickname');
			done();
		});
	});

	it('registered event nickname property should equal testbot', function (done) {
		setup();
		Events.once('key.registered', function(o) {
			o.nickname.should.equal('testbot');
			done();
		});
	});
});

describe('capabilities event', function () {
	function setup() {
		Stream.write(':sendak.freenode.net 004 testbot moorcock.freenode.net ircd-seven-1.1.3 DOQRSZaghilopswz CFILMPQSbcefgijklmnopqrstvz bkloveqjfI');
		Stream.write(':sendak.freenode.net 005 testbot CHANTYPES=# EXCEPTS INVEX CHANMODES=eIbq,k,flj,CFLMPQScgimnprstz CHANLIMIT=#:120 PREFIX=(ov)@+ MAXLIST=bqeI:100 MODES=4 NETWORK=freenode KNOCKSTATUSMSG=@+ CALLERID=g :are supported by this server');
		Stream.write(':sendak.freenode.net 005 testbot CASEMAPPING=rfc1459 CHARSET=ascii NICKLEN=16 CHANNELLEN=50 TOPICLEN=390 ETRACE CPRIVMSG CNOTICE DEAF=D MONITOR=100 FNC TARGMAX=NAMES:1,LIST:1,KICK:1,WHOIS:1,PRIVMSG:4,NOTICE:4,ACCEPT:,MONITOR: :are supported by this server');
		Stream.write(':sendak.freenode.net 005 testbot EXTBAN=$,arxz WHOX CLIENTVER=3.0 SAFELIST ELIST=CTU :are supported by this server');
		var socket = new Client('key', network, MockSocket);
	};

	it('capabilities event should have correct object format', function (done) {
		setup();
		Events.once('key.capabilities', function(o) {
			o.should.have.property('channel');
			o.channel.should.have.properties('idlength', 'limit', 'modes', 'prefixes', 'types');
			o.should.have.properties('kicklength', 'maxlist', 'maxtargets', 'modes', 'modeForPrefix', 'prefixForMode', 'nicklength', 'topiclength', 'usermodes', 'name');
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

describe('motd event', function () {
	function setup() {
		Stream.write(':sendak.freenode.net 375 testbot :- sendak.freenode.net Message of the Day -');
		Stream.write(':sendak.freenode.net 372 testbot :- Welcome to moorcock.freenode.net in Texas, USA. Thanks to');
		Stream.write(':sendak.freenode.net 372 testbot :- Kodingen (http://kodingen.com) for sponsoring this server!');
		Stream.write(':sendak.freenode.net 376 testbot :End of /MOTD command.');
		var socket = new Client('key', network, MockSocket);
	};

	it('motd should be correct', function (done) {
		setup();
		Events.once('key.motd', function(o) {
			o.should.eql(['- sendak.freenode.net Message of the Day -',
				'- Welcome to moorcock.freenode.net in Texas, USA. Thanks to',
				'- Kodingen (http://kodingen.com) for sponsoring this server!',
				'End of /MOTD command.']);
			done();
		});
	});
});

describe('topic event', function () {
	function setup() {
		Stream.write(':sendak.freenode.net 332 testbot #ircanywhere :IRCAnywhere, moved to freenode. Development has restarted using meteor.js in 0.2.0 branch https://github.com/ircanywhere/ircanywhere/tree/0.2.0');
		Stream.write(':sendak.freenode.net 333 testbot #ircanywhere rickibalboa!~ricki@unaffiliated/rickibalboa 1385050715');
		var socket = new Client('key', network, MockSocket);
	};

	it('topic event should have correct object format', function (done) {
		setup();
		Events.once('key.topic', function(o) {
			o.should.have.properties('channel', 'topic', 'topicBy');
			done();
		});
	});

	it('channel should be correct', function (done) {
		setup();
		Events.once('key.topic', function(o) {
			o.channel.should.equal('#ircanywhere');
			done();
		});
	});

	it('topic should be correct', function (done) {
		setup();
		Events.once('key.topic', function(o) {
			o.topic.should.have.equal('IRCAnywhere, moved to freenode. Development has restarted using meteor.js in 0.2.0 branch https://github.com/ircanywhere/ircanywhere/tree/0.2.0');
			done();
		});
	});

	it('topic setter should be correct', function (done) {
		setup();
		Events.once('key.topic', function(o) {
			o.topicBy.should.have.equal('rickibalboa!~ricki@unaffiliated/rickibalboa');
			done();
		});
	});
});

describe('names event', function () {
	function setup() {
		Stream.write(':sendak.freenode.net 353 testbot = #ircanywhere :testbot Not-002 @rickibalboa @Gnasher Venko [D3M0N] lyska @ChanServ LoganLK JakeXKS Techman TkTech zz_Trinexx Tappy');
		Stream.write(':sendak.freenode.net 366 testbot #ircanywhere :End of /NAMES list.');
		var socket = new Client('key', network, MockSocket);
	};

	it('names event should have correct object format', function (done) {
		setup();
		Events.once('key.names', function(o) {
			o.should.have.properties('channel', 'names');
			done();
		});
	});

	it('channel should be correct', function (done) {
		setup();
		Events.once('key.names', function(o) {
			o.channel.should.equal('#ircanywhere');
			done();
		});
	});

	it('names array should be correct', function (done) {
		setup();
		Events.once('key.names', function(o) {
			o.names.should.have.eql(['testbot', 'Not-002', '@rickibalboa',  '@Gnasher', 'Venko', '[D3M0N]', 'lyska', '@ChanServ', 'LoganLK', 'JakeXKS',  'Techman', 'TkTech', 'zz_Trinexx', 'Tappy' ]);
			done();
		});
	});
});

describe('who event', function () {
	function setup() {
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere ~testuser unaffiliated/testbot sendak.freenode.net testbot H :0 realuser');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere ~notifico 198.199.82.216 hubbard.freenode.net Not-002 H :0 Notifico! - http://n.tkte.ch/');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere ~ricki unaffiliated/rickibalboa leguin.freenode.net rickibalboa H@ :0 Ricki');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere Three host-92-3-234-146.as43234.net card.freenode.net Gnasher H@ :0 Dave');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere venko Colchester-LUG/Legen.dary rothfuss.freenode.net Venko H :0 venko');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere ~D3M0N irc.legalizeourmarijuana.us leguin.freenode.net [D3M0N] H :0 The Almighty D3V1L!');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere ~lyska op.op.op.oppan.ganghamstyle.pw hobana.freenode.net lyska H :0 Sam Dodrill <niichan@ponychat.net>');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere ChanServ services. services. ChanServ H@ :0 Channel Services');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere ~LoganLK 162.243.133.98 rothfuss.freenode.net LoganLK H :0 Logan');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere sid15915 gateway/web/irccloud.com/x-uvcbvvujowjeeaga leguin.freenode.net JakeXKS G :0 Jake');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere sid11863 gateway/web/irccloud.com/x-qaysfvklhrsppher leguin.freenode.net Techman G :0 Michael Hazell');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere ~TkTech irc.tkte.ch kornbluth.freenode.net TkTech H :0 TkTech');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere ~Trinexx tecnode-gaming.com wolfe.freenode.net zz_Trinexx H :0 Jake');
		Stream.write(':sendak.freenode.net 352 testbot #ircanywhere ~Tappy 2605:6400:2:fed5:22:fd8f:98fd:7a74 morgan.freenode.net Tappy H :0 Tappy');
		Stream.write(':sendak.freenode.net 315 testbot #ircanywhere :End of /WHO list.');
		var socket = new Client('key', network, MockSocket);
	};

	it('who event should have correct object format', function (done) {
		setup();
		Events.once('key.who', function(o) {
			o.should.have.properties('channel', 'who');
			done();
		});
	});

	it('channel should be correct', function (done) {
		setup();
		Events.once('key.who', function(o) {
			o.channel.should.equal('#ircanywhere');
			done();
		});
	});

	it('who array should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':sendak.freenode.net 311 testbot rickibalboa ~ricki unaffiliated/rickibalboa * :Ricki');
		Stream.write(':sendak.freenode.net 319 testbot rickibalboa :@#ircanywhere');
		Stream.write(':sendak.freenode.net 312 testbot rickibalboa leguin.freenode.net :Ume?, SE, EU');
		Stream.write(':sendak.freenode.net 671 testbot rickibalboa :is using a secure connection');
		Stream.write(':sendak.freenode.net 330 testbot rickibalboa rickibalboa :is logged in as');
		Stream.write(':sendak.freenode.net 318 testbot rickibalboa :End of /WHOIS list.');
		var socket = new Client('key', network, MockSocket);
	};

	it('whois event should have correct object format', function (done) {
		setup();
		Events.once('key.whois', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'realname', 'channels', 'server', 'serverinfo', 'secure');
			done();
		});
	});

	it('whois object should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':adams.freenode.net 364 testbot services. adams.freenode.net :1 Atheme IRC Services');
		Stream.write(':adams.freenode.net 364 testbot adams.freenode.net adams.freenode.net :0 Budapest, HU, EU');
		Stream.write(':adams.freenode.net 365 testbot * :End of /LINKS list.');
		var socket = new Client('key', network, MockSocket);
	};

	it('links object should have correct format', function (done) {
		setup();
		Events.once('key.links', function(o) {
			o.should.have.properties('links');
			done();
		});
	});

	it('values should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':leguin.freenode.net 322 testbot #puppet 1058 :Puppet Enterprise 3.1.0: http://bit.ly/PE_31 | Puppet 3.3.2: http://bit.ly/QUjTW0 |  Help: http://{ask,docs}.puppetlabs.com | Bugs & Feature Requests: http://bit.ly/aoNNEP');
		Stream.write(':leguin.freenode.net 322 testbot ##linux 1368 : Welcome to ##Linux! Freenode\'s general Linux support/discussion channel. | Channel website and rules: http://www.linuxassist.net | Our pastebin http://paste.linuxassist.net | Spammers or trolls? use !ops <troll\'s nick> <reason>". | For op assistance, join ##linux-ops. Feel at home and enjoy your stay.');
		Stream.write(':leguin.freenode.net 322 testbot #git 1082 :Welcome to #git, the place for git-related help and tomato soup | Current stable version: 1.8.5.1 | Start here: http://jk.gs/git | Seeing \"Cannot send to channel\" or unable to change nick? /msg gitinfo .voice | git-hg: Don\'t you know that\'s poison?');
		Stream.write(':leguin.freenode.net 323 testbot :End of /LIST');
		var socket = new Client('key', network, MockSocket);
	};

	it('list object should have correct format', function (done) {
		setup();
		Events.once('key.list', function(o) {
			o.should.have.properties('list');
			done();
		});
	});

	it('list object should be correct', function (done) {
		setup();
		Events.once('key.list', function(o) {
			o.list.should.have.a.lengthOf(3);
			o.list[0].channel.should.equal('#puppet');
			o.list[0].users.should.equal('1058');
			o.list[0].topic.should.equal('Puppet Enterprise 3.1.0: http://bit.ly/PE_31 | Puppet 3.3.2: http://bit.ly/QUjTW0 |  Help: http://{ask,docs}.puppetlabs.com | Bugs & Feature Requests: http://bit.ly/aoNNEP');
			done();
		});
	});
});

describe('user mode event', function () {
	function setup() {
		Stream.write(':testbot MODE testbot :+i');
		var socket = new Client('key', network, MockSocket);
	};

	it('mode object should have correct format', function (done) {
		setup();
		Events.once('key.usermode', function(o) {
			o.should.have.properties('nickname', 'mode');
			done();
		});
	});

	it('nick and mode should be correct', function (done) {
		setup();
		Events.once('key.usermode', function(o) {
			o.nickname.should.equal('testbot');
			o.mode.should.equal('+i');
			done();
		});
	});
});

describe('mode event', function () {
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa MODE #ircanywhere-test +i');
		var socket = new Client('key', network, MockSocket);
	};

	it('mode object should have correct format', function (done) {
		setup();
		Events.once('key.mode', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'channel', 'mode');
			done();
		});
	});

	it('channel and mode should be correct', function (done) {
		setup();
		Events.once('key.mode', function(o) {
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
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa JOIN #ircanywhere-test');
		var socket = new Client('key', network, MockSocket);
	};

	it('join object should have correct format', function (done) {
		setup();
		Events.once('key.join', function(o) {
			o.should.have.properties('channel', 'username', 'hostname', 'nickname');
			done();
		});
	});

	it('values should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa PART #ircanywhere-test :with a message');
		var socket = new Client('key', network, MockSocket);
	};

	it('part object should have correct format', function (done) {
		setup();
		Events.once('key.part', function(o) {
			o.should.have.properties('channel', 'username', 'hostname', 'nickname', 'message');
			done();
		});
	});

	it('channel and nick should be correct', function (done) {
		setup();
		Events.once('key.part', function(o) {
			o.channel.should.equal('#ircanywhere-test');
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			done();
		});
	});

	it('message should be correct', function (done) {
		setup();
		Events.once('key.part', function(o) {
			o.message.should.equal('with a message');
			done();
		});
	});
});

describe('kick event', function () {
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa KICK #ircanywhere-test testbot :bye mate');
		var socket = new Client('key', network, MockSocket);
	};

	it('kick object should have correct format', function (done) {
		setup();
		Events.once('key.kick', function(o) {
			o.should.have.properties('channel', 'username', 'hostname', 'nickname', 'kicked', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa QUIT :Ping timeout: 240 seconds');
		var socket = new Client('key', network, MockSocket);
	};

	it('quit object should have correct format', function (done) {
		setup();
		Events.once('key.quit', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa INVITE testbot :#ircanywhere-test');
		var socket = new Client('key', network, MockSocket);
	};

	it('invite object should have correct format', function (done) {
		setup();
		Events.once('key.invite', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'channel');
			done();
		});
	});

	it('values should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa AWAY :im going away');
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa AWAY :');
		var socket = new Client('key', network, MockSocket);
	};

	it('away object should have correct format', function (done) {
		setup();
		Events.once('key.away', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'message');
			done();
		});
	});

	it('unaway object should have correct format', function (done) {
		setup();
		Events.once('key.unaway', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname');
			o.should.not.have.property('message');
			done();
		});
	});

	it('away values should be correct', function (done) {
		setup();
		Events.once('key.away', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			o.message.should.equal('im going away');
			done();
		});
	});

	it('unaway values should be correct', function (done) {
		setup();
		Events.once('key.unaway', function(o) {
			o.nickname.should.equal('rickibalboa');
			o.username.should.equal('~ricki');
			o.hostname.should.equal('unaffiliated/rickibalboa');
			done();
		});
	});
});

describe('privmsg event', function () {
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa PRIVMSG #ircanywhere-test :hey there, this is a privmsg');
		var socket = new Client('key', network, MockSocket);
	};

	it('privmsg object should have correct format', function (done) {
		setup();
		Events.once('key.privmsg', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'target', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa NOTICE testbot :hi, just sending you a notice');
		var socket = new Client('key', network, MockSocket);
	};

	it('notice object should have correct format', function (done) {
		setup();
		Events.once('key.notice', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'target', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa PRIVMSG #ircanywhere-test :+ACTION hey just an action test here');
		var socket = new Client('key', network, MockSocket);
	};

	it('action object should have correct format', function (done) {
		setup();
		Events.once('key.action', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'target', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa PRIVMSG testbot :+VERSION');
		var socket = new Client('key', network, MockSocket);
	};

	it('ctcp request object should have correct format', function (done) {
		setup();
		Events.once('key.ctcp_request', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'type', 'target');
			done();
		});
	});

	it('values should be correct', function (done) {
		setup();
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
	function setup() {
		Stream.write(':rickibalboa!~ricki@unaffiliated/rickibalboa NOTICE testbot :VERSION HexChat 2.9.5 [x64] / Windows 8 [3.43GHz]');
		var socket = new Client('key', network, MockSocket);
	};

	it('ctcp response object should have correct format', function (done) {
		setup();
		Events.once('key.ctcp_response', function(o) {
			o.should.have.properties('nickname', 'username', 'hostname', 'type', 'target', 'message');
			done();
		});
	});

	it('values should be correct', function (done) {
		setup();
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