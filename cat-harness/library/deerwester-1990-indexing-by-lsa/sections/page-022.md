---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-022
section_title: "Page 22"
pages: 22-22
pdf_page: 22
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 21 -
power. In Borko and Bernick [16] , for example, factor analysis was performed on a term-term
correlation matrix (calculated from word usage over 260 abstracts), and 21 orthogonal factors were
selected on the basis of their interpretability. Documents were classiﬁed into these 21 categories on
the basis of normalized factor loadings for each term in the abstract, and performance was
comparable to that of another automatic system. It should be noted, however, that the information
used for classiﬁcation is much less than that which is available in the 21-dimensional factor space,
since only the factor loading of "signiﬁcant" terms on each of the factors was used (e.g. one value
for 5, 4, and 7 terms deﬁning the three sample factors presented in their Appendix B). In addition,
Borko’s work addressed the problem of document classiﬁcation, and not document retrieval. There
is, for example, no discussion of how one might use the full factor space (and not just the document
clusters derived from it) for document retrieval.
Koll’s [20] work on concept-based information retrieval is very similar in spirit to our latent
semantic indexing. Both terms and documents are represented in a single concept space on the basis
of statistical term co-occurrences. Beginning with axes deﬁned by a set of 7 non-overlapping (in
terms) and almost-spanning documents, terms were placed on the appropriate axis. New documents
were placed at the mean of constituent terms, and new terms were placed at the location of the
document in which they occurred. The system was evaluated with only a very small database of
documents and queries, but under some circumstances performance was comparable to that of SIRE
for Boolean and natural language queries. Our experience with the MED dataset suggests that better
performance might have been obtained with a higher dimensional representation. In addition, the
latent semantics approach is not order-dependent (as is Koll’s procedure), and it is a mathematically
rigorous way of uncovering truly orthogonal basis axes or factors for indexing.
The representation of documents by LSI is economical; each document and term need be
represented only by something on the order of 50 to 150 values. We have not explored the degree of
accuracy needed in these numbers, but we guess that a small integer will probably sufﬁce. The
storage requirements for a large document collection can be reduced because much of the
redundancy in the characterization of documents by terms is removed in the representation.
Offsetting the storage advantage is the fact that the only way documents can be retrieved is by an
exhaustive comparison of a query vector against all stored document vectors. Since search
algorithms in high dimensional space are not very efﬁcient on serial computers, this may detract
from the desirability of the method for very large collections. An additional drawback involves
updating. The initial SVD analysis is time consuming, so we would like a more efﬁcient method of
adding new terms and documents. We suggest that new documents be located at the centroid of
their terms (appropriately scaled); and new terms be placed at the centroid of the documents in
which they appear (appropriately scaled). How much of this updating can be done without having to
perform a new decomposition is unknown.
While the LSI method deals nicely with the synonymy problem, it offers only a partial solution
to the polysemy problem. It helps with multiple meanings because the meaning of a word can be
conditioned not only by other words in the document but by other appropriate words in the query not
used by the author of a particular relevant document. The failure comes in the fact that every term is
represented as just one point in the space. That is, a word with more than one entirely different
meaning (e.g. "bank"), is represented as a weighted average of the different meanings. If none of the
real meanings is like the average meaning, this may create a serious distortion. (In classical term
overlap methods, the meaning of the term is the union of all of it’s meanings, which probably leads
to less outright distortion, but to more imprecision.) What is needed is some way to detect the fact
