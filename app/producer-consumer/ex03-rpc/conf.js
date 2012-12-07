module.exports = {
  broker: { 
  	url: "amqp://localhost" 
  },
  exchange: { 
  	name: "service", 
  	settings: { type: "topic", durable:true } 
  },
  queue: { 
    name: "queue-service", 
    bindingKey: "#",
    // @see 'consumer() { ... queue.shift(); }' and '{ ack: true }'
    settings: { ack: false }
  }
};