require.config({
	shim: {
		'bootstrap': {
			deps: ['jquery', 'jquery-ui'],
		},
		'jquery.form': {
			deps: ['jquery'],
		},
		'jquery-ui': {
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

require(['jquery'], function ($) {
	$('.noscript-hide').removeClass('noscript-hide');
});

require(['login', 'player', 'playlist']);

require(['jquery', 'knockout', 'chat'], function ($, ko, chat) {
	$(function(){
		ko.applyBindings({
			chat: chat.viewModel,
		});
	});
});
