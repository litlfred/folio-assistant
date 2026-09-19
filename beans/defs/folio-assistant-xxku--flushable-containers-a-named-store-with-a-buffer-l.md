---
# folio-assistant-xxku
title: 'Flushable containers: a named store with a buffer limit, an over-full badge, and three flush actions'
status: todo
type: feature
created_at: 2026-09-19T12:07:49Z
updated_at: 2026-09-19T12:15:59Z
---


**In one sentence:** generalise `fsh-guts`'s flush behaviour into a *flushable
container* — a named store with a declared buffer limit, an over-full badge and
three actions (flush all / trim to limit / select to prune) — and make staging
previews and the console log two more instances of it.
[View this bean](https://github.com/litlfred/folio-assistant/blob/main/beans/defs/folio-assistant-xxku--flushable-containers-a-named-store-with-a-buffer-l.md)

## Why

Three stores here accumulate **by design**, so none is fixable by writing less:
`fsh-guts` (the trashcan that is kept), the staging previews under
`STAGING/<slug>/` on the publish branch, and a run's console log. Each has
grown its own ad-hoc answer to "it is too big now". They want one contract, and
the contract is written: [`skills/folio-core/flushable-containers.md`](../../skills/folio-core/flushable-containers.md).

The skill exists because the three differ in exactly the places a shared
implementation would paper over:

- **What "flush" means.** `fsh-guts` is the only real, irreversible delete — it
  is the last stop. A pruned preview is recoverable by re-running Feature
  Staging; a log is truncated. Recoverability changes the confirmation bar, so
  a container must **declare** it rather than let the caller assume.
- **Which end is expendable.** Previews drop the oldest. A console log's oldest
  retained line is very often the *cause* — so a shared "drop oldest" is not
  merely suboptimal for logs, it is wrong in the direction that destroys the
  evidence you opened the log for.

## Measurement — 2026-09-19, `origin/gh-pages`

Before: **346.1 MB across 9 previews**, against `STAGING_WARN_BYTES = 100 * MB`
(`test/health/checks.ts`). Per-preview sizes ran 37.5–39.0 MB — near-identical,
which points at a payload duplicated into every preview rather than at content.

Liveness evaluated at the moment of the act, per `w2g5` /
[#407](https://github.com/litlfred/folio-assistant/issues/407):
`LIVENESS_SIGNALS = ["open-pr", "unmerged-branch", "recent-commit"]`,
`RECENT_COMMIT_MINUTES = 30`; an item is an orphan only when **no** signal
fires, and an unevaluable signal **spares** it.

| preview | MB | signal | verdict |
|---|---|---|---|
| `claude-fervent-mccarthy-nw4olk` | 39.0 | recent commit (15 min) | spared |
| `dependabot-...-3567caad51` | 38.9 | PR #391 open | spared |
| `claude-wonderful-bohr-6kxh7b` | 38.9 | PR #408 open | spared |
| `claude-brave-hypatia-r820sf` | 38.9 | PR #403 open | spared |
| `claude-w2g5-orphan-liveness` | 38.7 | recent commit (29 min) | spared |
| `claude-consolidate-test-dir` | 38.4 | **none** | prune |
| `claude-4kiw-memory-pointer` | 38.3 | **none** | prune |
| `claude-festive-galileo-s7ibx0` | 37.5 | PR #413 open | spared |
| `claude-ecstatic-goldberg-eroyaz` | 37.5 | recent commit (4 min) | spared |

`claude-w2g5-orphan-liveness` sat one minute inside the 30-minute window. It was
spared: **a signal that fires is a signal, not a rounding error.** Deciding it
"basically stale" would be reading the threshold as an estimate of staleness
rather than as the definition of it.

Prune commit built and verified: 1572 deletions, every path under exactly those
two prefixes, **no** additions or modifications.

## The finding — the limit is structurally unreachable

After the prune: **269.4 MB across 7 previews.** Still 2.7× the threshold.

The seven spared previews are a **266 MB floor** on their own, and *two*
previews already exceed 100 MB. So "trim to the limit" cannot be satisfied at
any count by pruning — not because the orphans were too few, but because one
preview is 38 % of the entire budget. **The lever is preview size, not preview
count.** This is the case the skill's §"A limit below the floor is not a limit,
it is a permanent alarm" describes, now observed rather than hypothesised.

Reaching 100 MB by pruning would mean destroying a live sibling session's only
reviewable artefact to satisfy a number that arithmetic says stays red anyway.
That is not caution overriding the instruction — it is the instruction being
unsatisfiable as stated.

## The 38 MB is the slug, not the content

The threshold is unreachable for a reason that is fixable, and it is not "the
docs are big".

**27.5 MB of a 37.5 MB preview is HTML, and not one HTML blob is shared with any
other preview** — measured as `git ls-tree` blob-hash intersection between
`claude-festive-galileo-s7ibx0` and `claude-wonderful-bohr-6kxh7b`: 0 of ~390
HTML objects in common, against 185 of ~780 objects overall (the shared ones are
images, fonts and vendor JS).

Diffing one page that neither branch touched, `crdm-methodology.html`, says why:
86 of 1881 lines differ, and **75 of the 86 carry the preview slug** —

    <link rel="stylesheet" href="/folio-assistant/STAGING/<slug>/assets/css/…">
    <link rel="canonical" href="https://…/STAGING/<slug>/crdm-methodology.html" />
    <meta property="og:url" content="https://…/STAGING/<slug>/…" />

Each preview is built with an absolute `baseurl` of
`/folio-assistant/STAGING/<slug>`, so the slug is baked into every asset href,
canonical URL and `og:url` on every page. Git deduplicates by content hash, so a
one-substring difference on 75 lines makes the page a wholly distinct object.
**Nine previews therefore store nine full copies of a site that is
byte-identical apart from its own address.**

### The owner's correction: relative URLs break identity resolution

My first proposal was "make the URLs relative", and the owner flagged that this
**breaks `$schema`, JSON Schema and JSON-LD resolution**. Measured, and the
objection is exactly right — the reference kinds are not one population:

| kind | per page / doc | relativize? |
|---|---|---|
| nav `href`, `<script src>`, stylesheets, icons, `<img>` | ~235 refs per page | **yes** |
| `canonical`, `og:url`, inline `ld+json` `url` | 3 per page | no — see below |
| `@id` (1244), `partOf` (857), `to`/`from` (443 each), `performedBy` (414), `schema` (104), `inputSchema`/`outputSchema` (22 each) | 5205 in `folio-assistant.jsonld` | **never** |

A presentational reference is *an address to fetch, from this directory*;
relative is strictly better and cannot change meaning. An **identity** reference
is a name. A relative JSON-LD `@id` resolves against the document's **retrieval**
URL, so the graph's node identities become a function of how you fetched the
file — served from Pages, opened from disk, or embedded in another document give
three different graphs. And `schema` / `inputSchema` / `outputSchema` are JSON
Schema references: a validator handed the document out of band has no base to
resolve them against. So the knowledge-graph exports stay **byte-for-byte as
they are**.

The three SEO claims are a separate case and go the other way: a preview
**should not be emitting them at all**. `canonical` tells a crawler which URL is
authoritative, and a branch build asserting a canonical STAGING URL invites the
preview to be indexed. Same for `og:url` and the `jekyll-seo-tag` inline
`WebPage.url`. Dropping them from preview builds is a correctness fix that
happens also to be the last thing standing between HTML and deduplication —
two slug-bearing lines are enough to make a blob distinct.

**Note what this does NOT touch.** `@context` prefixes are already absolute and
slug-free (`https://litlfred.github.io/folio-assistant/bootstrap/ns#`), so the
vocabulary namespace is stable across previews and was never at risk.

And a question I am deliberately not answering, because it is the owner's:
a preview currently mints its own `@id` for all 1244 nodes, so nine previews are
nine parallel identities for one graph. That may well be *correct* — a preview's
graph genuinely differs in content, and an unstable id for an unstable artefact
is honest. The clearly wrong alternative would be a preview claiming the
published `@id`s, since two documents would then assert different facts about
one node. Left alone.

### Revised arithmetic, with the graph exports left absolute

Per preview: 37.5 MB = 27.5 MB HTML + 10.0 MB other. Of the "other", the
slug-bearing part is `search-data.json` (2.3 MB) + `folio-assistant.json`
(1.33) + `.jsonld` (1.33) ≈ **4.96 MB that will never deduplicate**, and
legitimately so: search must index the branch's own pages, and the graph export
is the graph *of that branch*.

After relativizing presentation and dropping the three SEO claims:

    one HTML copy            ~27.5 MB
    9 x graph/search exports ~44.6 MB
    shared assets             ~5   MB
                             --------
                             ~77 MB + per-branch deltas

**Under the 100 MB threshold with nothing pruned — but not by much.** The graph
exports become the new binding constraint: at ~18 concurrent previews they alone
exceed the limit. That is a real floor, not a duplication artefact, so at that
point the honest move is a limit whose **basis** states it —
`one HTML copy + N x 5 MB exports + assets` — rather than a prune policy. Which
is the skill's own rule applied twice: the first "prune more" answer was hiding a
9x duplication, and the second would be hiding a genuine floor.

## Done when

- [x] `skills/folio-core/flushable-containers.md` written and registered in
      `package-manifest.json`; `kg:audit:check` clean.
- [x] Staging measured, liveness re-verified immediately before the act, the two
      genuine orphans identified with sizes and ages.
- [ ] The prune commit landed on `gh-pages` (built and verified locally; the
      push needs owner assent — it rewrites the publish branch).
- [x] **The 38 MB question answered** — the preview slug in every page's
      `baseurl`, canonical and `og:url` defeats git deduplication; 0 HTML blobs
      shared between two previews. See §"The 38 MB is the slug".
- [x] The owner's objection checked: relative URLs would break JSON Schema and
      JSON-LD resolution. Proposal narrowed to presentational references only;
      the graph exports stay byte-for-byte absolute. See §"The owner's
      correction".
- [ ] Presentational refs relativized and the three SEO claims dropped from
      preview builds (~77 MB projected, under the limit). Until then the badge
      is permanently red, which trains a reader to ignore it.
- [ ] A basis recorded for whatever limit is chosen, stating the floor
      explicitly: one HTML copy + N x ~5 MB graph/search exports + assets.
- [ ] Either the buffer limit is raised to something above the live floor, with
      its basis recorded, **or** preview size comes down. Both is fine; neither
      leaves a check that cannot pass.
- [ ] `fsh-guts` (PR #403) and the console log adopt the three actions and the
      badge. Not mine to implement — noting the dependency.

## Not doing

- Building the viewer chrome for the badge — that is `7vhe`.
- The staging prune mechanism itself — that is `w2g5` / #407.
- Pruning any preview with a live signal, at any threshold.
