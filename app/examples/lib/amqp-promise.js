var amqp = require("amqp")
  , Promise = require("./promise").Promise
  , Logger = require('../lib/logger')
  , log = new Logger()
  ;


module.exports.connect = function(opts) {
	var connection = amqp.createConnection(opts||{});
	var promise = new Promise();
    connection.on('ready', function() {
    	promise.resolve(connection);
    });
    connection.on('error', function(error) {
    	promise.reject(error);
    });
    return promise;
}

module.exports.exchange = function(connection, opts) {
	var exchangeName     = opts.name;
    var exchangeSettings = opts.settings || {};
    log.info("Opening exchange '%s' with settings %j", 
             exchangeName, exchangeSettings);

	var promise = new Promise();
    connection.exchange(exchangeName, exchangeSettings, function(exchange) {
        promise.resolve(
        	{connection:connection, exchange:exchange});
    });
    return promise;
}

module.exports.queue = function(connection, opts) {
	var queueName     = opts.queueName;
    var bindingKey    = opts.bindingKey;
    log.info("Creating queue '%s'", queueName);
    
    var promise = new Promise();
    connection.queue(queueName, function(queue) {
    	promise.resolve(
			{connection:connection, queue:queue});
    });
    return promise;
}
