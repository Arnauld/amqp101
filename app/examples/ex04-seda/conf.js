module.exports = {
    broker: { 
        url: "amqp://localhost" 
    },
    producerExchange: "split",
    exchange: { 
    	"split": {
    		name: "split",
    		settings: { type:"fanout"},
    		next:"clean"
    	},
    	"clean": {
    		name: "clean",
    		settings: { type:"fanout"},
    		next:"normalize"
    	},
    	"normalize": {
    		name: "normalize",
    		settings: { type:"fanout"},
    		next:"index"
    	},

    	"index": {
    		name: "index",
    		settings: { type:"fanout"}
    	}
    }
}