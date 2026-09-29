---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-004
section_title: "Page 4"
pages: 4-4
pdf_page: 4
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 3 -
Sample Term by Document matrix
access
document
retrieval
information
theory
database
indexing
computer
REL
MATCH
iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii
Doc 1
x
x
x
x
x
R
Doc 2
x*
x
x*
M
Doc 3
x
x*
x*
R
M
cc
c
c
c
c
c
cc
c
c
c
c
c
cc
c
c
c
c
c
cc
c
c
c
c
c
cc
c
c
c
c
c
cc
c
c
c
c
c
cc
c
c
c
c
c
cc
c
c
c
c
c
cc
c
c
c
c
c
c
cc
c
c
c
c
c
c
cc
c
c
c
c
c
Query: "IDF in computer-based information look-up"
Table 1
Below the table we give a ﬁctional query that might have been passed against this database. An "R"
in the column labeled REL (relevant) indicates that the user would have judged the document
relevant to the query (here documents 1 and 3 are relevant). Terms occurring in both the query and a
document (computer and information) are indicated by an asterisk in the appropriate cell; an "M" in
the MATCH column indicates that the document matches the query and would have been returned
to the user. Documents 1 and 2 illustrate common classes of problems with which the proposed
method deals. Document 1 is a relevant document, which, however, contains none of the words in
the query. It would, therefore, not be returned by a straightforward term overlap retrieval scheme.
Document 2 is a non-relevant document which does contain terms in the query, and therefore would
be returned, despite the fact that the query context makes it clear enough to a human observer that a
different sense of at least one of the words is intended. Note that in this example none of the
meaning conditioning terms in the query is found in the index. Thus intersecting them with the
query terms would not have been a plausible strategy for omitting document 2.
Start by considering the synonymy problem. One way of looking at the problem is that document
1 should have contained the term "look-up" from the user’s perspective, or conversely that the query
should have contained the term "access" or "retrieval" from the system’s. To ﬂesh out the analogy,
we might consider any document (or title or abstract) to consist of a small selection from the
complete discourse that might have been written on its topic. Thus the text from which we extract
index terms is a fallible observation from which to infer what terms actually apply to its topic. The
same can be said about the query; it is only one sample description of the intended documents, and
in principle could have contained many different terms from the ones it does.
Our job then, in building a retrieval system, is to ﬁnd some way to predict what terms "really"
are implied by a query or apply to a document (i.e. the "latent semantics") on the basis of the fallible
sample actually found there. If there were no correlation between the occurrence of one term and
another, then there would be no way for us to use the data in a term by document matrix to estimate
the "true" association of terms and documents where data are in error. On the other hand, if there is a
great deal of structure, i.e. the occurrence of some patterns of words gives us a strong clue as to the
likely occurrence of others, then data from one part (or all) of the table can be used to correct other
portions. For example suppose that in our total collection the words "access" and "retrieval" each
occurred in 100 documents, and that 95 of these documents containing "access" also contained
"retrieval". We might reasonably guess that the absence of "retrieval" from a document containing
"access" might be erroneous, and consequently wish to retrieve the document in response to a query
containing only "retrieval". The kind of structure on which such inferences can be based is not
