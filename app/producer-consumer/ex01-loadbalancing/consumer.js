// shared configuration stored in conf.js
var conf = require('./conf')
  , amqpUtils = require('../shared/amqp-utils')
  ;

/**
 * Our consumer implementation:
 *
 * @param queue the corresponding queue 
 *              the consumer will... consumed!
 * @return a function that will be called for 
 *              every a new message is received
 */
function consumer(queue) {
  return function(msg, header, deliveryInfo) {
            var routingKey = deliveryInfo.routingKey;
            console.log(" '%s': %j", routingKey, msg);

            // simulate a random processing time
            // after a random delay, the queue is 
            // notified to send the next message
            setTimeout(function() {
              console.log("Processing done");
              // Setting the options argument to 
              // { ack: true } (which defaults to false) 
              // will make it so that the AMQP server 
              // only delivers a single message at a time.
              // When you want the next message, call q.shift(). 
              queue.shift();
            }, Math.random()*1000);
          };
}

/**
 * ~Currying+Adapting
 */
function createQueueAndRegisterConsumer(queueConf, consumer) {
  return function(connection, exchange) {
    var queueName     = queueConf.name;
    var bindingKey    = queueConf.bindingKey;
    var queueSettings = queueConf.settings;
    var exchangeName  = exchange.name;

    console.log("Creating queue '%s'", queueName);
    connection.queue(queueName, function(queue) {

      console.log("Subscribing consumer on queue '%s' with settings: %j", 
                  queueName, exchangeName, bindingKey, queueSettings);
      queue.subscribe(queueSettings, consumer(queue));

      console.log("Binding queue '%s' on exchange '%s' using routingKey: '%s'", 
                  queueName, exchangeName, bindingKey);
      queue.bind(exchangeName, bindingKey);
    });
  };
}

// open connection
console.log("Opening AMQP connection on %s", conf.broker.url);
var connection = require('amqp').createConnection({url: conf.broker.url});

var onceExchangeReady = createQueueAndRegisterConsumer(conf.queue,
                                                       consumer);

// Wait for connection to become established
connection.on('ready', amqpUtils.openExchange(connection, 
                                              conf.exchange,
                                              onceExchangeReady));

// help to track error
connection.on('error', function(err) { 
  console.log("Failed to open AMQP connection " + err);
  process.exit(1);
});
