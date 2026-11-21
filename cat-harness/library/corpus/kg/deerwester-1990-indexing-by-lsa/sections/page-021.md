---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-021
section_title: "Page 21"
pages: 21-21
pdf_page: 21
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 20 -
as LSI-SMART). The resulting performance was indistinguishable from SMART’s; average
precision for both methods was .14 (t < 1). This suggests that much of the initial difference between
LSI and SMART was due to term selection differences. Unfortunately, LSI was unable to improve
upon term matching - either in the initial LSI vs. term matching comparison, or in the LSI-SMART
vs. SMART comparison. Stemming, however, seems to capture some structure that LSI was unable
to capture as evidenced by the superior performance of SMART relative to term matching. In
theory, latent semantic analyses can extract at least some of the commonalities is usage of stemmed
forms. In practice, we may often have insufﬁcient data to do so.
A problem in evaluating the CISI dataset is the very low level of precision. Our intuition is that
this database contains a very homogeneous distribution of documents that is hard to differentiate on
the basis of abstracts. Moreover, many of the test queries, which were given in natural language,
seem very vague and poorly stated. Thus the relevance judgments may not be sufﬁciently reliable to
allow any retrieval system to perform well, or to provide an adequate comparison between methods.
No direct evidence has been reported on the reliability (repeatability) of these relevance judgments,
so this is mostly conjecture, although we do ﬁnd many cases in which the relevance judgments
appear to be in obvious error. In addition, it seems to us that poorly stated queries would invite
excessive reliance on term overlap in judging relevance, especially if the judges were familiar with
term matching as a possible retrieval strategy.
5.3 Summary of results from LSI analyses
These results are modestly encouraging. They show the latent semantic indexing method to be
superior to simple term matching in one standard case and equal in another. Further, for these two
databases, performance with LSI is superior to that obtained with the system described by Voorhees;
it performed better than SMART in one case and equal in the other (when term selection differences
were eliminated). In order to assess the value of the basic representational method, we have so far
avoided the addition of reﬁnements that one would consider in a realistic application, such as
discriminative term weighting, stemming, phrase ﬁnding or a method of handling negation or
disjunction in the queries. So far we have tested the method only with queries formulated to be used
against other retrieval methods; the method almost certainly could do better with queries in some
more appropriate format. We have projects in progress to add standard enhancements and to
incorporate them in a fully automatic indexing and retrieval system. In addition, we are working on
methods to incorporate the very low frequency, but often highly informative, words that were
ﬁltered out in the trial analysis procedures. It seems likely that with such improvements LSI will
offer a more effective retrieval method than has previously been available.
6. Conclusions and discussion
Although factor analytic approaches have been previously suggested and tried in the literature,
they have all had what we believe to be serious shortcomings which the present attempt overcomes.
We have examined problems of reasonable size (1000-2000 document abstracts; and 5000-7000
index terms) using a rich, high-dimensional representation, which appears necessary for success.
The explicit representation of both terms and documents in the same space makes retrieving
documents relevant to user queries a straightforward matter. Previous work by Borko and his
colleagues [15] [16] is similar in name to our approach, but used the factor space only for document
clustering, not document retrieval, and computational simpliﬁcations reduced its representational
