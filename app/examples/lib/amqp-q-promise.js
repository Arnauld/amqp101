var amqp = require("amqp")
  , Q = require("q")
  , Logger = require('../lib/logger')
  , log = new Logger()
  ;


module.exports.connect = function(opts, context) {
	var connection = amqp.createConnection(opts||{});
	var deferred = Q.defer();
    connection.on('ready', function() {
    	deferred.resolve({connection:connection, context:(context||{})});
    });
    connection.on('error', function(error) {
    	deferred.reject(error);
    });
    return deferred.promise;
}

module.exports.exchange = function(connection, opts, context) {
	var exchangeName     = opts.name;
    var exchangeSettings = opts.settings || {};
    log.info("Opening exchange '%s' with settings %j", 
             exchangeName, exchangeSettings);

	var deferred = Q.defer();
    connection.exchange(exchangeName, exchangeSettings, function(exchange) {
        deferred.resolve(
        	{connection:connection, exchange:exchange, context:(context||{})});
    });
    return deferred.promise;
}

module.exports.queue = function(connection, opts, context) {
	var queueName     = opts.name;
    log.info("Creating queue '%s'", queueName);
    
    var deferred = Q.defer();
    connection.queue(queueName, function(queue) {
    	deferred.resolve(
			{connection:connection, queue:queue, context:(context||{})});
    });
    return deferred.promise;
}
