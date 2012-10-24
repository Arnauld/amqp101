
in [ROUTING TOPOLOGIES FOR PERFORMANCE AND SCALABILITY WITH RABBITMQ](http://blog.springsource.org/2011/04/01/routing-topologies-for-performance-and-scalability-with-rabbitmq/)

> As of RabbitMQ 2.4.0, released March 23, 2011, a new topic routing algorithm optimization is available that is 60 times faster at peak than the previous topic algorithm. Due to this, one recommendation is to go for less exchanges and queues, and more routing because the time increase is now minimal.

Consider:

    <eXchange>----all.#--------(queue)
           \______chloe1.#____/
            \_____bob4.#_____/
             \____ ... _____/ 

Instead of

    <eXchange>----all.#--------(queue-all)
           \______chloe1.#_____(queue-chloe1)
            \_____bob4.#_______(queue-bob4)
             \____ ... 