---
doc_id: frantzi-ananiadou-1996-c-value
doc_title: "Extracting Nested Collocations"
section_id: page-005
section_title: "Page 5"
pages: 5-5
pdf_page: 5
source_pdf: frantzi-ananiadou-1996-c-value.pdf
source_sha256: 7a69f561d7308cb4
text_source: ocr
granularity: page
---
Vable 3: Extracted candidate collocation with C-

value in descending order.

Cov Try.

184 |

114

87.6
79.6
53.2
49.5
A475
Ad
ALAT
37.34
36

36

33
31.54
27,8
27

16
16
15
15
1S
15
15

15

19

93
dd
59
20,
25
AS
AA
26
6

22
38
23
3
3

3

30
27
10
27
27
10

10
oO
23
23

21

k
5

[18

| 92 |

WALL STREET JOURNAL
Staff Reporter of The Wall Street,
Journal

United States

the United States

the United

<mumber> to <money> from

to <money> from

said it

the company

Wall Street, Journal

<number> to <anoney> from

<momcy > a year

‘The Wall Street. Journal

Wall Street,

‘The Wall Street.

a year

There were <number> selling days
in the period this year

x ‘There were <number> selling
days in the period this

to be

will be

at the end of

the company’s

compared with

<COMMIEN'T> Parapraphing
Mirror </COMMIENT>

<money> a share

priced at <umuber> to yield

White [louse

the market

‘Votal cars

in the United States

‘Van Sri Khoo

The United States

National Bank

has been,

said Mr

said that

the end of

of its

fourth quarter

Diamond Shamrock

<mumber> <COMMEN'T>

Paragraphing Error <COMMISN'T>

more Lhag

had been

it is

<money> at Lhe end of <oumber>

tn a Securities and Exchange

Comission

a <ommber> for <number> stock
split

sales rose <number> to <money>
from

that the United States

because of

Among the extracted n-pgrams we can see the
domain-specific candidate collocations
“Stall Reporter of the Wall Street”, tional
Bank” ete., and those that appear within other
collocations rather than by themselves, “Wall
Strect Journal” ,“Wall Strect” etc.

‘There are, however, problems:

I. We did not calculate the precision or recall
of the Cevaluc algorithm. ‘These calculations de-
pend on the definition of collocation and they are
domain dependent. Usjellurer mentions 19 cate-
gorics of collocation (Kjellmer, 1994)),

2. As it can be seen from ‘Table 3, one
pearing both in small aud capital letters is treated
as two different strings. ‘Phe problem can be par-
tially solved if we use a canonical form. Llowever,
if we want to apply the algorithm for the extrac-
tion of domain-specific collocations, case is perti-
nen.

3. ">in strings like "e.t.c.", “et al.” ete., is
taken as a sentence boundary even when it is not.

4. How to filter out the extracted n-grams that.
are not relevant to the application (for the candi-
date collocations) we are interested in, is another
problem. Actually, for some of the extracted u-
grams (“to be”, “has been”, “said that”, ete.), we
cannol think of any application that these u-grams
would be useful. And though some of them could
be filtered out by a part-ofspecch tagger, we can-
not. say this for all the types of the “unwanted”
extracted n-grams,

such as

ig ap-

5 Related Work

Besides the work by Kita et al. mentioned ear-
lier, there are olher interesting approaches to the
extraction of collocations.

(Choucka ct al., £983) proposed a method,
based on the observed frequeucy of sequencies of
words, to extract uninterrupted collocations, but
the results are dependent ou the size of the corpus.

(Church and Hanks, 1990), proposed the associ-
ation ratio, a measure based on mutual informa-
tion (Fano, L961), Lo estimate word association
norms. ‘Lhey identify pairs of words that appear
together more often than by chance. ‘Lhe collo-
catious they identify could also be due to seman-
tic reasons. ‘They allow gaps between the words
and therefore extract Mmferrupted word sequences.
Since they only deal with collocations of length
two (though mutual information can be extended
for an arbitrary number of events, (Mano, 1961;
Mclliece, 1977)), they do not consider nested col-
locations.

(Kirn and Cho, 1993}, proposed umtual infor-
mation to calculate the degree of word association
