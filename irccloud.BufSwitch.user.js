// ==UserScript==
// @name           IRCCloud BufSwitch
// @namespace      http://github.com/raneksi
// @description    Switch buffers quickly without a mouse
// @match          https://www.irccloud.com/*
// @version        0.0.1
// @updateURL      https://userscripts.org/scripts/source/177846.meta.js
// @downloadURL    https://userscripts.org/scripts/source/177846.user.js
// ==/UserScript==

var inject = function(fn) {
	var script = document.createElement("script");
	script.textContent = "(" + fn.toString() + ")();";
	document.head.appendChild(script);
};

inject(function() {
	var BUF_SWITCH_KEY = 'ctrl+g';

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
		var sortByName = function(a, b) {
			var subStr = str.substr(0, 2);
			var args = _.map(_.toArray(arguments), function(buf) {
				return buf.attributes.name.replace(/^[^\w]*/, '');
			});

			a = args[0]; b = args[1];
			ai = a.indexOf(subStr);
			bi = b.indexOf(subStr);

			if (ai === bi) {
				// Prefer shorter if first two are equal
				if (a.length < b.length) return 1;
				else if (a.length > b.length) return -1;
				else return 0;
			}

			if (ai === -1) {
				return -1;
			} else if (bi === -1) {
				return 1;
			}

			if (ai < bi) {
				return 1;
			} else {
				return -1;
			}
		};

		return _.chain(getBuffers())
			.filter(hasPattern)
			.sort(sortByName)
			.value();
	};

	var parseShortcut = function() {
		var map = BUF_SWITCH_KEY.split('+');
		var modif = map[0];
		var key   = map[1];

		if (modif === 'cmd')
			modif = 'meta';

		return {
			modif : modif,
			key   : key.charCodeAt(0)
		};
	};

	var bindHotkey = function() {
		var shortcut = parseShortcut();

		$(document).on('keydown', '[id^=bufferInputView]', function(ev) {
			// HACK: In Chrome, keydown with modifier (ctrl) on returns keycode for
			//       the upper case variant
			var code = String.fromCharCode(ev.which).toLowerCase().charCodeAt(0);

			if (ev[shortcut.modif + 'Key'] && code === shortcut.key) {
				var $ta = $(this);
				var str = $ta.val();
				if (str.length > 0) {
					_.last(findBuffersByPattern(str)).select();
					$ta.val('');
				}

				ev.preventDefault();
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
