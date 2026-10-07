---
# folio-assistant-2q1p
title: 'RETIRED PREVIEWS COME BACK: the full-replace restore carries _retired as a record but never consults it, so a retirement is undone by the next main-site publish'
status: todo
type: bug
priority: high
parent: folio-assistant-1xhc
created_at: 2026-10-02T12:00:53Z
updated_at: 2026-10-02T12:00:53Z
---

Found 2026-10-02 by testing ONE preview retirement before dispatching 57 —
which is the only reason it was found rather than paid for 57 times.

## The failure, measured on `gh-pages`

| commit | what it did |
|---|---|
| `a46c58ca9df` | `staging(cleanup): remove STAGING/claude-fervent-brahmagupta-rbwhzm` — **1615 files deleted** |
| `93ffa64488c` | `docs(gh-pages): site from a07c3c66…` — **all 1615 re-added** |

`git diff --name-status a46c58ca9df 93ffa64488c -- STAGING/claude-fervent-brahmagupta-rbwhzm/`
gives 1615 `A` lines. The dispatch reported **success**, and the retirement
record is on the branch saying:

```json
"retiredOn": "2026-10-02T09:17:23.071Z",
"retiredReason": "removed by dispatch from litlfred"
```

while the preview it describes is live. **The record asserted a removal that
had been undone**, which is worse than no record: its whole value is that a
reader believes it.

## Why

`docs-site.yml` full-replaces `gh-pages`, so `restore-staging.ts` carries the
previews into `_site` first — that is `plj1`'s fix and it is correct.
`CARRIED_PREFIXES` also carries `STAGING/_retired` **unconditionally**, with a
docstring explaining that a liveness-gated carry would drop exactly the records
of closed pull requests it exists to keep.

The two halves never met: the restore carried the records and restored the
previews **without consulting them**. So retirement survived as a record and
was undone as an artefact, on every deploy, for every retired slug.

The workflow's own comment anticipates the race window — *"a window in which a
`feature-staging` deploy could land a preview this push then removes"* — but
only in the direction of losing an ADDITION. The symmetric case, losing a
REMOVAL, resurrects the thing.

## Summary of Changes

- `previewsAt` excludes any slug with a `_retired/<slug>.json` record. The
  store IS the set — a record is `<slug>.json` — so no second list can fall out
  of step with it.
- `retiredSlugs` reads it, and keeps the third state: a **missing** store is a
  determined empty set, an **unreadable** one is a reason that makes the whole
  restore `unknown`. Collapsing those would restore every retired preview —
  the defect, reintroduced by the guard against it.
- `copyPrefix` became `copyPaths`, taking a LIST, because the previews can no
  longer be archived wholesale: `STAGING/` entire would copy a retired slug
  whatever the caller decided. Naming the paths keeps the decision in
  `previewsAt`, where it is tested, rather than writing directories out and
  deleting some again.
- `copyPaths` **refuses an empty list**. `git archive <rev>` with no pathspec is
  the whole tree, so a filter that removed every path would have published a
  copy of the branch over the built site.

### Verified by reproducing, not by going green

Six tests added to `restore-staging.test.ts`, on the existing harness (a real
bare remote, a real replay of the publish). With the filter reverted, **3 go
red** — the resurrection, the verifier, and the whole-tree guard. With it, 33
pass.

The fixture is deliberately the HARDER case: the retired directory is still
present alongside its record, which is what a race actually produces, rather
than a branch where the cleanup commit has already landed cleanly.

## Still open

- [ ] the 57 reclaimable previews are still there. This makes retirement
      STICK; it does not retire anything. That is the owner's call and comes
      after this lands.
- [ ] per-preview size (~250 MB) is `qj9a`'s subject and the only route under
      GitHub's 1 GB Pages limit. Retiring all 57 leaves ~9.5 GB for the live
      ones.

Related: `tcd6` (the cleanup job that could not run at all), `plj1` (the
full-replace deploy that deleted previews), `6pfo` (the retired-record store),
`qj9a` (staging size and what `critical` asserts).
