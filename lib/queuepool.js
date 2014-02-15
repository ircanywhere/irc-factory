var pausequeue = require('pause-queue'),
	_ = require('lodash'),
	api = require(__dirname + '/api').Api,
	Queues = {};

function QueuePool() {
	
};

// ========================================
// these functions provide a way to push a new client into the queue, this means
// we can send 1000 clients to boot up, but in the old code they would do it at once
// which just wouldn't work, we now queue it with time in between.

QueuePool.prototype.queueJob = function(server, qid, key, fn) {
	var queue = this.queueExists(server);

	queue.push({key: key, qid: qid}, fn);
	// here we take the server hostname, just directly so irc.freenode.org and chat.freenode.org
	// are different. We have individual queues for hostnames so we can pause that queue if we've
	// hit the throttling limit for that server or network
};

QueuePool.prototype.queueExists = function(server) {
	server = server.toLowerCase();

	if (!Queues[server]) {
		Queues[server] = pausequeue(function(task, done) {
			setTimeout(done, 1000);
			// we don't get to the next item until we wait 1.5 seconds
		}, 1);
	}

	return Queues[server];
	// checks if a queue exists, creates or returns an existing queue
};

QueuePool.prototype.queueLength = function(server) {
	return this.queueExists(server).length() + 1;
};

QueuePool.prototype.queuePause = function(server) {
	var queue = this.queueExists(server);

	if (!queue.paused) {
		queue.pause();
		// pause the queue

		setTimeout(function() {
			queue.tasks = _.sortBy(queue.tasks, function(task) {
				return task.data.qid;
			});
			// make sure its re-sorted via the time of insert

			queue.resume();
		}, 30000);
		// attempt to try and start again in 30 seconds
		// generally we've no idea how long the servers throttle wait is, default is 60
		// but incase of it being less we can just try 30, that way if it is something like
		// 30 we're not losing 30 seconds of potential reconnect time
	}
};
// ========================================

exports.QueuePool = new QueuePool();