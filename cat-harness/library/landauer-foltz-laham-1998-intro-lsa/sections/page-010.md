---
doc_id: landauer-foltz-laham-1998-intro-lsa
doc_title: "landauer-foltz-laham-1998-intro-lsa"
section_id: page-010
section_title: "Page 10"
pages: 10-10
pdf_page: 10
source_pdf: landauer-foltz-laham-1998-intro-lsa.pdf
source_sha256: e1f7573855ca5836
text_source: embedded
granularity: page
---
Introduction to Latent Semantic Analysis
10
might be changed everywhere; this is the mathematical sense in which LSA performs
inference or induction.
Example of text data: Titles of Some Technical Memos
c1:
Human machine interface for ABC computer applications
c2:
A survey of user opinion of computer system response time
c3:
The EPS user interface management system
c4:
System and human system engineering testing of EPS
c5:
Relation of user perceived response time to error measurement
m1: 
The generation of random, binary, ordered trees
m2:
The intersection graph of paths in trees
m3:
Graph minors IV: Widths of trees and well-quasi-ordering
m4:
Graph minors: A survey
X
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
1
0
0
1
0
0
0
0
0
interface
1
0
1
0
0
0
0
0
0
computer
1
1
0
0
0
0
0
0
0
user
0
1
1
0
1
0
0
0
0
system
0
1
1
2
0
0
0
0
0
response
0
1
0
0
1
0
0
0
0
time
0
1
0
0
1
0
0
0
0
EPS
0
0
1
1
0
0
0
0
0
survey
0
1
0
0
0
0
0
0
1
trees
0
0
0
0
0
1
1
1
0
graph
0
0
0
0
0
0
1
1
1
minors
0
0
0
0
0
0
0
1
1
 r  (human.user) = -.38
 r (human.minors) = -.29
  
Figure 1.  A word by context matrix, X, formed from the titles of five articles about
human-computer interaction and four about graph theory. Cell entries are the
number of times that a word (rows) appeared in  a title (columns) for words that
appeared in at least two titles.
