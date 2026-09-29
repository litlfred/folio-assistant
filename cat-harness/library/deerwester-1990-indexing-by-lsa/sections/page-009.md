---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-009
section_title: "Page 9"
pages: 9-9
pdf_page: 9
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 8 -
particular term, query, or document can be expressed by k factor values, or equivalently, by the
location of a vector in the k -space deﬁned by the factors. The meaning representation is economical,
in the sense that N original index terms have been replaced by the k <N best surrogates by which
they can be approximated. We make no attempt to interpret the underlying factors, nor to "rotate"
them to some meaningful orientation. Our aim is not to be able to describe the factors verbally but
merely to be able to represent terms, documents and queries in a way that escapes the unreliability,
ambiguity and redundancy of individual terms as descriptors.
It is possible to reconstruct the original term by document matrix from its factor weights with
reasonable but not perfect accuracy. It is important for the method that the derived k -dimensional
factor space not reconstruct the original term space perfectly, because we believe the original term
space to be unreliable. Rather we want a derived structure that expresses what is reliable and
important in the underlying use of terms as document referents.
Unlike many typical uses of factor analysis, we are not necessarily interested in reducing the
representation to a very low dimensionality, say two or three factors, because we are not interested
in being able to visualize the space or understand it. But we do wish both to achieve sufﬁcient power
and to minimize the degree to which the space is distorted. We believe that the representation of
conceptual space for any large document collection will require more than a handful of underlying
independent "concepts", and thus that the number of orthogonal factors that will be needed is likely
to be fairly large. Moreover, we believe that the model of a Euclidean space is at best a useful
approximation. In reality, conceptual relations among terms and documents certainly involves more
complex structures, including, for example, local hierarchies and non-linear interactions between
meanings. More complex relations can often be made to approximately ﬁt a dimensional
representation by increasing the number of dimensions. In effect, different parts of the space will be
used for different parts of the language or object domain. Thus we have reason to avoid both very
low and extremely high numbers of dimensions. In between we are guided only by what appears to
work best. What we mean by "works best" is not (as is customary in some other ﬁelds) what
reproduces the greatest amount of variance in the original matrix, but what will give the best
retrieval effectiveness.
How do we process a query in this representation? Recall that each term and document is
represented as a vector in k -dimensional factor space. A query, just as a document, initially appears
as a set of words. We can represent a query (or "pseudo-document") as the weighted sum of its
component term vectors. (Note that the location of each document can be similarly described; it is a
weighted sum of its constituent term vectors.) To return a set of potential candidate documents, the
pseudo-document formed from a query is compared against all documents, and those with the
highest cosines, that is the nearest vectors, are returned. Generally either a threshold is set for
closeness of documents and all those above it returned, or the n closest are returned. (We are
concerned with the issue of whether the cosine measure is the best indication of similarity to predict
human relevance judgments, but we have not yet systematically explored any alternatives, cf. Jones
& Furnas [32] .)
A concrete example may make the procedure and its putative advantages clearer. Table 2 gives
a sample dataset. In this case, the document set consisted of the titles of 9 Bellcore technical
memoranda. Words occurring in more than one title were selected for indexing; they are italicized.
Note that there are two classes of titles: ﬁve about human-computer interaction (labeled c1-c5) and
four about graph theory (labeled m1-m4). The entries in the term by document matrix are simply
