---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-026
section_title: "Page 26"
pages: 26-26
pdf_page: 26
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 25 -
Appendix - SVD Numerical Example
In section 4.2, we outlined the details of the Singular Value Decomposition (SVD) Model. This Appendix presents a
numerical example using the sample term by document matrix described in section 4.1 and shown in Table 2 and Figure
1.
The example 12-term by 9-document matrix from Table 2 is presented below.
X
=
1
0
0
1
0
0
0
0
0
1
0
1
0
0
0
0
0
0
1
1
0
0
0
0
0
0
0
0
1
1
0
1
0
0
0
0
0
1
1
2
0
0
0
0
0
0
1
0
0
1
0
0
0
0
0
1
0
0
1
0
0
0
0
0
0
1
1
0
0
0
0
0
0
1
0
0
0
0
0
0
1
0
0
0
0
0
1
1
1
0
0
0
0
0
0
0
1
1
1
0
0
0
0
0
0
0
1
1
Recall that any rectangular matrix, for example a t ×d matrix of terms and documents, X , can be decomposed into the
product of three other matrices:
X =T 0S 0D 0′ ,
such that T 0 and D 0 have orthonormal columns and S 0 is diagonal. This is called the singular value decomposition
(SVD) of X.
Computing the SVD of the X matrix presented above results in the following three matrices for T 0,S 0,D 0 (rounded to
two decimal places).
T 0 (9-dimensional left-singular vectors for 12 terms)
S 0 (diagonal matrix of 9 singular values)
D 0 (9-dimensional right-singular vectors for 9 documents)
T 0
=
0 . 2 2
- 0 . 1 1
0 . 2 9
- 0 . 4 1
- 0 . 1 1
- 0 . 3 4
0 . 5 2
- 0 . 0 6
- 0 . 4 1
0 . 2 0
- 0 . 0 7
0 . 1 4
- 0 . 5 5
0 . 2 8
0 . 5 0
- 0 . 0 7
- 0 . 0 1
- 0 . 1 1
0 . 2 4
0 . 0 4
- 0 . 1 6
- 0 . 5 9
- 0 . 1 1
- 0 . 2 5
- 0 . 3 0
0 . 0 6
0 . 4 9
0 . 4 0
0 . 0 6
- 0 . 3 4
0 . 1 0
0 . 3 3
0 . 3 8
0 . 0 0
0 . 0 0
0 . 0 1
0 . 6 4
- 0 . 1 7
0 . 3 6
0 . 3 3
- 0 . 1 6
- 0 . 2 1
- 0 . 1 7
0 . 0 3
0 . 2 7
0 . 2 7
0 . 1 1
- 0 . 4 3
0 . 0 7
0 . 0 8
- 0 . 1 7
0 . 2 8
- 0 . 0 2
- 0 . 0 5
0 . 2 7
0 . 1 1
- 0 . 4 3
0 . 0 7
0 . 0 8
- 0 . 1 7
0 . 2 8
- 0 . 0 2
- 0 . 0 5
0 . 3 0
- 0 . 1 4
0 . 3 3
0 . 1 9
0 . 1 1
0 . 2 7
0 . 0 3
- 0 . 0 2
- 0 . 1 7
0 . 2 1
0 . 2 7
- 0 . 1 8
- 0 . 0 3
- 0 . 5 4
0 . 0 8
- 0 . 4 7
- 0 . 0 4
- 0 . 5 8
0 . 0 1
0 . 4 9
0 . 2 3
0 . 0 3
0 . 5 9
- 0 . 3 9
- 0 . 2 9
0 . 2 5
- 0 . 2 3
0 . 0 4
0 . 6 2
0 . 2 2
0 . 0 0
- 0 . 0 7
0 . 1 1
0 . 1 6
- 0 . 6 8
0 . 2 3
0 . 0 3
0 . 4 5
0 . 1 4
- 0 . 0 1
- 0 . 3 0
0 . 2 8
0 . 3 4
0 . 6 8
0 . 1 8
