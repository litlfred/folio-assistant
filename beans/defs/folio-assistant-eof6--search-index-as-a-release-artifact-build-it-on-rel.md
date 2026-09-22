---
# folio-assistant-eof6
title: 'SEARCH INDEX AS A RELEASE ARTIFACT: build it on release, never on staging refresh'
status: todo
type: task
priority: high
created_at: 2026-09-20T09:02:08Z
updated_at: 2026-09-20T09:02:08Z
parent: folio-assistant-kupb
---

Owner, 2026-09-20: 'as part of rendeing pipleine, can we tarball or so as binary archives the justthedocs search (and only aviaable on release, not refresh on staging?)'

YES — BUT NOT FOR THE REASON A TARBALL USUALLY WINS, and the distinction decides the design.

**Compression buys nothing on the wire.** GitHub Pages already serves text with `Content-Encoding: gzip`, so a plain `search-data.json` is ALREADY gzip-transferred. Wrapping one JSON in a `.tar.gz` and unpacking it in JavaScript trades a free, standard, cached transformation for a hand-rolled one. A binary archive earns its place only when it carries MANY shards as one artifact.

**Where it does pay is the SIZE BUDGET, and this repository is already over one of its own thresholds.** Measured by the daily health sweep, `test/health/results/repository.health-report.json`:

| | bytes | |
|---|---|---|
| staging previews, 7 of them | 304,159,961 | **~43.5 MB each** |
| warning threshold | 104,857,600 | the owner's own instruction, 2026-09-19: 'issue warning to user when exceeds > 100mb' |
| critical threshold | 786,432,000 | three-quarters of GitHub's documented 1 GB Pages limit |

So the previews are **2.9x the warning threshold** already, at 39% of critical, and every staging refresh rebuilds a full search index that nobody searches. Dropping it from staging is a real saving against a limit that is already being breached, not a hypothetical optimisation.

**And a RELEASE ASSET is not subject to the Pages budget at all.** That is the move that makes a large index possible: a 53 MB index (the measured floor for full IRIS at title+url only) cannot live inside a 1 GB site that must also hold the site, but it can live as a release asset the page fetches.

**STALE IS WORSE THAN ABSENT, and this is the rule to write down.** If staging carries no index, search is visibly unavailable there. If staging carries a REFRESHED-ON-RELEASE index, it returns hits for pages that have since changed — a wrong PASS, believed, which is the failure mode this repository names in `readme-sections`, in `repo-partition` and in `ci-health` alike. So staging must DISABLE search, never inherit an old index.

## Done when
- The index is built in the RELEASE path only, and published as a release asset rather than into the site tree.
- Staging builds skip it and the staging banner SAYS search is unavailable here — silence would read as 'no results'.
- Sharding is decided on measurement, not in advance: one file while it is small, shards only once a measured index exceeds a declared budget.
- The budget is declared with its BASIS, like every threshold in `test/health/`.

## OWNER'S RULING 2026-09-22 — this REVERSES the rule above

Asked which of four next steps to take, the owner answered:

> *"staging uses last published index (w/ wanrnig)"*

That overturns §"STALE IS WORSE THAN ABSENT" as written. Recorded here rather
than edited into that paragraph, because the paragraph's argument is still
worth reading and knowing it was **considered and overruled** is more useful
than finding it quietly gone.

**Why the ruling holds against the objection.** The bean's complaint was not
staleness as such — it was *"a wrong PASS, **believed**"*. Belief is the
load-bearing word. A warning attacks exactly that: a reviewer told the index
reflects the last PUBLISHED site, not this preview, can still use search to
find a page and knows not to read a hit as evidence about the branch. Absence
and a marked staleness are both honest; only unmarked staleness is not.

So the rule this bean should write down is narrower than the one it wrote:

> **Unmarked staleness is worse than absence. Marked staleness is not.**

## The size argument is much weaker than this bean assumed — measured elsewhere

PR #839 (bean `tebu`) measured a real preview rather than estimating, and the
search index is **not** where the bytes are:

| | pages | MiB | per page |
|---|---|---|---|
| `reference/` | 257 | **35.8** | 143 KiB |
| `api/` (TypeDoc) | 298 | 7.4 | 26 KiB |
| everything else | 121 | 11.2 | 95 KiB |

The bulk is just-the-docs inlining the whole navigation into every page —
`reference/` is 38% of pages and 66% of the HTML. #839 prunes it at the source
rather than from `_site`, because removing it after the build leaves the nav on
all 676 pages linking into a tree that is not there.

