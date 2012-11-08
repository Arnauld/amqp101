
/**
 * @param connection established connection with the AMQP broker
 * @param onceDone function invoked once the exchange is created/opened
 *        connection will be given as first argument, and the exchange
 *        as second argument: `onceDone(connection, exchange)`
 * @return a function that will open/create the exchange defined in the 
 *         configuration.
 */
exports.openExchange = function(connection, exchangeConf, onceDone) {
  return function() {
    var exchangeName     = exchangeConf.name;
    var exchangeSettings = exchangeConf.settings || {};
    console.log("Opening exchange '%s' with settings %j", 
                exchangeName, exchangeSettings);
    connection.exchange(exchangeName, exchangeSettings, function(exchange) {
      onceDone(connection, exchange);
    });
  };
}

/**
 * @param connection established connection with the AMQP broker
 * @return a function that will open/create the queue defined in the 
 *         configuration.
 */
exports.createQueue = function(connection, queueConf, exchange, consumer) {
    var queueName     = queueConf.name;
    var bindingKey    = queueConf.bindingKey;
    var queueSettings = queueConf.settings;
    var exchangeName  = exchange.name;

    console.log("Creating queue '%s'", queueName);
    var q = connection.queue(queueName, function(queue) {

      queue.subscribe(queueSettings, consumer(queue));

      console.log("Binding queue '%s' on exchange '%s' routingKey: %s", 
                  queueName, exchangeName, bindingKey);
      queue.bind(exchangeName, bindingKey);
    });
}