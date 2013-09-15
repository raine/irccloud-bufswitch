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
	var BUF_SWITCH_KEY = 'ctrl+g';

	var loadjQHotkeys = function(jQuery) {
		/*
		 * jQuery Hotkeys Plugin
		 * Copyright 2010, John Resig
		 * Dual licensed under the MIT or GPL Version 2 licenses.
		 */
		jQuery.hotkeys = {
			version: "0.8",

			specialKeys: {
				8: "backspace", 9: "tab", 10: "return", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
				20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
				37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
				96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
				104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
				112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
				120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 186: ";", 191: "/",
				220: "\\", 222: "'", 224: "meta"
			},

			shiftNums: {
				"`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
				"8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
				".": ">",  "/": "?",  "\\": "|"
			}
		};

		function keyHandler( handleObj ) {
			if ( typeof handleObj.data === "string" ) {
				handleObj.data = { keys: handleObj.data };
			}

			// Only care when a possible input has been specified
			if ( !handleObj.data || !handleObj.data.keys || typeof handleObj.data.keys !== "string" ) {
				return;
			}

			var origHandler = handleObj.handler,
				keys = handleObj.data.keys.toLowerCase().split(" "),
				textAcceptingInputTypes = ["text", "password", "number", "email", "url", "range", "date", "month", "week", "time", "datetime", "datetime-local", "search", "color", "tel"];

			handleObj.handler = function( event ) {
				// Don't fire in text-accepting inputs that we didn't directly bind to
				if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
					jQuery.inArray(event.target.type, textAcceptingInputTypes) > -1 ) ) {
					return;
				}

				var special = jQuery.hotkeys.specialKeys[ event.keyCode ],
					// character codes are available only in keypress
					character = event.type === "keypress" && String.fromCharCode( event.which ).toLowerCase(),
					modif = "", possible = {};

				// check combinations (alt|ctrl|shift+anything)
				if ( event.altKey && special !== "alt" ) {
					modif += "alt+";
				}

				if ( event.ctrlKey && special !== "ctrl" ) {
					modif += "ctrl+";
				}

				// TODO: Need to make sure this works consistently across platforms
				if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
					modif += "meta+";
				}

				if ( event.shiftKey && special !== "shift" ) {
					modif += "shift+";
				}

				if ( special ) {
					possible[ modif + special ] = true;
				}

				if ( character ) {
					possible[ modif + character ] = true;
					possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;

					// "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
					if ( modif === "shift+" ) {
						possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
					}
				}

				for ( var i = 0, l = keys.length; i < l; i++ ) {
					if ( possible[ keys[i] ] ) {
						return origHandler.apply( this, arguments );
					}
				}
			};
		}

		jQuery.each([ "keydown", "keyup", "keypress" ], function() {
			jQuery.event.special[ this ] = { add: keyHandler };
		});
	};

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

	var bindHotkey = function() {
		loadjQHotkeys(window.$);

		$(document).on('keypress', '[id^=bufferInputView]', BUF_SWITCH_KEY, function(ev) {
			var $ta = $(this);
			var str = $ta.val();
			if (str.length > 0) {
				_.last(findBuffersByPattern(str)).select();
				$ta.val('');
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
