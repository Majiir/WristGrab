require.config({
	shim: {
		'bootstrap': {
			deps: ['jquery'],
		},
		'jquery.form': {
			deps: ['jquery'],
		},
		'socketio': {
			exports: 'io',
		},
	},
	paths: {
		'bootstrap': '../js/bootstrap.min',
		'socketio': '../socket.io/socket.io',
	},
});

require(['jquery', 'socket', 'chat', 'login', 'player'], function ($, socket) {
	$('.noscript-hide').removeClass('noscript-hide');
});
