---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-011-35-evaluation
section_title: "Evaluation"
section_number: 3.5
pages: 10-11
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
We compare the MAP of each of the four versions of LSA and CA to explore the perfor-
mance of these methods in information retrieval under changes in the contributions of initial
dimensions (Kolda & O’leary, 1998). The MAP is calculated as follows:
• The similarity is assessed between a query vector and each document vector of a docu-
ment collection. We use three similarity metrics: Euclidean distance, dot similarity, and
cosine similarity. As Euclidean distance is a key motivation for CA, we report results
on Euclidean distance, and only report partial results for dot and cosine similarity in the
main paper and the other results in the supplementary materials.
• For Euclidean distance, the documents are ranked in an increasing order based on their
similarity with the query vector (for dot and cosine similarity, the ranking is in the
decreasing order); therefore, the ﬁrst document has the highest similarity.
• Precision-recall points are derived from the ordered list of documents. For a given query,
Table 4 deﬁnes four types of documents in the ordered list based on whether a document
is relevant and retrieved:
C = the set of relevant documents from the ordered list, i.e., documents that fall in the
same category as the query
D = the set of retrieved documents from the ordered list., i.e., when 10 documents are
returned, the set of retrieved documents consists of the ﬁrst 10 documents in the ordered
list.
Let |.| denote the number of documents in a set. Then, precision and recall are deﬁned as
precision = |C ∩D|
|D|
(11)
and
recall = |C ∩D|
|C|
.
(12)
Thus, precision is deﬁned as the ratio of the number of relevant documents retrieved over
the total number of retrieved documents, and recall is deﬁned as the ratio of the number
of relevant documents retrieved over the total number of relevant documents. For a given
query, the set C is ﬁxed. The set D is not ﬁxed; if we return the ﬁrst i documents, then D
consists of the ﬁrst i documents in the ordered list. Thus, for a given i, we can obtain a
Table 4 Retrieved and relevant
documents
Relevant
Non-relevant
Retrieved
C ∩D
C∩D
Not Retrieved
C ∩D
C ∩D
123
Journal of Intelligent Information Systems
precision (see (11)) and recall (see (12)) pair. We run values of i from 1 to l (the number
of documents in the ordered list), and obtain l precision-recall pairs.
• Then, 11 pseudo-precisions are calculated under 11 recalls (0, 0.1, · · · , 1.0), where a
pseudo-precision at recall x is the maximum precision from recall x to recall 1. For
example, pseudo-precision at recall 0.2 is the maximum precision from recall 0.2 to
recall 1.
• The average precision for the query is obtained by averaging the 11 pseudo-precisions.
• The MAP is the mean across all queries.
Greater MAP values indicate a better performance.
