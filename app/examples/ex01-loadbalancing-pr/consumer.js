// shared configuration stored in conf.js
var conf = require('./conf')
  , amqp = require('../lib/amqp-q-promise')
  , Logger = require('../lib/logger')
  , log = new Logger()
  ;

/**
 * Our consumer implementation:
 *
 * @param queue the corresponding queue 
 *              the consumer will... consumed!
 * @return a function that will be called for 
 *              every a new message is received
 */
function consumerFor(queue) {
  return function(msg, header, deliveryInfo) {
            var routingKey = deliveryInfo.routingKey;
            log.debug("Received '%s': %j", routingKey, msg);

            // simulate a random processing time
            // after a random delay, the queue is 
            // notified to send the next message
            setTimeout(function() {
              log.info("Processing done for message %j", msg.message);
              // Setting the options argument to 
              // { ack: true } (which defaults to false) 
              // will make it so that the AMQP server 
              // only delivers a single message at a time.
              // When you want the next message, call q.shift(). 
              queue.shift();
            }, Math.random()*1000);
          };
}

amqp.connect({url: conf.broker.url})
    .then(function(connection) {
    	log.info("Connection ready");
    	return amqp.exchange(connection, conf.exchange);
    })
    .then(function(res) {
    	log.info("Exchange %s ready", res.exchange.name);
    	return amqp.queue(res.connection, conf.queue);
    })
    .then(function(res) {
    	var queue = res.queue;
    	var settings = { ack: true };
    	log.info("Queue %s ready, subscribing with setting %j", queue.name, settings);
    	queue.subscribe(settings, consumerFor(queue));

    	var exchangeName = conf.queue.exchangeName;
    	var bindingKey   = conf.queue.bindingKey;
    	log.info("Binding queue '%s' on exchange '%s' using binding key '%s'", queue.name, exchangeName, bindingKey);
    	queue.bind(exchangeName, bindingKey);
    })
    .done()
    ;