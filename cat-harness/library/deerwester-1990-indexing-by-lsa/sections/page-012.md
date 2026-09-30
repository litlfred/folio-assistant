---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-012
section_title: "Page 12"
pages: 12-12
pdf_page: 12
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 11 -
------------------------------------------------------
Insert Figure here - 2d example of 9 tms
------------------------------------------------------
Figure 1
Terms are shown as ﬁlled circles and labeled accordingly; document titles are represented by open
squares, with the numbers of the terms contained in them indicated parenthetically. Thus, each term
and document can be described by its position in this two-dimensional factor space.
One test we set ourselves is to ﬁnd documents relevant to the query: "human computer
interaction". Simple term matching techniques would return documents c1, c2 and c4 since they
share one or more terms with the query. However, two other documents which are also relevant (c3
and c5) are missed by this method since they have no terms in common with the query. The latent
semantic structure method uses the derived factor representation to process the query; the ﬁrst 2-
dimensions are shown in Figure 1. First, the query is represented as a "pseudo-document" in the
factor space. Two of the query terms, "human" and "computer", are in the factor space, so the query
is placed at their centroid and scaled for comparison to documents (the point labeled q in Figure 1
represents the query). Then, we simply look for documents which are near the query, q . In this
case, documents c1-c5 (but not m1-m4) are "nearby" (within a cosine of .9, as indicated by the
dashed lines). Notice that even documents c3 and c5 which share no index terms at all with the
query are near it in this representation. The relations among the documents expressed in the factor
space depend on complex and indirect associations between terms and documents, ones that come
from an analysis of the structure of the whole set of relations in the term by document matrix. This is
the strength of using higher order structure in the term by document matrix to represent the
underlying meaning of a single term, document, or query. It yields a more robust and economical
representation than do straight term overlap or surface-level clustering methods.
4.2 Technical details
4.2.1 The Singular Value Decomposition (SVD) Model.
This section details the mathematics underlying the particular model of latent structure, singular
value decomposition, that we currently use. The casual reader may wish to skip this section and
proceed to Section 5.
Any rectangular matrix, for example a t xd matrix of terms and documents, X , can be
decomposed into the product of three other matrices:
X =T 0S 0D 0′,
such that T 0 and D 0 have orthonormal columns and S 0 is diagonal. This is called the singular value
decomposition of X . T 0 and D 0 are the matrices of left and right singular vectors and S 0 is the
diagonal matrix of singular values.4 Singular value decomposition (SVD) is unique up to certain
