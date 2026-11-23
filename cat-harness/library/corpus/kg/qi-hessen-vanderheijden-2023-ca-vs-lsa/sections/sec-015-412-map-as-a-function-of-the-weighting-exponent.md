---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-015-412-map-as-a-function-of-the-weighting-exponent
section_title: "MAP as a function of the weighting exponent α for LSA compared with MAP  for CA under varying numbers of dimensions"
section_number: 4.1.2
pages: 12-13
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
for CA under varying numbers of dimensions
In Section 4.1.1, we found that CA outperforms the four versions of LSA in terms of MAP,
where LSA had the usual weighting exponent α = 1. In this section, we study whether the
performance of LSA-RAW improves when we vary α.
123
Journal of Intelligent Information Systems
Table 5 MAP with the optimal number of dimensions k
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
RAW
0.358
0.394
0.339
0.489
LSA-RAW
6
0.652
9
0.625
12
0.510
24
0.492
LSA-NROWL1
5
0.733
6
0.721
10
0.565
16
0.470
LSA-NROWL2
5
0.738
5
0.748
4
0.636
13
0.482
LSA-TFIDF
10
0.669
9
0.668
12
0.512
19
0.521
CA
4
0.829
4
0.785
4
0.722
6
0.599
Bold values are best
Figure 4 shows MAP as a function of α for LSA-RAW with the number of dimensions
k = 4, 6, 9, 12, and 24. For comparison, we also report the MAP values for CA found in
Section 4.1.1 under these dimensions. We choose these values of k because these dimensions
are optimal for LSA-RAW and CA in Table 5. Table 6 shows the optimal α and corresponding
MAP, which is a condensed version of Fig. 4. We conclude the following from Fig. 4 and
Table 6:
• Although the performance of LSA-RAW improves by varying α, CA still outperforms
LSA-RAW.
• For LSA-RAW, the overall MAP ﬁrst increases and then decreases as a function of α.
This means that varying α can potentially improve the performance of LSA-RAW.
• The increase in MAP is minor. Consider, for example, the BBCNews dataset. In
Section 4.1.1, we found that the MAP was optimal with a value of 0.652 for α = 1,
when k = 6. Table 6 shows that for α = 0.2, the MAP increases to 0.658. Apparently,
for 6 dimensions, when α = 0.2, the information - noise ratio is optimal in terms of MAP.
For α = 0.2, the distances on later dimensions (of the 6 dimensions) are increased and
those on initial dimensions are reduced. This means that, with α = 0.2, the impact of the
initial dimensions affected most by the margins is reduced. This is consistent with the
results of Bullinaria and Levy (2012), which indicates that reducing the initial dimensions
improves performance.
• Moreover, the optimal α for LSA-RAW is data dependent and generally increases with
k. This replicates results of Caron (2001). As the number of dimensions varies, the
change in the optimal α is the result of the information - noise ratio for the speciﬁc
number of dimensions studied. For example, for the BBCNews dataset, the optimal
number of dimensions is 6; for larger numbers of dimensions, the optimal α increases.
An increasing α indicates that distances at earlier dimensions are more important for
information retrieval, and therefore, the role of the later dimensions is played down.
