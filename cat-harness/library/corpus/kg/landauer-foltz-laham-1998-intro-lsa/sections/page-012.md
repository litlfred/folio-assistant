---
doc_id: landauer-foltz-laham-1998-intro-lsa
doc_title: "landauer-foltz-laham-1998-intro-lsa"
section_id: page-012
section_title: "Page 12"
pages: 12-12
pdf_page: 12
source_pdf: landauer-foltz-laham-1998-intro-lsa.pdf
source_sha256: e1f7573855ca5836
text_source: embedded
granularity: page
---
Introduction to Latent Semantic Analysis
12
ˆX
{ } =
c1
c2
c3
c4
c5
m1
m2
m3
m4
human
 0.16
 0.40
 0.38
 0.47
 0.18
-0.05
-0.12
-0.16
-0.09
interface
 0.14
 0.37
 0.33
 0.40
 0.16
-0.03
-0.07
-0.10
-0.04
computer
 0.15
 0.51
 0.36
 0.41
 0.24
 0.02
 0.06
 0.09
 0.12
user
 0.26
 0.84
 0.61
 0.70
 0.39
 0.03
 0.08
 0.12
 0.19
system
 0.45
 1.23
 1.05
 1.27
 0.56
-0.07
-0.15
-0.21
-0.05
response
 0.16
 0.58
 0.38
 0.42
 0.28
 0.06
 0.13
 0.19
 0.22
time
 0.16
 0.58
 0.38
 0.42
 0.28
 0.06
 0.13
 0.19
 0.22
EPS
 0.22
 0.55
 0.51
 0.63
 0.24
-0.07
-0.14
-0.20
-0.11
survey
 0.10
 0.53
 0.23
 0.21
 0.27
 0.14
 0.31
 0.44
 0.42
trees
-0.06
 0.23
-0.14
-0.27
 0.14
 0.24
 0.55
 0.77
 0.66
graph
-0.06
 0.34
-0.15
-0.30
 0.20
 0.31
 0.69
 0.98
 0.85
minors
-0.04
 0.25
-0.10
-0.21
 0.15
 0.22
 0.50
 0.71
 0.62
 r (human.user) = .94
 r  (human.minors) = -.83
  
Figure 3.  Two dimensional reconstruction of original matrix shown in Fig. 1 based
on shaded columns and rows from SVD as shown in Fig. 2. Comparing shaded
and boxed rows and cells of Figs. 1 and 3 illustrates how LSA induces similarity
relations by changing estimated entries up or down to accommodate mutual
constraints in the data.
Look at the two shaded cells for    survey  and  trees   in column m4. The word  tree   did not
appear in this graph theory title. But because m4 did contain   graph   and    
minors,  the zero
entry for  tree  has been replaced with 0.66, which can be viewed as an estimate of how
many times it would occur in each of an infinite sample of titles containing   graph  and
   
minors  . By contrast, the value 1.00 for  survey  , which appeared once in m4, has been
replaced by 0.42 reflecting the fact that it is unexpected in this context and should be
counted as unimportant in characterizing the passage. Very roughly and
anthropomorphically, in constructing the reduced dimensional representation, SVD, with
only values along two orthogonal dimensions to go on, has to estimate what words actually
appear in each context by using only the information it has extracted. It does that by saying
the following:
