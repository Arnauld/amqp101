var amqp = require("amqp")
  , Q = require("q")
  , Logger = require('../lib/logger')
  , log = new Logger()
  ;


module.exports.connect = function(opts) {
	var connection = amqp.createConnection(opts||{});
	var deferred = Q.defer();
    connection.on('ready', function() {
    	deferred.resolve(connection);
    });
    connection.on('error', function(error) {
    	deferred.reject(error);
    });
    return deferred.promise;
}

module.exports.exchange = function(connection, opts) {
	var exchangeName     = opts.name;
    var exchangeSettings = opts.settings || {};
    log.info("Opening exchange '%s' with settings %j", 
             exchangeName, exchangeSettings);

	var deferred = Q.defer();
    connection.exchange(exchangeName, exchangeSettings, function(exchange) {
        deferred.resolve(
        	{connection:connection, exchange:exchange});
    });
    return deferred.promise;
}

module.exports.queue = function(connection, opts) {
	var queueName     = opts.queueName;
    var bindingKey    = opts.bindingKey;
    log.info("Creating queue '%s'", queueName);
    
    var deferred = Q.defer();
    connection.queue(queueName, function(queue) {
    	deferred.resolve(
			{connection:connection, queue:queue});
    });
    return deferred.promise;
}
