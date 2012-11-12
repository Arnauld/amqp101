module.exports = {
  broker: { 
  	url: "amqp://localhost" 
  },
  exchange: { 
  	name: "tasks", 
  	settings: { type: "topic", durable:true} 
  },
  queue: { 
  	name: "queue-tasks", 
  	bindingKey: "#",
    // @see 'consumer() { ... queue.shift(); }' and '{ ack: true }'
    settings: { ack: true }
  }
};