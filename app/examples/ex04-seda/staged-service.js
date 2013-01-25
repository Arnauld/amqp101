// simple command line argument parser
var program = require('commander');
program.version('1.0.0').option('-s, --stage [split|clean|normalize|index|query]', "Service's stage [split]", 'split').parse(process.argv);


// shared configuration stored in conf.js
var context = require('./init-amqp').context,
    Logger = require('../lib/logger'),
    log = new Logger(),
    env = { id: require('crypto').randomBytes(8).toString("hex") };

var processMessage = function(msg, cb) {
        var process = require('./service-' + program.stage).process;
        process(msg, cb, env);
    }

    /**
     * Our consumer implementation:
     *
     * @param queue the corresponding queue
     *              the consumer will... consumed!
     * @return a function that will be called for
     *              every a new message is received
     */

function consumerFor(queue, exchange) {
    return function(msg, header, deliveryInfo) {
        var opts = {
            contentType: "application/json"
        };
        processMessage(msg, function(processed) {
            if(exchange) {
                var key = processed.key,
                    msg = processed;


                log.info("Publishing message on exchange '%s', routingKey: %s, payload: %j", exchange.name, key, msg);
                var res = exchange.publish(key, msg, opts);
                log.info("Res %j", res);
            }
        });
    };
}

var srcQueue, dstExchange;
if(program.stage === "split") {
    srcQueue = "splitQ";
    dstExchange = "clean";
}
else if(program.stage === "clean") {
    srcQueue = "cleanQ";
    dstExchange = "normalize";
}
else if(program.stage === "normalize") {
    srcQueue = "normalizeQ";
    dstExchange = "index";
}
else if(program.stage === "index") {
    srcQueue = "splitQ";
    dstExchange = "clean";
}


context[program.stage + "Q"]

function set(context, key, value) {
    context[key] = value;
    return context;
}

amqp.connect({
    url: conf.broker.url
}, {}).then(function(res) {
    log.info("Connection ready");
    var context = set(res.context, "connection", res.connection);
    return amqp.exchange(res.connection, conf.exchange[program.stage], context);
}).then(function(res) {
    log.info("Source Exchange %s ready", res.exchange.name);
    var context = set(res.context, "srcExchange", res.exchange);

    var queueDef = function(context) {
            // queue name set to empty ""; this will generate a random and unique name
            // for the queue consumed by the service
            return amqp.queue(res.connection, {
                name: "",
                exclusive: true
            }, context);
        };

    // is there any Exchange next?
    if(conf.exchange[program.stage].next) {
        var next = conf.exchange[program.stage].next;
        return amqp.exchange(res.connection, conf.exchange[next], context).then(function(res) {
            log.info("Destination exchange %s ready", res.exchange.name);
            var context = set(res.context, "dstExchange", res.exchange);
            return queueDef(context);
        });
    } else {
        return queueDef(context);
    }
}).then(function(res) {
    var queue = res.queue,
        context = res.context,
        settings = {
            ack: false
        },
        bindingKey = "#" // does not matter
        ,
        srcExchangeName = context.srcExchange.name;

    log.info("Queue %s ready, subscribing with setting %j", queue.name, settings);
    queue.subscribe(settings, consumerFor(queue, context.dstExchange));

    log.info("Binding queue '%s' on exchange '%s' using binding key '%s'", queue.name, srcExchangeName, bindingKey);
    queue.bind(srcExchangeName, bindingKey);
}).done();