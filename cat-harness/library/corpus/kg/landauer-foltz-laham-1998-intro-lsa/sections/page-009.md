---
doc_id: landauer-foltz-laham-1998-intro-lsa
doc_title: "landauer-foltz-laham-1998-intro-lsa"
section_id: page-009
section_title: "Page 9"
pages: 9-9
pdf_page: 9
source_pdf: landauer-foltz-laham-1998-intro-lsa.pdf
source_sha256: e1f7573855ca5836
text_source: embedded
granularity: page
---
Introduction to Latent Semantic Analysis
9
than the smallest dimension of the original matrix. When fewer than the necessary number
of factors are used, the reconstructed matrix is a least-squares best fit. One can reduce the
dimensionality of the solution simply by deleting coefficients in the diagonal matrix,
ordinarily starting with the smallest. (In practice, for computational reasons, for very large
corpora only a limited number of dimensionsãcurrently a few thousandã can be
constructed.)
Here is a small example that gives the flavor of the analysis and demonstrates what
the technique accomplishes. This example uses as text passages the titles of nine technical
memoranda, five about human computer interaction (HCI), and four about mathematical
graph theory, topics that are conceptually rather disjoint. Thus the original matrix has nine
columns, and we have given it 12 rows, each corresponding to a content word used in at
least two of the titles. The titles, with the extracted terms italicized, and the corresponding
word-by-document matrix is shown in Figure 1.1  We will discuss the highlighted parts
of the tables in due course.
The linear decomposition is shown next (Figure 2); except for rounding errors, its
multiplication perfectly reconstructs the original as illustrated.
Next we show a reconstruction based on just two dimensions (Figure 3) that
approximates the original matrix. This uses vector elements only from the first two,
shaded, columns of the three matrices shown in the previous figure (which is equivalent to
setting all but the highest two values in S to zero).
Each value in this new representation has been computed as a linear combination of
values on the two retained dimensions, which in turn were computed as linear
combinations of the original cell values. Note, therefore, that if we were to change the entry
in any one cell of the original, the values in the reconstruction with reduced dimensions
                                                                        
1 This example has been used in several previous publications (e.g. Deerwester et al., 1990;
Landauer & Dumais, in press).
