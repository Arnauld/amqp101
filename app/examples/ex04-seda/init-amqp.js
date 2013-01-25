// shared configuration stored in conf.js
var amqp = require('../lib/amqp-q-promise'),
    Q = require("q"),
    Logger = require('../lib/logger'),
    log = new Logger();

var amqpSettings = {
    url: "amqp://localhost"
};

var exchanges = [{
    name: "split",
    defaultQ: true
}, //
{
    name: "clean",
    defaultQ: true
}, {
    name: "normalize",
    defaultQ: true
}, {
    name: "index",
    defaultQ: false,
    queues: [{
        name: "insertQ",
        binding: "#.insert"
    }, {
        name: "queryQ",
        binding: "#.query"
    }]
}];

function set(context, key, value) {
    context[key] = value;
    return context;
}

var context = exports.context = {};

amqp.connect(amqpSettings, context).then(function(res) {
    log.info("Connection ready");
    var context = set(res.context, "connection", res.connection);
    var promises = exchanges.map(function(exchangeConf) {
        return amqp.exchangeWithQueues(res.connection, exchangeConf, res.context);
    });
    return Q.all(promises);
}).then(function(res) {
    log.info("Exchanges and queues ready");
}).done();

