var fs = require('fs'),
	Api = require(__dirname + '/api').Api,
	api = new Api(),
	options = {
		events: parseInt(process.env.EVENTS_PORT) || 31920,
		rpc: parseInt(process.env.RPC_PORT) || 31930
	};
// recreate the api class because we're now over in a different process
// which is going to be non accessible by the initial application

fs.writeFile(__dirname + '/../irc-factory.pid', cp.pid, function(err) {
	if (err) {
		throw err;
	}
});
// write to file

api.setupServer(options);