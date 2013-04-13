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

require(['jquery', 'socket', 'chat', 'login'], function ($, socket) {
	$('.noscript-hide').removeClass('noscript-hide');

	var tag = document.createElement('script');

	tag.src = 'https://www.youtube.com/iframe_api';
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	var width = $('#player').width();

	var player;
	window.onYouTubeIframeAPIReady = function () {
		player = new YT.Player('player', {
			height: width * (9 / 16),
			width: width,
			videoId: 'U7mPqycQ0tQ',
			events: {
				'onReady': onPlayerReady,
				'onStateChange': onPlayerStateChange
			}
		});
	};

	function onPlayerReady(event) {
		player.getVideoId = function() { return player.j.videoData.video_id; }

		socket.on('pause', function(data) {
			if (data.videoId !== player.getVideoId()) {
				player.loadVideoById(data.videoId, data.timestamp);
			}
			player.seekTo(data.timestamp, true);
			player.pauseVideo();
		});

		socket.on('play', function(data) {
			if (data.videoId !== player.getVideoId()) {
				player.loadVideoById(data.videoId, data.timestamp);
			}
			if (canSeekTo(data.timestamp)) {
				player.seekTo(data.timestamp, true);
			}
			player.playVideo();
		});

		socket.on('requestUpdate', function() {
			sendUpdate();
		});

		sendUpdate();
	}

	function onPlayerStateChange(event) {
		sendUpdate();
	}

	function sendUpdate() {
		socket.emit('update',
			player.getPlayerState(),
			player.getCurrentTime(),
			player.getVideoId(),
			player.getVideoLoadedFraction()
		);
	}

	function canSeekTo(timestamp) {
		return Math.abs(player.getCurrentTime() - timestamp) >= 1;
	}

	socket.on('reconnect', function() {
		sendUpdate();
	});

	$(function(){
		$('#change').click(function() {
			var result = prompt('Enter a YouTube video ID:');
			if (result) {
				player.loadVideoById(result);
			}
		});
	});
});
