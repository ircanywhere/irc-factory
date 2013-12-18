var Api = require(__dirname + '/api').Api,
	api = new Api(),
	options = {
		incoming: process.env.INCOMING_PORT || 31930,
		outgoing: process.env.OUTGOING_PORT || 31920
	};
// recreate the api class because we're now over in a different process
// which is going to be non accessible by the initial application

api.setupServer(options);