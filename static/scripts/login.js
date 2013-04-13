define(['jquery', 'bootstrap', 'jquery.form'], function ($) {

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
	});

});
