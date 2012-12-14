/*


 Stemming and lemmatization

For grammatical reasons, documents are going to use different forms of a word, 
such as organize, organizes, and organizing. Additionally, there are families 
of derivationally related words with similar meanings, such as democracy, 
democratic, and democratization. In many situations, it seems as if it would 
be useful for a search for one of these words to return documents that contain 
another word in the set.

The goal of both stemming and lemmatization is to reduce inflectional forms and 
sometimes derivationally related forms of a word to a common base form. 
For instance:
am, are, is ⇒ be 
car, cars, car’s, cars’ ⇒ car
*/

var normalize = function(msg, context, callback) {
    var words = msg.words;

        if(context.indexOf("[en]") > -1) {
            // see https://github.com/jedp/porter-stemmer
            var stemmer = require('porter-stemmer').stemmer
            words = words.map(function(word) {
                return stemmer(word);
            });
        }
        if(context.indexOf("[fr]") > -1) {
            // see http://blog.kasunbg.org/2010/10/javascript-stemmer-for-french-language.html
            // => http://snowball.tartarus.org/otherlangs/index.html
            var stemmer = require('./stemmer/french_javascript').stemmer
            words = words.map(function(word) {
                return stemmer(word);
            });
        }

        // don't care of modifying the original message
        // otherwise do a real copy
        msg.words = words;
        callback(msg);
    }


exports.process = function(msg, callback, env) {
    normalize(msg, msg.context, callback);
}