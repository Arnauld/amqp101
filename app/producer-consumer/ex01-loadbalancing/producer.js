var conf = require('./conf')
  , amqpUtils = require('../shared/amqp-utils')
  , moment  = require('moment');


/**
 *
 *
 */
function producer(exchange, next) {
  // publish the message to the exchange
  // see http://momentjs.com/docs/#/displaying/format/
  var key  = "tasks.hey";
  var opts = {contentType: "application/json"}; 

  var i;
  for(i=0; i<10; i++) {
    var msg  = { 
      message : "Task! #" + i, 
      when    : moment().format('YYYY/MM/DD HH:mm:ssZ')
    };
    console.log("Publishing message on exchange '%s', routingKey: %s, payload: %j", 
                exchange.name, key, msg);
    var res = exchange.publish(key, msg, opts);
    console.log("Res %j", res);
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
