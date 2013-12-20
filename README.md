# irc-factory [![Build Status](https://travis-ci.org/ircanywhere/irc-factory.png)](https://travis-ci.org/ircanywhere/irc-factory) [![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/ircanywhere/irc-factory/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

**Some stress tests have been done** [Click here](https://github.com/ircanywhere/irc-factory/wiki/Stress-Tests)

A rebuilt irc-factory from [irc-socket](https://github.com/Havvy/irc-socket) and [irc-message](https://github.com/expr/irc-message), irc-factory was originally based on [node-irc](https://github.com/martynsmith/node-irc), however it got hacked away at and eventually turned into a half functional slow pile of junk.

I decided on the task of re-designing it from the ground up for the new [ircanywhere](https://github.com/ircanywhere/ircanywhere/tree/0.2.0). It's built ontop of a two rapid barebone irc socket and irc parsing libraries, it has a similar api to node-irc but ultimately has almost none of the bulk of it. The main difference between node-irc is that it's primary design is to allow for long running irc clients, which means you can seperate your program and irc client processes to allow for instant resumes.

## API

The api functions are documented below. You can include the api in your project like so;

```javascript
var ircFactory = require('irc-factory');
var api = new ircFactory.Api();
```

### api.createClient(key, object, [dummy])

The following function will create a non-long running client, if you just want to create a normal bot or a client for testing then you should use this, if you want a client that survives between shutdowns, you'll need to jump to [api.fork()](#apiforkexit). The dummy parameter is optional and is mainly used for testing, it can be ignored. Each client has to have a unique key, you could generate a hash of the client object and pass it in or something similar.

```javascript
var client = api.createClient('unique-client-key', {
	nick : 'testbot',
	user : 'testuser',
	server : 'irc.freenode.net',
	realname: 'realbot',
	port: 6667,
	secure: false
});
```

The following options are available, most of them are optional apart from the first 5, all the booleans default to false:
```json
{
	"nick": "irc nickname",
	"user": "irc username",
	"realname": "irc realname",
	"server": "the irc server to connect to",
	"port": "the port to connect on",
	"secure": "whether to use ssl",
	"capab": "whether to start the negotiation with CAP LS, required for sasl",
	"sasl": "whether to authenticate with sasl",
	"saslUsername": "optional username to identify with, if omitted it will use the value in user",
	"password": "if sasl is enabled this is the sasl password, if not it is a standard server password",
	"retryCount": "how many times to retry connecting if disconnected, default is 10",
	"retryWait": "how long to wait in ms between reconnects, default is 1000"
}
```

This function returns an object which contains a key `irc` which is an instance of [Client](#client), we can use this to directly control the client.

### api.destroyClient(key)

Clients can be destroyed by sending their key into this command, true or false will be returned on success.  Any events will need to be unhooked automatically, the 'close' event will most likely be sent out if the client is connected and then destroyed.

```javascript
var destroyed = api.destroyClient('unique-client-key');
```

### api.hookEvent(key, event, callback, [once])

IRC events come in down the pipe and are converted into usable objects, theres a lot of events, it could be a good idea to look in [test/irc.js](https://github.com/ircanywhere/irc-factory/blob/master/test/irc.js) for them, any unparsed events are sent as unknown and just contain the standard irc-message object. Wildcards can be used to subscribe to all events.

```javascript
api.hookEvent('unique-client-key', 'registered', function(object) {
	console.log(object);
});
```
The above code would subscribe to the registered event which is sent out when 001 is recieved, the object would look like:

```json
{
	"nickname": "simpleircbot",
	"time": "2013-12-10T19:48:14.992Z"
}
```

### api.unhookEvent(key, event, [callback])

Events can be unhooked by sending the exact same parameters in as you did with hookEvent, you can remove all events for that user by emitting the `callback` parameter.

### api.fork([exit], [options])

This is where the fun stuff happens, when we call this function it goes off in the background and forks and detaches itself. If you set `exit` to `true` it will close itself. If you choose `false` which you're probably going to want to do if you're including irc-factory in your project, when your process dies, your irc clients wont.

So the interface for controlling clients is a little different once we've forked, what happens when it's forked is two communication lines are fired up on ports `31920` and `31930`. An example of how to create a client and listen to events is in the [example.js](https://github.com/ircanywhere/irc-factory/blob/master/example.js) file.

### api.setupServer([options])

Alternatively, if you want to setup a multi-client relay server without forking the process but keeping the RPC interface. You can do so by calling this command directly, the difference between this and `fork()` is that all the IRC clients will die when your process dies, with `fork()` they will not.

### api.connect([options])

On your end-user you should be calling this function to connect to the relay and interact with your IRC clients. This function handles the connecting to the RPC server you created via either one of the above functions. You can handle your own socket errors to determine whether to start a server on a `ECONNREFUSED` code.

Alternatively, you can automatically setup the RPC server on `api.connect()` by setting `options.handleErrors = true`. This will setup a server on it's own when it cannot connect. The `options.fork` boolean will determine whether to setup the server with `fork()` or `setupServer()`. Note that you will want to set that value to `true` if you want to take advantage of persistant clients. An example of this is at [example.js](https://github.com/ircanywhere/irc-factory/blob/master/example.js).

Options takes two parameters;

```json
{
	"events": 31920,
	"rpc": 31930,
	"automaticSetup": true,
	"fork": true
}
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

```javascript
Client.raw('PRIVMSG #ircanywhere :hey there');
// or
Client.raw(['PRIVMSG', '#ircanywhere', 'hey there']);
```

### Client.privmsg(target, message)

Sends a message to a channel or a user, no need to write the : anywhere

### Client.notice(target, message)

Sends a notice to a target

### Client.join(channel, [password])

Joins a channel, you can supply an optional password

### Client.part(channel, [message])

Leaves a channel, you can also provide a part message

### Client.mode(target, mode)

Sets the mode on a target, you can set modes on yourself and channels, and if others if your ircd allows it and uses the same syntax

### Client.topic(channel, topic)

Set a channel's topic

### Client.me(target, message)

This function lets us send a /me action to the specified target, being a channel or user.

```javascript
Client.me('#ircanywhere', 'this will be sent as /me');
```

### Client.ctcp(target, type, message)

This function lets us send a ctcp response to a person, we can listen to ctcp requests by hooking onto the `ctcp_request` event and responsing to versions etc with this, an example is below;

```javascript
Client.ctcp('rickibalboa', 'VERSION', 'irc-factory x.x');
```

### Client.disconnect(message)

The following function will disconnect the user from the irc server sending the `message` as a quit message, the `close` event will be emitted when the client quits. If the client is already disconnected nothing will happen and the `close` event will be re-emitted so any client can alter their state accordingly.

```javascript
Client.disconnect('quitting');
```

### Client.reconnect()

Reconnect will connect a client if its disconnected, if it's connected it will disconnect that client. It's advised to call `Client.connection.isConnected()` if you want to check before you attempt a reconnect.

```javascript
Client.reconnect();
```
