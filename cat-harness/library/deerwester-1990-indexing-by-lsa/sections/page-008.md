---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-008
section_title: "Page 8"
pages: 8-8
pdf_page: 8
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 7 -
4. SVD or two-mode factor analysis
4.1 Overview
The latent semantic structure analysis starts with a matrix of terms by documents. This matrix is
then analyzed by singular value decomposition (SVD) to derive our particular latent semantic
structure model. Singular value decomposition is closely related to a number of mathematical and
statistical techniques in a wide variety of other ﬁelds, including eigenvector decomposition, spectral
analysis, and factor analysis. We will use the terminology of factor analysis, since that approach has
some precedence in the information retrieval literature.
The traditional, one-mode factor analysis begins with a matrix of associations between all pairs
of one type of object, e.g., documents [16]. This might be a matrix of human judgments of document
to document similarity, or a measure of term overlap computed for each pair of documents from an
original term by document matrix. This square symmetric matrix is decomposed by a process called
"eigen-analysis", into the product of two matrices of a very special form (containing "eigenvectors"
and "eigenvalues"). These special matrices show a breakdown of the original data into linearly
independent components or "factors". In general many of these components are very small, and may
be ignored, leading to an approximate model that contains many fewer factors. Each of the original
documents’ similarity behavior is now approximated by its values on this smaller number of factors.
The result can be represented geometrically by a spatial conﬁguration in which the dot product or
cosine between vectors representing two documents corresponds to their estimated similarity.
In two-mode factor analysis one begins not with a square symmetric matrix relating pairs of only
one type of entity, but with an arbitrary rectangular matrix with different entities on the rows and
columns, e.g., a matrix of terms and documents. This rectangular matrix is again decomposed into
three other matrices of a very special form, this time by a process called "singular-value-
decomposition" (SVD). (The resulting matrices contain "singular vectors" and "singular values".)
As in the one-mode case these special matrices show a breakdown of the original relationships into
linearly independent components or factors. Again, many of these components are very small, and
may be ignored, leading to an approximate model that contains many fewer dimensions. In this
reduced model all the term-term, document-document and term-document similarity is now
approximated by values on this smaller number of dimensions. The result can still be represented
geometrically by a spatial conﬁguration in which the dot product or cosine between vectors
representing two objects corresponds to their estimated similarity.
Thus, for information retrieval purposes, SVD can be viewed as a technique for deriving a set of
uncorrelated indexing variables or factors; each term and document is represented by its vector of
factor values. Note that by virtue of the dimension reduction, it is possible for documents with
somewhat different proﬁles of term usage to be mapped into the same vector of factor values. This
is just the property we need to accomplish the improvement of unreliable data proposed earlier.
Indeed, the SVD representation, by replacing individual terms with derived orthogonal factor values,
can help to solve all three of the fundamental problems we have described.
In various problems, we have approximated the original term-document matrix using 50-100
orthogonal factors or derived dimensions. Roughly speaking, these factors may be thought of as
artiﬁcial concepts; they represent extracted common meaning components of many different words
and documents. Each term or document is then characterized by a vector of weights indicating its
strength of association with each of these underlying concepts. That is, the "meaning" of a
