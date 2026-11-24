---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-017-421-weighting-the-elements-of-the-raw-document-t
section_title: "Weighting the elements of the raw document-term matrix for CA"
section_number: 4.2.1
pages: 13-16
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
Weighting the elements of the raw document-term matrix is an effective way to improve the
performance of LSA for information retrieval. Here, we explore whether this holds for CA.
Similar to Fig. 3, Fig. 5 shows MAP as a function of k for different weighting schemes of
123
Journal of Intelligent Information Systems
0.3
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
LSA−RAW (k = 4)
LSA−RAW (k = 6)
LSA−RAW (k = 9)
LSA−RAW (k = 12)
LSA−RAW (k = 24)
CA (k = 4)
CA (k = 6)
CA (k = 9)
CA (k = 12)
CA (k = 24)
0.3
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
LSA−RAW (k = 4)
LSA−RAW (k = 6)
LSA−RAW (k = 9)
LSA−RAW (k = 12)
LSA−RAW (k = 24)
CA (k = 4)
CA (k = 6)
CA (k = 9)
CA (k = 12)
CA (k = 24)
0.3
0.4
0.5
0.6
0.7
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
LSA−RAW (k = 4)
LSA−RAW (k = 6)
LSA−RAW (k = 9)
LSA−RAW (k = 12)
LSA−RAW (k = 24)
CA (k = 4)
CA (k = 6)
CA (k = 9)
CA (k = 12)
CA (k = 24)
0.2
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
LSA−RAW (k = 4)
LSA−RAW (k = 6)
LSA−RAW (k = 9)
LSA−RAW (k = 12)
LSA−RAW (k = 24)
CA (k = 4)
CA (k = 6)
CA (k = 9)
CA (k = 12)
CA (k = 24)
Fig. 4 MAP as a function of α for LSA-RAW and MAP for CA under varying k
CA. CA in Fig. 3 is referred to as CA-RAW in Fig. 5; for CA/CA-RAW, the results in these
two ﬁgures are identical. For the four versions of CA, Table 7 shows the dimensionality for
which the optimal MAP is reached, as well as the MAP value. We conclude the following
from Fig. 5 and Table 7:
• Overall, the weighting of the elements of the raw matrix sometimes improves the perfor-
mance of CA, but these improvements over CA-RAW are small and data dependent.
• Comparing Table 5 with Table 7, the performance of CA-NROWL1 is better than that of
LSA-NROWL1, the performance of CA-NROWL2 is better than that of LSA-NROWL2,
and the performance of CA-TFIDF is better than that of LSA-TFIDF.
Relative to LSA, it is harder to improve the performance of CA in information retrieval
by weighting the elements of the raw matrix because (1) the MAP of CA-RAW is already
relatively high, and (2) CA-RAW has weighted the elements of the raw document-term matrix
as it is an integral part of this technique (5).
123
Journal of Intelligent Information Systems
Table 6 MAP with the optimal weighting exponent α for LSA-RAW and MAP for CA under k =
4, 6, 9, 12, and 24
BBCNews
BBCSport
20 Newsgroups
Wilhelmus
α
MAP
α
MAP
α
MAP
α
MAP
LSA-RAW (k = 4)
-1.4
0.606
-1.4
0.552
0.8
0.436
0.2
0.424
LSA-RAW (k = 6)
0.2
0.658
-0.2
0.642
0.8
0.501
0.4
0.444
LSA-RAW (k = 9)
1
0.641
0.4
0.634
1.2
0.501
0.4
0.488
LSA-RAW (k = 12)
1.4
0.627
1
0.601
1.4
0.513
0.4
0.500
LSA-RAW (k = 24)
1.8
0.597
1.4
0.561
1.8
0.503
0.8
0.496
CA (k = 4)
0.829
0.785
0.722
0.566
CA (k = 6)
0.793
0.780
0.721
0.599
CA (k = 9)
0.717
0.755
0.690
0.591
CA (k = 12)
0.682
0.720
0.670
0.588
CA (k = 24)
0.603
0.611
0.548
0.563
Bold values are best
0.55
0.60
0.65
0.70
0.75
0.80
k
MAP (Euclidean)
0
2
0
1
1
CA−RAW
CA−NROWL1
CA−NROWL2
CA−TFIDF
0.50
0.55
0.60
0.65
0.70
0.75
0.80
k
MAP (Euclidean)
0
2
0
1
1
CA−RAW
CA−NROWL1
CA−NROWL2
CA−TFIDF
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
CA−RAW
CA−NROWL1
CA−NROWL2
CA−TFIDF
0.30
0.35
0.40
0.45
0.50
0.55
0.60
k
MAP (Euclidean)
0
2
0
1
1
CA−RAW
CA−NROWL1
CA−NROWL2
CA−TFIDF
Fig. 5 MAP as a function of the number of dimensions k for the four versions of CA under standard coordinates
123
Journal of Intelligent Information Systems
Table 7 MAP with the optimal number of dimensions k for the four versions of CA
BBCNews
BBCSport
20 Newsgroups
Wilhelmus
k
MAP
k
MAP
k
MAP
k
MAP
CA-RAW
4
0.829
4
0.785
4
0.722
6
0.599
CA-NROWL1
4
0.821
4
0.800
7
0.631
6
0.603
CA-NROWL2
5
0.818
5
0.802
6
0.695
6
0.604
CA-TFIDF
6
0.786
5
0.800
4
0.704
5
0.618
Bold values are best
