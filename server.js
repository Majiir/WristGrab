/**
 * Module dependencies.
 */

var connect = require('connect')
  , crypto = require('crypto')
  , dispatch = require('dispatch')
  , http = require('http')
  , lessMiddleware = require('less-middleware')
  , quip = require('quip')
  , ioSession = require('socket.io-session');

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
 * Database.
 */

var db = require('chaos')('./data');

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
		maxAge: 60 * 60 * 1000,
		secret: 'secret_key_here',
		store: new connect.middleware.session.MemoryStore(),
	},
};

/**
 * Form validation.
 */

var form = require('form');

var registerForm = form.create({
	username: [
		form.validator(form.Validator.len, 4, 32, 'Username must be 4-32 characters.'),
		form.validator(form.Validator.is, /^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/, 'Username may only contain A-Z, a-z, 0-9 and spaces.'),
	],
	password: [
		form.validator(form.Validator.len, 6, 64, 'Password must be 6-64 characters.'),
	],
	email: [
		form.validator(form.Validator.isEmail, 'Please enter a valid e-mail address.'),
	],
});

/**
 * Servers.
 */

var file = new(require('node-static').Server)(config.file.path, { cache: config.file.cache });

var server = http.createServer(connect()
	.use(connect.cookieParser())
	.use(connect.session({ cookie: { maxAge: config.session.maxAge }, key: config.session.key, secret: config.session.secret, store: config.session.store }))
	.use(function (req, res, next) {
		if (req.session) {
			req.session = getConnectedSession(req.session);
		}
		next();
	})
	.use(connect.bodyParser())
	.use(quip())
	.use(dispatch({
		'POST /login': function (req, res, next) {
			db.get('user:' + (req.body.username || '').toLowerCase(), function (err, user) {
				var hash = crypto.createHash('sha1').update(req.body.password).digest('binary');
				var success = user && user.hash === hash;
				res.json({ success: success });
				if (success) {
					updateSessionUser(req.session, user);
				}
			});
		},
		'POST /register': function (req, res, next) {
			registerForm.process(req.body, function(err, data) {
				if (err) {
					res.json(err);
					return;
				}
				db.get('user:' + data.username.toLowerCase(), function (err, val) {
					if (val) { res.json({ username: 'Username is already in use.' }); return; }

					var user = {
						username: data.username,
						hash: crypto.createHash('sha1').update(data.password).digest('binary'),
						email: data.email,
					};

					db.set('user:' + data.username.toLowerCase(), user, function (err) {
						res.json({ success: true });
					});

					updateSessionUser(req.session, user);
				});
			});
		},
		'POST /logout': function(req, res, next) {
			updateSessionUser(req.session, null, function() {
				res.status(204).send();
			});
		}
	}))
	.use(lessMiddleware({
		paths: [
			'./node_modules/bootstrap/less',
			'./node_modules/bootswatch',
		],
		dest: './static',
		src: './less',
	}))
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

/**
 * User utility methods.
 */

function updateSessionUser (session, user, callback) {
	session.user = user;
	session.save(callback);
	sendSessionUser(session);
	updateList();
}

/**
 * Socket authorization.
 */

function getConnectedSession(sess) {
	var socket = io.sockets.clients().filter(function (sock) { return sock.handshake.session.id == sess.id; }).shift();
	if (!socket) { return sess; }
	return socket.handshake.session;
}

io.configure(function () {
	io.set('authorization', ioSession(connect.cookieParser(config.session.secret), config.session.store, config.session.key, function (handshake, callback) {
		if (handshake.session) {
			handshake.session = getConnectedSession(handshake.session);
			callback(null, true);
		} else {
			callback(new Error("Couldn't load session for socket connection."));
		}
	}));
});

/**
 * Socket events.
 */

function connected(socket) {
	return !socket.disconnected && !socket.disconnecting;
}

function getSocketNickname(socket) {
	var user = socket.handshake.session.user;
	return (user ? user.username : 'Guest') + (isLeader(socket) ? '*' : '');
}

function updateList() {
	var list = io.sockets.clients()
		.filter(connected)
		.map(getSocketNickname);
	io.sockets.emit('list', list);
}

function sendSessionUser(session) {
	io.sockets.clients()
		.filter(function (socket) { return socket.handshake.session === session; })
		.forEach(sendSocketUser);
}

function sendSocketUser(socket) {
	var user = socket.handshake.session.user;
	socket.emit('user', user ? user.username : null);
}

function isLeader(socket) {
	return socket.handshake.address.address == '127.0.0.1';
}

io.sockets.on('connection', function (socket) {

	updateList();
	sendSocketUser(socket);

	io.sockets.clients().filter(isLeader).forEach(function (sock) {
		sock.emit('requestPlayList');
	});

	socket.on('update', function (status, time, videoId, loaded) {
		console.log(
			'Status: ' + stateNames[status] + '   ' +
			'\tTime: ' + time.toFixed(2) +
			'\tVideo: ' + videoId +
			'\tLoaded: ' + loaded.toFixed(3)
		);
		if (isLeader(socket)) {
			socket.broadcast.emit(status == states.PLAYING ? 'play' : 'pause', { timestamp: time, videoId: videoId });
		} else {
			if (status == states.PLAYING || status == states.CUED || status == states.UNSTARTED || status == states.ENDED) {
				io.sockets.clients().filter(isLeader).forEach(function (sock) {
					sock.emit('requestUpdate');
				});
			}
		}
	});

	socket.on('chat', function (text) {
		io.sockets.emit('chat', { text: text, name: getSocketNickname(socket) });
	});

	socket.on('disconnect', function() {
		socket.disconnecting = true;
		updateList();
	});

	socket.on('updatePlayList', function(list, index) {
		if(isLeader(socket)) {
			socket.broadcast.emit('refreshPlayList', list, index);
		}
	});

});

/**
 * Listening.
 */

server.listen(config.server.port, config.server.ip);
console.log('Server listening on ' + config.server.ip + ':' + config.server.port + '...');
