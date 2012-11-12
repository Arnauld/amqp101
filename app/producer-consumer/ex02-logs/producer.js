// simple command line argument parser
var program = require('commander');
program
  .version('1.0.0')
  .option('-l, --loop <n>', "Number of times the messages are sent [1]", 1)
  .parse(process.argv);

var conf = require('./conf')
  , amqpUtils = require('../shared/amqp-utils')
  , messages = require('./messages');


/**
 *
 *
 */
function producer(exchange, next) {
  // publish the messages to the exchange
  var opts = {contentType: "application/json"}; 

  for (var i = 0; i < program.loop; i++) {
    messages.forEach(function(message) {
      var key = message.key;
      var msg = message.payload;
      console.log("Publishing message on exchange '%s', routingKey: %s, payload: %j", 
                  exchange.name, key, msg);
      var res = exchange.publish(key, msg, opts);
      console.log("Res %j", res);
    });
  }

  if(next)
    next();
}

/**
 * ~Currying+Adapting
 */
function registerProducer(next) {
  return function(connection, exchange) {
    producer(exchange, next);
  };
}

// utility method
var exitOnceDone = function() {
  process.exit(0);
}

// open connection
console.log("Opening AMQP connection on %s", conf.broker.url);
var connection = require('amqp').createConnection({url: conf.broker.url});

var onceExchangeReady = registerProducer(exitOnceDone);

// Wait for connection to become established
connection.on('ready', amqpUtils.openExchange(connection, 
                                             conf.exchange,
                                             onceExchangeReady));

// help to track error
connection.on('error', function(err) { 
  console.log("Failed to open AMQP connection " + err);
  process.exit(1);
});
