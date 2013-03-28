/**
 * Module dependencies.
 */

var connect = require('connect')
  , cookie = require('cookie');

/**
 * Get the Session associated with this socket's handshake.
 * The callback is of form `fn(err, sess)`.
 *
 * @param {Socket} socket
 * @param {Store} store
 * @param {String} key
 * @param {String} secret
 * @param {Function} fn
 * @api public
 */

exports.load = function(socket, store, key, secret, fn) {
	if (socket.handshake.headers.cookie) {
		var parsed = cookie.parse(socket.handshake.headers.cookie);
		if (key in parsed) {
			var sid = connect.utils.parseSignedCookie(parsed[key], secret);
			if (sid) {
				store.load(sid, function(err, sess) {
					if (err) {
						fn(err);
					} else {
						if (sess) {
							sess.touch();
						}
						fn(err, sess);
					}
				});
			} else {
				fn(new Error('Session key signature doesn\'t match secret key.'));
			}
		} else {
			fn(null, null);
		}
	} else {
		fn(null, null);
	}
};
