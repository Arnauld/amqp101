var Logger = require('../lib/logger');
var log = new Logger();

var level;
for(level=0; level<6; level++) {
	log.level = level;
	console.log("Level set to %s", level)
	log.error("My name is %s" , "Bob");
	log.error("Level set to %s" , level);
	log.warn("Level set to %s" , level);
	log.info("Level set to %s" , level);
	log.debug("Level set to %s" , level);
}
