---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-005
section_title: "Page 5"
pages: 5-5
pdf_page: 5
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 4 -
limited to simple pairwise correlation.
In document 2 we would like our analysis to tell us that the term "information" is in fact
something of an imposter. Given the other terms in the query and in that document we would predict
no occurrence of a term with the meaning here intended for "information", i.e. knowledge desired by
a searcher. A correlational structure analysis may allow us to down-weight polysemous terms by
taking advantage of such observations.
Our overall research program has been to ﬁnd effective models for overcoming these problems.
We would like a representation in which a set of terms, which by itself is incomplete and unreliable
evidence of the relevance of a given document, is replaced by some other set of entities which are
more reliable indicants. We take advantage of implicit higher-order (or latent) structure in the
association of terms and documents to reveal such relationships.
3.2 The choice of method for uncovering latent semantic structure
The goal is to ﬁnd and ﬁt a useful model of the relationships between terms and documents. We
want to use the matrix of observed occurrences of terms applied to documents to estimate
parameters of that underlying model. With the resulting model we can then estimate what the
observed occurrences really should have been. In this way, for example, we might predict that a
given term should be associated with a document, even though, because of variability in word use,
no such association was observed.
The ﬁrst question is what sort of model to choose. A notion of semantic similarity, between
documents and between terms, seems central to modeling the patterns of term usage across
documents. This led us to restrict consideration to proximity models, i.e., models that try to put
similar items near each other in some space or structure. Such models include: hierarchical,
partition and overlapping clusterings; ultrametric and additive trees; and factor-analytic and
multidimensional distance models (see Carroll & Arabie [10] for a survey).
Aiding information retrieval by discovering latent proximity structure has at least two lines of
precedence in the literature. Hierarchical classiﬁcation analyses are frequently used for term and
document clustering [11] [12] [13] . Latent class analysis [14] and factor analysis [15] [16] [17] have also
been explored before for automatic document indexing and retrieval.
In document clustering, for example, a notion of distance is deﬁned such that two documents are
considered close to the extent that they contain the same terms. The matrix of document-to-
document distances is then subjected to a clustering analysis to ﬁnd a hierarchical classiﬁcation for
the documents. Retrieval is based on exploring neighborhoods of this structure. Similar efforts
have analyzed word usage in a corpus and built clusters of related terms, in effect making a
statistically-based thesaurus. We believe an important weakness of the clustering approach is that
hierarchies are far too limited to capture the rich semantics of most document sets. Hierarchical
clusterings permit no cross classiﬁcations, for example, and in general have very few free
parameters (essentially only n parameters for n objects). Empirically, clustering improves the
computational efﬁciency of search; whether or not it improves retrieval success is unclear [13] [18] [19]
.
Previously tried factor analytic approaches have taken a square symmetric matrix of similarities
between pairs of documents (based on statistical term overlap or human judgments), and used linear
algebra to construct a low dimensional spatial model wherein similar documents are placed near one
