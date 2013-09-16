var fs  = require('fs');
var ujs = require('uglify-js');

var getBookmarklet = function() {
	var code = ujs.minify('irccloud.BufSwitch.user.js').code;
	return 'javascript:' + escape(code);
};

var getHTML = function() {
	var html = '';
	html += 'Drag the link into the bookmark bar and click with IRCCloud active:';
	html += '<p><a href="' + getBookmarklet() + '">BufSwitch</a></p>';
	return html;
};

fs.writeFileSync('bookmarklet.html', getHTML());
