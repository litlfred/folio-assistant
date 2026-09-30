---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-019
section_title: "Page 19"
pages: 19-19
pdf_page: 19
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 18 -
numbers of factors, and select the dimensionality which maximizes retrieval performance.9 The
results for the MED dataset are shown in Figure 5 which presents average precision as a function of
number of factors.
------------------------------------------------------
Insert Figure here - MED avg precision as fcn of NFACT
------------------------------------------------------
Figure 5
As can be seen, mean precision more than doubles (from .25 to .52) as the number of factors
increases from 10 to 100, with a maximum at 100. We therefore use the 100-factor space for the
results we report. In this particular dataset, performance might improve a bit if solutions with more
than 100 factors were explored, but, in general, it is not the case that more factors necessarily means
better performance. (In other small applications, we have seen much clearer maxima; performance
increases up to some point, and then decreases when too many factors are used. One interpretation
of this decrease is that the extra parameters are modeling the sampling noise or peculiarities of the
sample rather than important underlying relationships in the pattern of term usage over documents.)
It is also important to note that previous attempts to use factor analytic techniques for information
retrieval have used small numbers of factors (Koll [20] , 7 dimensions; and Ossario [17] , 13
dimensions; Borko & Bernick [16] , 21 dimensions). We show a more than 50% improvement in
performance beyond this range, and therefore suspect that some of the limited utility of previous
factor analytic approaches may be the result of an impoverished representation.
Unfortunately this MED dataset was specially constructed in a way that may have resulted in
unrealistically good results. From what we can determine, the test collection was made up by taking
the union of the returns of a set of thorough keyword searches for documents relevant to the 30
queries in the set. It thus may be an unrepresentatively well-segmented collection. The sets of
documents for particular queries are probably isolated to an abnormal extent in the multidimensional
manifold of concepts. In such a circumstance our method does an excellent job of deﬁning the
isolated subdomains and separating them for retrieval. This is probably not the way most natural
document collections are structured. It is worth noting, however, that other automatic techniques
applied to the same dataset are not able to capitalize as well on this same abnormal structural
property. Thus the fact that LSI greatly outperforms the rest is still quite signiﬁcant. (Note also that
the use of keyword searches to deﬁne the document test set probably biases results in favor of
methods based on surface term matching, such as SMART, since no documents that do not contain
any of the keywords are included.)
hhhhhhhhhhhhhhh
9. This is actually quite easy to do since the SVD solutions are nested. To explore performance in a 10-dimensional
solution, for example, cosines are calculated using only the ﬁrst 10 coordinates of the 100-factor solution.
