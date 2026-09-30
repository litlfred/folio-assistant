---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-006-sources-and-matching
section_title: "Sources and matching"
section_number: null
pages: 5-6
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
The raw material is openly licensed bulk MARC from
research libraries — Harvard, Columbia, and Prince-
ton (the Library of Congress dump was considered
but dropped, as its coverage stops at 2014). All are
CC0 / public domain, so the benchmark redistributes
the actual records, making it fully reproducible. The
same book is identified across catalogs by OCLC
number (primary) and LCCN (fallback); a subtle
but high-impact step strips the historical ocm/ocn/on
prefixes and leading zeros from OCLC numbers and
rejects all-zero identifiers, without which matching
silently fails — or, worse, collapses unrelated records
onto a shared malformed key — for a large fraction
of records.
3.5
Extraction, provenance filtering,
and typing
From each qualifying record we read the input (title,
authors, date, publisher, physical description, and
the rich signals — summary [MARC 520], table of
contents [505], notes [500]; language from the 008
code; broad discipline from the validated first letter of
the LC classification) and the answer (the 6xx subject
headings, reassembled field-aware: only the subdivi-
sion subfields 𝑣/𝑥/𝑦/𝑧are joined with --, while name
and title subfields are kept as part of the heading).
Two extraction-time controls matter for fairness.
First,
provenance filtering:
the 6xx fields of a
MARC record may carry headings from other the-
sauri (FAST, MeSH, foreign-language vocabularies)
that are not LCSH. We keep a 600/610/611/630/
650/651 heading only when its second indicator is
0 (LCSH) or its $2 source is lcsh, and a 655 heading
only when $2 is lcgft (genre/form), removing most
of a quarter of candidate headings whose strings look
like valid LCSH but whose provenance is not — a dis-
tinction string-validity checks miss. Second, typing:
every heading is tagged by its MARC field as topi-
cal (650; the topical core), geographic (651), name
(600/610/611/630), or genre/form (655), so scores
can be sliced by category and a name-recognition
failure is not hidden inside a topical average.
We
5
Table 1: Per-book agreement among the three libraries, over the 465,187 works all three subject-cataloged.
Agreement among all three libraries
Exact heading
Concept (root)
Identical heading sets
39.4%
49.8%
≥1 heading shared by all three
80.7%
93.3%
Share nothing in common
1.0%
0.2%
Median three-way Jaccard
0.50
0.86
also restrict the collection to monographs (leader
type/level), so a set described as “books” contains
books rather than serials, scores, or maps.
Non-English material is handled by extracting both
the romanised title/authors and the original-script
(“vernacular”) forms from the linked 880 fields, since
the answers are always English and bridging from
non-English content is where systems succeed or fail.
3.6
