---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-023
section_title: "Page 23"
pages: 23-23
pdf_page: 23
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 22 -
that a particular term has several distinct meanings and to subcategorize it and place it in several
points in the space. We have not yet found a satisfactory way to do that (but see Amsler [36] ;
Choueka & Lusignan [37] ; Lesk [38] ).
The latent semantic indexing methods that we have discussed, and in particular the singular-
value decomposition technique that we have tested, are capable of improving the way in which we
deal with the problem of multiple terms referring to the same object. They replace individual terms
as the descriptors of documents by independent "artiﬁcial concepts" that can be speciﬁed by any one
of several terms (or documents) or combinations thereof. In this way relevant documents that do not
contain the terms of the query, or whose contained terms are qualiﬁed by other terms in the query or
document but not both, can be properly characterized and identiﬁed. The method yields a retrieval
scheme in which documents are ordered continuously by similarity to the query, so that a threshold
can be set depending on the desires and resources of the user and service.
At this point in its development, the method should be regarded as a potential component of a
retrieval system, rather than as a complete retrieval system as such. As a component it would serve
much the same function as is served by raw term vector ranking and other comparison methods. It’s
putative advantages would be the noise reduction, as described above, and data compaction through
the elimination of redundancy. In applying the method, some of the same implementation issues
will arise as in raw vector methods - in particular questions of term weighting, stemming, phrasal
entries, similarity measure, and counterparts for Boolean operators. Unfortunately, the value of such
retrieval enhancing procedures will have to be reevaluated for use with LSI because its
representation changes the nature of the problems with which these procedures were intended to
deal. For example, stemming is done to capture likely synonyms. Since LSI already deals with this
problem to some extent, the additional value of stemming is an open question. Likewise, LSI
averages the "meaning" of polysemous words, where raw term matching maintains one-to-many
mappings; as a result, phrases and other disambiguation techniques may be more important.
