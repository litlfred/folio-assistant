---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-011
section_title: "Page 11"
pages: 11-11
pdf_page: 11
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 10 -
Technical Memo Example
Titles:
c1: Human machine interface for Lab ABC computer applications
c2: A survey of user opinion of computer system response time
c3: The EPS user interface management system
c4: System and human system engineering testing of EPS
c5: Relation of user-perceived response time to error measurement
m1: The generation of random, binary, unordered trees
m2: The intersection graph of paths in trees
m3: Graph minors IV: Widths of trees and well-quasi-ordering
m4: Graph minors: A survey
Terms
Documents
c1
c2
c3
c4
c5
m1
m2
m3
m4
__
__
__
__
__
__
__
__
__
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
A sample dataset consisting of the titles of 9 technical memoranda. Terms occurring in more than one title are
italicized. There are two classes of documents - ﬁve about human-computer interaction (c1-c5) and four about
graphs (m1-m4). This dataset can be described by means of a term by document matrix where each cell entry
indicates the frequency with which a term occurs in a document.
Table 2
For this example we carefully chose documents and terms so that SVD would produce a satisfactory
solution using just two dimensions. Figure 1 shows the two-dimensional geometric representation
for terms and documents that resulted from the SVD analysis. Details of the mathematics
underlying the analysis will be presented in the next section. The numerical results of the SVD for
this example are shown in the Appendix and can be used to verify the placement of terms and
documents in Figure 1.
