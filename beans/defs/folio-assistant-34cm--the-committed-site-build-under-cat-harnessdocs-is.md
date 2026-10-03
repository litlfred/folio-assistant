---
# folio-assistant-34cm
title: The committed site build under cat-harness/docs/ is 44% of all merge conflicts, and the publish workflow rebuilds it anyway
status: todo
type: bug
created_at: 2026-10-03T08:34:21Z
updated_at: 2026-10-03T08:34:21Z
parent: folio-assistant-hfag
---


Owner, 2026-10-03: *"I want you to examine each of the conflicted PR as they
come in to figure out how we can reduce the conflicts/ignore them."* This is
that measurement, taken over the whole open queue at once rather than per PR,
because the answer is a distribution and not a property of any one PR.

## The measurement

Every conflicted path of every open non-draft PR, against `main` `d089aca9616`,
classified with **main's own** `merge-conflict-patterns.ts` (see
`merge-conflict-patterns` rule 3 — classifying from a stale tree over-reports):

| | |
|---|---|
| distinct conflicted paths | 404 |
| path-instances (a path × the PRs conflicting on it) | **704** |
| generated | 591 |
| generated-regions | 57 |
| **authored** | **56 — 8 %** |

Where those 704 live:

| area | instances | share | distinct paths |
|---|---|---|---|
| `cat-harness/docs/` — the committed site build | **308** | **44 %** | 110 |
| `cat-harness/test/results/` — Arc 3fva's target | 239 | 34 % | 186 |
| everything else | 130 | 18 % | 96 |
| `beans/` — `fs43`'s target | 13 | 2 % | 2 |
| `cat-harness/uml/` | 9 | 1 % | 6 |

Worst single paths, by how many PRs collide on them: the LSI trio
(`docs/lsi/index.md`, `test/results/lsi/cat-harness/skills.lsi.json`,
`test/results/tool-runs/lsi-index/cat-harness/skills.tool-run.json`) at **14
PRs each**, then `beans/README.md` at 11, `docs/glossary/index.md` at 10.

## Two remedies are already closed, and the corpus says so

Not re-derived here — `.gitattributes` carries both, and its own write-up
corrects an earlier stronger claim:

1. **`-diff -merge` does not reduce the conflict COUNT.** Measured in a scratch
   repository: both sides changing the file still exits 1 with the path
   unresolved. It buys one clean whole-file conflict instead of markers inside
   a blob, plus a collapsed review diff. Bean `eqxp` claimed an entry would cut
   a real merge from five conflicts to two; that is false and corrected there.
2. **An auto-resolving merge driver needs `git config merge.*.driver`**, which
   is per-checkout — it would work in one clone and nowhere else, CI included.
   Deliberately rejected.

`.gitattributes`'s closing line is the finding this bean quantifies:

> *"Removing these conflicts, rather than tidying them, needs the files off
> `main` altogether."*

## The part that is new: the declared arc targets the SECOND-largest share

`fs43` takes `beans/` off `main` — **2 %**. Arc 3fva (#1764, #1801) takes
`cat-harness/test/results/` off `main` — **34 %**. The largest single source,
the committed site build at **44 %**, has no arc at all.

**And it is the most defensible of the three to remove, because the publish
workflow already rebuilds it.** `.github/workflows/docs-site.yml` runs
`gen-schema-docs`, `gen-skill-docs`, `gen-docs-pages`, `schema:viz`,
`library:viz`, `uploads:viz`, `voices:viz`, `handler:index`,
`translation:index` and `glossary-export` before composing and publishing. So
the committed copies under `cat-harness/docs/` are **not what a reader
fetches**. They exist so a `:check` can detect that somebody did not run a
generator — and the publish step fixes that case regardless.

So 44 % of the merge cost of this repository is paid to keep a drift signal
whose only failure mode the deploy already repairs.

## What this does NOT argue

- **Not that the `:check`s are worthless.** `audit:coverage`'s argument holds:
  a printed verdict cannot tell "never measured" from "measured clean". But
  that argument is about *verdicts* — QA sidecars, witnesses, health reports —
  not about a RENDERING of a source that is itself committed. `docs/glossary/`
  is derivable from the schema files beside it; a sidecar's attestation is not
  derivable from anything.
- **Not a glob over `docs/`.** `.gitattributes` names the test that matters:
  *"does its producer carry anything forward from the existing file"*. Some of
  `docs/` is authored (`docs/guides/`, `docs/proposals/`). The conflicts are
  concentrated in the generated subtrees — `docs-auto/**`, `glossary/**`,
  `lsi/**`, `qa/**`, the per-locale glossaries.
- **Not that `fs43` or Arc 3fva are misprioritised as work.** Both have reasons
  beyond conflict count (clone cost, `gh-pages` weight, evidence provenance).
  The claim is narrower: if the GOAL is fewer conflicts, the ranking is
  docs 44 % > results 34 % > beans 2 %, and only the first is unaddressed.

## Done when

- [ ] A decision on the generated subtrees of `cat-harness/docs/`: off `main`
      (a `cat/<harness>/docs` special branch, or built-only), or kept with the
      44 % accepted and written down as accepted
- [ ] The decision distinguishes RENDERINGS (derivable from committed sources)
      from VERDICTS (carry something forward) — per `.gitattributes`'s own test
- [ ] If they come off `main`, the `:check`s that read them still answer, or
      are retired with their reason
- [ ] This distribution is re-measured afterwards, so the claim is verified
      rather than assumed

## Not decided here

Whether the LSI trio is worth separate treatment. It is the worst single
collision in the store — 14 PRs each on three files, 42 instances, 6 % of
everything — and two of the three are under `test/results/` while one is under
`docs/`, so it straddles the two arcs. It may deserve its own answer before
either arc lands.
