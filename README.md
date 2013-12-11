# irc-factory [![Build Status](https://travis-ci.org/ircanywhere/irc-factory.png)](https://travis-ci.org/ircanywhere/irc-factory)

A rebuilt irc-factory from [simple-irc-socket](https://github.com/Havvy/simple-irc-socket) and [irc-message](https://github.com/expr/irc-message), irc-factory was originally based on [node-irc](https://github.com/martynsmith/node-irc), however it got hacked away at and eventually turned into a half functional slow pile of junk.

I decided on the task of re-designing it from the ground up for the new [ircanywhere](https://github.com/ircanywhere/ircanywhere/tree/0.2.0). It's built ontop of a two rapid barebone irc socket and irc parsing libraries, it has a similar api to node-irc but ultimately has almost none of the bulk of it. The main difference between node-irc is that it's primary design is to allow for long running irc clients, which means you can seperate your program and irc client processes to allow for instant resumes.

## API

The api functions are documented below. You can include the api in your project like so;

```
var ircFactory = require('irc-factory');
var api = new ircFactory.Api();
```

### api.createClient(key, object, [dummy])

The following function will create a non-long running client, if you just want to create a normal bot or a client for testing then you should use this, if you want a client that survives between shutdowns, you'll need to jump to [api.fork()](#apiforkexit). The dummy parameter is optional and is mainly used for testing, it can be ignored. Each client has to have a unique key, you could generate a hash of the client object and pass it in or something similar.

```
var client = api.createClient('unique-client-key', {
	nick : 'testbot',
	user : 'testuser',
	server : 'irc.freenode.net',
	realname: 'realbot',
	port: 6667,
	secure: false
});
```

This function returns an object which contains a key `irc` which is an instance of [Client](#client), we can use this to directly control the client.

### api.destroyClient(key)

Clients can be destroyed by sending their key into this command, true or false will be returned on success.  Any events will need to be unhooked automatically, the 'close' event will most likely be sent out if the client is connected and then destroyed.

```
var destroyed = api.destroyClient('unique-client-key');
```

### api.hookEvent(key, event, callback, [once])

IRC events come in down the pipe and are converted into usable objects, theres a lot of events, it could be a good idea to look in [test/irc.js](https://github.com/ircanywhere/irc-factory/blob/master/test/irc.js) for them, any unparsed events are sent as unknown and just contain the standard irc-message object. Wildcards can be used to subscribe to all events.

```
api.hookEvent('unique-client-key', 'registered', function(object) {
	console.log(object);
});
```
The above code would subscribe to the registered event which is sent out when 001 is recieved, the object would look like:

```
{
	nickname: 'simpleircbot',
	time: '2013-12-10T19:48:14.992Z'
}
```

### api.unhookEvent(key, event, [callback])

Events can be unhooked by sending the exact same parameters in as you did with hookEvent, you can remove all events for that user by emitting the `callback` parameter.

### api.fork([exit])

This is where the fun stuff happens, when we call this function it goes off in the background and forks and detaches itself. If you set `exit` to `true` it will close itself. If you choose `false` which you're probably going to want to do if you're including irc-factory in your project, when your process dies, your irc clients wont.

So the interface for controlling clients is  a little different once we've forked, what happens when it's forked is two communication lines are fired up on ports `31920` and `31930`. An example of how to create a client and listen to events are is below;

```
var axon = require('axon'),
	incoming = axon.socket('pull'),
	outgoing = axon.socket('pub-emitter');

axon.codec.define('json', {
	encode: JSON.stringify,
	decode: JSON.parse
});
// setup a json codec

incoming.connect(31920);
incoming.format('json');
// setup our incoming connection

outgoing.connect(31930);
// setup our outgoing connection

incoming.on('message', function(msg){
	console.log(msg);
});
// handle incoming events, we don't use an event emitter because
// of the fact we want queueing.

setTimeout(function() {
	outgoing.emit('createClient', 'test', {
		nick : 'simpleircbot',
		user : 'testuser',
		server : 'irc.freenode.net',
		realname: 'realbot',
		port: 6667,
		secure: false
	});
}, 1500);
// create a client
```

The following commands are available to be sent down the pipe, they only take one command and it's the parameters sent as an object.

### outgoing.emit('createClient', key, client, [dummy])

This function is an alias of `api.createClient` with the difference being that all events are automatically hooked onto and come down the `incoming` pipe, if your program closes, when you reconnect any events that were sent will be queued and sent down the pipe to you.

### outgoing.emit('destroyClient', key)

This function is a direct alias of `api.destroyClient` all hooks will also be removed when this is called.

### outgoing.emit('call', key, function, params)

This function lets us call a method in the `Client` object any method can be called even private ones which are prefixed with `_` however beware of what you are doing, it's most commonly used for calling the methods `raw`, `me`, `ctcp` etc. `params` takes an array of the parameters that will be passed into the function call.

## Client

The following functions are available and they're fairly self explanatory.

### Client.raw(line)

This function lets us pass a raw line into the irc socket, we can either send a normal raw irc line without the linebreaks at the end or send an array in of a string seperated by spaces.

`Client.raw('PRIVMSG #ircanywhere :hey there');` or `Client.raw(['PRIVMSG', '#ircanywhere', 'hey there']);`

### Client.me(target, message)

This function lets us send a /me action to the specified target, being a channel or user.

`Client.me('#ircanywhere', 'this will be sent as /me');`


### Client.ctcp(target, type, message)

This function lets us send a ctcp response to a person, we can listen to ctcp requests by hooking onto the `ctcp_request` event and responsing to versions etc with this, an example is below;

`Client.ctcp('rickibalboa', 'VERSION', 'irc-factory x.x');`

### Client.disconnect(message)

The following function will disconnect the user from the irc server sending the `message` as a quit message, the `close` event will be emitted when the client quits. If the client is already disconnected nothing will happen and the `close` event will be re-emitted so any client can alter their state accordingly.

`Client.disconnect('quitting');`

### Client.reconnect()

Reconnect will connect a client if its disconnected, if it's connected it will disconnect that client. It's advised to call `Client.connection.isConnected()` if you want to check before you attempt a reconnect.

`Client.reconnect();`