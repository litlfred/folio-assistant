---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-020
section_title: "Page 20"
pages: 20-20
pdf_page: 20
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 19 -
5.2 CISI
Our second test case is the CISI set of 1460 information science abstracts. This set has been
consistently difﬁcult for automatic retrieval methods. It consists of 1460 documents and 35 queries.
Our automatic indexing, which excluded words on SMART’s stop list of common words and words
occurring in only one document, resulted in 5135 index terms. Some additional characteristics of
the dataset are given below:
term &
LSI
Voorhees
SMART
iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
number of unique terms
5135
4941
5019
mean number of terms per document
45.4
43.9
45.2
mean number of terms per query
7.7
7.2
7.8
mean number of relevant documents per query
49.8
49.8
49.8
cc
c
c
c
c
c
c
A 100-factor SVD solution was obtained from the 5135 term by 1460 document matrix, and
evaluated using the ﬁrst 35 queries available with the dataset. LSI results for a 100-factor solution
("LSI-100") along with those for term matching ("TERM"), SMART ("SMART") and Voorhees
("VO") are shown in Figure 6.
------------------------------------------------------
Insert Figure here - CISI precision-recall curve
------------------------------------------------------
Figure 6
All the methods do quite poorly on this dataset, with precision never rising above .30, even for the
lowest levels of recall. Average precision for is .11 for both LSI and term matching (t = 1). For this
data set, the latent structure captured by the SVD analysis is no more useful than raw term overlap in
capturing the distinctions between relevant and irrelevant documents for the available queries. The
Voorhees data cover only a very limited range of low recall levels, but for these values precision is
similar to that for LSI and term matching. SMART, on the other hand, results in reliably better
performance than LSI, although the absolute levels of precision (.14) is still very low. (The odds
against differences this large or larger by chance is over 1000 to 1; t (34) = 3.66.) We believe that
the superiority of SMART over LSI can be traced to differences in term selection that tend to
improve performance. As noted previously, SMART used stemmed words but LSI did not, and
SMART included all terms whereas the LSI included only those appearing in more than one
document. Since few terms which appear in only one document (and were thus excluded by LSI)
are used in the queries, the omission of these words is unlikely to be a major determinant of
performance. Thus, stemming appears to be the likely source of performance differences.
We have recently completed a new LSI analysis using SMART’s index terms. This enabled us to
explore how much of the difference between SMART and the original LSI was due differences in
term selection and further to see if additional latent structure could be extracted. For this analysis,
we began with a 5019 term (SMART’s terms) by 1460 document matrix and obtained a 100-factor
SVD solution. The 35 test queries were re-evaluated using this new LSI solution (which we refer to
