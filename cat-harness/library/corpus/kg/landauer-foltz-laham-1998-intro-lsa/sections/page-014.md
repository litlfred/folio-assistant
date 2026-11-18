---
doc_id: landauer-foltz-laham-1998-intro-lsa
doc_title: "landauer-foltz-laham-1998-intro-lsa"
section_id: page-014
section_title: "Page 14"
pages: 14-14
pdf_page: 14
source_pdf: landauer-foltz-laham-1998-intro-lsa.pdf
source_sha256: e1f7573855ca5836
text_source: embedded
granularity: page
---
Introduction to Latent Semantic Analysis
14
Correlations between titles in raw data:
c1
c2
c3
c4
c5
m1
m2
m3
c2
-0.19
c3
0.00
0.00
c4
0.00
0.00
0.47
c5
-0.33
0.58
0.00
-0.31
m1
-0.17
-0.30
-0.21
-0.16
-0.17
m2
-0.26
-0.45
-0.32
-0.24
-0.26
0.67
m3
-0.33
-0.58
-0.41
-0.31
-0.33
0.52
0.77
m4
-0.33
-0.19
-0.41
-0.31
-0.33
-0.17
0.26
0.56
 0.02
-0.30
0.44
Correlations in two dimensional space:
c2
0.91
c3
1.00
0.91
c4
1.00
0.88
1.00
c5
0.85
0.99
0.85
0.81
m1
-0.85
-0.56
-0.85
-0.88
-0.45
m2
-0.85
-0.56
-0.85
-0.88
-0.44
1.00
m3
-0.85
-0.56
-0.85
-0.88
-0.44
1.00
1.00
m4
-0.81
-0.50
-0.81
-0.84
-0.37
1.00
1.00
1.00
 0.92
-0.72
1.00
  
Figure 4.  Intercorrelations among vectors representing titles (averages of vectors of
the words they contain) in the original full dimensional source data of Fig. 1 and in
the two-dimensional reconstruction of Fig. 3 illustrate how LSA induces passage
similarity.
In the two dimensional reconstruction the topical groupings are much clearer. Most
dramatically, the average  r  between HCI titles increases from .02 to .92. This happened,
not because the HCI titles were generally similar to each other in the raw data, which they
were not, but because they contrasted with the non-HCI titles in the same ways. Similarly,
the correlations among the graph theory titles were re-estimated to be all 1.00, and those
between the two classes of topic were now strongly negative, mean  r  = -.72.
Thus, SVD has performed a number of reasonable inductions; it has inferred what
the true pattern of occurrences and relations must be for the words in titles if all the original
