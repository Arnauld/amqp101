var Logger = require('../lib/logger'),
	log = new Logger(),
	util = require('./util');


exports.process = function(msg, callback, env) {
	// don't care of modifying the original message
	// otherwise do a real copy
	var processed = msg,
	    text = msg.text,
	    context = msg.context;

	if(context.indexOf("[html]") > -1 || context.indexOf("[xml]") > -1) {
		var frags = [];

		var htmlparser = require("htmlparser");
		var handler = new htmlparser.DefaultHandler(function(error, dom) {
			if(error) log.error("%j", error)
			else log.debug("Parsing complete!")
		});
		var parser = new htmlparser.Parser(handler);
		parser.parseComplete(rawHtml);
		sys.puts(sys.inspect(handler.dom, false, null));

		text = frags.join(" ");
	}

	processed.words = text.toLowerCase().split(/[\s.,;:?!*+-\[\]\(\)']+/);
	callback(processed);
}