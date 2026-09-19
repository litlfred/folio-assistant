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

The arithmetic, which is what makes this the lever rather than a tidy-up:
9 × 27.5 MB ≈ 247 MB of HTML today; with relative URLs it would collapse to one
copy plus each branch's genuine deltas — roughly 27.5 MB + 10 MB of shared
assets + deltas, i.e. **STAGING comes in under the 100 MB threshold with nothing
pruned and nobody's preview destroyed.**

So the earlier finding stands but its conclusion moves: the limit is unreachable
*by pruning*, and reachable *by fixing the build*. Prune-to-limit was never the
right instrument here — it was being asked to compensate for a 9× duplication
one layer down. Candidate fixes, in the order I would try them:

1. **Relative URLs** — just-the-docs supports `relative_url`; a `<base href>` or
   root-relative-to-`.` emission removes the slug from asset hrefs entirely.
   Biggest win, and it makes a preview directory portable, which is worth having
   on its own.
2. **Drop `canonical` and `og:url` from previews.** A preview should arguably not
   claim a canonical URL at all — it is not the published page, and emitting one
   invites a crawler to index a branch build.
3. **Skip `reference/` and `api/` in previews** (16.6 + 6.8 MB) unless the branch
   touched a schema or a public signature. Independent of the above and a large
   win, but it changes what a reviewer can see, so it is the one to decide rather
   than assume.

Not mine to implement — the staging build is `w2g5` / #407 territory — but the
measurement is here so nobody re-derives it, and #2 is a correctness point as
much as a size one.

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
- [ ] One of the three fixes above landed, so the threshold is reachable without
      pruning live work. Until then the badge is permanently red, which trains a
      reader to ignore it.
- [ ] Either the buffer limit is raised to something above the live floor, with
      its basis recorded, **or** preview size comes down. Both is fine; neither
      leaves a check that cannot pass.
- [ ] `fsh-guts` (PR #403) and the console log adopt the three actions and the
      badge. Not mine to implement — noting the dependency.

## Not doing

- Building the viewer chrome for the badge — that is `7vhe`.
- The staging prune mechanism itself — that is `w2g5` / #407.
- Pruning any preview with a live signal, at any threshold.
