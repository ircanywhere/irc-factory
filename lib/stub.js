var EEProto = require('events').EventEmitter.prototype;

var create = function (prototype, properties) {
	if (typeof properties !== 'object') {
		return Object.create(prototype);
	}

	var props = {};
	Object.keys(properties).forEach(function (key) {
		props[key] = { value: properties[key] };
	});
	return Object.create(prototype, props);
};

var GenericMockSocket = module.exports = function GenericMockSocket () {
	return create(EEProto, {
		connect : function () {
			this.emit('connect');
			setTimeout((function () {
				for (var msg in GenericMockSocket.messages) {
					this.emit('data', GenericMockSocket.messages[msg] + "\r\n");
				}
				this.isConnected = true;
			}).bind(this), 0);
		},
		end : function () { this.emit('close'); },
		write : function () { },
		setNoDelay : function () { },
		setEncoding : function () { }
	});
};