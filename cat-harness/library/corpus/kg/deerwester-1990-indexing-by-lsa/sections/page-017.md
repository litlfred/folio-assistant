---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-017
section_title: "Page 17"
pages: 17-17
pdf_page: 17
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 16 -
compute (see Section 4.2 for details), and documents are ordered by their distance to the query. In
many senses, the current LSI method is impoverished and thus provides a conservative test of the
utility of latent semantic structure in indexing and information retrieval. We have so far avoided
adding reﬁnements such as stemming, phrases, term-weighting and Boolean combinations (all of
which generally result in performance improvements) in order to better evaluate the utility of the
basic representation technique.
We compare the results of our latent structure indexing (LSI) method against a straightforward
term matching method, a version of SMART, and against data reported by Voorhees [19] for the
same standard datasets. The term overlap comparisons provide a baseline against which to assess
the beneﬁts of indexing by means of latent semantic structure rather than raw term matching. For
the term matching method, we use the same term-document matrix that was the starting point for the
LSI method. A query is represented as a column, and cosines between the query column and each
document column are calculated. The SMART and Voorhees systems are more representative of
state of the art information retrieval systems, but differences in indexing, term weighting, and query
processing preclude precise comparisons of our LSI method and these systems. Nonetheless, such
comparisons are of interest. For the SMART evaluations, documents were indexed using a stop list
of common words, full stemming, and raw term frequencies as options. Queries were similarly
processed and a vector sequential search was used for matching queries and documents. This
particular invocation of SMART is the same as our term matching method except for the initial
choice of index terms. The Voorhees data were obtained directly from her paper in which she used
a vector retrieval system with extended Boolean queries (see Voorhees [19] for details). Her
documents were indexed by removing words on a stop list, mapping word variants into the same
term, and weighting terms. Weighted extended Boolean queries were used for retrieval.
Performance is evaluated by measuring precision at several different levels of recall. This is
done separately for each available query and then averaged over queries. For the LSI, term
matching, and SMART runs, full precision-recall curves can be calculated. For the Voorhees data,
only two precision-recall pairs are available; these are the values obtained when 10 or 20 documents
were returned - see her Figures 4b) and 6b). We present the values from her sequential search
(SEQ) condition, since the best performance is generally observed in this condition and not in one of
the retrieval conditions using document clusters.
5.1 MED
The ﬁrst standard set we tried, MED, was the commonly studied collection of medical abstracts.
It consists of 1033 documents, and 30 queries. Our automatic indexing on all terms occurring in
more than one document and not on SMART’s stoplist of common words resulted in 5823 indexing
terms. Some additional characteristics of the dataset are given below:
term &
LSI
Voorhees
SMART
iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
number of unique terms
5823
6927
6927
mean number of terms per document
50.1
51.6
51.6
mean number of terms per query
9.8
39.78
10.1
mean number of relevant documents per query
23.2
23.2
23.2
cc
c
c
c
c
c
c
