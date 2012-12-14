exports.process = function(msg, callback, env) {
    var processed = msg; // don't care of modifying the original message
                         // otherwise do a real copy
    processed.words = msg.text.toLowerCase().split(/[\s.,;:?!*+-\[\]\(\)']+/);
    callback(processed);
}