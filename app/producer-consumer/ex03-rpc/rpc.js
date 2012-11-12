var crypto = require('crypto');


function RPC(requestExchange) {
  var self = this;
  self.requestExchange = requestExchange
  self.requests = {};
  self.inprogress = 0;
  self.onDone = function() {}; // no-op
}

exports = module.exports = RPC;

RPC.prototype.onceDone = function(callback) {
  this.onDone = callback;
}

RPC.prototype.onResponse = function(correlationId, message) {
  var self = this;
  if(self.requests[correlationId]) {
    var request = self.requests[correlationId];
    delete self.requests[correlationId];
    
    clearTimeout(request.guard);
    request.callback(null, message);
    self.inprogress--;
  }

  console.log("Still in progress %j", self.inprogress);
  if(self.inprogress === 0) {
    self.onDone();
  }
}

RPC.prototype.registerReplyTo = function(replyToQueue) {
  var self = this;
  self.replyToQueue = replyToQueue;

  replyToQueue.subscribe({ack:true, exclusive:true}, function(msg, headers, deliveryInfo, m) {
    var routingKey = deliveryInfo.routingKey;
    console.log("Replied '%s' // '%j': %j // %j", routingKey, headers, msg);
    self.onResponse(m.correlationId, msg);
  });
  return self;
}

RPC.prototype.emitRequest = function(message, callback) {
  var self = this;

  self.inprogress++;
  
  // generate a unique correlationId for the request
  var correlationId = crypto.randomBytes(16).toString('hex');

  // no response after timeout
  var guard = setTimeout(function(){
    var request = self.requests[correlationId];
    delete self.requests[correlationId];
    
    request.callback({error:"timout"});
    self.inprogress--;

  }, message.timeout || 500);

  // track request
  self.requests[correlationId] = {
    callback: callback,
    guard: guard
  };

  var opts = {
    contentType: "application/json",
    correlationId: correlationId,
    replyTo: self.replyToQueue.name
  };

  var key = message.key;
  var msg = message.payload;
  console.log("Publishing message on exchange '%s', routingKey: %s, payload: %j, options: %j", 
              self.requestExchange.name, key, msg, opts);
  var res = self.requestExchange.publish(key, msg, opts);
  console.log("Res %j", res);
};
