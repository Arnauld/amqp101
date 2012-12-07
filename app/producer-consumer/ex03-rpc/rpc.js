
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

    // prevent timeout guard to trigger
    clearTimeout(request.guard);

    // remove the request from the spawned ones
    delete self.requests[correlationId];
    
    request.callback(null, message);
    self.inprogress--;
  }
  else {
    console.log("No matching request found for response (correlationId %s); Request timeout?", correlationId);
  }

  console.log("Requests pending #%j", self.inprogress);
  if(self.inprogress === 0) {
    self.onDone();
  }
}

RPC.prototype.registerReplyTo = function(replyToQueue) {
  var self = this;
  self.replyToQueue = replyToQueue;

  // register ~itself as a listener, reacting when a response is received
  // in the dedicated 'replyTo' queue
  var options = { ack:false, exclusive:true };
  replyToQueue.subscribe(options, function(msg, headers, deliveryInfo, m) {
    self.onResponse(m.correlationId, msg);
  });
  return self;
}

var cId = 0;

RPC.prototype.emitRequest = function(message, callback) {
  var self = this;

  self.inprogress++;
  
  // generate a unique correlationId for the request
  var correlationId = "0x" + (cId++);

  // timout when no response was received after a given amount of time
  var guard = setTimeout(function() {
    console.log("No response in time %s: timeout", correlationId);
    var request = self.requests[correlationId];
    delete self.requests[correlationId];
    
    request.callback({error:"timout", correlationId:correlationId});
    self.inprogress--;

  }, message.timeout || 2000);

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
  console.log("Publishing message payload: %j, correlationId: %j", 
              msg, correlationId);
  var res = self.requestExchange.publish(key, msg, opts);
  console.log("Res %j", res);
};
