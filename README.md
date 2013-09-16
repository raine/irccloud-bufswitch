irccloud.BufSwitch.user.js
==========================

Switch channels/conversations quickly without a mouse.

1. Type any part of a buffer name where you normally type messages.
2. Hit `Ctrl+G`

The activation key can be changed by editing the source.

See also: [irccloud.AlwaysMarkRead](https://github.com/raneksi/irccloud-alwaysmarkread).

## Try Without Installing

	javascript:var inject=function(b){var a=document.createElement("script");a.textContent="("+b.toString()+")();";document.head.appendChild(a)};inject(function(){var c="ctrl+g";var e=function(i){console.log(JSON.stringify(i))};var b=function(){return _.filter(SESSION.buffers.models,function(j){var i=j.attributes.buffer_type!=="console";var k=j.attributes.archived!=true;return i&&k})};var h=function(i){return(new RegExp(_.reduce(i.split(""),function(k,j){return k+"[^"+j+"]*?"+j})))};var a=function(l){var k=h(l);var i=function(m){return k.test(m.attributes.name)};var j=function(n,m){var p=l.substr(0,2);var o=_.map(_.toArray(arguments),function(q){return q.attributes.name.replace(/^[^\w]*/,"")});n=o[0];m=o[1];ai=n.indexOf(p);bi=m.indexOf(p);if(ai===bi){if(n.length<m.length){return 1}else{if(n.length>m.length){return -1}else{return 0}}}if(ai===-1){return -1}else{if(bi===-1){return 1}}if(ai<bi){return 1}else{return -1}};return _.chain(b()).filter(i).sort(j).value()};var g=function(){var k=c.split("+");var j=k[0];var i=k[1];if(j==="cmd"){j="meta"}return{modif:j,key:i.charCodeAt(0)}};var f=function(){var i=g();$(document).on("keydown","[id^=bufferInputView]",function(l){var k=String.fromCharCode(l.which).toLowerCase().charCodeAt(0);if(l[i.modif+"Key"]&&k===i.key){var j=$(this);var m=j.val();if(m.length>0){_.last(a(m)).select();j.val("")}l.preventDefault()}})};var d=function(i){(function(){if(window.hasOwnProperty("SESSIONVIEW")){i()}else{setTimeout(arguments.callee,25)}})()};d(f)});

## Installation

I have tested the userscript on Chrome and Firefox using Greasemonkey.

### Firefox

1. Install [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/).
2. Go to http://userscripts.org/scripts/source/177846.user.js and click **Install**.

### Chrome

#### Method 1 (Recommended)

This method provides automatic updates for the script.

1. Install [Tampermonkey extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) on Chrome Store.
2. Go to http://userscripts.org/scripts/source/177846.user.js and click
   **OK** to confirm installation.

#### Method 2

1. Download [irccloud.BufSwitch.user.js](https://github.com/raneksi/irccloud-bufswitch/raw/master/irccloud.BufSwitch.user.js) to your computer.
2. Go to the extension view in Chrome ([chrome://extensions](chrome://extensions)).
3. Drag the `irccloud.BufSwitch.user.js` file on the extension page. It
   should say "Drop to install" as you do so.
