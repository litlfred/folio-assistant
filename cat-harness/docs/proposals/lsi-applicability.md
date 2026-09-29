---
title: LSI — applicability to ingestion, KG development, QA and the work plan
status: proposal
bean: folio-assistant-ansc
issue: 1482
---

# Latent Semantic Indexing: where it applies here, measured

**Method:** [`methodologies/lsi.md`](../../methodologies/lsi.md) · **Skill:**
[`lsi-indexing`](../../skills/graph-management/lsi-indexing.md) · **Engine:**
`content/pipeline/lsi.ts` · **Bean** `ansc`, **issue** #1482.

Every number below was measured on 2026-09-29 in this checkout, by the commands
named beside it. None is quoted from the literature.

## 1. The problem LSI solves, stated in this repository's own words

`content/pipeline/graph-search.ts` already names it in its docblock: a lexical
search *"cannot answer [has anyone worked this topic?] for a prior result
written in different words — which is the case that actually costs a session,
because the grep comes back empty and reads as a clean bill."* The graph walk
it adds recovers the case where the related node is **linked**. LSI recovers the
case where it is **not linked and not worded the same**, which neither lexical
search nor the graph can see.

That is the whole argument for adopting it, and it also sets the limit: LSI is a
retrieval aid, so every output here is a proposal (method refusals 1–4).

## 2. Applicability, problem by problem

### 2.1 Document ingestion

| use | measured on who-iris (3 docs, 342 sections, 47,552 words, ~1 s) | verdict |
|---|---|---|
| **Outlier / non-prose detection** (`narrowDimensions`) | two dimensions are placeholder text in the WPRO style guide: Lorem-ipsum layout filler (pp. 21, 29–31) and pseudo-Latin font specimens (pp. 14–15, 28). Found on the first run, by nobody looking for it | **strong** — cheap, and finds what a per-page check cannot, because "unusual" is only defined against the rest of the corpus |
| **Near-duplicate pages** (`nearDuplicates`) | 12 pairs, all inside the WPRO guide: repeated layout pages (pp. 6–10) and font-specimen pages (14/15, cos 0.993) | **useful**, needs a person: similar is not duplicate |
| **Cross-document "about the same thing"** | query *certainty of the evidence* → Handbook §9.5.2, §9.1 lexically, then §9.2 *GRADE evidence profiles* and §9.6 **latent-only**; *tuberculosis drug susceptibility* → the Handbook's PICO examples, all latent-only | **strong** for the vocabulary gap; weak across documents whose vocabularies do not overlap (the style manuals and the guideline handbook share little) |
| Prioritising agent summaries (bean `x80s`) | not run | plausible: summarise a dimension's central units first |
| Round-trip translation QA (bean `ktt2`) | not run | **not with this node.** Cross-language LSI is a different method (Dumais et al. 1997) and needs a parallel corpus |

### 2.2 Knowledge-graph development

| use | measured | verdict |
|---|---|---|
| **Vocabulary-gap search beside `graph-search`** | see 2.1 | **strong**; report as its own provenance, never merged |
| Duplicate / overlapping skills | 302 skills, 7,514 terms: **0** pairs ≥ 0.95 | a measured negative — the skills graph is not restating itself at that threshold |
| `uses[]` candidates for a block | not run | **propose only** — `uses[]` is editorial; writing it from a score destroys the signal (refusal 3) |
| Glossary candidates (bean `lqo9`) | not run | plausible: term–term neighbours in `U_k Σ_k` surface synonyms a glossary should reconcile |
| Cohesion of a candidate subgraph (bean `j79e`, detangle) | not run | a second, independent cohesion measure; parallel to the structural one, not a replacement |
| **Formal math content** | — | **excluded.** A similarity score is never evidence for a claim, never enters a proof (refusal 4) |

### 2.3 QA

`bun run lsi:audit` — which declared prose graphs need an index, and is each
fresh. First run: **8 graphs** met the threshold (≥ 100 units, ≥ 20,000 words;
a house number, basis stated in `scripts/lsi.ts`). After this PR: `who-iris/library`
and `cat-harness/skills` **pass**; `cat-harness/beans` is **n/a by design**
(a state graph, rebuilt on demand); five still **fail** —
`agent-skills/library`, `cat-harness/library`, `cat-harness/docs`,
`smart-base/library`, `smart-trust/smart-trust-docs`.

### 2.4 The work plan — epics

`bun run lsi:epics` over **1,061 beans** (every status), 21 open epics as
classes. Full output: [`lsi-epic-filing-2026-09-29.md`](lsi-epic-filing-2026-09-29.md).

