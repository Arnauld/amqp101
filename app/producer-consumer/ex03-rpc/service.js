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
function consumer(connection, queue, queueConf) {
  console.log("Creating consumer for %s ==> %j", queue.name, queueConf);

  return function(msg, headers, deliveryInfo, m) {
            var routingKey = deliveryInfo.routingKey;
            var replyTo = m.replyTo;
            var correlationId = m.correlationId;
            console.log(" '%s' // '%j': %j ~ %j", routingKey, headers, msg, [replyTo, correlationId]);

            if(replyTo) {
              var opts = {
                contentType: "application/json",
                correlationId: correlationId
              };
              connection.publish(replyTo, {message: "Job's done!"}, opts);
            }

            if(queueConf.settings.ack) {
              // Setting the options argument to 
              // { ack: true } (which defaults to false) 
              // will make it so that the AMQP server 
              // only delivers a single message at a time.
              // When you want the next message, call q.shift(). 
              queue.shift();
            }
          };
}

/**
 * ~Currying+Adapting
 */
function createQueueWith(queueConf, consumer) {
  return function(connection, exchange) {
    console.log("Creating queue: %j", queueConf);
    amqpUtils.createQueue(connection, queueConf, exchange, function(queue) {
      return consumer(connection, queue, queueConf);
    });
  };
}

// open connection
console.log("Opening AMQP connection on %s", conf.broker.url);
var connection = require('amqp').createConnection({url: conf.broker.url});

// Wait for connection to become established
var onceExchangeReady = createQueueWith(conf.queue,
                                        consumer);
connection.on('ready', amqpUtils.openExchange(connection, 
                                             conf.exchange,
                                             onceExchangeReady));

// help to track error
connection.on('error', function(err) { 
  console.log("Failed to open AMQP connection " + err);
  process.exit(1);
});
