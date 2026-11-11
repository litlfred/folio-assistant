---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-007
section_title: "Page 7"
pages: 7-7
pdf_page: 7
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 6 -
2.
Explicit representation of both terms and documents. The desire to represent both terms and
documents simultaneously is more than esthetic. In our proximity-based latent structure
paradigm, retrieval proceeds by appropriately placing a new object corresponding to the query
in the semantic structure and ﬁnding those documents that are close by. One simple way to
achieve appropriate placement is if terms, as well as documents, have positions in the
structure. Then a query can be placed at the centroid of its term points. Thus for both
elegance and retrieval mechanisms, we needed what are called two-mode proximity methods
(Carroll and Arabie [10] ), that start with a rectangular matrix and construct explicit
representations of both row and column objects. One such method is multidimensional
unfolding [22] [23] [24] , in which both terms and documents would appear as points in a single
space with similarity related monotonically to Euclidean distance. Another is two-mode factor
analysis [25] [26] [27] [28] , in which terms and documents would again be represented as points
in a space, but similarity is given by the inner product between points. A ﬁnal candidate is
unfolding in trees [29] , in which both terms and documents would appear as leaves on a tree,
and path length distance through the tree would give the similarity (one version of this is
equivalent to simultaneous hierarchical clustering of both terms and objects). The explicit
representation of both terms and documents also leads to a straightforward way in which to
add or "fold-in" new terms or documents that were not in the original matrix. New terms can
be placed at the centroid of the documents in which they appear; similarly, new documents
can be placed at the centroid of their constituent terms.3
3.
Computational tractability for large datasets. Many of the existing models require
computation that goes up with N 4 or N 5 (where N is the number of terms plus documents).
Since we hoped to work with document sets that were at least in the thousands, models with
efﬁcient ﬁtting techniques were needed.
The only model which satisﬁed all three criteria was two-mode factor analysis. The tree
unfolding model was considered too representationally restrictive, and along with non-metric
multidimensional unfolding, too computationally expensive. Two-mode factor analysis is a
generalization of the familiar factor analytic model based on singular value decomposition (SVD).
(See Forsythe, Malcolm & Moler [30] , Chapter 9, for an introduction to SVD and its applications.)
SVD represents both terms and documents as vectors in a space of choosable dimensionality, and
the dot product or cosine between points in the space gives their similarity. In addition, a program
was available [31] that ﬁt the model in time of order N 2 x k 3.
hhhhhhhhhhhhhhh
3. There are several important and interesting issues raised by considering the addition of new terms and
documents into the space. First, the addition of new objects introduces some temporal dependencies in the
representation. That is, where a new term or document gets placed depends on what other terms and documents
are already in the space. Second, in general, simply folding-in new terms or documents will result in a
somewhat different space than would have been obtained had these objects been included in the original
analysis. Since the initial analysis is time consuming, it is clearly advantageous to be able to add new objects by
folding-in. How much of this can be done without rescaling is an open research issue, and is likely to depend on
the variability of the database over time, the representativeness of the original of documents and terms, etc.
