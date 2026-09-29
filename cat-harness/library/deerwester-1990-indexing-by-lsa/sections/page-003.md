---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-003
section_title: "Page 3"
pages: 3-3
pdf_page: 3
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 2 -
(homography). In different contexts or when used by different people the same term (e.g. "chip")
takes on varying referential signiﬁcance. Thus the use of a term in a search query does not
necessarily mean that a document containing or labeled by the same term is of interest. Polysemy is
one factor underlying poor "precision".
The failure of current automatic indexing to overcome these problems can be largely traced to
three factors. The ﬁrst factor is that the way index terms are identiﬁed is incomplete. The terms
used to describe or index a document typically contain only a fraction of the terms that users as a
group will try to look it up under. This is partly because the documents themselves do not contain all
the terms users will apply, and sometimes because term selection procedures intentionally omit
many of the terms in a document.
Attempts to deal with the synonymy problem have relied on intellectual or automatic term
expansion, or the construction of a thesaurus. These are presumably advantageous for conscientious
and knowledgeable searchers who can use such tools to suggest additional search terms. The
drawback for fully automatic methods is that some added terms may have different meaning from
that intended (the polysemy effect) leading to rapid degradation of precision [6] .
It is worth noting in passing that experiments with small interactive data bases have shown
monotonic improvements in recall rate without overall loss of precision as more indexing terms,
either taken from the documents or from large samples of actual users’ words are added [7] [8] .
Whether this "unlimited aliasing" method, which we have described elsewhere, will be effective in
very large data bases remains to be determined. Not only is there a potential issue of ambiguity and
lack of precision, but the problem of identifying index terms that are not in the text of documents
grows cumbersome. This was one of the motives for the approach to be described here.
The second factor is the lack of an adequate automatic method for dealing with polysemy. One
common approach is the use of controlled vocabularies and human intermediaries to act as
translators. Not only is this solution extremely expensive, but it is not necessarily effective. Another
approach is to allow Boolean intersection or coordination with other terms to disambiguate meaning.
Success is severely hampered by users’ inability to think of appropriate limiting terms if they do
exist, and by the fact that such terms may not occur in the documents or may not have been included
in the indexing.
The third factor is somewhat more technical, having to do with the way in which current
automatic indexing and and retrieval systems actually work. In such systems each word type is
treated as independent of any other (see, for example, van Rijsbergen [9] ). Thus matching (or not)
both of two terms that almost always occur together is counted as heavily as matching two that are
rarely found in the same document. Thus the scoring of success, in either straight Boolean or
coordination level searches, fails to take redundancy into account, and as a result may distort results
to an unknown degree. This problem exacerbates a user’s difﬁculty in using compound-term queries
effectively to expand or limit a search.
3. Rationale of the Latent Semantic Indexing (LSI) method
3.1 Illustration of retrieval problems
We illustrate some of the problems with term-based information retrieval systems by means of a
ﬁctional matrix of terms by documents (Table 1).