**So "dropping the index saves the budget" was never established here.** This
bean asserted it from the per-preview TOTAL (43.5 MB each) without ever
attributing any of it to the index. That is the same shape as `sj6m`'s
requirement-2 error the same day: a cost attributed to one component because
nothing had measured the others.

The ruling therefore rests on its own merits — search that works on staging,
honestly labelled — and not on a size saving this bean cannot show.

## Blocked, and on what

Not started. Two reasons, both external:

1. **`feature-staging.yml` is held by open PR #839**, which is actively
   rewriting the staging build for size. Editing it in parallel guarantees a
   conflict for one of us over a file whose whole subject is the same preview.
   This work should be built ON #839, after it merges.
2. **The index cannot be measured from a sandboxed session** —
   `preview-site.sh` finds no working Jekyll, and egress to
   `litlfred.github.io` is denied by proxy policy (403 on CONNECT). So the
   sharding Done-when below, which requires a MEASURED index size, cannot be
   satisfied from here by anyone. It needs CI or a local checkout.

## Done when — revised under the ruling

- [ ] Staging does not BUILD an index; it uses the last published one, and a
      visible warning says results reflect the published site rather than this
      preview. **Replaces** "staging must disable search".
- [ ] The warning is on the search surface itself, not only in the staging
      banner — a reviewer who searches has not necessarily read the banner.
- [ ] The index is built in the RELEASE path and published as a release asset
      rather than into the site tree (unchanged).
- [ ] Sharding decided on MEASUREMENT, not in advance — and the measurement
      needs an environment this session does not have.
- [ ] The budget is declared with its BASIS, like every threshold in
      `test/health/`.
- [ ] Built on top of #839 rather than beside it.

## CORRECTION 2026-09-22 ~11:20 — two errors in the section above

Both mine, both from reading a stale copy rather than the current one.

### 1. #839 was already merged when I called it a blocker

The §"Blocked, and on what" above says `feature-staging.yml` "is held by open
PR #839". **#839 merged at 09:07Z**, more than two hours before that was
written. I reasoned from a PR listing taken earlier in the session and never
re-checked its state — and the one call I did make against it, `get_files`,
returns data for a merged PR just as happily as for an open one, so nothing
contradicted me.

**So this work is NOT blocked on a sibling.** It was not blocked when the
blocker was recorded.

### 2. The measurement I quoted was superseded by its own PR

I cited #839's per-directory table and said it "prunes `reference/` at the
source". The table is real and committed — `feature-staging.yml` lines
218-225 — but the characterisation is imprecise in a way that matters:

**Pruning is CONDITIONAL.** A carry rule keeps `reference/` whenever the
branch touches its sources (`docs/reference/`, `schemas/`, `skills/`,
`methodologies/`, or the three generators). #839's own branch edited
`skills/`, so it carried `reference/` and dropped only `api/`. Its final body
records what that measured:

| | |
|---|---|
| baseline, 7 comparable previews | 92.47 MiB |
| this branch, `api/` dropped | 85.20 MiB |
| **measured saving** | **7.27 MiB = 7.9 %** |
| projected in its first body | 43.20 MiB = 48.9 % |

Wrong by a factor of six, **in the direction its author was warning about** —
and the "nav shrinks on every remaining page too" bonus did not materialise,
because `api/` is TypeDoc output carrying no just-the-docs nav.

### What survives

The conclusion does not change: **the search index is still not where the
bytes are**, and this bean's size argument for dropping it is still
unestablished. What changes is that the saving from pruning is per-branch and
much smaller than either this bean or #839's first draft assumed — so the
budget pressure the bean invoked is *worse* than described, not better, and
the ruling's justification remains correctness rather than size.

## Done when — still blocked, but on ONE thing, not two

- [ ] Staging uses the last published index, with a warning **on the search
      surface itself**. The warning is not a nicety: shipping the stale index
      WITHOUT it implements precisely the "unmarked staleness" this bean was
      right to refuse, so a partial delivery here is worse than none.
- [ ] The index is built in the RELEASE path and published as a release asset.
- [ ] Sharding decided on MEASUREMENT — **still unavailable from a sandboxed
      session**: `preview-site.sh` finds no working Jekyll and egress to
      `litlfred.github.io` is denied by proxy policy (403 on CONNECT). This is
      the one real blocker left, and it is environmental, not a sibling's.
- [ ] The budget is declared with its BASIS.
