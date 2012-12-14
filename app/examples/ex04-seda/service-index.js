var Logger = require('../lib/logger'),
	log = new Logger(),
	util = require('./util');

var index = function(env, docId, msg) {
		// our in-memory storage!!
		// in the environement itself
		if(!env.reversedIndex) {
			env.reversedIndex = {};
		}
		var reversedIndex = env.reversedIndex;

		msg.words.forEach(function(word) {
			var wordToDocs = util.getOrSet(reversedIndex, word, {});
			// increase the number of time the given word 
			// appears in the document
			util.incOrSet(wordToDocs, docId, 1);
		});

		//log.debug("Index content: %j", reversedIndex);
	}

var storeDocument = function(env, msg) {
		// our in-memory storage!!
		// in the environement itself
		if(!env.hasOwnProperty("documents")) {
			env.documents = [];
		}

		var documents = env.documents,
			docId = "w" + documents.length;
		documents.push(msg.text);

		log.debug("Document stored with id %s", docId);
		return docId;
	}

var query = function(env, msg, callback) {
		var reversedIndex = env.reversedIndex || {},
			weightenDocs = {};

		msg.words.forEach(function(word) {
			if(reversedIndex.hasOwnProperty(word)) {
				var docId, wordToDocs = reversedIndex[word];
				log.debug("Documents matching word %s: %j", word, wordToDocs);
				for(docId in wordToDocs) {
					if(wordToDocs.hasOwnProperty(docId)) {
						// increase the number of time the given document 
						// appears in the searched text
						util.incOrSet(weightenDocs, docId, wordToDocs[docId]);
					}
				}
			} else {
				log.debug("No document matching word %s", word);
			}
		});

		var docId, found = [];
		for(docId in weightenDocs) {
			if(weightenDocs.hasOwnProperty(docId)) {
				found.push({
					docId: docId,
					weight: weightenDocs[docId]
				});
			}
		}
		found.sort(function(b, a) {
			// descending order;
			return a.weight - b.weight;
		});
		found.forEach(function(doc) {
			log.debug("Document found %s (w: %d)", doc.docId, doc.weight);
		});
		callback(null, found);
	}


exports.process = function(msg, callback, env) {
	var command = msg.command || "indexing";
	log.debug("Index processing type: %s", command);
	if(command === "query") {
		query(env, msg, callback);
	} else {
		var docId = storeDocument(env, msg);
		index(env, docId, msg);
		callback(null, "ok");
	}
}