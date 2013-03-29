/**
 * Module dependencies.
 */

var connect = require('connect')
  , cookie = require('cookie');

/**
 * Get the Session associated with this socket's handshake.
 * The callback is of form `fn(err, sess)`.
 *
 * @param {Object} handshake
 * @param {Store} store
 * @param {String} key
 * @param {String} secret
 * @param {Function} fn
 * @api public
 */

exports.load = function (handshake, store, key, secret, fn) {
	if (!handshake.headers.cookie) { return fn(null, null); }
	var parsed = cookie.parse(handshake.headers.cookie);
	if (!(key in parsed)) { return fn(null, null); }
	var sid = connect.utils.parseSignedCookie(parsed[key], secret);
	if (!sid) { return fn(new Error("Session key signature doesn't match secret key.")); }
	store.load(sid, function (err, sess) {
		if (err) { return fn(err); }
		if (sess) { sess.touch(); }
		return fn(err, sess);
	});
};
