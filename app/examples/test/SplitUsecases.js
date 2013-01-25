var split = function(text) {
		// remove all comments
		text = text.replace(/<!--.*?--\s*>/gm, "");

		// remove all scripts
		text = text.replace(/<script.*?\/>/gm, "");
		text = text.replace(/<script.*?<\/\s*script\s*>/gm, "");

		// remove all tags
		text = text.replace(/<(?:[^>'\"]*(?:\".*?\"|'.*?')?)+>/gm, "");
		return text;
	}

var text1 = "<h1>Un beau titre</h1> <p>Bla bla bla</p>";

console.log(split(text1));