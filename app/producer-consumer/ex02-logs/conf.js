module.exports = {
  broker: { 
  	url: "amqp://localhost" 
  },
  exchange: { 
  	name: "logs", 
  	settings: { type: "topic", durable:true} 
  },
  queue: { 
    journal : {
      name: "queue-journal", 
      bindingKey: "#",
      // @see 'consumer() { ... queue.shift(); }' and '{ ack: true }'
      settings: { ack: false }
    },
    monitor : {
      name: "queue-monitor", 
      bindingKey: "logs.#",
      // @see 'consumer() { ... queue.shift(); }' and '{ ack: true }'
      settings: { ack: true }
    },
    alert : {
      name: "queue-alert", 
      bindingKey: "logs.#.critical",
      // @see 'consumer() { ... queue.shift(); }' and '{ ack: true }'
      settings: { ack: true }
    },
  }
};