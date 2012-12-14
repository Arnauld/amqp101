var fs = require('fs');

var cached;
var stopWords = exports.stopWords = function(callback, log) {
		if(typeof cached === "undefined") {
			var path = require('path');
			fs.readFile(path.resolve(__dirname, 'french_stop.txt'), 'utf-8', function(err, data) {
				if(err) {
					log.error("Failed to load 'french stop words': " + err);
					callback([]);
				} else {
					log.info("Preparing 'french stop words'");
					cached = [];
					var pattern = new RegExp("^([^|\\s]+)[^\r\n]*$", "gm"),
						match;
					while(match = pattern.exec(data)) {
						var word = match[1].trim();
						if(word.length > 0) cached.push(word);
					}
					callback(cached);
				}
			});
		} else {
			callback(cached);
		}
	}
/*
stopWords(function(words) {
	words.forEach(function(word) {
		console.log(">>" + word + "<<")
	});
});
*/