- **The store is already well filed**: 7 of 254 open beans have no epic.
- **Calibration**: leave-one-out, LSI's best epic equals the current one for
  **145 / 247 (59 %)**; chance is ~5 %. Flat across k = 50–250 (59–63 %).
  Log-entropy beat tf-idf (59 % vs 52 %). (Dumais 1991, credited with that
  weighting, is not held, so this is our measurement, not a replication.)
- **34 disputed filings.** The strongest are *symptom vs subject*: translation
  catalogue beans under CI RELIABILITY (they turned `main` red) that LSI puts
  under TRANSLATION (what they are about). Both are defensible; which axis an
  epic means is an owner decision.
- **Duplicates found**: 13 bean pairs ≥ 0.95, e.g. `3ozg`/`rmcf` (72 sidecars
  churn), `d3yq`/`xffc` (themes), `gx86`/`whwf`, `o3p3`/`ukfw`.
- **Branches**: 145 unmerged. 39 name a bean in their commits (explicit home);
  106 do not and get a latent proposal, mostly with small margins — most are
  one-commit leftovers whose work landed another way.

## 3. What LSI is NOT good at, here

Since this page was first written, the sources were ingested and the method
node was checked against them ([`lsi`](../../methodologies/lsi.md)): the
engine reproduces the 1990 paper's worked example, and two claims in the
first draft were corrected — `k` (the paper uses 50–100) and stemming (the
paper's CISI result shows stemming captured structure LSI did not).

- **The first dimension is a margin.** Qi et al. (2023): LSA's first
  dimensions mainly show document length and term frequency. Both our
  committed indexes have a dimension 1 with no negative pole — that signature.

- **Word order and negation.** Bag of words: "X is not Y" and "X is Y" are the
  same vector. Useless for checking what a text *asserts*.
- **Polysemy is only partly handled.** A term has one vector — the average of
  its senses; context disambiguates only at the unit level.
- **Small graphs.** Below ~100 units the co-occurrence statistics are thin;
  that is why the audit says `n/a`, not `pass`.
- **`k` is empirical.** The literature gives no rule; the calibration above is
  how this repo chose (and found the choice barely matters for filing).
- **Dimensions are identifiable only up to sign and rotation within equal
  singular values.** The engine fixes the sign; naming a dimension is still a
  person's act.

## 4. Options for skills, tools and docs

Built in this PR: the methodology node, the engine, `lsi` / `lsi:audit` /
`lsi:epics`, the `lsi-indexing` skill, committed sidecars for
who-iris and skills, this page and the epic proposal.

| # | option | what it adds | cost | recommendation |
|---|---|---|---|---|
| A | **Semantic check before `beans create`** | fold the new title in, show the 3 nearest beans; `beans create` dedupes on nothing (the 14,688-duplicate incident) | small: one call in the check-before-create recipe | **do first** — highest value per line |
| B | **Ingestion QA step** | run `narrowDimensions` + `nearDuplicates` as a sidecar when a library document is ingested (`library-ingestion`) | small–medium; one BPMN task | do second |
| C | **`--latent` on `graph-search` + an MCP `lsi_query` Tool node** | agents get vocabulary-gap search where they already search, as a separate provenance | medium; a Tool node + satisfies | do third |
| D | Fold `lsi-index-fresh` into `kg:audit` as a sidecar criterion | the verdict joins the audited record, like `check:raci` did (bean `3kbd`) | medium; kg:audit sidecar churn, and PR #1472 is reshaping kg:audit now | after #1472 lands |
| E | Index the five remaining graphs | `bun run lsi index` per graph; `docs` is 434k words (~10 s) | trivial compute, large sidecars to review | after deciding sidecar size policy |
| F | Apply the epic proposal | `beans update --parent` for the 7 unfiled, scrap-with-pointer for confirmed duplicates | owner review per bean | owner decides |
| G | **Correspondence analysis as its own method node** — ✅ **built and measured 2026-09-29** | `methodologies/correspondence-analysis.md`, `content/pipeline/ca.ts` (tested on Qi et al.'s Table 1). On the pre-refiling bean store: CA-raw 146 vs LSI-raw 136 of 250 (the paper's direction, McNemar p = 0.17); vs log-entropy LSI p = 0.71. Removes the margin dimension (who-iris dim 1: LSI 342/342 one side, CA 46/296) but its leading dimensions go to outliers | done | parallel track; LSI stays the filing default |
