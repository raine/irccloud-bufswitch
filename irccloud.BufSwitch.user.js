// ==UserScript==
// @name           IRCCloud BufSwitch
// @namespace      http://github.com/raneksi
// @description    Switch buffers quickly without a mouse
// @match          https://www.irccloud.com/*
// @version        0.0.4
// @updateURL      https://userscripts.org/scripts/source/177846.meta.js
// @downloadURL    https://userscripts.org/scripts/source/177846.user.js
// ==/UserScript==

var inject = function(fn) {
	var script = document.createElement("script");
	script.textContent = "(" + fn.toString() + ")();";
	document.head.appendChild(script);
};

inject(function() {
	var SHORTCUTS = {
		bufSwitch  : 'ctrl+g',
		nextActive : 'ctrl+n',
		prevActive : 'ctrl+p',
		back	   : 'ctrl+b'
	};

	var log = function(obj) {
		console.log(JSON.stringify(obj));
	};

	var filterWith = function(list) {
		var preds = _.toArray(arguments).slice(1);

		return _.filter(list, function(obj) {
			var call = function(a, b) { return b(a); };
			return _.every(preds, _.partial(call, obj));
		});
	};

	var b = {
		isNotConsole  : function(buf) { return buf.attributes.buffer_type !== 'console'; },
		isNotArchived : function(buf) { return buf.attributes.archived != true; },
		isUnseen      : function(buf) { return buf.unseen; }
	};

	var bufferOrdering = function() {
		var i = 0;
		var connPosns = _.reduce(SESSIONVIEW.model.connections.models, function(posns, conn) {
			posns[conn.cid] = i++;
			return posns;
		}, {});

		var sortByConnAndName = function(buf) {
			return [connPosns[buf.connection.cid], buf.attributes.name];
		};

		i = 0;
		return _.sortBy(SESSION.buffers.models, sortByConnAndName)
			.reduce(function(acc, buf) {
				acc[buf.cid] = i++;
				return acc;
			}, {});
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

		return _.chain(SESSION.buffers.models)
			.filterWith(b.isNotConsole, b.isNotArchived)
			.filter(hasPattern)
			.sort(sortByName)
			.value();
	};

	var getActiveBuffers = function() {
		var allUnseen = _.chain(SESSION.buffers.models)
				 .filterWith(b.isUnseen, b.isNotConsole, b.isNotArchived);
		var buffersWithMentions = allUnseen.filterWith(function(buf) { return buf.unseenHighlights.length > 0; });
		if (buffersWithMentions.size() > 0) {
			return buffersWithMentions.value();
		} else {
			return allUnseen.value();
		}
	};

	var parseShortcuts = function() {
		var parseShortcut = function(str) {
			var map = str.split('+');
			var modif = map[0];
			var key   = map[1];

			if (modif === 'cmd')
				modif = 'meta';

			return {
				modif : modif,
				key   : key.charCodeAt(0)
			};
		};

		return _.object(_.map(SHORTCUTS, function(key, cmd) {
			return [ cmd, parseShortcut(key) ];
		}));
	};


	var padWithZeros = function(number, max, radix) {
		radix = radix || 10;
		var maxLength = max.toString(radix).length;
		var str = number.toString(radix);
		_.times(maxLength - str.length, function() {str = '0' + str} );
		return str;
	};

	var selectAdjacentUnreadChannel = function(picker) {
		var ordering = bufferOrdering();
		var totalBuffers = _.keys(ordering).length;
		var current = ordering[SESSION.currentBuffer.cid];
		var active = _.sortBy(getActiveBuffers(), function(buf) {
			var posn = ordering[buf.cid];
			return [current >= posn, padWithZeros(posn, totalBuffers)];
		});

		if (active.length > 0) picker(active).select();
	}

	var handlers = {
		bufSwitch: {
			target: '[id^=bufferInputView]',
			fn: function($textarea) {
				var str = $textarea.val();
				if (str.length > 0) {
					var buf = _.last(findBuffersByPattern(str));
					if (buf) {
						buf.select();
						$textarea.val('');
					}
				}
			}
		},
		nextActive: {
			fn: function() {
				selectAdjacentUnreadChannel(_.first);
			}
		},
		prevActive: {
			fn: function() {
				selectAdjacentUnreadChannel(_.last);
			}
		},
		back: {
			fn: function() {
				var prev = SESSIONVIEW.model.previousBuffer;
				if (prev) prev.select();
			}
		}
	};

	var handleKeydown = function(shortcuts, handlers, ev) {
		matchShortcut = function(arr) {
			var shortcut = arr[1];

			// HACK: In Chrome, keydown with modifier (ctrl) on returns the
			// keycode for the upper case variant
			var charCode = String.fromCharCode(ev.which).toLowerCase().charCodeAt(0);

			if (ev[shortcut.modif + 'Key'] && charCode === shortcut.key) {
				ev.preventDefault();
				return true;
			}
		};

		// Find the first shortcut that matches the `ev` and run the handler
		// if its target element matches
		var action;
		if (action = _.find(_.pairs(shortcuts), matchShortcut)) {
			var cmd = action[0], handler;
			if (handler = handlers[cmd]) {
				if (handler.target && !$(ev.target).is(handler.target)) return;
				handler.fn($(ev.target));
			}
		}
	};

	var setup = function() {
		if (!_.has(_, 'filterWith')) _.mixin({ filterWith: filterWith });
		$(document).on('keydown', _.partial(handleKeydown, parseShortcuts(), handlers));
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

	readyCheck(setup);
});
