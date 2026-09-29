---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-018
section_title: "Page 18"
pages: 18-18
pdf_page: 18
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 17 -
The number of unique terms, terms per document and terms per query vary somewhat because
different term-processing algorithms were used in the different systems. A 100-factor SVD of the
5823 term by 1033 document matrix was obtained, and retrieval effectiveness evaluated against the
30 queries available with the dataset. Figure 4 shows precision as a function of recall for a LSI
100-factor solution ("LSI-100"), term matching ("TERM"), SMART ("SMART"), and the Voorhees
data ("VO"), all on the same set of documents and queries.
------------------------------------------------------
Insert Figure here - MED precision-recall curve
------------------------------------------------------
Figure 4
For all but the two lowest levels of recall (.10), precision of the LSI method lies well above that
obtained with straightforward term matching, SMART, and the vector method reported by
Voorhees. The average difference in precision between the LSI and the term matching method is
.06 (.51 vs. .45), which represents a 13% improvement over raw term matching. (The odds against a
difference this large or larger by chance is 29 to 1, t (29) = 2.23.) Thus, LSI captures some structure
in the data which is obscured when raw term overlap is used. The LSI method also compares
favorably with SMART (t (29) = 1.96; the odds against a difference this large or larger by chance is
16 to 1) and the Voorhees system. It is somewhat surprising that the term matching and SMART
methods do not differ for this data set. There are several differences in indexing between LSI and
SMART (word stemming is used in SMART but not LSI, and SMART includes word stems
occurring in any document whereas LSI, for computational reasons, includes only terms occurring in
more than one document) that should lead to better performance for SMART. The difference in
performance between LSI and the other methods is especially impressive at higher recall levels
where precision is ordinarily quite low, thus representing large proportional improvements. The
comparatively poor performance of the LSI method at the lowest levels of recall can be traced to at
least two factors. First, precision is quite good in all systems at low recall, leaving little room for
improvement. Second, latent semantic indexing is designed primarily to handle synonymy problems
(thus improving recall); it is less successful in dealing with polysemy (precision). Synonymy is not
much of a problem at low recall since any word matches will retrieve some of the relevant
documents. Thus the largest beneﬁts of the LSI method should be observed at high recall, and,
indeed, this is the case.
Up to this point, we have reported LSI results from a 100-factor representation (i.e. in a 100-
dimensional space). This raises the important issue of choosing the dimensionality. Ideally we want
enough dimensions to capture all the real structure in the term-document matrix, but not too many,
or we may start modeling noise or irrelevant detail in the data. How to choose the appropriate
number of dimensions is an open research issue. In our tests, we have been guided by the
operational criterion of "what works best". That is, we examine performance for several different
hhhhhhhhhhhhhhh
8. The value 39.7 is reported in Table 1 of the Voorhees paper. We suspect this is in error, and that the correct
value may be 9.7 which would be in line with the other measures of mean number of terms per query.
