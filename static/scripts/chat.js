define(['socket', 'knockout'], function (socket, ko) {

	function Message(text, sender) {
		this.text = text;
		this.sender = sender;
	}

	function ChatViewModel() {

		var self = this;

		self.messages = ko.observableArray([]);
		self.newMessageText = ko.observable();
		self.users = ko.observableArray([]);

		self.addMessage = function (message) {
			self.messages.push(message);
		};

		self.sendMessage = function () {
			socket.emit('chat', self.newMessageText());
			self.newMessageText('');
		};

		self.scrollToBottom = function (element) {
			var el = element.parentElement;
			if (el.scrollTop == el.scrollHeight - el.clientHeight) {
				setTimeout(function () { el.scrollTop = el.scrollHeight - el.clientHeight; }, 0);
			}
		};

	}

	var chatViewModel = new ChatViewModel();

	socket.on('chat', function(data) {
		chatViewModel.addMessage(new Message(data.text, data.name));
	});

	socket.on('list', function(list) {
		chatViewModel.users(list);
	});

	return {
		viewModel: chatViewModel,
	};

});
