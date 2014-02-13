var cluster = require('cluster'),
	domain = require('domain'),
	Api = require(__dirname + '/api').Api,
	api = new Api(),
	cpus = 2,//require('os').cpus().length;
	options = {
		events: parseInt(process.env.EVENTS_PORT) || 31920,
		rpc: parseInt(process.env.RPC_PORT) || 31930
	};
// recreate the api class because we're now over in a different process
// which is going to be non accessible by the initial application

// ========================================
// setup the cluster as a master or slave

if (cluster.isMaster) {
	for (var i = 0; i < cpus; i++) {
		cluster.fork();
	}
	// fork for how many cpus there are

	cluster.on('fork', function(worker) {
		api.emit('worker_connect', {id: worker.id});
	});

	cluster.on('disconnect', function(worker) {
		api.emit('worker_disconnect', {id: worker.id});
		cluster.fork();
	});
	// handle disconnects by re-forking and sending an event
	// to any clients
} else {
	api.setupServer(options, cluster.worker);
}
// ========================================