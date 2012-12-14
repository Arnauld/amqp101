// simple command line argument parser
var program = require('commander');
program
  .version('1.0.0')
  .option('-r, --role [monitor|alert|journal]', "Consumer's role [journal]", 'journal')
  .parse(process.argv);


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
function consumerFor(queue, queueConf) {
    return function(msg, header, deliveryInfo) {
            var routingKey = deliveryInfo.routingKey;
            log.info(" '%s': %j", routingKey, msg);

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

amqp.connect({url: conf.broker.url})
    .then(function(connection) {
    	log.info("Connection ready");
    	return amqp.exchange(connection, conf.exchange);
    })
    .then(function(res) {
    	log.info("Exchange %s ready", res.exchange.name);
    	return amqp.queue(res.connection, conf.queue[program.role]);
    })
    .then(function(res) {
    	var queueConf = conf.queue[program.role]
    	  , queue = res.queue
    	  , settings = queueConf.settings
    	  , bindingKey   = queueConf.bindingKey
      	  , exchangeName = conf.exchange.name
    	;

    	log.info("Queue %s ready, subscribing with setting %j", queue.name, settings);
    	queue.subscribe(settings, consumerFor(queue, queueConf));

    	log.info("Binding queue '%s' on exchange '%s' using binding key '%s'", queue.name, exchangeName, bindingKey);
    	queue.bind(exchangeName, bindingKey);
    })
    .done()
    ;

