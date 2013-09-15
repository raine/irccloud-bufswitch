// ==UserScript==
// @name           IRCCloud BufSwitch
// @namespace      http://github.com/raneksi
// @description    Switch buffers quickly without a mouse
// @match          https://www.irccloud.com/*
// @version        0.0.1
// ==/UserScript==

var inject = function(fn) {
	var script = document.createElement("script");
	script.textContent = "(" + fn.toString() + ")();";
	document.head.appendChild(script);
};

inject(function() {
	var log = function(obj) {
		console.log(JSON.stringify(obj));
	};

	var getBuffers = function() {
		return _.filter(SESSION.buffers.models,	function(buf) {
			var notConsole  = buf.attributes.buffer_type !== 'console';
			var notArchived = buf.attributes.archived != true; // undefined or false
			return notConsole && notArchived;
		});
	};

	var createPattern = function(str) {
		return (new RegExp(_.reduce(str.split(''), function(a, b) {
			return a + '[^' + b + ']*?' + b; 
		})));
	};

	var findBuffersByPattern = function(str) {
		var pattern = createPattern(str);

		var hasPattern = function(buf) {
			return pattern.test(buf.attributes.name);
		};

		// Sort by the index of first two characters of `str`
		var sortByName = function(buf) {
			var name  = buf.attributes.name.replace(/^[^\w]*/, '');
			var index = name.indexOf(str.substr(0, 2));
			return (index >= 0 ? index : 999);
		};

		return _.chain(getBuffers())
			.filter(hasPattern)
			.sortBy(sortByName)
			.value();
	};

	var bindHotkey = function() {
		$(document).on('keypress', '[id^=bufferInputView]', function(ev) {
			if (ev.ctrlKey && ev.which === 103) {
				var $ta = $(this);
				var str = $ta.val();
				if (str.length > 0) {
					_.head(findBuffersByPattern(str)).select();
					$ta.val('');
				}
			}
		});
	};

	var readyCheck = function(done) {
		(function() {
			if (window.hasOwnProperty('SESSIONVIEW')) {
				done();
			} else {
				setTimeout(arguments.callee, 25);
			}
		})();
	};

	readyCheck(bindHotkey);
});
