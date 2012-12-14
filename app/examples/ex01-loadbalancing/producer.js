// shared configuration stored in conf.js
var conf = require('./conf')
  , amqp = require('../lib/amqp-q-promise')
  , Q = require("q")
  , Logger = require('../lib/logger')
  , log = new Logger()
  , moment  = require('moment')
  ;

var emitMessages = function(connection, exchange) {
  var deferred = Q.defer();
  process.nextTick(function() {
    // publish the message to the exchange
    // see http://momentjs.com/docs/#/displaying/format/
    var key  = "tasks.hey";
    var opts = {contentType: "application/json"}; 

    var i;
    for(i=0; i<10; i++) {
      var msg  = { 
        message : "Task! #" + i, 
        when    : moment().format('YYYY/MM/DD HH:mm:ssZ')
      };
      log.info("Publishing message on exchange '%s', routingKey: %s, payload: %j", 
        exchange.name, key, msg);
      var res = exchange.publish(key, msg, opts);
      log.info("Res %j", res);
    }

    deferred.resolve("ok");
  });
  return deferred.promise;
}

amqp.connect({url: conf.broker.url})
.then(function(connection) {
 log.info("Connection ready");
 return amqp.exchange(connection, conf.exchange);
})
.then(function(res) {
 log.info("Exchange %s ready", res.exchange.name);
 return emitMessages(res.connection, res.exchange);
})
.then(function() {
 log.info("Messages emitted, bye!");
 process.exit(0);
})
.done();
