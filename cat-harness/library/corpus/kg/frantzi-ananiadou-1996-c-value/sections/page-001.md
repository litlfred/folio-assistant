---
doc_id: frantzi-ananiadou-1996-c-value
doc_title: "Extracting Nested Collocations"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: frantzi-ananiadou-1996-c-value.pdf
source_sha256: 7a69f561d7308cb4
text_source: ocr
granularity: page
---
Extracting Nested Collocations

Katerina T. Frantzi and Sophia Ananiadou
Dept. of Computing
Manchester Metropolitan University
Manchester, ML 5GD, U.K.
{Is Vrantzi,S. Ananiadou} @doc.mmu.ac.uk

Abstract

This paper provides an approach to
the semi-automatic extraction of colloca-
Lions from corpora using statistics. ‘The
growing availability of large textual cor-
pora, and the increasing nutuber of ap-
plications of collocation extraction, has
given rise to various approaches on the
topic. i this paper, we address the
problem of nested collocations, that is,
those being part of longer collocations.
Most approaches till now, treated sub-
strings of collocations as collocations,
only if they appeared frequently cnough
by thomselves in the corpus. ‘These tech-
niques left. a lot of collocatious wiex-
tracted. In this paper, we propose an al-
gorithm for a semi-automatic extraction
of nested uninterrupted and interrupted
collocations, paying particular attcntion
to nested collocation.

1 Introduction

The increased interest in collocation extraction
comes from the fact that they can be used for
many NLP applications such as machine transla-
tion, machine aids for translation, dictionary con-
struction, aud second language learning, to name
a few.

Recently, large scale textual corpora give the
potential of working with the real data, cither
for grammar inferring, or for enriching the lex-
icon. ‘These corpus-based approaches have also
been used for the extraction of collocations.

fi this paper we are concerned with nested
collocations. Collocatious that are substrings of
other longer oues. Regarding this type of colloca-
tion, the approaches till now could be divided into
two groups: those that do not refer to substrings
of collocations as a particular problem, (Church

41

and Llanks, 1990; Kim and Cho, 1993; Nagao
and Mori, 1994), and those that do (Kita et al.,
1994; Smadja, 1993; Uschara et al., 1995; Kjellmer,
1994). However, even the latter, deal with only
part of the problan: they try not to extract the
unwanted substrings of collocations. In favour of
this, they leave a large number of nested colloca-
tions unextracted.

In section 2 collocations are briefly discussed
and the problem is determined. In section 3 our
approach to the problem, the algorithm and an
example are given. [In section 4 the experiments
are discussed and the method is compared with
that, proposed by (Isita ct al., 1994). In section
5 there are comments on related work and finally
Section 6 contains the conclusions and the future
work.

2 Collocations - The Problem

Collocations are pervasive in language: “letters”
are “delivered”, “tea? is “strong” and not “pow-
erful’, we “run programs”, and so on. Linguists
have long been interested in collocations and the
definitions are numerous and varied. Some re-
searchers include multi-clement. compounds as ox-
amples of collocations; some admit only collo-
cations consisting of pairs of words, while oth-
crs admit only collocations consisting of a max~
imum of five or six words; some emphasize syn-
taginat pects, obhers semantic aspects. ‘The
common points regarding collocations appear to
be, as (Smadja, 1993) suggests!: they are arbi-
trary (it, is not clear why to “fall through” means
to “fail”), they are domain-dependent (“interest
rate”, “stock market”), they are recurrent and co-
hesive lexical clusters: the presence of one of the
collocates strongly suggests the rest. of the collo-
cation (“United” could imply “States” or “King-
dom’).

‘Tle classifies collocations into predicative rela-
tions, rigid noun phrases and phrasal templates.
