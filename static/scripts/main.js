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

require(['jquery', 'chat', 'login', 'player'], function ($) {
	$('.noscript-hide').removeClass('noscript-hide');
});
