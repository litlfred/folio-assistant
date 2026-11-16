---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-002-3-methodology
section_title: "Methodology"
section_number: 3
pages: 4-5
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
METHODOLOGY
We searched mainly on the five websites, including Google1, Google Scholar2, Semantic Scholar3, ACL Anthology4,
and Terminology5 journals to identify suitable articles for this survey. The search progress was taken from October to
December 2022. Our query terms covered two distinct ATE resources: available corpora and neural systems. Therefore,
we used 80 different queries to collect the papers that describe either methods/systems (16) or corpora (64), which are
the combinations of different keywords as illustrated in Fig. 1 and are listed as examples below:
• Methods/Systems: automatic term extraction, automatic term recognition, automatic term detection, automatic
term retrieval, automated term extraction, automated term recognition, automated term detection, automated term
retrieval, automatic terminology extraction, automatic terminology recognition, automatic terminology detection,
automatic terminology retrieval, automated terminology extraction, automated terminology recognition, automated
terminology detection, automated terminology retrieval,...
• Corpora: We combined the above keywords with each of the four following keywords: data, dataset, corpus,
corpora. For example, automatic term extraction data, automatic term extraction dataset, automatic term extraction
corpus, automatic term extraction corpora, to mention a few.
Fig. 1. The combination of keywords to search for term datasets and systems.
We sorted the resulting papers obtained by each query according to the citation counts. After collecting based on
queries, we filtered out all the papers that have less than five citations if the papers were released before 2022. After this
filtering step, we continued to select only the papers that either introduced a neural architecture for automatic term
extraction or described a novel ATE dataset to investigate in our survey. There were no limits in the languages and the
domains of the dataset that the papers aimed to solve the tasks. When it came to articles presenting neural architecture,
we included them in the survey only if they represented the first article to introduce it; otherwise, we traced citations
back until we found the original paper that introduced the architecture. We followed the same citation-tracing approach
when searching for ATE systems that employ extensive feature engineering for performance comparison. In total, 329
articles were collected, 139 articles were reviewed after filtering, and 112 articles were finally selected from the point of
view of the dataset, code, and tool availability after applying the citation-tracing mechanism for the survey.
1https://www.google.com/
2https://scholar.google.com/
3https://www.semanticscholar.org/
4https://aclanthology.org/
5https://benjamins.com/catalog/term
4
The Recent Advances in Automatic Term Extraction: A survey
ACM Computing Surveys Journal, December 12–24, 2022,
