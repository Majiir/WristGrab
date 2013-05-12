define(['jquery', 'socket', 'player', 'knockout', 'knockout-sortable', 'bootstrap', 'jquery.form'], function ($, socket, player, ko) {

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

		var self = this;

		self.id = id;

		self.info = ko.observable();

		getVideoInfo(id, function (data) {
			self.info({
				title: data.entry.title.$t,
				duration: data.entry.media$group.yt$duration.seconds,
			});
		});

	}

	function PlaylistViewModel() {

		var self = this;

		self.currentVideo = ko.observable();
		self.videos = ko.observableArray([]);
		self.playlistName = ko.observable();

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

		self.savePlaylist = function(video) {
			var playlist = self.videos().map(function (video) { return video.id; });
			$.ajax({
				type: 'POST',
				url: '/playlist/save',
				data: { 'name': self.playlistName, 'playlist': playlist },
				dataType: 'json',
				success: function (data) { },
			});
		};

		self.loadPlaylist = function(video) {
			$.ajax({
				type: 'POST',
				url: '/playlist/load',
				data: { 'name': self.playlistName },
				dataType: 'json',
				success: function (data) {
					self.videos.removeAll();
					$.each(data.videos, function (index, id) {
						self.videos.push(new VideoViewModel(id));
					});
				},
			});
		};

	}

	var playlistViewModel = new PlaylistViewModel();

	player.onStateChange(function (event) {
		if (event.data == YT.PlayerState.ENDED) {
			var index = playlistViewModel.videos.indexOf(playlistViewModel.currentVideo());
			if (index < 0) { return; }
			var next = index + 1;
			if (next >= playlistViewModel.videos().length) {
				next = 0;
			}
			playlistViewModel.playVideo(playlistViewModel.videos()[next]);
		}
	});

	function updatePlayList() {
		socket.emit('updatePlayList',
			playlistViewModel.videos().map(function (video) { return video.id; }),
			playlistViewModel.videos.indexOf(playlistViewModel.currentVideo())
		);
	}

	playlistViewModel.currentVideo.subscribe(updatePlayList);
	playlistViewModel.videos.subscribe(updatePlayList);

	socket.on('refreshPlayList', function(list, index) {
		playlistViewModel.videos(list.map(function (id) { return new VideoViewModel(id); }));
		playlistViewModel.currentVideo(playlistViewModel.videos()[index]);
	});

	socket.on('requestPlayList', function(){
		updatePlayList();
	});

	$(function(){
		var saveForm = $('#playlistSave').find('form');
		var loadForm = $('playlistLoad').find('form');

		saveForm.submit(function() {
			return false;
		});

		loadForm.submit(function() {
			return false;
		});
	});

	$('.popover-markup>.trigger').popover({ 
		html : true,
		animation : true,
		placement : 'bottom',
		content: function() {
 			return $(this).parent().find('.content').html();
		}
	});

	return {
		viewModel: playlistViewModel,
	};

});
