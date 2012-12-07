// shared configuration stored in conf.js
var conf = require('./conf')
  , amqp = require('../lib/amqp-promise')
  , Logger = require('../lib/logger')
  , log = new Logger()
  ;

var emitMessages = function(connection, exchange) {
	var promise = new Promise();
    connection.on('ready', function() {
    	promise.resolve(connection);
    });
    connection.on('error', function(error) {
    	promise.reject(error);
    });
    return promise;
}

amqp.connect({url: conf.broker.url})
    .then(function(connection) {
    	log.info("Connection ready");
    	return amqp.exchange(connection, conf.exchange);
    })
    .then(function(res) {
    	log.info("Exchange %s ready", res.exchange.name);
    	return emitMessages(res.connection, res.exchange);
    })
    .then(function() {
    	process.exit(0);
    });
