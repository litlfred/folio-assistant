---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-009-33-design
section_title: "Design"
section_number: 3.3
pages: 8-9
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
We compare the performances of LSA and CA for information retrieval, where two kinds of
weightings are studied in LSA: the elements of the raw document-term matrix are weighted
and the weighting exponent α is varied. We also explore the impact of these weightings in
CA. We vary the number of dimension k from 1, 2, · · · , 20, 22, · · · , 50, 60, · · · to 100 and the
value of α from -6, -5.5, · · · , -2, -1.8, · · · , 4, 4.5, · · · to 8; we explore all 40 × 47 = 1, 880
combinations of parameter values.
In the study of weighting the elements of the raw document-term matrix, we perform the
LSA and CA of
• raw matrix F, denoted by RAW,
• L1 row-normalized matrix FL1 with L(i, j) = fi j, G( j) = 1, and N(i) = 1/ n
j=1 fi j,
NROWL1,
• L2 row-normalized matrix FL2 with L(i, j)
=
fi j, G( j)
=
1, and N(i)
=
1/
n
j=1 f 2
i j, NROWL2, and
• TF-IDF matrix FTF-IDF described in Section 2.1, TFIDF.
We refer to the combination of the CA and TF-IDF matrix as CA-TFIDF. Similarly, we
obtain LSA-RAW, LSA-NROWL1, LSA-NROWL2, LSA-TFIDF, CA-RAW, CA-NROWL1,
and CA-NROWL2. For performance comparison, RAW is used for term matchings without
dimensionality reduction.
Dimension 1: 8.425 (62.3%)
Dimension 2: 3.261 (24.1%)
1
2
3
4
5
6
−2
−1.6
−1.2
−0.8
−0.4
−1.6
−1.2
−0.8
−0.4
0.4
O
lion
tiger
cheetah
jaguar
porsche
ferrari
Dimension 1: 598.063 (94.3%)
Dimension 2: 34.684 (5.5%)
1
2
3
4
5
6
−16 −14 −12 −10
−8
−6
−4
−2
−6
−4
−2
2
O
lion
tiger
cheetah
jaguar
porsche
ferrari
Fig. 2 A two-dimensional plot of documents and terms for LSA-RAW with (a) α = 0.5 and (b) α = 1.5
123
Journal of Intelligent Information Systems
