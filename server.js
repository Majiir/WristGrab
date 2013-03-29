/**
 * Module dependencies.
 */

var connect = require('connect')
  , http = require('http')
  , ioSession = require('./socketio-sessions.js');

/**
 * Map inversion.
 * See: http://nelsonwells.net/2011/10/swap-object-key-and-values-in-javascript/
 */

var invert = function (obj) {
	var new_obj = {};
	for (var prop in obj) {
		if(obj.hasOwnProperty(prop)) {
			new_obj[obj[prop]] = prop;
		}
	}
	return new_obj;
};

/**
 * YouTube player states.
 * See: https://developers.google.com/youtube/iframe_api_reference#Events
 */

var states = {
	UNSTARTED: -1,
	ENDED: 0,
	PLAYING: 1,
	PAUSED: 2,
	BUFFERING: 3,
	CUED: 5
};

var stateNames = invert(states);

console.log(stateNames);

/**
 * Configuration.
 */

var config = {
	file: {
		cache: 30,
		path: './static',
	},
	server: {
		ip: '0.0.0.0',
		port: 1337,
	},
	session: {
		key: 'sid',
		maxAge: 60 * 1000,
		secret: 'secret_key_here',
		store: new connect.middleware.session.MemoryStore(),
	},
};

/**
 * Servers.
 */

var file = new(require('node-static').Server)(config.file.path, { cache: config.file.cache });

var server = http.createServer(connect()
	.use(connect.cookieParser())
	.use(connect.session({ cookie: { maxAge: config.session.maxAge }, key: config.session.key, secret: config.session.secret, store: config.session.store }))
	.use(function (req, res) {
		file.serve(req, res, function (err, result) {
			if (err) {
				res.writeHead(err.status, err.headers);
				res.end('Error ' + err.status + '\n');
			} else {
				console.log(result.status + ': ' + req.method + ' ' + req.url);
			}
		});
	})
);

var io = require('socket.io').listen(server);
server.listen(config.server.port, config.server.ip);

/**
 * Socket events.
 */

io.sockets.on('connection', function (socket) {
	
	ioSession.load(socket.handshake, config.session.store, config.session.key, config.session.secret, function(err, sess) {
		if (err) {
			console.log(err);
		} else {
			if (sess) {
				console.log('Successfully loaded session from socket connection!');
				console.log(sess);
			} else {
				console.log('No session found! (not an error)');
			}
		}
	});
	
	socket.on('update', function(data) {
		console.log(
			'Status: ' + stateNames[data.status] + '   ' +
			'\tTime: ' + data.time.toFixed(2) +
			'\tLoaded: ' + data.loaded.toFixed(3)
		);
		if (socket.handshake.address.address == '127.0.0.1') {
			if (data.status == states.PAUSED || data.status == states.BUFFERING) {
				socket.broadcast.emit('pause', { timestamp: data.time });
			} else if (data.status == states.PLAYING) {
				socket.broadcast.emit('play', { timestamp: data.time });
			}
		}
	});

	socket.on('chat', function(data) {
		io.sockets.emit('chat', { text: data.text, name: socket.handshake.address.address });
	});
	
});

/**
 * Logging.
 */

console.log('Server listening on ' + config.server.ip + ':' + config.server.port + '...');
