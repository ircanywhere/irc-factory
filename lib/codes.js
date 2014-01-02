module.exports = {
	'001': 'RPL_WELCOME',
	'002': 'RPL_YOURHOST',          // RFC2812
	'003': 'RPL_CREATED',           // RFC2812
	'004': 'RPL_MYINFO',            // RFC2812
	'005': 'RPL_ISUPPORT',          // draft-brocklesby-irc-isupport-03
	'008': 'RPL_SNOMASK',           // ircu
	'009': 'RPL_STATMEMTOT',        // ircu
	'010': 'RPL_REDIR',             // ratbox
	'014': 'RPL_YOURCOOKIE',        // IRCnet
	'015': 'RPL_MAP',               // ircu
	'016': 'RPL_MAPMORE',           // ircu
	'017': 'RPL_MAPEND',            // ircu
	'020': 'RPL_CONNECTING',        // IRCnet
	'042': 'RPL_YOURID',            // IRCnet
	'043': 'RPL_SAVENICK',          // IRCnet
	'050': 'RPL_ATTEMPTINGJUNC',    // aircd
	'051': 'RPL_ATTEMPTINGREROUTE', // aircd

	'200': 'RPL_TRACELINK',         // RFC1459
	'201': 'RPL_TRACECONNECTING',   // RFC1459
	'202': 'RPL_TRACEHANDSHAKE',    // RFC1459
	'203': 'RPL_TRACEUNKNOWN',      // RFC1459
	'204': 'RPL_TRACEOPERATOR',     // RFC1459
	'205': 'RPL_TRACEUSER',         // RFC1459
	'206': 'RPL_TRACESERVER',       // RFC1459
	'207': 'RPL_TRACECAPTURED',     // hybrid (RFC2812 TRACESERVICE)
	'208': 'RPL_TRACENEWTYPE',      // RFC1459
	'209': 'RPL_TRACECLASS',        // RFC2812
	'210': 'RPL_STATS',             // aircd (single stats reply)
	'211': 'RPL_STATSLINKINFO',     // RFC1459
	'212': 'RPL_STATSCOMMANDS',     // RFC1459
	'213': 'RPL_STATSCLINE',        // RFC1459
	'214': 'RPL_STATSNLINE',        // RFC1459
	'215': 'RPL_STATSILINE',        // RFC1459
	'216': 'RPL_STATSKLINE',        // RFC1459
	'217': 'RPL_STATSQLINE',        // RFC1459
	'218': 'RPL_STATSYLINE',        // RFC1459
	'219': 'RPL_ENDOFSTATS',        // RFC1459

	'220': 'RPL_STATSPLINE',        // hybrid
	'221': 'RPL_UMODEIS',           // RFC1459
	'222': 'RPL_SQLINE_NICK',       // DALnet
	'223': 'RPL_STATSGLINE',        // Unreal
	'224': 'RPL_STATSFLINE',        // hybrid
	'225': 'RPL_STATSDLINE',        // hybrid
	'226': 'RPL_STATSALINE',        // hybrid
	'227': 'RPL_STATSVLINE',        // Unreal
	'228': 'RPL_STATSCCOUNT',       // hybrid

	'231': 'RPL_SERVICEINFO',       // RFC1459
	'233': 'RPL_SERVICE',           // RFC1459
	'234': 'RPL_SERVLIST',          // RFC1459
	'235': 'RPL_SERVLISTEND',       // RFC1459
	'239': 'RPL_STATSIAUTH',        // IRCnet

	'241': 'RPL_STATSLLINE',        // RFC1459
	'242': 'RPL_STATSUPTIME',       // RFC1459
	'243': 'RPL_STATSOLINE',        // RFC1459
	'244': 'RPL_STATSHLINE',        // RFC1459
	'245': 'RPL_STATSSLINE',        // Bahamut, IRCnet, hybrid
	'247': 'RPL_STATSXLINE',        // hybrid
	'248': 'RPL_STATSULINE',        // hybrid
	'249': 'RPL_STATSDEBUG',        // hybrid

	'250': 'RPL_STATSCONN',         // ircu, Unreal, hybrid
	'251': 'RPL_LUSERCLIENT',       // RFC1459
	'252': 'RPL_LUSEROP',           // RFC1459
	'253': 'RPL_LUSERUNKNOWN',      // RFC1459
	'254': 'RPL_LUSERCHANNELS',     // RFC1459
	'255': 'RPL_LUSERME',           // RFC1459
	'256': 'RPL_ADMINME',           // RFC1459
	'257': 'RPL_ADMINLOC1',         // RFC1459
	'258': 'RPL_ADMINLOC2',         // RFC1459
	'259': 'RPL_ADMINEMAIL',        // RFC1459

	'261': 'RPL_TRACELOG',          // RFC1459
	'262': 'RPL_ENDOFTRACE',        // hybrid
	'263': 'RPL_LOAD2HI',           // hybrid
	'265': 'RPL_LOCALUSERS',        // aircd, Bahamut, hybrid
	'266': 'RPL_GLOBALUSERS',       // aircd, Bahamut, hybrid
	'267': 'RPL_START_NETSTAT',     // aircd
	'268': 'RPL_NETSTAT',           // aircd
	'269': 'RPL_END_NETSTAT',       // aircd

	'270': 'RPL_PRIVS',             // ircu
	'271': 'RPL_SILELIST',          // ircu
	'272': 'RPL_ENDOFSILELIST',     // ircu
	'275': 'RPL_WHOISSSL',          // oftc-hybrid
	'276': 'RPL_WHOISCERTFP',       // oftc-hybrid

	'280': 'RPL_GLIST',             // ircu
	'281': 'RPL_ACCEPTLIST',        // ratbox/chary
	'282': 'RPL_ENDOFACCEPT',       // ratbox/chary

	'300': 'RPL_NONE',              // RFC1459
	'301': 'RPL_AWAY',              // RFC1459
	'302': 'RPL_USERHOST',          // RFC1459
	'303': 'RPL_ISON',              // RFC1459
	'304': 'RPL_TEXT',              // hybrid
	'305': 'RPL_UNAWAY',            // RFC1459
	'306': 'RPL_NOWAWAY',           // RFC1459
	'307': 'RPL_WHOISNICKSERVREG',  // An issue of contention.
	'308': 'RPL_WHOISADMIN',        // hybrid

	'310': 'RPL_WHOISMODES',        // Plexus
	'311': 'RPL_WHOISUSER',         // RFC1459
	'312': 'RPL_WHOISSERVER',       // RFC1459
	'313': 'RPL_WHOISOPERATOR',     // RFC1459
	'314': 'RPL_WHOWASUSER',        // RFC1459
	'315': 'RPL_ENDOFWHO',          // RFC1459
	'316': 'RPL_WHOISCHANOP',       // reserved in rb/chary
	'317': 'RPL_WHOISIDLE',         // RFC1459
	'318': 'RPL_ENDOFWHOIS',        // RFC1459
	'319': 'RPL_WHOISCHANNELS',     // RFC1459

	'321': 'RPL_LISTSTART',         // RFC1459
	'322': 'RPL_LIST',              // RFC1459
	'323': 'RPL_LISTEND',           // RFC1459
	'324': 'RPL_CHANNELMODEIS',     // RFC1459
	'325': 'RPL_CHANNELMLOCK',      // sorircd 1.3
	'328': 'RPL_CHANNELURL',        // ratbox/chary
	'329': 'RPL_CREATIONTIME',      // Bahamut

	'330': 'RPL_WHOISLOGGEDIN',     // ratbox/chary
	'331': 'RPL_NOTOPIC',           // RFC1459
	'332': 'RPL_TOPIC',             // RFC1459
	'333': 'RPL_TOPICWHOTIME',      // ircu
	'337': 'RPL_WHOISTEXT',         // ratbox/chary
	'338': 'RPL_WHOISACTUALLY',     // Bahamut, ircu

	'340': 'RPL_USERIP',            // ircu
	'341': 'RPL_INVITING',          // RFC1459
	'342': 'RPL_SUMMONING',         // RFC1459
	'345': 'RPL_INVITED',           // GameSurge
	'346': 'RPL_INVITELIST',        // RFC2812
	'347': 'RPL_ENDOFINVITELIST',   // RFC2812
	'348': 'RPL_EXCEPTLIST',        // RFC2812
	'349': 'RPL_ENDOFEXCEPTLIST',   // RFC2812

	'351': 'RPL_VERSION',           // RFC1459
	'352': 'RPL_WHOREPLY',          // RFC1459
	'353': 'RPL_NAMREPLY',          // RFC1459
	'354': 'RPL_WHOSPCRPL',         // ircu

	'360': 'RPL_WHOWASREAL',        // ratbox/chary
	'361': 'RPL_KILLDONE',          // RFC1459
	'362': 'RPL_CLOSING',           // RFC1459
	'363': 'RPL_CLOSEEND',          // RFC1459
	'364': 'RPL_LINKS',             // RFC1459
	'365': 'RPL_ENDOFLINKS',        // RFC1459
	'366': 'RPL_ENDOFNAMES',        // RFC1459
	'367': 'RPL_BANLIST',           // RFC1459
	'368': 'RPL_ENDOFBANLIST',      // RFC1459
	'369': 'RPL_ENDOFWHOWAS',       // RFC1459

	'371': 'RPL_INFO',              // RFC1459
	'372': 'RPL_MOTD',              // RFC1459
	'373': 'RPL_INFOSTART',         // RFC1459
	'374': 'RPL_ENDOFINFO',         // RFC1459
	'375': 'RPL_MOTDSTART',         // RFC1459
	'376': 'RPL_ENDOFMOTD',         // RFC1459
	'378': 'RPL_WHOISHOST',         // charybdis

	'381': 'RPL_YOUREOPER',         // RFC1459
	'382': 'RPL_REHASHING',         // RFC1459
	'383': 'RPL_YOURESERVICE',      // RFC2812
	'384': 'RPL_MYPORTIS',          // RFC1459
	'385': 'RPL_NOTOPERANYMORE',    // AustHex, hybrid, Unreal
	'386': 'RPL_RSACHALLENGE',      // ratbox

	'391': 'RPL_TIME',              // RFC1459
	'392': 'RPL_USERSSTART',        // RFC1459
	'393': 'RPL_USERS',             // RFC1459
	'394': 'RPL_ENDOFUSERS',        // RFC1459
	'395': 'RPL_NOUSERS',           // RFC1459
	'396': 'RPL_HOSTHIDDEN',        // ircu

	'401': 'ERR_NOSUCHNICK',        // RFC1459
	'402': 'ERR_NOSUCHSERVER',      // RFC1459
	'403': 'ERR_NOSUCHCHANNEL',     // RFC1459
	'404': 'ERR_CANNOTSENDTOCHAN',  // RFC1459
	'405': 'ERR_TOOMANYCHANNELS',   // RFC1459
	'406': 'ERR_WASNOSUCHNICK',     // RFC1459
	'407': 'ERR_TOOMANYTARGETS',    // RFC1459
	'408': 'ERR_NOSUCHSERVICE',     // RFC2812
	'409': 'ERR_NOORIGIN',          // RFC1459

	'410': 'ERR_INVALIDCAPCMD',     // hybrid
	'411': 'ERR_NORECIPIENT',       // RFC1459
	'412': 'ERR_NOTEXTTOSEND',      // RFC1459
	'413': 'ERR_NOTOPLEVEL',        // RFC1459
	'414': 'ERR_WILDTOPLEVEL',      // RFC1459
	'415': 'ERR_BADMASK',           // RFC2812
	'416': 'ERR_TOOMANYMATCHES',    // ratbox

	'421': 'ERR_UNKNOWNCOMMAND',    // RFC1459
	'422': 'ERR_NOMOTD',            // RFC1459
	'423': 'ERR_NOADMININFO',       // RFC1459
	'424': 'ERR_FILEERROR',         // RFC1459
	'425': 'ERR_NOOPERMOTD',        // Unreal
	'429': 'ERR_TOOMANYAWAY',       // Bahamut

	'430': 'ERR_EVENTNICKCHANGE',   // AustHex
	'431': 'ERR_NONICKNAMEGIVEN',   // RFC1459
	'432': 'ERR_ERRONEUSNICKNAME',  // RFC1459
	'433': 'ERR_NICKNAMEINUSE',     // RFC1459
	'436': 'ERR_NICKCOLLISION',     // RFC1459
	'437': 'ERR_UNAVAILRESOURCE',   // hybrid
	'438': 'ERR_NICKTOOFAST',       // hybrid
	'439': 'ERR_TARGETTOOFAST',     // ircu

	'440': 'ERR_SERVICESDOWN',      // Bahamut, Unreal
	'441': 'ERR_USERNOTINCHANNEL',  // RFC1459
	'442': 'ERR_NOTONCHANNEL',      // RFC1459
	'443': 'ERR_USERONCHANNEL',     // RFC1459
	'444': 'ERR_NOLOGIN',           // RFC1459
	'445': 'ERR_SUMMONDISABLED',    // RFC1459
	'446': 'ERR_USERSDISABLED',     // RFC1459
	'447': 'ERR_NONICKCHANGE',      // Unreal
	'449': 'ERR_NOTIMPLEMENTED',    // ircu

	'451': 'ERR_NOTREGISTERED',     // RFC1459
	'455': 'ERR_HOSTILENAME',       // Unreal
	'456': 'ERR_ACCEPTFULL',        // hybrid
	'457': 'ERR_ACCEPTEXIST',       // hybrid
	'458': 'ERR_ACCEPTNOT',         // hybrid
	'459': 'ERR_NOHIDING',          // Unreal

	'460': 'ERR_NOTFORHALFOPS',     // Unreal
	'461': 'ERR_NEEDMOREPARAMS',    // RFC1459
	'462': 'ERR_ALREADYREGISTRED',  // RFC1459
	'463': 'ERR_NOPERMFORHOST',     // RFC1459
	'464': 'ERR_PASSWDMISMATCH',    // RFC1459
	'465': 'ERR_YOUREBANNEDCREEP',  // RFC1459
	'466': 'ERR_YOUWILLBEBANNED',   // RFC1459
	'467': 'ERR_KEYSET',            // RFC1459
	'469': 'ERR_LINKSET',           // Unreal

	'470': 'ERR_LINKCHANNEL',       // charybdis
	'471': 'ERR_CHANNELISFULL',     // RFC1459
	'472': 'ERR_UNKNOWNMODE',       // RFC1459
	'473': 'ERR_INVITEONLYCHAN',    // RFC1459
	'474': 'ERR_BANNEDFROMCHAN',    // RFC1459
	'475': 'ERR_BADCHANNELKEY',     // RFC1459
	'476': 'ERR_BADCHANMASK',       // RFC2812
	'477': 'ERR_NEEDREGGEDNICK',    // ratbox (REGONLYCHAN in hyb7)
	'478': 'ERR_BANLISTFULL',       // ircu
	'479': 'ERR_BADCHANNAME',       // hybrid

	'480': 'ERR_SSLONLYCHAN',       // ratbox
	'481': 'ERR_NOPRIVILEGES',      // RFC1459
	'482': 'ERR_CHANOPRIVSNEEDED',  // RFC1459
	'483': 'ERR_CANTKILLSERVER',    // RFC1459
	'484': 'ERR_ISCHANSERVICE',     // ratbox (ERR_RESTRICTED in hyb7)
	'485': 'ERR_BANNEDNICK',        // ratbox
	'488': 'ERR_TSLESSCHAN',        // IRCnet
	'489': 'ERR_VOICENEEDED',       // ircu

	'491': 'ERR_NOOPERHOST',        // RFC1459
	'492': 'ERR_NOSERVICEHOST',     // RFC1459
	'493': 'ERR_NOFEATURE',         // ircu
	'494': 'ERR_OWNMODE',           // Bahamut
	'495': 'ERR_BADLOGTYPE',        // ircu
	'496': 'ERR_BADLOGSYS',         // ircu
	'497': 'ERR_BADLOGVALUE',       // ircu
	'498': 'ERR_ISOPERLCHAN',       // ircu

	'501': 'ERR_UMODEUNKNOWNFLAG',  // RFC1459
	'502': 'ERR_USERSDONTMATCH',    // RFC1459
	'503': 'ERR_GHOSTEDCLIENT',     // hybrid
	'504': 'ERR_USERNOTONSERV',     // hybrid

	'513': 'ERR_WRONGPONG',         // hybrid
	'517': 'ERR_DISABLED',          // ircu
	'518': 'ERR_LONGMASK',          // ircu

	'521': 'ERR_LISTSYNTAX',        // hybrid
	'522': 'ERR_WHOSYNTAX',         // hybrid
	'523': 'ERR_WHOLIMITEXCEEDED',  // hybrid
	'524': 'ERR_HELPNOTFOUND',      // hybrid

	'670': 'RPL_STARTTLS',          // ircv3 tls-3.1
	'671': 'RPL_WHOISSECURE',       // Unreal

	'691': 'ERR_STARTTLS',          // ircv3 tls-3.2

	'702': 'RPL_MODLIST',           // hybrid
	'703': 'RPL_ENDOFMODLIST',      // hybrid
	'704': 'RPL_HELPSTART',         // hybrid
	'705': 'RPL_HELPTXT',           // hybrid
	'706': 'RPL_ENDOFHELP',         // hybrid
	'707': 'ERR_TARGCHANGE',        // ratbox

	'710': 'RPL_KNOCK',             // hybrid
	'711': 'RPL_KNOCKDLVR',         // hybrid
	'712': 'ERR_TOOMANYKNOCK',      // hybrid
	'713': 'ERR_CHANOPEN',          // hybrid
	'714': 'ERR_KNOCKONCHAN',       // hybrid
	'715': 'ERR_KNOCKDISABLED',     // hybrid
	'716': 'RPL_TARGUMODEG',        // hybrid
	'717': 'RPL_TARGNOTIFY',        // hybrid
	'718': 'RPL_UMODEGMSG',         // hybrid

	'720': 'RPL_OMOTDSTART',        // hybrid
	'721': 'RPL_OMOTD',             // hybrid
	'722': 'RPL_ENDOFOMOTD',        // hybrid
	'723': 'ERR_NOPRIVS',           // hybrid
	'724': 'RPL_TESTMASK',          // hybrid
	'725': 'RPL_TESTLINE',          // hybrid
	'726': 'RPL_NOTESTLINE',        // hybrid
	'727': 'RPL_TESTMASKGECOS',     // ratbox
	'728': 'RPL_QUIETLIST',			// charybdis
	'729': 'RPL_ENDOFQUIETLIST',	// charybdis

	'730': 'RPL_MONONLINE',         // ircv3 monitor ext
	'731': 'RPL_MONOFFLINE',        // ircv3 monitor ext
	'732': 'RPL_MONLIST',           // ircv3 monitor ext
	'733': 'RPL_ENDOFMONLIST',      // ircv3 monitor ext
	'734': 'ERR_MONLISTFULL',       // ircv3 monitor ext

	'740': 'RPL_RSACHALLENGE2',      // ratbox
	'741': 'RPL_ENDOFRSACHALLENGE2', // ratbox

	'900': 'RPL_SASLAUTHENTICATED',	 // charbydis / kiwiirc
	'903': 'RPL_SASLLOGGEDIN',		 // charbydis / kiwiirc
	'904': 'ERR_SASLNOTAUTHORISED',  // charbydis / kiwiirc
	'906': 'ERR_SASLABORTED',		 // charbydis / kiwiirc
	'907': 'ERR_SASLALREADYAUTHED'	 // charbydis / kiwiirc
};