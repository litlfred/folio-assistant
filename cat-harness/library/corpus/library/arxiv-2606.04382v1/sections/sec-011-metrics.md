---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-011-metrics
section_title: "Metrics"
section_number: null
pages: 7-8
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
The central methodological commitment is that no
single number is trustworthy on its own: an aggre-
gate can hide catastrophic per-language or per-type
failure, and can rank systems against the grain of
expert judgement (Galke et al. 2022; D’Souza et al.
2025). We report a panel and read the pattern across
it.
For generation, predictions and answers are sets; we
report micro- and macro-averaged precision, recall,
and F1.
For the retrieval pipeline, predictions are
ranked and we report recall@𝑘(𝑘∈{5, 10, 50, 200}),
P@𝑘, R-Precision, and MRR. Every measure is com-
puted under two match definitions: exact (the full
subdivided heading must match) and root/concept
(only the base term before the first --). The exact-
versus-concept gap is itself diagnostic: a high concept
but low exact score means the system found the right
topic but not the authorised subdivided form — a
different, specifiable error from a topical miss. Every
measure is additionally broken down by language and
by heading type; these breakdowns are the panel’s
most important safeguard.
Formally, fix a match mode 𝑚∈{exact, root} with
key map 𝜅𝑚(𝜅exact = the normalized heading; 𝜅root
= its substring before the first --); all comparisons
are between the key images 𝜅𝑚(𝑃) and 𝜅𝑚(𝐺) of a
prediction set 𝑃and gold set 𝐺. For generation (set
prediction),
P = |𝑃∩𝐺|
|𝑃|
,
R = |𝑃∩𝐺|
|𝐺|
,
𝐹1 = 2 P ⋅R
P + R ,
(3)
reported both macro (mean of the per-record scores
over the 𝑁records) and micro (the same formulas on
pooled counts ∑𝑖|𝑃𝑖∩𝐺𝑖|, ∑𝑖|𝑃𝑖|, ∑𝑖|𝐺𝑖|). For re-
trieval (a ranked list with prefix 𝑃@𝑘= {𝑝1, … , 𝑝𝑘}),
recall@𝑘= |𝑃@𝑘∩𝐺|
|𝐺|
,
P@𝑘= |𝑃@𝑘∩𝐺|
𝑘
,
RP =
|𝑃@|𝐺| ∩𝐺|
|𝐺|
,
MRR = 1
𝑁
𝑁
∑
𝑖=1
1
𝑟𝑖
.
(4)
where RP is R-precision (precision at the cutoff 𝑘=
|𝐺|) and 𝑟𝑖is the rank of the first gold heading in
record 𝑖(with 1/𝑟𝑖= 0 when none is retrieved).
Retrieval is scored against the vocabulary-reachable
gold set 𝐺reach
𝑚
= {𝑔∈𝐺∶𝜅𝑚(𝑔) ∈𝒱𝑚} for re-
trieval vocabulary 𝒱, and we report the reachability
ceiling |𝐺reach
𝑚
|/|𝐺| explicitly so unreachable headings
are not silently counted as misses (Equation 5).
reachable𝑚= ∑
𝑁
𝑖=1 |𝐺reach
𝑚,𝑖|
∑
𝑁
𝑖=1 |𝐺𝑖|
(5)
Equation 5 is heading-weighted (reachable gold head-
ings over all gold headings, not a per-record average):
on the evaluation subset the exact-reachable ceiling is
41% of gold headings and the concept-reachable ceil-
ing 85%. Name (LCNAF) headings are not present
in the LCSH+LCGFT retrieval vocabulary, so they
7
are reported separately rather than counted as un-
reachable misses. So that a heading that cannot be
retrieved is never scored as a miss, retrieval metrics
are macro-averaged only over the records that have
at least one reachable gold heading — 1,483 of the
2,002 evaluation records for exact match, 1,929 for
concept; records whose entire gold is unreachable are
excluded rather than scored as recall-zero, and the
count scored (𝑛) is reported with every retrieval table.
Bootstrap 95% confidence intervals (1,000 resamples
over records) and paired approximate-randomisation
tests accompany the headline comparisons. A qual-
itative track — expert ratings of validity, appropri-
ateness, and discovery usefulness — is specified but
left to future work; the inter-cataloger human agree-
ment reference of Section 3.3 serves as its quantitative
stand-in.
3.11
