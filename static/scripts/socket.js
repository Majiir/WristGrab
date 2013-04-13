define(['jquery', 'socketio'], function ($, io) {

	var socket = io.connect();

	socket.on('disconnect', function() {
		$('#disconnected').slideDown();
	});

	socket.on('reconnect', function() {
		$('#disconnected').fadeOut('fast', function() {
			$('#reconnected').fadeIn('fast');
			setTimeout(function() {
				$('#reconnected').slideUp('slow');
			}, 1000);
		});
	});

	return socket;

});
