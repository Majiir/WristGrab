define(['jquery', 'socket'], function ($, socket) {

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

	$(function(){
		$('#nickname').click(function() {
			var result = prompt('Enter a new nickname:');
			if (result) {
				socket.emit('nickname', result);
			}
		});
	});

});
