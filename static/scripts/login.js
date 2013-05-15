define(['jquery', 'socket', 'knockout', 'bootstrap', 'jquery.form'], function ($, socket, ko) {

	function LoginViewModel() {

		var self = this;

		self.user = ko.observable();

		self.logout = function () {
			$.post('/logout');
		};

	}

	var loginViewModel = new LoginViewModel();

	socket.on('user', function (user) {
		loginViewModel.user(user);
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
	});

	return {
		viewModel: loginViewModel,
	};

});
