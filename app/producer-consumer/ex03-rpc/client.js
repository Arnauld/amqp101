// simple command line argument parser
var program = require('commander');
program
  .version('1.0.0')
  .option('-l, --loop <n>', "Number of times the messages are sent [1]", 1)
  .parse(process.argv);

var conf = require('./conf')
  , amqpUtils = require('../shared/amqp-utils')
  , RPC = require('./rpc');


/**
 *
 *
 */
function producer(rpc) {

  var loop;
  for(loop=0; loop<program.loop; loop++) {
    var l = loop;
    rpc.emitRequest({
        key: "uuid",
        payload: { action: "generate-uuid" }
      }, 
      function(err, response) {
        if(err)
          console.log("Ooops! %j", err);
        else
          console.log("Hey! %j", response);
      });
  }
}

/**
 * ~Currying+Adapting
 */
function registerProducer(next) {
  return function(rpc) {
    rpc.onceDone(next);
    producer(rpc);
  };
}


/**
 * ~Currying+Adapting
 */
function createReplyToQueue(next) {
  return function(connection, exchange) {
    console.log("Creating ReplyTo queue");
    connection.queue('', function(queue) {
      console.log("ReplyTo queue created: '%s'", queue.name);
      var rpc = new RPC(exchange).registerReplyTo(queue);
      next(rpc);
    });
  }
}

// utility method
var exitOnceDone = function(connection) {
  return function() {
    connection.end();
    connection.on('close', function() { process.exit(0); });
  }
}

// open connection
console.log("Opening AMQP connection on %s", conf.broker.url);
var connection = require('amqp').createConnection({url: conf.broker.url});

var onceReplyToQueueCreated = registerProducer(exitOnceDone(connection));
var onceExchangeReady = createReplyToQueue(onceReplyToQueueCreated);

// Wait for connection to become established
connection.on('ready', amqpUtils.openExchange(connection, 
                                             conf.exchange,
                                             onceExchangeReady));

// help to track error
connection.on('error', function(err) { 
  console.log("Failed to open AMQP connection " + err);
  process.exit(1);
});
