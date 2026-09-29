---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-014-411-map-as-a-function-of-the-number-of-dimension
section_title: "MAP as a function of the number of dimensions for the four versions of LSA  with the standard weighting exponent α= 1 and for CA"
section_number: 4.1.1
pages: 11-12
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
with the standard weighting exponent ˛ = 1 and for CA
We ﬁrst investigate the performance of LSA and CA in terms of MAP, in their standard
use, i.e., without varying the weighting exponent α, i.e., α = 1. Term matching without the
preliminary use of LSA and CA, i.e., directly on the document-term matrix, is denoted by
RAW. We expect that, in line with Qi et al. (2023), the performance of LSA and CA will
be better than that of RAW, and the performance of CA will be better than that of the four
versions of LSA.
Figure 3 shows MAP as a function of the number of dimensions k for different weighting
schemes of LSA, and for CA. We display only the ﬁrst 20 dimensions, as all lines usually
decrease after dimension 20. Figures with dimensionality up to 100 can be found in the
supplementary materials. For the four versions of LSA, and for CA, Table 5 presents the
dimension number for which the optimal MAP is reached, as well as the MAP values, in
each of the four datasets. We conclude the following from Fig. 3 and Table 5:
• Both LSA and CA result in better MAP than RAW, which results in a straight line when
the full dimensional matrix is used.
• For both LSA and CA, performance is a function of the number of dimensions k. Overall,
MAP rises as a function of k to reach a peak, and then, it goes down. For CA, the peak is
reached at k = 4. In CA, the information used to calculate MAP increases in the ﬁrst four
dimensions in comparison to the noise. In the components of k ≥5, the noise dominates
the useful information, which results in the MAP going down from this point.
• CA results in a considerably better MAP than the four versions of LSA: LSA-RAW, LSA-
NROWL1, LSA-NROWL2, and LSA-TFIDF, which is in line with Qi et al. (2023), who
showed that the performance of CA is better than that of LSA for document-term matrices.
This is because of the differential treatment of margins in LSA and CA. The margins
provide irrelevant information for making queries. In CA, the margins are removed,
and therefore, the relative amount of information in comparison to the noise, which we
informally refer to as the information - noise ratio, is considerably larger in CA than in
LSA. This explains the better MAP in CA.
• The peaks for the four versions of LSA are usually found at higher dimensionality k than
the peaks for CA. This is because margins are noise for queries when we ﬁx α = 1; in
123
Journal of Intelligent Information Systems
0.2
0.3
0.4
0.5
0.6
0.7
0.8
k
MAP (Euclidean)
0
2
0
1
1
RAW
LSA−RAW
LSA−NROWL1
LSA−NROWL2
LSA−TFIDF
CA
0.2
0.3
0.4
0.5
0.6
0.7
0.8
k
MAP (Euclidean)
0
2
0
1
1
RAW
LSA−RAW
LSA−NROWL1
LSA−NROWL2
LSA−TFIDF
CA
0.3
0.4
0.5
0.6
0.7
k
MAP (Euclidean)
0
2
0
1
1
RAW
LSA−RAW
LSA−NROWL1
LSA−NROWL2
LSA−TFIDF
CA
0.3
0.4
0.5
0.6
k
MAP (Euclidean)
0
2
0
1
1
RAW
LSA−RAW
LSA−NROWL1
LSA−NROWL2
LSA−TFIDF
CA
Fig. 3 MAP as a function of the number of dimensions k under standard coordinates
LSA, this noise plays an important role in the ﬁrst few dimensions. Hence, this earlier
peak in CA is also explained by its better information - noise ratio.
• The four LSA methods are not equally effective. In all four datasets, the performance of
LSA can be signiﬁcantly improved using weighting schemes. The improvements over
LSA-RAW are data dependent. On average, across the four datasets, LSA-NROWL2 is
the best, but for the Wilhelmus dataset, LSA-NROWL1 and LSA-NROWL2 result in a
somewhat worse MAP than that with LSA-RAW.
