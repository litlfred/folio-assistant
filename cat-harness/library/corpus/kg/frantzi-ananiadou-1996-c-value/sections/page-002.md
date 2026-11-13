---
doc_id: frantzi-ananiadou-1996-c-value
doc_title: "Extracting Nested Collocations"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: frantzi-ananiadou-1996-c-value.pdf
source_sha256: 7a69f561d7308cb4
text_source: ocr
granularity: page
---
It is not the goal of this paper to provide yet
another definition of collocation. We adopt as a
working definition the one by (Sinclair, 1991)

Collocation is the occurrence of two or
more words within a short space of cach
other in a text.

Let us recall that collocations are domain-
dependent. Sublanguages have remarkably high
incidences of collocation (Ananiadou and Mc-
Naught, 1995). (Frawley, 1988) neatly sums up
the nature of sublanguage, showing the key con-
tribution of collocation:

sublanguage is strongly lexically based
sublanguage texts focus on content:

lexical selection is syntactified in sublanguages
collocation plays a major role in sublanguage

sublanguages demonstrate elaborate lexical co-
hesion.

The particular structures found in sublanguage
texts reflect. very closely the structuring of a sub-
language’s associated conceptual domain. It is the
particular syntactified combinations of words that,
reveal this structure. Since we work with sublan-
guages we can use “small” corpora as opposed as
if we were working with a general language corpus.
In the Brown Corpus for example, which consists
of one million words, there are only 2 occurrences
of “reading material”, 2 of “cups of coffee”, 5 of
“for good” and 7 of “as always”, (Kjellmer, 1994).

We extract uninterrupted and interrupted col-
locations. The interrupted are phrasal templates
only and not predicative relations. We focus on
the problem of the extraction of those collocations
we call nested collocations. These collocations are
at the same time substrings of other longer collo-
cations. To make this clear, consider the follow-
ing strings: “New York Stock Exchange”, “York
Stock”, “New York” and “Stock Exchange”. As-
sume that the first string, being a collocation, is
extracted by some method able to extract colloca-
tions of length two or more. Are the other three
extracted as well? “New York” and “Stock Ex-
change” should be extracted, while “York Stock”
should not. Though the examples here are from
domain-specific lexical collocations, grammatical
ones can be nested as well: “put down as”, “put
down for”, “put down to” and “put. down”.

(Smadja, 1993; Kita et al., 1994; Ikehara et: al.,
1995), mention about substrings of collocations.

42

Smadja’s Xtract produces only the biggest possi-
ble n-grams. Ikehara et al., exclude the substrings
of the retrieved collocations.

A more precise approach to the problem is pro-
vided by (Kita et al., 1994), They extract a sub-
string of a collocation if it appears a significant
amount of times by itself. The following cxam-
ple illustrates the problem and their approach:
consider the strings a= “in spite” and 6=“in spite
of”, with n(a@) and n(b) their numbors of occur-
rencies in the corpus respectively. It will always
be n(a) > n(b), so whenever 6 is identified as a
collocation, a is too. However, a should not. be
extracted as a collocation. So, they modify the
measure of frequency of occurrence to become

K (a) = (la| ~ 1)(n(a) — n)) ()

where

a is a word sequence

ja} is the length of a

n(a) is the number of occurrencies of a in the cor-
pus.

6 is every word sequence that contains a

n(b) is the number of occurrencies of b

As a result they do not extract the sub-strings of
longer collocations unless they appear a signifi-
cant amount of times by themselves in the corpus,

The problem is not solved. Table 2 gives the ex-
tracted by Cost-Criteria n-grams containing “Wall
Street”. The corpus consists of 40,000 words of
market reports. Only those n-grams of frequency
3 or more are considered. It can be seen that
“Wall Street” is not extracted as a collocation,
though it has a frequency of occurrence of 38.

Table t: n-grams extracted by Cost-Criteria con-
taining “Wall Street”

LCCTE ] Candidate Collocations |
114 ] 19 | Staff Reporter of The Wall Street Journal
6 3 Wall Strect analysts
0 19 | Reporter of The Wall Street Journal
0 19 | Staff Reporter of The Wall Street
-72 20 | of The Wall Street Journal
-108 | 22 | The Wall Street Journal
-108 | 26 | Wall Street Journal
-152 | 19 | Reporter of The Wall Street
-152 | 38 | Wall Street
-228 | 20 | of The Wall Street
-230 | 23 | The Wall Street
