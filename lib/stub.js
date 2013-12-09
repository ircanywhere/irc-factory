var events = require('events'),
	util = require('util'),
	_ = require('lodash');
 
function ReadWriteStream() {
	events.EventEmitter.call(this);
	this.readable = true;
	this.writable = true;
}
 
util.inherits(ReadWriteStream, events.EventEmitter);
 
['end', 'error', 'close', 'setEncoding', 'pause', 'resume', 'destroy', 'drain', 'write', {name: 'rewrite', event: 'data'}, 'destroySoon'].forEach(function(func) {
	ReadWriteStream.prototype[func.name || func] = (function(func) {
		var event = func.event || func;
		return function() {
			var args = Array.prototype.slice.call(arguments);
			args.unshift(event);
			this.emit.apply(this, args);
		};
	}(func));
});

function ReadWriteNetStream(specialTimeout) {
	this.specialTimeout = specialTimeout || false;
	ReadWriteStream.call(this);
	this.bufferSize = 0;
	this.remoteAddress = '';
	this.remotePort = '';
	this.bytesRead = '';
	this.bytesWritten = '';
}
 
util.inherits(ReadWriteNetStream, ReadWriteStream);

// Net.Socket
['connect', 'setSecure', 'setTimeout', 'setNoDelay', 'setKeepAlive', 'address', 'timeout'].forEach(function(funcName) {
	ReadWriteNetStream.prototype[funcName.name || funcName] = (function(func) {
		var event = funcName.event || func;
		return function(a, b) {
			if (this.specialTimeout && funcName === 'setTimeout' && _.isFunction(b)) {
				this.on('timeout', b);
			}
			var args = Array.prototype.slice.call(arguments);
			args.unshift(event);
			this.emit.apply(this, args);
		};
	}(funcName));
});

module.exports.ReadWriteStream = ReadWriteStream;
module.exports.ReadWriteNetStream = ReadWriteNetStream;