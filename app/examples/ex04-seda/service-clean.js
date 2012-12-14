var Logger = require('../lib/logger')
  , log = new Logger()
  , util = require('./util')
  ;

var stopWordsFor = function(context, callback) {
        if(context.indexOf("[en]") > -1) {
            var stopWords = [];
            util.appendAll(stopWords, "a an and are as at be by for from has he in is it its " + //
            "of on that the to was were will with");
            callback(stopWords);
        } else if(context.indexOf("[fr]") > -1) {
            var stopWords = require('./stemmer/french_stop').stopWords;
            stopWords(callback, log);
        } else {
            callback([]);
        }
    }

    /**
     *  Dropping common terms: stop words
     *
     */
var removeStopWords = function(msg, callback) {
        stopWordsFor(msg.context, function(stopWords) {
            var filteredWords = msg.words.filter(function(word) {
                return word.length > 0 && stopWords.indexOf(word) === -1;
            });
            // don't care of modifying the original message
            // otherwise do a real copy
            msg.words = filteredWords;

            callback(msg);
        });
    }


exports.process = function(msg, callback, env) {
    removeStopWords(msg, callback);
}