// simple command line argument parser
var argv     = require('optimist').argv;

// let's reuse the socket.io's logger utility
var Logger = require('./lib/logger');
var logger = new Logger(argv.log || "debug");

/******************************************************************************
 ~ amqp part
 ******************************************************************************/

// uses command line settings or fallback on defaults
var conf = {
  // amqp[s]://[user:password@]hostname[:port][/vhost]
  brokerUrl    : argv.brokerUrl || "amqp://localhost",
  exchangeName : argv.exchangeName || "tasks",
  clientName   : argv.clientName || "bob"
};

var setupAmqp = function() {
  var exchange = conn.exchange(conf.exchangeName, {'type': 'fanout', durable: true}, function() {
    logger.info("[" + conf.clientName + "] Exchange opened");
    exchange.publish('', { command: "oneway_case1" }, {contentType: "application/json"});
    exchange.publish('', { command: "oneway_case2" }, {contentType: "application/json"});

    // create reply queue
    conn.queue('', {durable: false, exclusive: true}, function(q) {
      logger.debug("[" + conf.clientName + "] Reply queue created (" + q.name + ") and opened");

      var msg = { command: "waitresponse_case1" };
      exchange.publish('', msg, {contentType: "application/json", replyTo: q.name});
    });
  });
};

logger.info("Starting amqp on " + conf.brokerUrl);
var conn = require('amqp').createConnection({url: conf.brokerUrl});
conn.on('ready', setupAmqp);
