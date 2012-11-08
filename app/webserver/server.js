// let's reuse the socket.io's logger utility
var Logger = require('./node_modules/socket.io/lib/logger');
var logger = new Logger();

// simple command line argument parser
var argv     = require('optimist').argv;

// our internal server's bus
var EventEmitter = require('events').EventEmitter;
var eventBus = new EventEmitter();

/******************************************************************************
 ~ webserver part 
 ******************************************************************************/
var webapp = (function() {

  // uses command line settings or fallback on defaults
  var web = {
    port : argv.webport || 1337,
    host : argv.webhost || '127.0.0.1'
  };

  // create an http server that dedicates its incoming 
  // requests to the 'webserverHandler' function
  var webapp = require('http').createServer(webserverHandler);
  webapp.listen(web.port, web.host);
  logger.info('HTTP Server running at http://' + web.host + ':' + web.port);

  // Create a node-static server instance to serve 
  // the './public' folder
  var static = require('node-static');
  var file   = new(static.Server)('./public');
   
  function webserverHandler(req, res) {
    req.addListener('end', function () {
      file.serve(request, response);
    });
  }
  return webapp;
})();

/******************************************************************************
 ~ socket.io part 
 ******************************************************************************/

(function() {
  // connect socket.io to our webapp
  var io = require("socket.io").listen(webapp);

  // new connection opened
  io.sockets.on('connection', function (socket) {
    socket.emit('system', { type:"greetings", payload:'Welcome' });
    socket.on('whoisit', function(userId) {
      logger.debug("Registering socket to user '" + userId + "'");
      // TODO store userId on the socket itself
      eventBus.emit('socket', userId, socket);
    });
  });
})();

/******************************************************************************
 ~ amqp part
 ******************************************************************************/

// keep track of all opened (socket.io) sockets
var sockets = {
  all: [],
  byUserId: {},
  register: function(userId, socket) {
    sockets.all.push(socket);
    sockets.byUserId[userId] = socket;
  },
  forEach: function(cb) {
    sockets.all.forEach(cb);
  }
};

// dedicated queue
var queue;

var routingKeyRegexp = /cli\.(\d\d)\.(\d\d)\.(\d\d)\.(\d\d)\.(\d\d)(.*)/

// uses command line settings or fallback on defaults
var amqp = {
  // amqp[s]://[user:password@]hostname[:port][/vhost]
  brokerUrl    : argv.brokerUrl || "amqp://localhost",
  exchangeName : argv.exchangeName || "notification",
  // routing key;
  // all.xxxx
  // cli.34.17.12.78.77.xxx
  // 012345678901234567
  userIdToRoutingKey: function(userId, cb) {
    cb("cli." + userId.substring(0, 2) 
        + "." + userId.substring(2, 4) 
        + "." + userId.substring(4, 6)
        + "." + userId.substring(6));
  },
  routingKeyToUserId: function(routingKey, cb) {
    var pieces = routingKey.match(routingKeyRegexp);
    if(pieces) {
      cb(undefined, pieces[0] + pieces[1] + pieces[2] + pieces[3] + pieces[4]);
    }
    else {
      cb("Failed to extract userId from '" + routingKey + "'");
    }
  }
};

// listen for new socket
eventBus.on('socket', function(userId, socket) {
  sockets.register(userId, socket);

  logger.info("Add binding for user " + userId + ": '" + "'");
  queue.bind(amqp.exchangeName, userId + '.#', function() {
    logger.debug("Binding added for user " + userId);
  });
});

var notificationDispatch = function(msg, header, deliveryInfo) {
  var routingKey = deliveryInfo.routingKey;

  logger.debug("Got a message with routing key '" + routingKey + "' message received " + JSON.stringify(msg));
  
  if(routingKey.indexOf("all.") === 0) {
    sockets.forEach(function(socket) {
      socket.emit('notification', msg);
    });          
  }
  else {
    conf.routingKeyToUserId(routingKey, function(err, userId) {
      if(err) {
        logger.error(err);
        return;
      }

      logger.debug("Attempt to emit notification to " + userId);
      var socket = sockets.byUserId[userId];
      if(socket) {
        socket.emit('notification', msg);
      }
      else {
        logger.warn("No socket found for userId '" + userId + "'");
      }
    });
  }
};

var setupAmqp = function() {
  var exchange = conn.exchange(amqp.exchangeName, {'type': 'topic', durable: true}, function() {

    queue = conn.queue('', {durable: false, exclusive: true}, function() {
      queue.subscribe(notificationDispatch);
      queue.bind(exchange.name, 'all.#', function () {
        logger.info("Queue binding done on 'all.#'");
      });
    });
    queue.on('disconnect', function(what) {
      logger.info("Disconnect " + JSON.stringify(what));
    });

    // queue.on('queueBindOk', function(what) {
    //   logger.info("Queue bind OK " + JSON.stringify(what));
    // });
    // queue.on('queueUnbindOk', function(what) {
    //   logger.info("Queue unbind OK " + JSON.stringify(what));
    // });

    amqp.queue = queue;
  });
};


logger.info("Starting amqp on " + amqp.brokerUrl);
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
