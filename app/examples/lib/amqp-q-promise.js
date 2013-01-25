var amqp = require("amqp"),
    Q = require("q"),
    Logger = require('../lib/logger'),
    log = new Logger();

/* {markdown}

- `opts` AMQP connection's options (@see amqp node module).
    
  `amqp.createConnection([options, [implOptions]])` takes two options
                 objects as parameters.  The first options object has these defaults:
       
  ```
  { host: 'localhost'
  , port: 5672
  , login: 'guest'
  , password: 'guest'
  , vhost: '/'
  }
  ```
       
  All of these can be passed in a single URL of the form
  `amqp[s]://[user:password@]hostname[:port][/vhost]` e.g.:
  `{url: "amqp://guest:guest@localhost:5672"}`

- `context` context returned within the promise allowing state transmission between promise.

- In return callbacks registered on the promise are invoked with the following object:
  
  ```
  { connection: connection
  , context: context
  }
  ```
  where `connection` is the opened connection.
         
 */
var connectF = module.exports.connect = function(opts, context) {
        var connection = amqp.createConnection(opts || {});
        var deferred = Q.defer();
        connection.on('ready', function() {
            deferred.resolve({
                connection: connection,
                context: (context || {})
            });
        });
        connection.on('error', function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }


/* {markdown}

(Create, is necessary, and) Open an exchange.
 
- `connection` an opened amqp connection
- `opts` exchange's options:

     ```
     { name: "tasks"
     , settings: amqpExchangeSettings
     }
     ```

     where `amqpExchangeSettings` corresponds to the AMQP's exchange settings

  - `type`: the type of exchange `'direct'`, `'fanout'`, or `'topic'` (default).
  - `passive`: boolean, default false.
      If set, the server will not create the exchange.  The client can use
      this to check whether an exchange exists without modifying the server
      state.
  - `durable`: boolean, default false.
      If set when creating a new exchange, the exchange will be marked as
      durable.  Durable exchanges remain active when a server restarts.
      Non-durable exchanges (transient exchanges) are purged if/when a
      server restarts.
  - `comfirm`: boolean, default false.
      If set when connecting to a exchange the channel will send acks 
      for publishes. Published tasks will emit 'ack' when it is acked.
  - `autoDelete`: boolean, default true.
      If set, the exchange is deleted when there are no longer queues
      bound to it.
  - `noDeclare`: boolean, default false.
      If set, the exchange will not be declared, this will allow the exchange
      to be deleted if you dont know its previous options.
  - `confirm`: boolean, default false.
      If set, the exchange will be in confirm mode, and you will get a 
      'ack'|'error' event emitted on a publish, or the callback on the publish
      will be called.

- `context` context returned within the promise allowing state transmission between promise.

- In return callbacks registered on the promise are invoked with the following object:
  
  ```
  { connection: connection
  , exchange: exchange
  , context: context
  }
  ```
  where `connection` is the specified connection and `exchange` is the opened exchange.

 */
var exchangeF = module.exports.exchange = function(connection, opts, context) {
        var exchangeName = opts.name;
        var exchangeSettings = opts.settings || {};
        log.info("Opening exchange '%s' with settings %j", exchangeName, exchangeSettings);

        var deferred = Q.defer();
        connection.exchange(exchangeName, exchangeSettings, function(exchange) {
            deferred.resolve({
                connection: connection,
                exchange: exchange,
                context: (context || {})
            });
        });
        return deferred.promise;
    }

/* {markdown}

(Create, if necessary) and Open a queue.

- `connection` an opened amqp connection
- `opts` queue's options:

     ```
     { name: "tasks" }
     ```

- `context` context returned within the promise allowing state transmission between promise.

- In return callbacks registered on the promise are invoked with the following object:
  
  ```
  { connection: connection
  , queue: queue
  , context: context
  }
  ```
  where `connection` is the specified connection and `queue` is the opened queue.

 */
var queueF = module.exports.queue = function(connection, opts, context) {
        var queueName = opts.name;
        log.info("Creating queue '%s'", queueName);

        var deferred = Q.defer();
        connection.queue(queueName, function(queue) {
            deferred.resolve({
                connection: connection,
                queue: queue,
                context: (context || {})
            });
        });
        return deferred.promise;
    }

function set(context, key, value) {
    context[key] = value;
    return context;
}

/*
(Create if necessary) and Open the exchange and Bind to it any queue declared.

Exchange will be of `topic` type by default.
If set the default queue created will be named `<exchange_name>Q`.

- `connection` an opened amqp connection
- `opts` queue's options:

    `exchange` options with bounded queues definitions.

     ```
     { name: "clean",
     , defaultQ: true
     }
     ```
    
    or

     ```
     { name: "index",
     , defaultQ: false,
     , queues: [{
         name: "insertQ",
         binding: "#.insert"
       }, {
        name: "queryQ",
        binding: "#.query"
       }]
     }
     ```

- `context` context returned within the promise allowing state transmission between promise.

- In return callbacks registered on the promise are invoked with the following object:
  
  ```
  { connection: connection
  , exchange.<exchange_name>: exchange
  (, queue.<queue_name>: queue)*
  , context: context
  }
  ```
  where `connection` is the specified connection and `queue` is the opened queue.

 */
var exchangeWithQueues = module.exports.exchangeWithQueues = function(connection, opts, context) {
        var exchangeName = opts.name,
            exchangeConf = opts.settings || {
                name: exchangeName,
                settings: {
                    type: "topic"
                }
            };

        return exchangeF(connection, exchangeConf, context).then(function(resE) {
            log.info("Exchange '%s' ready", exchangeName);
            var context = set(resE.context, "exchange." + exchangeName, resE.exchange),
                queues  = opts.queues || [];


            if(opts.defaultQ) {
                queues.push({
                  name: exchangeName + "Q",
                  binding: "#"
                });
            } 

            var promises = queues.map(function(queue) {
                var queueName = queue.name;
                return queueF(resE.connection, {
                    name: queue.name,
                    exclusive: false
                }).then(function(resQ) {
                    log.info("Queue %s ready", queueName);
                    var context = set(resQ.context, "queue." + queueName, resQ.queue);

                    var patternKey = queue.binding;
                    log.info("Binding queue '%s' on exchange '%s' using binding key '%s'", queueName, exchangeName, patternKey);
                    resQ.queue.bind(exchangeName, patternKey);
                });
            });
            return Q.all(promises);
        });
    }