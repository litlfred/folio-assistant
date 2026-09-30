---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-006
section_title: "Page 6"
pages: 6-6
pdf_page: 6
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 5 -
another. The factor analytic model has the potential of much greater richness than the clustering
model (a k dimensional model for n points has nk parameters). However previous attempts along
these lines, too, had shortcomings. First, factor analysis is computationally expensive, and since
most previous attempts were made 15-20 years ago, they were limited by processing constraints [16] .
Second, most past attempts considered restricted versions of the factor analytic model, either by
using very low dimensionality, or by converting the factor analysis results to a simple binary
clustering [16] . Third, some attempts have relied on excessively tedious data gathering techniques,
requiring the collection of thousands of similarity judgments from humans [17] .
Previously reported clustering and factor analytic approaches have also struggled with a certain
representational awkwardness. Typically the original data explicitly relate two types of entities,
terms and documents, and most conceptions of the retrieval problem mention both types (e.g., given
terms that describe a searchers’ interests, relevant documents are returned). However,
representations chosen so far handle only one at a time (e.g., either term clustering or document
clustering). Any attempts to put the ignored entity back in the representation have been arbitrary
and after the fact. An exception to this is a proposal by Koll [20] in which both terms and documents
are represented in the same space of concepts (see also Raghavan & Wong [21] ). While Koll’s
approach is quite close in spirit to the one we propose, his concept space was of very low
dimensionality (only seven underlying dimensions), and the dimensions were hand-chosen and not
truly orthogonal as are the underlying axes in factor analytic approaches. 2
Our approach differs from previous attempts in a number of ways that will become clearer as the
model is described in more detail. To foreshadow some of these differences, we: (1) examine
problems of reasonable size (1000-2000 document abstracts; and 5000-7000 index terms); (2) use a
rich, high-dimensional representation (about 100 dimensions) to capture term-document relations
(and this appears necessary for success); (3) use a mathematical technique which explicitly
represents both terms and documents in the same space; and (4) retrieve documents from query
terms directly, without rotation or interpretation of the underlying axes and without using
intermediate document clusters.
We considered alternative models using the following three criteria:
1.
Adjustable representational richness. To represent the underlying semantic structure, we
need a model with sufﬁcient power. We believe hierarchical clusterings to be too restrictive,
since they allow no multiple or crossed classiﬁcations and have essentially only as many
parameters as objects. Since the right kind of alternative is unknown, we looked for models
whose power could be varied, as some compensation for choosing a perhaps inappropriate
structure. The most obvious class is dimensional models, like multidimensional scaling and
factor analysis, where representational power can be controlled by choosing the number, k , of
dimensions (i.e., k parameters per object).
hhhhhhhhhhhhhhh
2. Koll begins with a set of 7 non-overlapping but almost spanning documents which form the axes of the space.
Terms are located on the axis of the document in which they occur; the remainder of the documents are
processed sequentially and placed at the average of their terms. This approach has been evaluated on only a
small dataset where it was moderately successful.
