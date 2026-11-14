---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-001-literature-review
section_title: "Literature review"
section_number: null
pages: 2-3
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
This work sits at the intersection of three literatures:
the cataloging-theory tradition on what a “subject”
is and how reliably it can be assigned; the automated
subject-indexing literature on systems that assign it;
and the benchmark literature in adjacent controlled
vocabularies. We draw on all three, and locate the
gap each leaves for LCSH.
2.1
What a “subject” is: subject anal-
ysis and aboutness
Subject cataloging begins with subject analysis —
determining what a work is about and rendering
that judgement as controlled-vocabulary headings
(Joudrey and Taylor 2018). Hjørland’s foundational
work argues that a subject is not a property simply
read off a document but a determination shaped by
the analyst’s purpose and frame, and develops the re-
lated notions of aboutness, topicality, and relevance
(Hjørland 1992, 2001). This matters directly for any
benchmark: if “the subject” is partly a judgement,
there is no single gold answer, and an answer key
must be built from agreement among expert judge-
ments rather than asserted by one. Our consensus
design is a direct operationalisation of this stance,
and the concordance analysis in Section 3.3 quanti-
fies, at scale, exactly where that judgement is shared
and where it varies.
2.2
How much do catalogers agree?
Inter-indexer consistency
The reliability of subject assignment has been stud-
ied for over half a century under the heading of inter-
indexer consistency. Beginning with Zunde and Dex-
ter’s measures of consistency and quality (Zunde and
Dexter 1969) and the review of two decades of stud-
ies by Leonard (Leonard 1977), this literature repeat-
edly finds that independent indexers agree on the ex-
act terms only modestly — commonly in the 10–50%
range, with consistency rising as terms are general-
ized — including in direct comparisons of national-
library catalogers (Wolfram and Olson 2007; Tonta
1991). Our inter-cataloger concordance in Section 3.3
is the modern, population-scale extension of this line:
across 465,187 works cataloged by three independent
libraries we recover the classic finding (exact agree-
ment ~39%) and sharpen it by separating an objective
concept core (~93% concept-level agreement) from a
subjective expression surface — the distinction that
motivates both our consensus target and our exact-
versus-concept metrics.
2
2.3
