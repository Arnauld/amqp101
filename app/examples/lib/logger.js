var colors = require('colors')
  , moment  = require('moment');

colors.setTheme({
  silly: 'rainbow',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'grey',
  verbose: 'cyan'
});


/**
 * Logger (console)
 */
var Logger = module.exports = function (opts) {
	opts = opts || {};
	this.level = opts.level || 4;
}

Logger.prototype.error = function(message) {
	if(this.level > 0)
    log("error".error, message, arguments);
}

Logger.prototype.warn = function(message) {
  if(this.level > 1)
    log("warn ".warn, message, arguments);
}

Logger.prototype.info = function(message) {
  if(this.level > 2)
    log("info ".info, message, arguments);
}

Logger.prototype.debug = function(message) {
  if(this.level > 3)
    log("debug".debug, message, arguments);
}


function log(level, message, params) {
  var time = moment().format('YYYY/MM/DD HH:mm:ss.SSS')
  var args = 
  	[time.debug + " - " + level + " - " + message].concat(Array.prototype.slice.call(params).slice(1));
  console.log.apply(
  	console,
  	args);
}