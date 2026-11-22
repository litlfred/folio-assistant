---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 1 -
1. Introduction
We describe here a new approach to automatic indexing and retrieval. It is designed to
overcome a fundamental problem that plagues existing retrieval techniques that try to match words
of queries with words of documents. The problem is that users want to retrieve on the basis of
conceptual content, and individual words provide unreliable evidence about the conceptual topic or
meaning of a document. There are usually many ways to express a given concept, so the literal
terms in a user’s query may not match those of a relevant document. In addition, most words have
multiple meanings, so terms in a user’s query will literally match terms in documents that are not of
interest to the user.
The proposed approach tries to overcome the deﬁciencies of term-matching retrieval by treating
the unreliability of observed term-document association data as a statistical problem. We assume
there is some underlying latent semantic structure in the data that is partially obscured by the
randomness of word choice with respect to retrieval. We use statistical techniques to estimate this
latent structure, and get rid of the obscuring "noise". A description of terms and documents based
on the latent semantic structure is used for indexing and retrieval.1
The particular "latent semantic indexing" (LSI) analysis that we have tried uses singular-value
decomposition. We take a large matrix of term-document association data and construct a
"semantic" space wherein terms and documents that are closely associated are placed near one
another. Singular-value decomposition allows the arrangement of the space to reﬂect the major
associative patterns in the data, and ignore the smaller, less important inﬂuences. As a result, terms
that did not actually appear in a document may still end up close to the document, if that is
consistent with the major patterns of association in the data. Position in the space then serves as the
new kind of semantic indexing, and retrieval proceeds by using the terms in a query to identify a
point in the space, and documents in its neighborhood are returned to the user.
2. Deﬁciencies of current automatic indexing and retrieval methods
A fundamental deﬁciency of current information retrieval methods is that the words searchers
use often are not the same as those by which the information they seek has been indexed. There are
actually two sides to the issue; we will call them broadly synonymy and polysemy. We use
synonymy in a very general sense to describe the fact that there are many ways to refer to the same
object. Users in different contexts, or with different needs, knowledge, or linguistic habits will
describe the same information using different terms. Indeed, we have found that the degree of
variability in descriptive term usage is much greater than is commonly suspected. For example, two
people choose the same main key word for a single well-known object less than 20% of the time [1] .
Comparably poor agreement has been reported in studies of inter-indexer consistency [2] and in the
generation of search terms by either expert intermediaries [3] or less experienced searchers
[4] [5] . The prevalence of synonyms tends to decrease the "recall" performance of retrieval systems.
By polysemy we refer to the general fact that most words have more than one distinct meaning
hhhhhhhhhhhhhhh
1. By "semantic structure" we mean here only the correlation structure in the way in which individual words
appear in documents; "semantic" implies only the fact that terms in a document may be taken as referents to the
document itself or to its topic.
