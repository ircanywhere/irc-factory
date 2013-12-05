/*var EEProto = require('events').EventEmitter.prototype;

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
};*/

var events = require('events'),
	stream = require('stream'),
	sinon = require('sinon');

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

var GenericMockSocket = create(events.EventEmitter.prototype, {
	_connected : false,
	_data : [],
	_stream: new stream.Stream(),

	connect : function () {
		this.emit('connect');

		setTimeout((function () {
			for (var msg in this._data) {
				this.emit('data', this._data[msg] + "\r\n");
			}
			this._data.length = 0;
			this._connected = true;
		}).bind(this), 0);
	},

	end : function () {
		this.emit('close');
	},

	write : function () {

	},

	setNoDelay : function () {

	},

	setEncoding : function () {

	}
});

GenericMockSocket._stream.writable = true;
GenericMockSocket._stream.write = function (data) {
	if (GenericMockSocket._connected) {
		GenericMockSocket.emit('data', data + "\r\n");
	} else {
		GenericMockSocket._data.push(data);
	}
	return true;
};

module.exports.Socket = function() { return GenericMockSocket; };
module.exports.Stream = GenericMockSocket._stream;