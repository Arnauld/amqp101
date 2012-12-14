// simple command line argument parser
var program = require('commander');
program
  .version('1.0.0')
  .option('-l, --loop <n>', "Number of times the messages are sent [1]", 1)
  .parse(process.argv);

// shared configuration stored in conf.js
var conf = require('./conf')
  , messages = require('./messages')
  , amqp = require('../lib/amqp-q-promise')
  , Logger = require('../lib/logger')
  , log = new Logger()
  , Q = require("q")
  ;

/**
 *
 *
 */
var emitMessages = function(connection, exchange) {
  var deferred = Q.defer();
  process.nextTick(function() {
    // publish the messages to the exchange
    var opts = {
      contentType: "application/json"
    };

    var i;
    for(i = 0; i < program.loop; i++) {
      messages.forEach(function(message) {
        var key = message.key;
        var msg = message.payload;
        log.info("Publishing message on exchange '%s', routingKey: %s, payload: %j", exchange.name, key, msg);
        var res = exchange.publish(key, msg, opts);
        log.info("Res %j", res);
      });
    }

    deferred.resolve("ok");
  });
  return deferred.promise;
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
 log.info("Messages emitted, bye!");
 process.exit(0);
})
.done();

