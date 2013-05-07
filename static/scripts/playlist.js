define(['jquery', 'socket', 'player', 'knockout', 'jquery-ui'], function ($, socket, player, ko) {

	var videoInfoCache = {};
	var videoInfoRequests = {};

	function getVideoInfo(id, fn) {
		if (id in videoInfoCache) {
			fn(videoInfoCache[id]);
		} else if (id in videoInfoRequests) {
			videoInfoRequests[id].done(function (data) {
				fn(data);
			});
		} else {
			videoInfoRequests[id] = $.ajax({
				url: 'http://gdata.youtube.com/feeds/api/videos/' + id + '?v=2&alt=json',
				dataType: 'jsonp',
			}).done(function (data) {
				videoInfoCache[id] = data;
				delete videoInfoRequests[id];
				fn(data);
			});
		}
	}

	function VideoViewModel(id) {
		this.id = id;
	}

	function PlaylistViewModel() {

		var self = this;

		self.currentVideo = ko.observable();
		self.videos = ko.observableArray([]);

		self.addVideo = function() {
			var id = prompt('Enter a YouTube video ID:');
			if (id) {
				self.videos.push(new VideoViewModel(id));
			}
		};

		self.removeVideo = function(video) {
			self.videos.remove(video);
		};

		self.playVideo = function(video) {
			self.currentVideo(video);
			player.getPlayer().loadVideoById(video.id);
		};
	}

	var playlistViewModel = new PlaylistViewModel();

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
		updatePlayList();
		player.getPlayer().loadVideoById(next.attr('data-id'));
	}

	function updatePlayList() {
		var list = $('#playlist tr').map(function() { return $(this).attr('data-id'); }).get();
		socket.emit('updatePlayList', list, $('#playlist tr.playing').index());
	}

	function addToPlayList(id){
		$('#playlist tbody').append('<tr data-id="'+id+'"><td>Loading...</td><td>Loading...</td><td><button class="close">&times;</button></td></tr>');

		getVideoInfo(id, function (data) {
				$('#playlist tr[data-id='+id+'] td:nth-child(1)').text(data.entry.title.$t);
				$('#playlist tr[data-id='+id+'] td:nth-child(2)').text(data.entry.media$group.yt$duration.seconds);
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

	socket.on('refreshPlayList', function(list, index) {
		$('#playlist tbody').empty();
		list.forEach(function(item) { addToPlayList(item); });
		if (index < 0) { return; }
		$('#playlist tr').eq(index).addClass('playing');
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

	return {
		viewModel: playlistViewModel,
	};

});
