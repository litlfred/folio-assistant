---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-019-5-results-for-dot-similarity-and-cosine-similari
section_title: "Results for dot similarity and cosine similarity"
section_number: 5
pages: 17-18
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
In Section 4, we presented the results where Euclidean distance was used as a measure of
similarity. Here, for comparison, we provide results for dot similarity and cosine similarity.
Tables and ﬁgures for dot similarity and cosine similarity are presented in the supplementary
materials.
The results for both dot similarity and cosine similarity lead to conclusions that match
thoseforEuclideandistance.However,cosinesimilarityleadstoabetterperformanceinterms
of MAP than Euclidean distance and dot similarity. We displayed the results for Euclidean
distance in Section 4 because (1) it is more easily interpretable in the context of adjusting
weighting exponent α: as α increases, Euclidean distances between row points (column
points) on initial dimensions increase relative to the later dimensions; and (2) in the literature,
Table 8 MAP with the optimal α for CA-RAW under k = 4, 6, 9, 12, and 24
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
CA-RAW (k = 4)
2
0.829
3.6
0.790
4
0.726
-1
0.585
CA-RAW (k = 6)
4.5
0.814
5
0.798
4.5
0.730
0.4
0.603
CA-RAW (k = 9)
6.5
0.802
6
0.797
5.5
0.726
1
0.591
CA-RAW (k = 12)
7
0.797
6.5
0.794
6
0.723
1.2
0.588
CA-RAW (k = 24)
8
0.788
7.5
0.791
7
0.715
1.6
0.579
Bold values are best
123
Journal of Intelligent Information Systems
the Euclidean distance is the preferred way to interpret CA (in fact, we have never seen an
interpretation of CA in terms of cosine or dot similarity).
