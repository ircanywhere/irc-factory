var Api = require(__dirname + '/api').Api,
	api = new Api();
// recreate the api class because we're now over in a different process
// which is going to be non accessible by the initial application

api.setupServer();