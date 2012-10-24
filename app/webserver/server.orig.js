var webserver = require('http').createServer(webserverHandler)
   , io       = require('socket.io').listen(webserver)
   , URL      = require('url')
   , fs       = require('fs')
   , Logger   = require('./logger')
   , argv     = require('optimist').argv
   , static   = require('node-static');

var logger = new Logger();

/******************************************************************************
 ~ webserver part 
 ******************************************************************************/

var webport = argv.webport || 1337;
var webhost = argv.webhost || '127.0.0.1';
webserver.listen(webport, webhost);
logger.info('HTTP Server running at http://' + webhost + ':' + webport);

//
// Create a node-static server instance to serve the './public' folder
//
var file = new(static.Server)('./public');
 
function webserverHandler(req, res) {
  req.addListener('end', function () {
    //
    // Serve files!
    //
    file.serve(request, response);
  });
}

function webserverHandler_homemade(req, res) {
  var url = URL.parse(req.url, true);
  logger.debug("HTTP>" + JSON.stringify(url, null, "  "));

  // default resource
  var file = '/assets/index.html';
  
  // otherwise load file from 'static' subfolder
  if(url.pathname.indexOf('/assets/')===0) {
    file = url.pathname;
  }

  // asynchronously load the resource
  // once done, send it back
  fs.readFile(__dirname + file,
    function (err, data) {
      if (err) {
        logger.error('Error loading <' + file + '>');
        res.writeHead(500);
        return res.end('Error loading <' + file + '>');
      }

      res.writeHead(200);
      res.end(data);
    });
}

/******************************************************************************
 ~ socket.io part 
 ******************************************************************************/

var sockets = {
  all: [],
  byUserId: {},
  register: function(userId, socket) {
    sockets.all.push(socket);
    sockets.byUserId[userId] = socket;
  }
  forEach: function(cb) {
    sockets.all.forEach(cb);
  }
};

io.sockets.on('connection', function (socket) {
  socket.emit('system', { type:"greetings", payload:'Welcome' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

/******************************************************************************
 ~ amqp part
 ******************************************************************************/
var routinkKeyRegexp = /cli\.(\d\d)\.(\d\d)\.(\d\d)\.(\d\d)\.(\d\d)(.*)/

var amqp = {};
var conf = {
  brokerUrl : "amqp://localhost",
  exchangeName : "notification",
  userIdFromRoutingKey: function(routingKey, cb) {
    // routing key;
    // all.xxxx
    // cli.34.17.12.78.77.xxx
    // 012345678901234567
    var pieces = routinkKey.match(routingKeyRegexp);
    if(pieces) {
      cb(undefined, pieces[0] + pieces[1] + pieces[2] + pieces[3] + pieces[4]);
    }
    else {
      cb("Failed to extract userId from '" + routingKey + "'");
    }
  }
};

var notificationDispatch = function(msg, header, deliveryInfo) {
  var routingKey = deliveryInfo.routingKey;

  logger.debug("Got a message with routing key '" + routingKey + "' message received " + JSON.stringify(msg));
  
  if(routingKey.indexOf("all.") === 0) {
    sockets.forEach(function(socket) {
      socket.emit('notification', msg);
    });          
  }
  else {
    conf.userIdFromRoutingKey(routingKey, function(err, userId) {
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
  var exchange = conn.exchange(conf.exchangeName, {'type': 'topic', durable: true}, function() {

    var queue = conn.queue('', {durable: false, exclusive: true}, function() {
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

logger.info("Starting amqp on " + conf.brokerUrl);
var conn = require('amqp').createConnection({url: rabbitUrl});
conn.on('ready', setupAmqp);

