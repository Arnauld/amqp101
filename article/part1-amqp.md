
# AMQP

A l'heure des architectures élastiques, des clusters de serveurs, de la répartitions de charges, de l'intégration de système tiers et de l'asynchronisme, il existe un composant essentiel: le bus de message. Véritable coordinateur de l'infrastructure et des différents systèmes, il permet aux différents composants de communiquer entre eux de manière totallement transparente et sans contraintes des technologies sous-jacentes de chacuns d'eux.
On retrouve ainsi généralement des bus JMS, des files MQseries (IBM) ou des broker Tibco, ... TODO des solutions relativement lourdes à mettre en place et généralement très liées au language sous-jacent: Java. JMS ne définit en effet pas un protocole d'échange mais un ensemble d'API ce qui ne facilite pas vraiment l'interopérabilité avec un autre langage.

Alors qu'un mouvement de fond pousse à la simplicité, des solutions alternatives se mettent en place comme le pubsub de Redis (TODO link) ou encore Riak (TODO).
Bien que ces technologies soient utilisées par les plus grands du web, certains projets restent encore frileux à utiliser des protocoles spécifiques et non normé. Il existe cependant une alternative "industrielle", qui paradoxalement est très simple d'utilisation et à mettre en place: AMQP, hummmm encore un accronyme douteux? Jamais entendu parler? Et bien regarder de plus près le portefeuille d'application de VMWare (et de SpringSource): RabbitMQ. Il s'agit d'une implémentation du broker de ce protocole.
Advanced Message Queueing Protocol (AMQP) a été créé comme un standard ouvert (open standard)
