---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-018-422-map-as-a-function-of-the-weighting-exponent
section_title: "MAP as a function of the weighting exponent α for CA"
section_number: 4.2.2
pages: 16-17
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
In this section, we introduce CA with weighting exponent α. Similar to Fig. 4, Fig. 6 shows
MAP as a function of α in CA-RAW for the number of dimensions k = 4, 6, 9, 12, and 24.
0.4
0.5
0.6
0.7
0.8
α
MAP (Euclidean)
−6
−5
−4
−3
−2
−1
0
1
2
3
4
5
6
7
8
CA−RAW (k = 4)
CA−RAW (k = 6)
CA−RAW (k = 9)
CA−RAW (k = 12)
CA−RAW (k = 24)
0.4
0.5
0.6
0.7
0.8
α
MAP (Euclidean)
−6
−5
−4
−3
−2
−1
0
1
2
3
4
5
6
7
8
CA−RAW (k = 4)
CA−RAW (k = 6)
CA−RAW (k = 9)
CA−RAW (k = 12)
CA−RAW (k = 24)
0.40
0.45
0.50
0.55
0.60
0.65
0.70
α
MAP (Euclidean)
−6
−5
−4
−3
−2
−1
0
1
2
3
4
5
6
7
8
CA−RAW (k = 4)
CA−RAW (k = 6)
CA−RAW (k = 9)
CA−RAW (k = 12)
CA−RAW (k = 24)
0.3
0.4
0.5
0.6
α
MAP (Euclidean)
−6
−5
−4
−3
−2
−1
0
1
2
3
4
5
6
7
8
CA−RAW (k = 4)
CA−RAW (k = 6)
CA−RAW (k = 9)
CA−RAW (k = 12)
CA−RAW (k = 24)
Fig. 6 MAP as a function of α for CA-RAW under various values of k
123
Journal of Intelligent Information Systems
Table 8 shows the optimal α and the corresponding MAP, which is a condensed version of
Fig. 6. We conclude the following from Fig. 6 and Table 8:
• For CA, the overall MAP ﬁrst increases and then decreases as a function of α. This means
that varying α can potentially improve the performance of CA.
• The increase in MAP by adjusting α is data and dimension dependent.
• If we compare the maxima in Table 6 with those in Table 8, there is hardly a noticeable
increase.
Now, we check the optimal α like Bullinaria and Levy (2012) did. Comparing Table 8
with part LSA-RAW of Table 6, the optimal α for CA-RAW is almost always larger than
LSA-RAW and is almost always larger than 1. That is, CA-RAW needs a larger α than LSA-
RAW to obtain its maximum MAP. Thus, compared to LSA, CA improves by placing more
emphasis on its initial dimensions. The important difference between LSA and CA is that LSA
involves margins, and CA does not. Therefore, we infer that margins in LSA considerably
contribute to the initial dimensions; however, they are irrelevant (“noise”) for information
retrieval. On the other hand, CA effectively eliminates this irrelevant information.
We study MAP as a function of α under the optimal number of dimensions. The details
including tables and ﬁgures are in the supplementary materials. Again, CA performs better
than LSA. Adjusting α can potentially improve the performance of LSA and CA. Although
the optimal α under the optimal number of dimensions is data dependent, the optimal α of
CA is usually considerably larger than that of LSA.
