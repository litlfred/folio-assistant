---
doc_id: nlm-mesh-indexing-policy-2026
doc_title: "NLM — MeSH indexing policy and vocabulary structure (selected pages)"
section_id: s002-use-of-mesh-in-indexing
section_title: "Use of MeSH in Indexing"
file: "nlm-mesh-indexing-policy-2026.md"
lines: 6-24
source_sha256: ef74ac912a89e108
granularity: heading
---
## Use of MeSH in Indexing

Source: <https://www.nlm.nih.gov/mesh/intro_indexing.html> · Last Reviewed: July 10, 2025

The MeSH vocabulary is primarily designed for use by NLM to index citations for journal articles in the MEDLINE database and to search the MEDLINE data using PubMed.  MEDLINE indexing was done by human indexers for many decades but was transitioned to automated indexing in 2022 – the algorithm currently used for indexing is the MTIX (Medical Text Indexer-NeXt Generation) algorithm, which uses a machine-learning model known as a neural network. See the [NLM Technical Bulletin article on MTIX](https://www.nlm.nih.gov/pubs/techbull/ma24/ma24_mtix.html). More information about the transition to automation can be found in this [NLM Technical Bulletin article](https://www.nlm.nih.gov/pubs/techbull/nd21/nd21_medline_2022.html) and in these [frequently asked questions](https://www.nlm.nih.gov/bsd/indexfaq.html) about indexing for MEDLINE.

For the purposes of MEDLINE indexing, biomedical concepts may be reflected in several ways by MeSH descriptors:

- With the coordination of two descriptors, e.g., JEJUNAL DISEASES and ENTERITIS for jejunitis
- With a descriptor and a subheading, e.g., MUSCLES/INJURIES for muscle injuries
- With a “pre-coordinated” descriptor, e.g., HEAD INJURIES for head injuries

MTIX was trained on millions of MEDLINE citations published between 2007 and 2022. From those examples, MTIX learns how the citation title, abstract, publication year, indexing year, and journal name relate to the indexed terms on that article. Once trained, MTIX can apply the knowledge it developed during training to new citations, determining which MeSH terms are statistically likely to be appropriate indexing for that new article. Automated indexing generally provides the most specific MeSH descriptor available, though a broader descriptor may be indexed based on the frequency of its occurrence. Human curators review selected sets of automatically indexed citations and may add or delete MeSH descriptors or make other corrections as needed.

 

Last Reviewed: July 10, 2025
