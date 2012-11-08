// simple command line argument parser
var  program = require('commander')
   , moment  = require('moment');

program
  .version('1.0.0')
  .option('-b, --brokerUrl [url]', 'broker url [amqp://localhost]', 'amqp://localhost')
  .option('-e, --exchangeName [name]', 'name of the exchange (default name depends on its type)')
  .option('-t, --exchangeType [type]', 'type of the exchange: topic, fanout, direct [topic]', "topic")
  .option('-m, --message [msg]', 'message to send [Hello!]', 'Hello!')
  .option('-r, --routingKey [key]', "message's routing key (default is empty) []", '')
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

// Wait for connection to become established
connection.on('ready', function() {
  console.log("Opening exchange '%s'", exchangeName);
  var opts = {
      type: program.exchangeType,
      durable: true
  };
  var exchange = connection.exchange(exchangeName, opts, 
    // publish the message to the exchange
    // see http://momentjs.com/docs/#/displaying/format/
    function() {
      var msg  = { 
        message : program.message, 
        when    : moment().format('YYYY/MM/DD HH:mm:ssZ')
      };
      var key  = program.routingKey;
      var opts = {contentType: "application/json"}; 
      console.log("Publishing message on exchange '%s', routingKey: %s, payload: %j", exchangeName, key, msg);
      var res = exchange.publish(key, msg, opts);
      console.log("Res %j", res);
      process.exit(0);
    });
});

// help to track error
connection.on('error', function(err) { 
  console.log("Failed to open AMQP connection " + err);
  process.exit(1);
});
