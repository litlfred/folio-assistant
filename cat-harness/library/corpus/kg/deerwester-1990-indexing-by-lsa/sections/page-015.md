---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-015
section_title: "Page 15"
pages: 15-15
pdf_page: 15
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 14 -
represent the important and reliable patterns underlying the data in X . Since Xhihat =TSD ′, the
relevant quantities can be computed just using the smaller matrices, T , D , and S .
4.2.3.1 Comparing two terms. The dot product between two row vectors of Xhihat reﬂects the
extent to which two terms have a similar pattern of occurrence across the set of documents. The
matrix XhihatXhihat ′ is the square symmetric matrix containing all these term-to-term dot products.
Since S is diagonal and D is orthonormal It is easy to verify that:
XhihatXhihat ′=TS 2T ′
Note that this means that the i ,j cell of XhihatXhihat ′ can be obtained by taking the dot product
between the i and j rows of the matrix TS . That is, if one considers the rows of TS as coordinates
for terms, dot products between these points give the comparison between terms. Note that the
relation between taking T as coordinates and taking TS as coordinates is simple since S is diagonal;
the positions of the points are the same except that each of the axes has been stretched or shrunk in
proportion to the corresponding diagonal element of S .
4.2.3.2 Comparing two documents. The analysis for comparing two documents is similar, except
that in this case it is the dot product between two column vectors of the matrix Xhihat which tells
the extent to which two documents have a similar proﬁle of terms. Thus the matrix Xhihat ′Xhihat
contains the document-to-document dot products. The deﬁnitions of the matrices T , S and D again
guarantee:
Xhihat ′Xhihat =DS 2D ′
Here the i ,j cell of Xhihat ′Xhihat is obtained by taking the dot product between the i and j rows of
the matrix DS . So one can consider rows of a DS matrix as coordinates for documents, and take dot
products in this space. (Again note that the DS space is just a stretched version of the D space.)
4.2.3.3 Comparing a term and a document. This comparison is different. Instead of trying to
estimate the dot product between rows or between columns of Xhihat , the fundamental comparison
between a term and a document is the value of an individual cell of Xhihat . Xhihat is deﬁned in
terms of matrices T , S and D . Repeating it here:
Xhihat =TSD ′
The i ,j cell of Xhihat is therefore obtained by taking the dot product between the i -th row of the
matrix TS
1⁄2 and the j -th row of the matrix DS
1⁄2. Note that while the within comparisons (i.e.,
term-term or document-document) involve using rows of TS and DS for coordinates, the between
comparison requires TS
1⁄2 and DS
1⁄2 for coordinates. That is, it is not possible to make a single
conﬁguration of points in a space that will allow both between and within comparisons. They will
be similar however, differing only by a stretching or shrinking of the axes by a factor of S
1⁄2.
4.2.4 Finding representations for pseudo-documents
The previous results show how it is possible to compute comparisons between the various
objects associated with the rows or columns of Xhihat . It is very important in information retrieval
applications to compute appropriate comparison quantities for objects that did not appear in the
original analysis. For example, we want to be able to take a completely novel query, ﬁnd some
point for it in the space, and then look at its cosine with respect to terms or documents in the space.
Another example would be trying, after-the-fact, to ﬁnd representations for documents that did not
