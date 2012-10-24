// simple command line argument parser
var argv     = require('optimist').argv;

// let's reuse the socket.io's logger utility
var Logger = require('./lib/logger');
var logger = new Logger(argv.log || "debug");

/******************************************************************************
 ~ amqp part
 ******************************************************************************/

var serverName = argv.serverName || "node-server";

// uses command line settings or fallback on defaults
var conf = {
  // amqp[s]://[user:password@]hostname[:port][/vhost]
  brokerUrl    : argv.brokerUrl || "amqp://localhost",
  exchangeName : argv.exchangeName || "tasks"
};

var notificationDispatch = function(msg, header, deliveryInfo) {
  var routingKey = deliveryInfo.routingKey;
  logger.debug("Got a message with routing key '" + routingKey + "'" +
               " (deliveryInfo: " + JSON.stringify(deliveryInfo) + ")" +
               " - message received: " + JSON.stringify(msg));
};

var setupAmqp = function() {
  logger.debug("Opening exchange '" + conf.exchangeName + "'");
  var exchange = conn.exchange(conf.exchangeName, {'type': 'fanout', durable: true}, function() {
    logger.debug("Exchange '" + conf.exchangeName + "' opened");

    logger.debug("Creating queue on '" + conf.exchangeName + "'");
    var queue = conn.queue(serverName, {durable: false, exclusive: true}, function() {
      queue.subscribe(notificationDispatch);
    
      logger.debug("Binding queue on '" + conf.exchangeName + "'");
      queue.bind(conf.exchangeName, '', function () {
        logger.info("Queue binding done on exchange '"+ conf.exchangeName + "'");
      });
    });
    queue.on('disconnect', function(what) {
      logger.info("Disconnect " + JSON.stringify(what));
    });
    conf.queue = queue;
  });

};

var maxRetry = 20;
var retry = 0;

logger.info("Opening AMQP connection on " + conf.brokerUrl);
var conn = require('amqp').createConnection({url: conf.brokerUrl});
conn.on('ready', function() {
  retry = 0; // reset retry counter
  setupAmqp();
});
conn.on('error', function(err) {
  logger.error("Failed to open AMQP connection (attempt " + (++retry) + "/" + maxRetry + ")");
  if(retry===maxRetry) {
    if(conf.queue) {
      conf.queue.destroy();
    }
    conn.end();
    process.exit(-1);
   }
});
