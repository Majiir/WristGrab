define(['jquery', 'socket'], function ($, socket) {

	var tag = document.createElement('script');

	tag.src = 'https://www.youtube.com/iframe_api';
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

	var player;
	window.onYouTubeIframeAPIReady = function () {
		player = new YT.Player('player', {
			videoId: 'U7mPqycQ0tQ',
			events: {
				'onReady': onPlayerReady,
				'onStateChange': onPlayerStateChange
			}
		});
	};

	function onPlayerReady(event) {
		player.getVideoId = function() { return player.k.videoData.video_id; }

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
		onStateChangeHandlers.forEach(function (fn) {
			fn(event);
		});
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

	onStateChangeHandlers = [];

	return {
		onStateChange: function (fn) {
			onStateChangeHandlers.push(fn);
		},

		getPlayer: function () {
			return player;
		},
	};

});
