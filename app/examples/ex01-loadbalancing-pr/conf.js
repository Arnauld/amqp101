module.exports = {
  broker: { 
  	url: "amqp://localhost" 
  },
  exchange: { 
  	name: "tasks", 
  	settings: { type: "topic", durable:true} 
  },
  queue: { 
    exchangeName: "tasks",
  	queueName: "queue-tasks", 
  	bindingKey: "#",
  }
};