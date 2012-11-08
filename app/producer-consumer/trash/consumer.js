// simple command line argument parser
var program = require('commander');
program
  .version('1.0.0')
  .option('-b, --brokerUrl [url]', 'broker url [amqp://localhost]', 'amqp://localhost')
  .option('-e, --exchangeName [name]', 'name of the exchange (default name depends on its type)')
  .option('-t, --exchangeType [type]', 'type of the exchange: topic, fanout, direct [topic]', "topic")
  .option('-m, --queueName [name]', 'queue name []', '')
  .option('-r, --routingKey [key]', "queue's routing key [#]", '#')
  .parse(process.argv);

var exchangeName = program.exchangeName || (function(exchangeType){
  if(exchangeType==="direct")
    return "msg.direct";
  else if(exchangeType==="fanout")
    return "msg.fanout";
  else
    return "msg.topic";
})(program.exchangeType);

// see https://github.com/postwait/node-amqp

console.log("Opening AMQP connection on %s", program.brokerUrl);
var connection = require('amqp').createConnection({url: program.brokerUrl});

// our consumer implementation
var consumer = function(msg, header, deliveryInfo) {
  var routingKey = deliveryInfo.routingKey;
  console.log("Got a message with routing key '%s': %j", 
               routingKey, deliveryInfo, msg);

  // check for a reply-to header

};

// Wait for connection to become established
connection.on('ready', function() {
  console.log("Opening exchange '%s'", exchangeName);
  var settings = {
      type: program.exchangeType,
      durable: true
  };

  var exchange = connection.exchange(exchangeName, settings, function() {
    
    console.log("Creating queue '%s'", program.queueName);
    var q = connection.queue(program.queueName, function(queue) {

      queue.subscribe(consumer);

      var key = program.routingKey;
      console.log("Binding queue (%s) on exchange '%s', routingKey: %s", 
                  queue.name, exchangeName, key);
      queue.bind(exchangeName, key);
    });

  });
});

// help to track error
connection.on('error', function(err) { 
  console.log("Failed to open AMQP connection " + err);
  process.exit(1);
});
