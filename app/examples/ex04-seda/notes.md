[[Conf] Recherche d’information (RI) : Fondements et illustration avec Apache Lucene](http://www.arolla.fr/blog/2012/04/devoxx-france-2012-jy-etais/)
[Introduction to Information Retrieval](http://nlp.stanford.edu/IR-book/information-retrieval-book.html)


http://snowball.tartarus.org/algorithms/french/stemmer.html

http://snowball.tartarus.org/otherlangs/french_javascript.txt
http://snowball.tartarus.org/algorithms/french/stop.txt







     [split    ] {topic} + named-queue
         |
         v
     [clean    ] {topic} + named-queue
         |
         v
     [normalize] {topic} + named-queue
         |
         v
       [index] {topic}
     
         |           \
         | #.insert   \  #.query
         v             \
       
     [index]----()     [query]----()