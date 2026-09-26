---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-005-consensus-ground-truth
section_title: "Consensus ground truth"
section_number: null
pages: 4-5
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
There is no single correct heading set for a book —
cataloging is expert judgement, and while profession-
als largely agree on a work’s subject they vary in how
they express it, as shown in Section 3.3. We therefore
define ground truth by consensus across independent
libraries: the same book is cataloged separately by
several research libraries, and where independent ex-
perts agree we have something close to truth. The
inclusion rule is strict and never relaxed to enlarge
the dataset: a book is admitted only if at least two
libraries independently assigned LCSH to it.
Inde-
pendence is enforced at the level of the cataloging
agency (MARC field 040), not merely the holding li-
brary, so that a copy-cataloged record imported from
another institution does not count as a second judge-
ment. The benchmark never discards the underlying
disagreement: it records which library asserted which
heading and releases three consensus views described
in Section 3.6.
3.3
Inter-cataloger concordance:
an
objective core and a subjective
surface
The consensus rule rests on an empirical claim —
that independent experts agree often enough to con-
stitute a usable signal — which the multi-library data
lets us test directly. Across the full corpus 1.32 M
works are held by all three libraries, and 465,187 were
subject-cataloged by all three, giving that many nat-
ural three-way annotations of the same book. Com-
paring the three heading sets per book gives a two-
layer picture (Table 1).
For a work cataloged by
libraries 𝒞= {Columbia, Harvard, Princeton}, let
𝑆𝑐= 𝜅𝑚(headings of 𝑐) be library 𝑐’s key set un-
der match mode 𝑚(see Section 3.10; exact = 𝜅exact,
concept = 𝜅root). Agreement is summarized by the
three-way and mean-pairwise Jaccard indices
𝐽3 =
∣⋂𝑐∈𝒞𝑆𝑐∣
∣⋃𝑐∈𝒞𝑆𝑐∣,̄
𝐽pair = 1
3
∑
{𝑎,𝑏}⊂𝒞
|𝑆𝑎∩𝑆𝑏|
|𝑆𝑎∪𝑆𝑏|; (1)
In Table 1 we report the median of the per-work 𝐽3
values; pairwise Jaccard is used only as a supplemen-
tary diagnostic and is not shown in the table.
a work has identical sets if 𝑆𝑎= 𝑆𝑏= 𝑆𝑐, shares ≥1
heading if ⋂𝑐𝑆𝑐≠∅, and shares nothing if 𝑆𝑎∩𝑆𝑏= ∅
for every pair. With the vote 𝑣(ℎ) = |{𝑐∶ℎ∈𝑆𝑐}|,
the single-source rate is the fraction of distinct asser-
tions ℎ∈⋃𝑐𝑆𝑐with 𝑣(ℎ) = 1. The human agree-
ment reference treats each library ℓas a predictor of
its peers’ consensus 𝐶−ℓ= ⋂𝑐≠ℓ𝑆𝑐,
recallℓ= |𝑆ℓ∩𝐶−ℓ|
|𝐶−ℓ|
,
(2)
4
averaged over works with 𝐶−ℓ≠∅and the three
choices of ℓ(here concept = the heading root, the
term before the first --).
Two layers emerge. Subject identification is largely
objective: three independent libraries cataloging the
same book share a concept-level heading 93.3% of
the time and share nothing only 0.2% of the time
(median concept Jaccard 0.86).
Subject expression
is substantially subjective: only 39.4% assign byte-
identical sets, and 35.6% of all (book, heading) as-
sertions are made by just one of the three libraries.
The jump from exact to concept agreement (identi-
cal 39%→50%; “≥1 shared” 81%→93%) shows most
disagreement is granularity — which subdivisions,
how specific — not topic; per-library heading counts
are otherwise similar (Columbia 2.56, Harvard 2.86,
Princeton 2.62 per book).
This concordance reflects genuine convergence, not
shared copy-cataloging:
restricting to the 67,624
works cataloged by three distinct MARC-040 agen-
cies lowers agreement by only ~4–5 points (concept
“≥1 shared” 76.9% vs 81.4%), even though the con-
sensus rule already requires independent agencies.
Two design choices follow directly.
First, a sin-
gle library’s headings are one noisy sample of the
subjective-expression layer, so aggregating across in-
dependent libraries recovers the reliable target —
the justification for consensus ground truth.
Sec-
ond, because disagreement is dominated by granular-
ity rather than topic, exact match conflates “wrong
subject” with “different subdivision,” and we there-
fore report exact and concept (root) match through-
out; see Section 3.10. The same data yields a human
agreement reference: treating each library as a pre-
dictor of the consensus of the other two, a human
cataloger reproduces 86.9% of the agreed headings
exactly and 93.0% at the concept level. This indexes
how reliably an expert reproduces peers’ consensus;
it is an agreement reference, not a retrieval ceiling —
a first-stage retriever returns 200 ranked candidates
whereas a cataloger commits to a short final set, so
the two are not scored on the same task.
3.4
