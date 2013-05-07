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

define('jquery.ui.sortable', ['jquery-ui']);

require(['jquery'], function ($) {
	$('.noscript-hide').removeClass('noscript-hide');
});

require(['player']);

require(['jquery', 'knockout', 'chat', 'login', 'playlist'], function ($, ko, chat, login, playlist) {
	$(function(){
		ko.applyBindings({
			chat: chat.viewModel,
			login: login.viewModel,
			playlist: playlist.viewModel,
		});
	});
});
