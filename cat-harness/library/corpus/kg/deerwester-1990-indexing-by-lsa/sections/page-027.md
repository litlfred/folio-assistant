---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-027
section_title: "Page 27"
pages: 27-27
pdf_page: 27
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
De e r we s t e r
-
2 6
-
S 0
=
3 . 3 4
2 . 5 4
2 . 3 5
1 . 6 4
1 . 5 0
1 . 3 1
0 . 8 5
0 . 5 6
0 . 3 6
D 0
=
0 . 2 0
- 0 . 0 6
0 . 1 1
- 0 . 9 5
0 . 0 5
- 0 . 0 8
0 . 1 8
- 0 . 0 1
- 0 . 0 6
0 . 6 1
0 . 1 7
- 0 . 5 0
- 0 . 0 3
- 0 . 2 1
- 0 . 2 6
- 0 . 4 3
0 . 0 5
0 . 2 4
0 . 4 6
- 0 . 1 3
0 . 2 1
0 . 0 4
0 . 3 8
0 . 7 2
- 0 . 2 4
0 . 0 1
0 . 0 2
0 . 5 4
- 0 . 2 3
0 . 5 7
0 . 2 7
- 0 . 2 1
- 0 . 3 7
0 . 2 6
- 0 . 0 2
- 0 . 0 8
0 . 2 8
0 . 1 1
- 0 . 5 1
0 . 1 5
0 . 3 3
0 . 0 3
0 . 6 7
- 0 . 0 6
- 0 . 2 6
0 . 0 0
0 . 1 9
0 . 1 0
0 . 0 2
0 . 3 9
- 0 . 3 0
- 0 . 3 4
0 . 4 5
- 0 . 6 2
0 . 0 1
0 . 4 4
0 . 1 9
0 . 0 2
0 . 3 5
- 0 . 2 1
- 0 . 1 5
- 0 . 7 6
0 . 0 2
0 . 0 2
0 . 6 2
0 . 2 5
0 . 0 1
0 . 1 5
0 . 0 0
0 . 2 5
0 . 4 5
0 . 5 2
0 . 0 8
0 . 5 3
0 . 0 8
- 0 . 0 3
- 0 . 6 0
0 . 3 6
0 . 0 4
- 0 . 0 7
- 0 . 4 5
The reader can verify that:
X =T 0S 0D 0′ (except for small rounding errors)
T 0 has orthogonal, unit length columns so T 0T 0′=I
D 0 has orthogonal, unit length columns so D 0D 0′=I
*****
We now approximate X keeping only the ﬁrst two singular values and the corresponding columns from the T and D
matrices. (Note that these are the T and D coordinates used to position the 12 terms and 9 documents, respectively, in
the 2-dimensional representation of Figure 1.) In this reduced model,
X ∼∼Xhihat =TSD ′
X ∼∼
T
S
D ′
0 . 2 2
- 0 . 1 1
3 . 3 4
0 . 2 0
0 . 6 1
0 . 4 6
0 . 5 4
0 . 2 8
0 . 0 0
0 . 0 2
0 . 0 2
0 . 0 8
0 . 2 0
- 0 . 0 7
2 . 5 4
- 0 . 0 6
0 . 1 7
- 0 . 1 3
- 0 . 2 3
0 . 1 1
0 . 1 9
0 . 4 4
0 . 6 2
0 . 5 3
0 . 2 4
0 . 0 4
0 . 4 0
0 . 0 6
0 . 6 4
- 0 . 1 7
0 . 2 7
0 . 1 1
0 . 2 7
0 . 1 1
0 . 3 0
- 0 . 1 4
0 . 2 1
0 . 2 7
0 . 0 1
0 . 4 9
0 . 0 4
0 . 6 2
0 . 0 3
0 . 4 5
Multiplying out the matrices TSD ′ gives the following estimate of X , Xhihat .
