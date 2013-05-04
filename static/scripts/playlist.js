define(['jquery', 'socket', 'player', 'jquery-ui'], function ($, socket, player) {

	player.onStateChange(function (event) {
		if (event.data == YT.PlayerState.ENDED) {
			var current = $('#playlist tr.playing');
			var next = current.is(':last-child') ? $('#playlist tr:first') : current.next();
			playEntry(next);
		}
	});

	function playEntry(next) {
		$('#playlist tr.playing').removeClass('playing');
		next.addClass('playing');
		player.getPlayer().loadVideoById(next.attr('data-id'));
	}

	function updatePlayList() {
		var list = $('#playlist tr').map(function() { return $(this).attr('data-id'); }).get();
		socket.emit('updatePlayList', list);
	}

	function addToPlayList(id){
		$('#playlist tbody').append('<tr data-id="'+id+'"><td>Loading...</td><td>Loading...</td><td><button class="close">&times;</button></td></tr>');

		$.ajax({
			url: "http://gdata.youtube.com/feeds/api/videos/"+id+"?v=2&alt=json",
			dataType: "jsonp",
			success: function (data) {
				$('#playlist tr[data-id='+id+'] td:nth-child(1)').text(data.entry.title.$t);
				$('#playlist tr[data-id='+id+'] td:nth-child(2)').text(data.entry.media$group.yt$duration.seconds);
			}
		});
	}

	$(document).ready(function() {
		$("#playlist").sortable({
			containment: 'parent',
			distance: 10,
			items: 'tr',
			scroll: true,
			tolerance: 'pointer',
			update: function(event, ui) {
				updatePlayList();
			},
		});
	});

	$('#add').click(function () {
		var id = prompt('Enter a YouTube video ID:');
		if (id) {
			addToPlayList(id);
			updatePlayList();
		}
	});

	socket.on('refreshPlayList', function(list) {
		$('#playlist tbody').empty();
		list.forEach(function(item) { addToPlayList(item); });
	});

	socket.on('requestPlayList', function(){
		updatePlayList();
	});

	$(function() {

		$('#playlist').on('click', 'button.close', function () {
			$(this).closest('tr').remove();
			updatePlayList();
			return false;
		});

		$('#playlist').on('click', 'tr', function () {
			playEntry($(this));
		});

	});

});
