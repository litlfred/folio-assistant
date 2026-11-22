---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-016
section_title: "Page 16"
pages: 16-16
pdf_page: 16
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 15 -
appear in the original analysis. The new objects in both these examples are very much like the
documents of the matrices, X and Xhihat , in that they present themselves as vectors of terms. It is
for this reason that we call them pseudo −documents . In order to compare a query or pseudo-
document, q , to other documents, we need to be able to start with its term vector Xq and derive a
representation Dq that we can use just like a row of D in the comparison formulas of the preceding
section. One criterion for such a derivation is that putting in a real document Xi should give Di (at
least when the model is perfect, i.e., X =Xhihat ). With this constraint, a little algebra shows that:
Dq =Xq ′TS −1
Note that with appropriate rescaling of the axes, this amounts to placing the pseudo-document at the
centroid of its corresponding term points. This Dq then is just like a row of D and, appropriately
scaled by S
1⁄2 or S , can be used like a usual document’s factor vector for making between or within
comparisons, respectively.
4.2.5 Preprocessing and normalization
The equations given here do not take into account any preprocessing or reweighting of the rows
or columns of X. Such preprocessing might be used to prevent documents of different overall length
from having differential effect on the model, or be used to impose certain preconceptions of which
terms are more important. The effects of certain of these transformations can be taken into account
in a straightforward way, but we will not go into the algebra here.
5. Tests of the SVD Latent Semantic Indexing (LSI) method
We have so far tried the LSI method on two standard document collections where queries and
relevance judgments were available (MED and CISI). PARAFAC (Harshman & Lundy [31] ), a
program for the iterative numerical solution of multi-mode factor-analysis problems, was used for
the studies reported below. (Other programs for more standard SVD are also available - e.g., [33] [34]
.)
"Documents" consist of the full text of the title and abstract. Each document is indexed
automatically; all terms occurring in more than one document and not on a stop list of 439 common
words used by SMART are included in the analyses.6 We did not stem words or map variants of
words to the same root form. The analysis begins with a term by document matrix in which each
cell indicates the frequency with which each term occurs in each document. This matrix was
analyzed by singular value decomposition to derive our latent structure model which was then used
for indexing and retrieval. Queries were placed in the resulting space at the centroid of their
constituent terms (again, all terms not on the stop list and occurring in more than one document
were used). Cosines between the query vector and document vectors are then straightforward to
hhhhhhhhhhhhhhh
6. We have argued above that the more terms the better, but so far, computational constraints have limited us to
around 7000 terms. Terms that occur in only one document, or equally frequently in all documents have little or
no inﬂuence on the SVD solution. Rejecting such terms has usually been sufﬁcient to satisfy our computational
constraints. (In addition, we wanted to be as consistent with SMART as possible in indexing, thus the omission
of SMART’s common words.) Given greater resources, we see no reason to omit any terms from the latent
structure analysis. Even given current limited computational resources, the terms omitted in indexing can be
used for retrieval purposes by folding them back into the concept space, as we described brieﬂy in section 3.2.
