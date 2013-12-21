# irc-factory [![Build Status](https://travis-ci.org/ircanywhere/irc-factory.png)](https://travis-ci.org/ircanywhere/irc-factory) [![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/ircanywhere/irc-factory/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

**Some stress tests have been done** [Click here](https://github.com/ircanywhere/irc-factory/wiki/Stress-Tests)

A rebuilt irc-factory from [irc-socket](https://github.com/Havvy/irc-socket) and [irc-message](https://github.com/expr/irc-message), irc-factory was originally based on [node-irc](https://github.com/martynsmith/node-irc), however it got hacked away at and eventually turned into a half functional slow pile of junk.

I decided on the task of re-designing it from the ground up for the new [ircanywhere](https://github.com/ircanywhere/ircanywhere/tree/0.2.0). It's built ontop of a two rapid barebone irc socket and irc parsing libraries, it has a similar api to node-irc but ultimately has almost none of the bulk of it. The main difference between node-irc is that it's primary design is to allow for long running irc clients, which means you can seperate your program and irc client processes to allow for instant resumes.

Installation and usage docs are in the [wiki](https://github.com/ircanywhere/irc-factory/wiki/Setup-&-Usage).