// shared configuration stored in conf.js
var conf = require('./conf')
  , amqpUtils = require('../shared/amqp-utils')
  , crypto = require('crypto')
  ;

var handlers = {
  'generate-uuid' : function(msg, callback) {
    var random = crypto.randomBytes(4).toString('hex') + "-" +
                 crypto.randomBytes(2).toString('hex') + "-" +
                 crypto.randomBytes(2).toString('hex') + "-" +
                 crypto.randomBytes(2).toString('hex') + "-" +
                 crypto.randomBytes(6).toString('hex');
    callback(null, { uuid: random });
  }
};

var simulateWork = true;
function handleCall(correlationId, msg, callback) {
  var handler = handlers[msg.action];
  if(handler) {
    console.log("Handling request %s action %s", correlationId, msg.action);
    if(simulateWork) {
      setTimeout(function() {
        handler(msg, callback);
      }, Math.random() * 4000);
    }
    else {
      handler(msg, callback);
    }
  }
  else {
    console.log("Unsupported action %s", msg.action);
    callback({error:"Unsupported action"});
  }
}

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

            handleCall(correlationId, msg, function(error, result) {
              if(replyTo) {
                var opts = {
                  contentType: "application/json",
                  correlationId: correlationId
                };
                connection.publish(replyTo, error||result, opts);
              }
            });
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
