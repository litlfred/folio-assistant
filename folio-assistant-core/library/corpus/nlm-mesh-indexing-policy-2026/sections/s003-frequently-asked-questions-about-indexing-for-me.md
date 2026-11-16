---
doc_id: nlm-mesh-indexing-policy-2026
doc_title: "NLM — MeSH indexing policy and vocabulary structure (selected pages)"
section_id: s003-frequently-asked-questions-about-indexing-for-me
section_title: "Frequently Asked Questions about Indexing for MEDLINE"
file: "nlm-mesh-indexing-policy-2026.md"
lines: 25-116
source_sha256: ef74ac912a89e108
granularity: heading
---
## Frequently Asked Questions about Indexing for MEDLINE

Source: <https://www.nlm.nih.gov/bsd/indexfaq.html> · Last Reviewed: February 24, 2023

- [How is MEDLINE® indexing accomplished?](#produced)
- [What are the benefits of automated indexing?](#scan)
- [What text is automated indexing based on?](#keywords)
- [What algorithm is used for automated indexing, and what quality assurance processes are in place?](#selected)
- [How long does it take for an article to be indexed for MEDLINE?](#descriptor)
- [How can I tell whether a record was indexed by a human vs. automatically?](#terminology)
- [How can I provide feedback about indexing or report a potential error?](#online)
- [As an author, how can I identify MeSH terms to provide as keywords?](#author)
- [How can I learn more about the MeSH vocabulary used for indexing?](#learn)

------------------------------------------------------------------------

**How is MEDLINE indexing accomplished?**

As of April 2022, all journals indexed for MEDLINE are done by automated indexing, with human review and curation of results as appropriate.

MeSH indexing for MEDLINE was done completely by human indexers until 2011. At that point, while the vast majority of journals were still done by full human indexing, NLM began experimenting with a method of indexing that, for a select set of journals, involved human curation of algorithmic results. The algorithm involved was the [Medical Text Indexer](https://lhncbc.nlm.nih.gov/ii/information/Papers/MTI_System_Description_Expanded_2013_Accessible.pdf) (MTI), which was developed by researchers in the Lister Hill Center, and this method of indexing was termed MTIFL (MTI-First Line). In 2019, we began experimenting with the full automation of indexing for some journals, with human review of select citations. The algorithm involved was a customized version of MTI termed MTIA (MTI-Auto). In 2024, we released the MTIX (Medical Text Indexer-NeXt Generation) algorithm, which uses a machine-learning model known as a neural network.

------------------------------------------------------------------------

**What are the benefits of automated indexing?**

Automated indexing provides users with timely access to MeSH indexing metadata and allows NLM to scale MeSH indexing for MEDLINE to the increasing volume of published biomedical literature. Our goal is to provide MeSH indexing within 24 hours of a citation appearing in PubMed.

------------------------------------------------------------------------

**What text is automated indexing based on?**

Automated indexing is currently based on the title and abstract of an article; future work will investigate automated indexing that is based on processing of the article’s full text (where NLM has access to that text for computational purposes).

------------------------------------------------------------------------

**What algorithm is used for automated indexing, and what quality assurance processes are in place?**

Automated indexing is currently done by the MTIX (Medical Text Indexer-NeXt Generation) algorithm, which uses a machine-learning model known as a neural network. MTIX was trained on millions of MEDLINE citations published between 2007 and 2022. From those examples, MTIX learns how the citation title, abstract, publication year, indexing year, and journal name relate to the indexed terms on that article. Once trained, MTIX can apply the knowledge it developed during training to new citations, determining which MeSH terms are statistically likely to be appropriate indexing for that new article.

Human indexers perform quality assurance review of selected sets of automatically indexed citations, e.g., those involving genes and proteins, cases of known ambiguity, and clinical trials, and curate these citations as needed. Random sets of citations are also reviewed.

------------------------------------------------------------------------

**How long does it take for an article to be indexed for MEDLINE?**

For FY 2021, the average time to index for articles fully indexed by humans was 145 days. This is in addition to any time required for bibliographic data review.

Article citations done by automated indexing are generally completed within 1 day of receipt in our indexing system and appear as indexed for MEDLINE in PubMed the following day. Again, this does not account for any time the citation may have spent in bibliographic data review.

------------------------------------------------------------------------

**How can I tell whether a record was indexed by a human vs. automatically?**

Automatically indexed citations are identified in the XML record for a citation. The attribute “IndexingMethod” was added to the MEDLINE/PubMed DTD several years ago - for more information, please see this [NLM Technical Bulletin article](https://www.nlm.nih.gov/pubs/techbull/ja18/ja18_indexing_method.html). An IndexingMethod value of “Automated” indicates that MeSH indexing was provided algorithmically; a value of “Curated” indicates that MeSH indexing was provided algorithmically and a human reviewed (and possibly modified) the algorithm results. The IndexingMethod attribute is only present if a value is specified; if this attribute is not present, the indexing method is fully human. For instructions on retrieving PubMed records in XML via API, see the [Entrez Programming Utilities Help](https://www.ncbi.nlm.nih.gov/books/NBK25501/). As of February 2023, users can identify citations indexed by these various methods in the PubMed interface as follows:

- Automated - search [indexingmethod_automated](https://pubmed.ncbi.nlm.nih.gov/?term=indexingmethod_automated)
- Curated - search [indexingmethod_curated](https://pubmed.ncbi.nlm.nih.gov/?term=indexingmethod_curated)
- Fully human indexed – Search: [medline\[sb\] NOT (indexingmethod_curated OR indexingmethod_automated)](https://pubmed.ncbi.nlm.nih.gov/?term=medline%5Bsb%5D+NOT+%28indexingmethod_curated+OR+indexingmethod_automated%29&)

------------------------------------------------------------------------

**How can I provide feedback about indexing or report potential errors?**

Users are highly encouraged to provide feedback or report problematic indexing through our Customer Service link, which is available via the “Help” link at the bottom of every webpage. This will take you to the NLM Support Center. Continue to click on ‘Write to the help desk’ to fill out the form and submit feedback and/or questions.  
  
![](/images/Picture3.png)  
  

------------------------------------------------------------------------

**As an author, how can I identify MeSH terms to provide as keywords?**

Since early 2013, PubMed has displayed publisher-supplied keywords in the KEYWORDS field of the abstract display. Authors who wish to supply those keywords using the MeSH vocabulary can consult the [MeSH Browser](https://meshb.nlm.nih.gov/search). They may also use a tool called [MeSH on Demand](https://meshb.nlm.nih.gov/MeSHonDemand)  that identifies MeSH terms in text using the NLM Medical Text Indexer program. After processing the text, MeSH on Demand returns a list of MeSH terms relevant to the text that was input.

If authors wish their articles to be retrieved by their preferred terminology, they should ensure that these words appear in the title or abstract, where they will be searchable as text words.

------------------------------------------------------------------------

**Where can I learn more about the MeSH vocabulary used for indexing?**

The [MeSH homepage](https://www.nlm.nih.gov/mesh/meshhome.html) is a valuable resource for information related to the MeSH vocabulary.

------------------------------------------------------------------------

 

 

Last Reviewed: February 24, 2023
