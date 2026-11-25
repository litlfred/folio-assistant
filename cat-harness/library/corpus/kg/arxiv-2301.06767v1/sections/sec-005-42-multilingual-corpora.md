---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-005-42-multilingual-corpora
section_title: "Multilingual corpora"
section_number: 4.2
pages: 7-9
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
Multilingual corpora
With the development of multilingual tasks [25, 58], datasets that cover multiple languages and domains are becoming
increasingly important for the training and evaluation of multilingual and cross-lingual models. Table 2 presents the
available manually annotated corpora used in multilingual ATE training and/or evaluation that cover more than one
language.
The Terminology Extraction, Translation Tools and Comparable Corpora (TTC) project [22, 38] was one of the first
domain-specific corpora made purposefully to enable training and evaluation of multilingual term extraction models.
The corpus contains manually annotated texts from two domains (Wind energy and Mobile technology) in seven
languages (Chinese, English, French, German, Latvian, Russian, and Spanish). The summary for each domain can be
found on this website23.
Also, other corpora focused on specific domains in multiple languages. The BitterCorpus [4] was released in 2014 as
a manually-annotated collection of parallel English-Italian documents with 874 domain-specific bilingual terms in the
Information Technology (IT) domain. The documents are extracted from two corpora: the GNOME and the KDE data
collections. The summary for these two corpora and the BitterCorpus itself can be found on this website29.
TermFrame v1.0 [83, 103] is a specialized corpus of karstology literature in Slovene, Croatian, and English. The terms
were extracted from 24 English and 60 Slovene documents by comparing the domain corpus to the reference corpus, and
with additional processing steps (e.g., filtering based on nested terms, stopwords, and fuzzy matching). The summary
for each domain can be found on this website30.
KAS-biterm [66] is a collection of 700 bilingual Ph.D. theses (40 million tokens) in the KAS corpus about Slovene
academic writing of three domains: Chemistry, Computer Science, and Political Science. The sentences in the corpus
were filtered by noSketch Engine to keep only those with a high chance of containing the term in the original language
22https://www.clarin.si/repository/xmlui/handle/11356/1400
23http://www.ttc-project.eu/
29https://mt4cat.fbk.eu/benchmarks/bittercorpus
30http://termframe.ff.uni-lj.si/
7
ACM Computing Surveys Journal, December 12–24, 2022,
Tran et al.
Table 2. A list of multilingual term datasets.
Datasets
Years
Domain(s)
Language(s)
No of docs
No of words
No of terms
No of entities
TTC24
2012
Wind energy,
Chinese
270
238,299
293
-
Mobile technology
English
209
51,699
269
-
French
-
-
-
-
German
-
-
-
-
Latvian
-
-
-
-
Russian
-
-
-
-
Spanish
-
-
-
-
BitterCorpus25
2014
Information Technology
English
56
-
874
-
Italian
56
-
874
-
TermFrame v1.026
2019
Karstology
Slovene
60
987,801
2,946
341
Croatian
43
969,735
-
-
English
54
1,968,509
4,397
156
KAS-biterm27
2019
Academic writing
Slovene
176
-
1,895
-
English
176
-
2,138
-
others
176
-
168
-
ACTER v1.528
2020
Corruption, Dressage,
English
248
222,281
5,534
1,333
Heart failure,
French
309
240,207
4,941
789
Wind energy
Dutch
259
218,989
5,454
884
and its translation into Slovene. The terms were labeled using three labels (terms, partial terms, abbreviations) in three
categories of languages (Slovene, English, or other languages). The summary for each domain can be found on this
website31.
Annotated Corpora for Term Extraction Research (ACTER) dataset [87] was the first meticulously annotated corpus
that covered multiple languages and domains and that offered available up-to-date documentation and transparent
annotation guidelines. Texts from four different domains (Corruption, Dressage, Heart failure, and Wind energy) and
three languages (English, French, and Dutch) were manually annotated. The texts for a specific domain are comparable
across languages, meaning that texts from the same domain but across different languages cover the same subject.
While most texts cannot be aligned as parallel translations, the texts from the corruption domain are sentence-aligned.
Furthermore, ACTER solves the debate about whether or not to consider named entities as terms by providing two
different versions of manual annotations: one containing only terms, and the other containing both terms and named
entities. As of yet, these characteristics make ACTER the most useful resource for benchmarking and method comparison
in both monolingual and multilingual ATE. The summary for each domain can be found on this website32.
While we investigated different available corpora, we figured out that most of the original papers fully describe the
primary version of the dataset. Some papers included both data and method descriptions but rarely documented data
versions of the dataset and whether an entire dataset was used or only a part of it. As a result, given the same corpora,
it is hard to make a thorough comparison among methods given they use different data versions, especially when the
latest version has a significant update compared to the previous one.
31https://www.clarin.si/repository/xmlui/handle/11356/1199
32https://github.com/AylaRT/ACTER
8
The Recent Advances in Automatic Term Extraction: A survey
ACM Computing Surveys Journal, December 12–24, 2022,
