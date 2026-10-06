---
name: lsi-indexing
description: >-
  Build, read and audit a Latent Semantic Indexing index over a declared prose
  graph — a library, the skills, the beans, docs — to find units that discuss
  the same thing in different words, near-duplicates, outlier clusters, and a
  proposed home for unfiled work. Every output is a proposal; LSI never writes
  a relation.
graph-typologies:
  - library
  - skills
  - beans
  - docs
---

# LSI indexing — the platform's application of `methodologies/lsi.md`

**The method is the node, not this file.** [`lsi`](../../../methodologies/lsi.md)
carries what LSI is, its sources, and the six refusals. This skill says how to
run it here and how to read what comes back. Where the two disagree, the node
wins.

## When to reach for it

| you are asking | use |
|---|---|
| "which nodes contain these words?" | `graph-search` — lexical, exact, no score |
| **"has anyone worked this topic in *other* words?"** | `bun run lsi query "<text>" --instance <i> --graph <g>` |
| "is this new bean / section a restatement of an existing one?" | the sidecar's `nearDuplicates` |
| "what is this graph about, as a whole?" | the sidecar's `dimensions` (read both poles) |
| "is there junk in this library — boilerplate, specimen text, a bad page?" | the sidecar's `narrowDimensions` |
| "which epic does this bean / branch / PR belong under?" | `bun run lsi:epics` |

Run the lexical search FIRST. LSI supplements an empty or thin lexical result;
it never replaces a lexical hit, and its hits are always reported under their
own label (`latent only` vs `lexical+latent`) — refusal 1.

## Commands

```sh
bun run lsi index --instance who-iris --graph library      # build + write the sidecar
bun run lsi index --instance who-iris --graph library --doc 9789241548960-eng   # one document
bun run lsi query "certainty of the evidence" --instance who-iris --graph library
bun run lsi:audit                                          # which graphs need one; is each fresh?
bun run lsi:epics --out <file.md> [--prs <open-prs.json>]  # epic-filing proposal
bun run lsi:near "<planned bean title>"                    # before `beans create`
bun run cat-harness/content/pipeline/graph-search.ts "<q>" --latent   # lexical + graph, THEN a separate latent list
```

**From an MCP host**: the `lsi_query` tool (Tool node `lsi-query`), with the
query as `text` and optional `instance` / `graph`. On a shell the query goes on
STDIN (`echo "<q>" | bun run lsi query --instance who-iris --graph library`),
because free text never goes on a command line.

A **unit** is the graph's own chunk: a library **section** (what ingestion
already produced), otherwise one markdown file. Units under 20 tokens are
skipped — too little vocabulary to place.

## Cross-document links — a floor, and hubs reported, not penalised

`bun run lsi links --instance <i> --graph <g>` proposes links between units of
DIFFERENT documents in one graph: each unit's best other-document match, only
at cosine ≥ 0.5 (`LINK_FLOOR`), with the units that are "nearest" to many
others listed as **hubs** to discount. On who-iris it proposes 12 links and
leaves 326 of 342 sections with none — the honest answer when the median best
match is ~0.2.

**Why there is no hub PENALTY (bean `9udd`).** A CSLS-style penalty
(`2·cos − r(a) − r(b)`) was measured on the 15 strongest who-iris pairs a
reader labelled, and made ranking worse: real-vs-spurious AUC 0.96 with plain
cosine, 0.75–0.79 with the penalty at K = 5, 10, 20. The page it demoted most
(HQ p36, mark-up) is central because it is genuinely on-topic. The floor alone
is what the data supports; it is a house number fitted to 15 examples.

## Keywords — the per-unit view the index used to discard (issue #2302)

The weighted matrix already says which terms characterise each unit; the index
then reduces it to k dimensions and the per-unit view was gone.
`keywordsOf(matrix, cols, texts, top, headings)` keeps it: a unit's (or a
pooled set of units') top terms and two-word phrases, from the same weights.
Its first consumer is `bun run library:keywords` (per library section and per
document, written as `keywords.json` and shown in the library viewer). The
scoring rules are documented with `keywordsOf` in `content/pipeline/lsi.ts`,
and the ingestion skill that runs it says when (`skill_fetch
l1-document-ingestion`, §"Keywords"). Reuse it for any unit set the index covers — beans, chapters —
rather than writing a second term weighting.

## Correspondence analysis — the parallel track

[`correspondence-analysis`](../../../methodologies/correspondence-analysis.md)
is a separate method over the same term matrix (`content/pipeline/ca.ts`):
the SVD of the χ² residuals, so no dimension carries document length or term
frequency. `bun run lsi:epics --method ca` runs it on the bean store.
**Measured 2026-09-29: not significantly better or worse than LSI at filing
beans** (exact McNemar p = 0.17–0.71), so LSI stays the default. Reach for CA
when an LSI dimension 1 has no negative pole, or when the question is which
units are UNUSUAL — CA's leading dimensions go to the most distinctive
profiles. Pick one per question; never average the two scores.

## On ingestion — the index refreshes itself

