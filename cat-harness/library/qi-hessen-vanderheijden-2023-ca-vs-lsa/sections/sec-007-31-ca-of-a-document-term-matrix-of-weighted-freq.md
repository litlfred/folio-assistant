---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-007-31-ca-of-a-document-term-matrix-of-weighted-freq
section_title: "CA of a document-term matrix of weighted frequencies"
section_number: 3.1
pages: 6-6
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
Weighting the entries of the raw document-term matrix is an effective method for improving
the performance of LSA, and this motivates us to study the weighting of the elements of
the input matrix of CA. So, we try to improve the performance of CA by using the same
weighting methods as in LSA.
The processing of the raw data matrix by D
−1
2
r
(P −E)D
−1
2
c
(see (5)) is considered an
integral part of CA. This processing step effectively eliminates the margins, which allows
CA to focus on the relationships between documents and terms. The weighting of the entries
of the raw document-term matrix in (1), such as by TF-IDF, can be used to assign higher
values to terms with more indicative of the meaning of documents. Thus, the weighting of
the entries of the raw document-term matrix may also be an effective method for improving
the performance of CA.
To perform the CA of a document-term matrix of weighted frequencies, we ﬁrst use (1)
to obtain a document-term matrix A of weighted frequencies, and then, we perform CA on
this matrix A instead of F.
