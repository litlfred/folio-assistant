---
name: lsi-indexing
description: >-
  Build, read and audit a Latent Semantic Indexing index over a declared prose
  graph — a library, the skills, the beans, docs — to find units that discuss
  the same thing in different words, near-duplicates, outlier clusters, and a
  proposed home for unfiled work. Every output is a proposal; LSI never writes
  a relation.
capability: architecture
package: graph-management
graph-kinds:
  - library
  - skills
  - beans
  - docs
---

# LSI indexing — the platform's application of `methodologies/lsi.md`

**The method is the node, not this file.** [`lsi`](../../methodologies/lsi.md)
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
```

A **unit** is the graph's own chunk: a library **section** (what ingestion
already produced), otherwise one markdown file. Units under 20 tokens are
skipped — too little vocabulary to place.

## On ingestion — the index refreshes itself

`bun run ingest … --promote` ends by re-indexing the library it wrote into
and printing, for the promoted document only, its near-duplicate section
pairs and any narrow dimension it carries. **Advisory**: an index is not part
of L1, so a failure prints "not refreshed — this is not a pass" and the
ingest still succeeds. Read the lines while the document is fresh: a narrow
dimension on a new document is almost always boilerplate, specimen text or a
mis-extracted page, and it is cheapest to mark now.

## Where the index lives, and what is committed

`cat-harness/test/results/lsi/<instance>/<graph>.lsi.json` — the fingerprint,
parameters, retained variance, per-dimension pole terms, each unit's three
nearest neighbours, and the findings. **Not the vectors**: a rebuild is about a
second per few hundred units, and a float dump is not reviewable.

**State graphs are indexed on demand, never committed.** The `beans` graph
changes on nearly every commit; a committed index would be stale on every PR
and a merge-conflict magnet. `lsi:epics` rebuilds it each run.

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
