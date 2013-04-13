(function () {
	$('.noscript-hide').removeClass('noscript-hide');

	var socket = io.connect();

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

	$('#chatform').submit(function() {
		var input = $('#chatinput');
		socket.emit('chat', input.val());
		input.val('');
		return false;
	});

	var updateChatButton = function(event) {
		if ($('#chatinput').val() == '') {
			$('#chatbutton').attr('disabled', 'disabled');
		} else {
			$('#chatbutton').removeAttr('disabled');
		}
	};

	updateChatButton();

	$('#chatinput').keyup(updateChatButton).keydown(updateChatButton).change(updateChatButton);

	socket.on('chat', function(data) {
		var div = $('#chatbox');
		div.append($('<li>').append($('<strong>').text(data.name + ': ')).append($('<span>').text(data.text)));
		div.animate({ scrollTop: div.prop('scrollHeight') - div.height() }, 1);
	});

	socket.on('list', function(list) {
		$('#chatlist').empty();
		$.each(list, function(index, item) {
			var div = $('#chatlist');
			div.append($('<li>').append($('<strong>').text(item)));
		});
	});

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
		sendUpdate();
	});

	$(function(){
		var loggedIn = $('.logged-in');
		var loggedOut = $('.logged-out');
		var loginDropdown = $('#login-dropdown');
		var loginForm = loginDropdown.find('form');
		var loginButton = loginForm.find('button[type=submit]');
		var loginError = loginForm.find('.text-error');

		loginForm.submit(function() {
			loginButton.button('loading');
			loginError.slideUp('fast');
			$(this).ajaxSubmit(function(res) {
				loginButton.button('reset');
				if (res.success) {
					loginForm.trigger('reset');
					loggedOut.fadeOut(null, function() {
						loggedIn.fadeIn();
					});
					loginDropdown.removeClass('open');
				} else {
					loginError.slideDown('fast');
				}
			});
			return false;
		});

		var register = $('#register');
		var registerForm = register.find('form');
		var registerButton = register.find('button[type=submit]');

		registerForm.submit(function() {
			registerButton.button('loading');
			registerForm.find('.error').slideUp('fast', function() {
				$(this).remove();
			});
			$(this).ajaxSubmit(function(res) {
				registerButton.button('reset');
				if (res.success) {
					registerForm.trigger('reset');
					register.modal('hide');
					loggedOut.fadeOut(null, function() {
						loggedIn.fadeIn();
					});
				} else {
					registerForm.find('input').after(function() {
						var error = res[$(this).attr('name')];
						if (!error) { return; }
						var elem = $('<div>').addClass('error').addClass('help-block').text(error);
						elem.slideDown('fast');
						return elem;
					});
				}
			});
			return false;
		});

		register.on('hidden', function() {
			registerForm.trigger('reset');
			registerForm.find('.error').remove();
		});

		$('#logout').click(function() {
			$.ajax({ url: '/logout' }).done(function() {
				loggedIn.fadeOut(null, function() {
					loggedOut.fadeIn();
				});
			});
			return false;
		});

		$('#change').click(function() {
			var result = prompt('Enter a YouTube video ID:');
			if (result) {
				player.loadVideoById(result);
			}
		});

		$('#nickname').click(function() {
			var result = prompt('Enter a new nickname:');
			if (result) {
				socket.emit('nickname', result);
			}
		});
	});
})();