`bun run ingest … --promote` ends by re-indexing the library it wrote into
and printing, for the promoted document only, its near-duplicate section
pairs and any narrow dimension it carries. **Advisory**: an index is not part
of L1, so a failure prints "not refreshed — this is not a pass" and the
ingest still succeeds. Read the lines while the document is fresh: a narrow
dimension on a new document is almost always boilerplate, specimen text or a
mis-extracted page, and it is cheapest to mark now.

## Where to LOOK at an index

`bun run lsi:viz` writes one page, `/lsi/` ("Latent semantic indexes"): every
stored index with its dimensions as two poles, its findings, and the
need-an-index verdicts. The page names what it draws in its own front matter —
`renders:` the `qa` directory, `rendered-by: lsi-viewer` — which since #1168
B7a-2b is how a directory's viewer is found (the directory no longer points at
the page; its `tile:` carries only the title). So it appears on the navbar, the
board and the central **Published graphs** page (`/cat-harness/`, §"Every
declared viewer") with no further wiring. `lsi:viz:check` fails in CI when the page is stale — so after
`lsi index`, run `lsi:viz` too. The page is excluded from every index's units:
indexing a page that reports on the indexes would never reach a fixed point.

## Where the index lives, and what is stored

`cat-harness/test/results/lsi/<instance>/<graph>.lsi.json` — the fingerprint,
parameters, retained variance, per-dimension pole terms, each unit's three
nearest neighbours, and the findings. **Not the vectors**: a rebuild is about a
second per few hundred units, and a float dump is not reviewable.

That path is the **working copy, and nothing under it is committed** (bean
`tqjj`, 2026-10-04 — the LSI subset of `5hox`). The record is the commit-keyed
entry the CI job `qa-publish` stores on the orphan `qa-reports` branch
(`main/<sha>/`, `pr/<n>/<sha>/`; arc `3fva`). The readers cope with its
absence (bean `oq1j`): with no `test/results/lsi/` in the checkout, the verdict
rebuilds the index in memory and judges that run, writing nothing, and
`lsi:viz` reads the indexes by ref through `qa-store` (`--ref`, default `main`)
— anything but a hit exits 2 and writes no page about zero indexes.

**The viewer page is SPLIT, and the cut is by what each value is a function
of.** A sidecar comes off `main` because its record is on the branch. The page
cannot come off whole — its front matter is what declares the harness tile for
`/lsi/`, so a page that is not committed is a page with no way in. So:

| part of `docs/lsi/index.md` | a function of | committed |
|---|---|---|
| front matter, prose, method links | the generator | **yes** |
| which graphs need an index, and each verdict | the **tree** | **yes** |
| units, terms, retained, σ, pole terms, cosines | an index's **content** | no |

The committed half reads **no index at all**: the verdict table is computed
with a source that holds nothing, so `graphVerdict` takes its compute-and-judge
branch over the current tree. That is not a detail. Were the table read from a
stored index, the same commit would say `fresh` on a container holding a
working copy and `stale` in CI reading `qa-reports` at `main` — which resolves
to the LATEST published entry, so the value would depend on when the gate ran
rather than on the tree. **That is bean `in5a`'s loop arriving over the
network**, and it is the trap to avoid when taking any committed page off a
store: the page stops being a function of the tree.

`bun run lsi:viz -- --detail` adds the per-index sections and is run by the
docs-site build, after that workflow's `qa:fetch` pins the entry to the
build's own sha. So the published page carries everything a reader wants and
`main` carries nothing a one-sentence skill edit moves. `lsi:viz:check` keeps
its ordinary meaning against the committed half, so it is still a gate that
fails.

### Why a declared merge pattern was not enough, measured

This is the worked example for a question that comes up every time a generated
file conflicts. Three facts, in order, and the third is the one that is easy to
get wrong:

1. **The content is reproducible.** Regenerated on an unchanged tree in a cloud
   container, `skills.lsi.json` came back byte-identical to the committed file.
   So this is *not* bean `in5a`, where a container-dependent value makes
   take-base a loop. Take-base plus a regeneration pass converges here.
2. **It converges on a rewrite of the whole file.** Appending one sentence to
   one of 229 skills changed the `fingerprint`, **9 of 12** `dimensions`
   entries and **166 of 229** `neighbours` entries, and left `findings` and
   every other field byte-identical. `neighbours` is **94 %** of the file;
   `findings`, the only judgement in it, is **0.3 %**. An SVD rotation is
   globally sensitive: there is no small diff to merge.
3. **The pattern was already declared, and the files still conflicted.**
   `derived-results`/take-base has covered `**/test/results/lsi/**` and
   `**/test/results/tool-runs/**` all along, and those paths were still
   blocking seven open pull requests each. A strategy settles **how** a
   conflict is resolved, never **whether** one arises — which is what
   `.gitattributes` means by *"Removing these conflicts, rather than tidying
   them, needs the files off `main` altogether."*

So the question to ask of a conflicting generated file is not "which strategy"
but **"what is this file's record, and is `main` it?"** Where the answer is no,
declare the strategy for the branches in flight and take the file off `main`.

**State graphs are indexed on demand, never stored.** The `beans` graph
changes on nearly every commit; a stored index would be stale on every PR
and a merge-conflict magnet. `lsi:epics` rebuilds it each run. That reasoning
is now the general case rather than the exception: `skills` reached the same
verdict for the same reason, three days later.

## Reading a sidecar

- **`retained`** — share of ‖A‖²_F the rank-`k` approximation keeps. It is not
  a quality score; a low value on a large heterogeneous graph (beans: ~45 %)
  is expected.
- **Dimension 1 is usually a margin.** Qi et al. (2023): LSA's first
  dimensions mainly carry document length and overall term frequency. A
  dimension with no negative pole is that signature — skip it when reading
  themes.
- **`dimensions`** — a dimension is a *contrast*, so read the positive and
  negative poles together. Refusal 2: it is not a topic until a person names
  it.
- **`narrowDimensions`** — a dimension ≥ 80 % of whose mass sits on ≤ 3 units
  (or 1 %). Almost always non-prose: in who-iris it found two different
  kinds of placeholder text in the WPRO style guide on the first run —
  Lorem-ipsum layout filler (pp. 21, 29–31) and pseudo-Latin font specimens
  (pp. 14–15, 28). Treat as an ingestion finding.
- **`nearDuplicates`** — cosine ≥ 0.95. In the bean store it found pairs such
  as `3ozg`/`rmcf` (the same 72-sidecar churn, filed twice). A duplicate bean
  is **scrapped with a pointer**, never deleted (`bean-coordination`).

## The need-an-index audit

`bun run lsi:audit` walks every declared graph of a prose kind across every
instance and writes `cat-harness/test/results/lsi-need-an-index.qa-results.json` (`qa-results/v1`).

| result | means |
|---|---|
| `n/a` | below the threshold — **not judged**, which is not the same as fine |
| `fail` | needs an index and has none, or its fingerprint no longer matches |
| `pass` | has a fresh index |

The threshold (≥ 100 units and ≥ 20,000 words) is a **house** number with its
basis stated in `scripts/lsi.ts`; the method gives no corpus-size rule. It
reports and does not gate (exit 0), like `check:methodology-evidence`;
`--strict` exits 1 for a caller that has decided; no CI step runs it yet.

### The same verdict in the audited record — `kg:audit`'s `tool-downstream-fresh`

LSI is the first member of the **downstream-tool family** (bean `fq5u`). The
`lsi-index` Tool node declares `downstream`, and every `bun run lsi index`
writes a `folio-tool-run/v1` record — outcome and input fingerprint, on
success AND on failure — under `test/results/tool-runs/lsi-index/`. The
verdict reads three states:

| state | meaning | green? |
|---|---|---|
| fresh | a successful run's recorded fingerprint matches the graph now | yes |
| stale | the graph changed since the recorded run | no |
| not-run / failed | no run record, or the last run failed | **never** |

A sidecar on disk with no run record is `not-run`: a file is not evidence the
run that should keep it current succeeded. `kg:audit` carries this as
`tool-downstream-fresh` on the `lsi-index` Tool (`minor`), one finding per
graph, using the same verdict function as `lsi:audit`. It generalises the
graph-level `lsi-index-fresh` it replaced. Its finding text carries **no
counts**, so the kg-qa sidecar moves only when a verdict flips.

Two chains keep the indexes fresh, so the criterion stays quiet in
ordinary work:

- **a skill edit** — `skill:register` runs `lsi:skills` before `kg:audit`, and
  CI checks it with `lsi:skills:check`;
- **an ingest** — `--promote` re-indexes the library (§"On ingestion").

A graph nobody has indexed yet (today: `cat-harness/docs`) is a standing
`minor` finding on the `lsi-index` Tool. That is the point of recording it: "needs one and has none"
is now a fact in the audited record instead of a line in a report.

## Epic filing — the qou hierarchy, proposed by evidence

The qou project-management skills (`todo-manager`, `session-intent`) require
every piece of work to sit under a parent bean. `lsi:epics` proposes that
parent for each open bean with no epic, each unmerged branch and each open PR:

1. **explicit first** — a `parent:` chain that reaches an epic, or a bean id
   named in a branch's commit messages (case-insensitive, merge commits
   excluded);
2. **latent second** — cosine to each open epic's centroid (the epic plus all
   descendants of every status, each normalised; leave-one-out for the bean
   being scored). A branch or PR is folded in from its name and commits.

It prints a **calibration line**: of the beans already under an epic, how
often LSI's best guess is the current epic. Measured 2026-09-29: 145 / 247
(59 %) against 21 classes, flat across k = 50–250, and log-entropy beat tf-idf
(59 % vs 52 %). Read every proposal in that light.

**A disputed filing is not a misfiling.** The largest disputes on the first
run were beans filed by *symptom* (translation catalogues under CI
RELIABILITY because they turned `main` red) that LSI files by *subject*
(TRANSLATION). Both are defensible; which axis an epic means is a decision for
the owner, not for the score.

**Never apply the proposal in bulk.** `beans update <id> --parent <epic>` is
done one bean at a time by somebody who read both the bean and the epic.
