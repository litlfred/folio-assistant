---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-004-41-monolingual-corpora
section_title: "Monolingual corpora"
section_number: 4.1
pages: 5-7
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
Monolingual corpora
Table 1 lists manually annotated monolingual corpora that: (1) have been used for monolingual ATE evaluation, (2)
contain more than 100 terms, (3) have annotation or gold standards, and (4) are publicly available at a specific URL or
easily to reconstruct based on the data description. Note that the years on the Table refer to when the corpora were
released and that the statistics are up-to-date with the latest release. We attach the link of each corpus in the footnote
for facilitating access.
GENIA [53] is one of the best-known biomedical English corpora that was used for evaluating monolingual term
extraction in many studies [33, 55, 56, 76, 107, 111]. The version 3.0 of GENIA was a collection of 2000 abstracts in the
articles extracted from MEDLINE database. 93,293 out of all 436,967 words were annotated as biological terms. This
corpus was the first publicly available corpus with linguistically rich annotations that include sentence boundaries,
term boundaries, term classifications, semi-structured coordinated clauses, recovered ellipsis in terms, etc.
Another example of a bio-text-mining dataset is the Colorado Richly Annotated Full Text Corpus (CRAFT) [7].
CRAFT is a collection of full-text, open-access biomedical journal articles, each of which is a member of the PubMed
Central Open Access Subset6. The latest public release (version 2.0) includes around 100,000 ontologies/terms annotated
from 67 out of the 97 articles in seven different categories: Chemical Entities of Biological Interest, Cell Ontology, Entrez
Gene, three sub-ontologies of Gene Ontology, NCBI Taxonomy, Protein Ontology, and Sequence Ontology. Further
details are described in CRAFT website7. However, both GENIA and CRAFT consisted of applying ontologies on text,
and not of labeling terms as an open task.
In the context of the Gene Ontology project8, the Gene Ontology corpus [17] provides structured controlled
vocabularies of molecular and cellular biology that are freely available for community use in the annotation of genes,
gene products, and sequences. Between 2005 and 2022, a total of 7,694,564 annotations was made, with 43,329 valid
terms, 4.024 obsoleted terms, and 2,438 merged terms. These terms were organized in a hierarchical manner under
three sub-ontologies, including Molecular Function, Biological Process, and Cellular Component. Further statistical
details about different versions from the beginning of 2018 up to October 2022 can be accessed via the Gene Ontology
website9. A few approaches to term extraction have been tested on this corpus, for example, [24, 112].
The ACL Reference Dataset for Terminology Extraction and Classification (ACL RD-TEC) is a dataset for evaluating
the term extraction and classification from literature in the domain of computational linguistics. Derived from the ACL
Anthology Reference Corpus, ACL RD-TEC consists of two versions: ACL RD-TEC v1.0 and ACL RD-TEC v2.0. The 1.0
version [85] was released in 2014, providing 82,000 manually annotated candidate terms of three types: valid, invalid, or
technology terms. Successive to the ACL RD-TEC v1.0, the ACL RD-TEC v2.0 [84] embraces 300 unique abstracts from
articles in the ACL Anthology Reference Corpus, published between 1978 and 2006. The annotated terms are classified
6https://www.ncbi.nlm.nih.gov/pmc/tools/openftlist/
7https://bionlp-corpora.sourceforge.net/CRAFT/
8http://www.geneontology.org/
9http://geneontology.org/stats.html
5
ACM Computing Surveys Journal, December 12–24, 2022,
Tran et al.
into one of the seven categories: Method, Tool, Language resource, Language resource product, Model, Measures and
measurements, and Other. Both versions are experimented with and evaluated by several approaches, such as linguistic
and statistical ones [104], machine learning ones [42, 72, 104, 107], or even deep learning ones [39, 56, 58].
Regarding the Brazilian Portuguese language, the number of available Brazilian Portuguese corpora has increased
significantly in different domains, including and excluding well-constructed gold standards. In our survey, we focus only
on the accessible corpora that have well-annotated labels or gold standards. For example, the Ceramic Coating corpus
[93] collected texts (448,352 words in total) from 164 papers in the Industrial Ceramics Magazine. Each paper contains
4 to 8 pages on average (approximately 4,000 words per paper). In the domain of pediatrics, JPED [18] includes 283
texts from the Pediatrics Journal (Jornal de Pediatria) and a gold standard of 1,534 bigrams and 2,647 trigrams. Another
popular corpus is ECO [108]. This available corpus, constructed in the context of the BLOC-Eco project, contains
390 Portuguese documents pertaining to the domain of Ecology. In the context of Nanoscience and Nanotechnology,
the N&N [13, 26] corpus includes 1,057 texts, divisible into 5 categories: scientific, divulgation-scientific, informative,
technical-administrative, and others. EaD [92] contains 347 texts extracted from the Internet in the field of Distance
Education. Further information about all the Brazilian Portuguese-related corpora is described in [20]’s work.
Table 1. List of monolingual term datasets.
Datasets
Years
Domain(s)
Language(s)
No of docs
No of words
No of terms
GENIA10
2003
Biomedicine
English
193
436,967
93,293
GO11
2005
Gene
English
-
-
43,329
CRAFT v2.012
2016
Biomedicine
English
67
> 560,000
≈100,000
ACL RD-TEC v1.0 13
2014
Computational
English
10,922
36,729,513
82,000
linguistics
ACL RD-TEC v2.014
2016
Computational
English
300
33,216
6,818
linguistics
JPED 15
2005
Pediatrics
Portuguese
283
-
-
ECO 16
2005
Ecology
Portuguese
390
-
322
N&N 17
2008
Nanoscience
Portuguese
1,057
-
1,794
Nanotechnology
EaD 18
2010
Distance
Portuguese
347
-
118
education
Irish Wiki19
2019
Education
Irish
11
5,178
864
Hindu Wiki20
2022
Education
Hindu
71
11,960
953
RSDO5 21
2021
Ph.D. theses,
Slovene
12
257,029
37,985
Scientific book,
Journal articles,
Graduate textbooks
6
The Recent Advances in Automatic Term Extraction: A survey
ACM Computing Surveys Journal, December 12–24, 2022,
For what concerns less-resourced languages, RSDO522 is one of the academic Slovenian corpora with well-documented
annotation guidelines. It consists of 12 texts, collected between 2000 and 2019, from the fields of biomechanics, linguistics,
chemistry, and veterinary science. Over 250,000 words and almost 38,000 manually annotated terms were included.
Apart from the manually annotated terms, the corpus was also annotated using the Universal Dependencies annotations
(e.g., tokenization, sentence segmentation, lemmatization, morphological features, and dependency syntax). The corpus
can serve as training sets for supervised term extraction and for term extraction tool benchmarking. Recently, while
[73] applied term extraction on 11 Wikipedia Irish documents of 5,178 words and 864 extracted terms, [8] introduced a
collection of 71 Wikipedia Hindu documents comprising 11,960 words and 953 manually annotated terms.
The monolingual datasets differ considerably, as there is a lot of variation in both the annotation and evaluation.
Diverse approaches have been applied to each different aspect, including annotation type (candidate term list or just
source text, etc.), annotation scheme (binary or multi-label, etc.), annotation guidelines (term length, POS patterns,
whether or not to add named entities, etc.). The inter-annotator agreement (IAA), a measure of how well multiple
annotators can make the same annotation decision for a certain category, varies as well, and there is often a lack of
meta-information to better understand the corpus. Another problem is that each monolingual dataset covers a different
domain and usually covers only a limited amount of terms within that specific domain. Consequently, it is extremely
difficult to make any comprehensive comparison among corpora or combine multiple datasets into an extensive corpus.
