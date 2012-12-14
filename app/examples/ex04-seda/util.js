
/**
 * Split the text and append all fragment to the given array.
 */
exports.splitAndAppendAll = function(array, text) {
        text.split(/\s+/).forEach(function(word) {
            array.push(word);
        });
        return array;
    }

/**
 * Get the value for the given key. If there is none, default value
 * is set and returned.
 */
exports.getOrSet = function(obj, key, defaultValue) {
	if(obj.hasOwnProperty(key)) {
		return obj[key];
	}
	else {
		obj[key] = defaultValue;
		return defaultValue;	
	}
}


/**
 * Get the value for the given key. If there is none, default value
 * is eturned.
 */
exports.getOrDefault = function(obj, key, defaultValue) {
	if(obj.hasOwnProperty(key)) {
		return obj[key];
	}
	else {
		return defaultValue;	
	}
}


/**
 * Increment the value for the given key with the specified amount. 
 * If there is none, value is set to amount.
 */
exports.incOrSet = function(obj, key, amount) {
	if(obj.hasOwnProperty(key)) {
		obj[key] = obj[key] + amount;
	}
	else {
		obj[key] = amount;
	}
}