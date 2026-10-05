---
# folio-assistant-w0cr
title: 'STREAM 3/3: GOAL 3 — who-iris through a themed harness, and PR #881 (yg29, 15 open beans)'
status: completed
type: task
priority: high
created_at: 2026-09-22T18:09:11Z
updated_at: 2026-09-23T19:45:00Z
parent: folio-assistant-yg29
---

## What this is

Stream 3 of 3 in the 2026-09-22 consolidation (see the sibling claims under
`vuip` and `p5wm`). It owns **GOAL 3 (`yg29`) — 15 open beans**: showing who-iris
with its existing materialised assets, through a themed harness.

Smallest of the three streams by bean count, and the one carrying the largest
single pull request in the repository.

## What this stream owns

**Beans** — `yg29` (15 open), including the `kupb` IRIS-catalogue epic.

**`yg29`'s stated shortest path is STALE, and this claim carries the
re-measurement rather than reproducing it.** Measured 2026-09-22T18:15Z.

`yg29` states four steps. **Step 1 is entirely finished.** It says to close the
three beans that are *"built but still read open"* — `z7ev`, `lzbw`, `huiu` —
and all three are **`completed`** in the store: somebody closed them and the
milestone was never updated. `jbx2`, half of step 3, is **`completed`** too.

What actually remains:

| bean | status | |
|---|---|---|
| `j66n` | in-progress | the two themes — `iris-web`'s source is already on disk in the IRIS capture; `who-wpro-publication`'s is the style guide's own rules |
| `809i` | todo | catalogue by reference; the rendering distinguishes the three states visually |
| `kupb` | in-progress | the IRIS-catalogue epic; closes last |

**What step 1 was FOR still needs doing, even though its beans are closed.** Its
stated purpose was verifying `check:voices` is green across the who-style-guide
-> who-iris boundary, which is `kupb`'s own falsifier. Closing three beans did
not run that check. Run it.

Do not repair `yg29` itself — `check:stale-paths` lists it as **outstanding**,
and an outstanding entry is repaired by the bean's OWNER. Put the correction to
the owner.

**Pull request on this surface:**

| PR | state | note |
|---|---|---|
| #881 | **dirty** | smart-base: WHO digital-health corpus. **2,859 files, +131,099 / −236, 19 commits.** Was green at 115/115 gates before `main` moved under it. |

#881 is the stream's first and largest problem. Its own body records two findings
it deliberately did **not** act on, which stay open rather than being quietly
closed by a rebase:

- **`m4xy`** — WHO's conceptual figures are **vector** and invisible to the
  raster extraction arm. `9789240120747-eng` declares six figures and eighteen
  tables and extracts **zero** images, reporting a *determined empty*. An entry
  can be L1-complete, gate-green, and missing every figure it declares.
- **`cpmo`** — the four ConceptMaps are indexed `referenced`, not materialized.

## First three moves

1. **Run `check:voices` across the who-style-guide → who-iris boundary.** This
   is what `yg29`'s step 1 was *for*; its three beans are already closed, but
   closing them did not run the check, and it is `kupb`'s own falsifier. The
   path above is re-measured, so start here rather than re-deriving it.
2. **Resolve #881's conflict by merging `main` in, never by rebasing.** Its
   history records that every prior conflict was in a **generated** file and none
   was resolved by hand — `main`'s copy taken, then the repo's own generators
   re-run. Do the same; 2,859 files is not a diff to hand-merge.
3. **`j66n`'s two themes**, whose sources are both already on disk.

## Blocked on the owner — do not guess these

`hqku` (*"is `library/` active content a sweep should judge, or derived material
it should skip?"* — it bears directly on the rendering), and the disposition of
`xffc` and `d3yq`, whose premise the owner withdrew with *"no formal role/theme
mapping per se. that is authoring (human/agentic) decision/judgement."*

Also unresolved from #881 and not this stream's to decide: `Home _
folio-assistant.pdf` came in the same upload and is a print of this project's own
home page — **not ingested, pending the owner's word**; and `qou/uploads/` still
holds the originals (`fgkb`), where `deletion-requires-confirmation` governs.

## Not this stream

GOAL 1 / the KG (stream 1) and the rendered surface (stream 2). **This goal
depends on stream 2**: who-iris is shown through a navbar section at
`<baseurl>/who-iris/...`, so `o7eq`'s URL rule and the navbar are this stream's
delivery mechanism, not separate work. Coordinate; do not re-decide `o7eq` here.

## Done when

- [x] `yg29`'s shortest path re-verified (2026-09-22T18:15Z: step 1 entirely
      complete — `z7ev`, `lzbw`, `huiu` all closed — and `jbx2` too)
- [x] The correction put to the owner — `yg29` repaired **by its owner**, which
      is precisely what `k59d`'s remaining Done-when asked for. Merged in #961
- [x] `check:voices` green across the who-style-guide → who-iris boundary —
      exit 0, 6 voices / 58 rules, re-run in a fresh container
- [x] #881 conflict-free and green — `dirty` → **merged**, with `m4xy` and
      `cpmo` both still `todo`: untouched, not absorbed
- [x] `j66n`'s two themes landed (#477), and `j66n` itself is now **closed** —
      all four clauses, verified by running the tests rather than reading them
- [x] `hqku`, `xffc`, `d3yq` and the `Home _ folio-assistant.pdf` disposition
      put to the owner — `hqku` needed no question (the block was VOID, and
      saying so IS the answer); `xffc`/`d3yq` asked and **scrapped with reasons**;
      the PDF asked and answered, `litlfred/qou#7451` open for the owner's merge

## Summary of Changes — stream 3/3 closed 2026-09-23

**GOAL 3's three Done-when clauses are met**, measured by running the thing:
`check:voices` exit 0; `check:catalogue` exit 0 (13 nodes — 0 unknown, 10
referenced, 3 materialized, against 1,057,223 files upstream); `iris:pages:check`
11 pages, no orphans; and the site BUILT then mounted — `who-iris/library/` →
`/who-iris/`, rendering on `--iris-*` rather than just-the-docs chrome.

### Shipped

| | |
|---|---|
| **#881** | `dirty` → **merged**. Two conflicts; one was a real defect — a dangling `--source` this branch had propagated into a second script, the exact bug main's #920 had just fixed. Neither side of that conflict was correct alone |
| **#961** | **merged**. `yg29` repaired by its owner; `809i` closed on evidence |
| **#1114** | scraps, both skill bindings, `j66n` closed, `9fdi` settled, `hpax`'s block recorded |
| **qou#7451** | open for the owner. Removes `Home _ folio-assistant.pdf` only |

`kupb` went from **twelve** open children to **three** (`hfwl`, `hpax`, `v048`).
`fgkb`'s measurement Done-when closed with all seven sha256 comparisons re-run in
one pass rather than five quoted and two added — **7 of 7 byte-identical**.

### The defect this stream kept finding

**"Built but still reads open", four times, at four levels.** `yg29` advertised
it for `z7ev`/`lzbw`/`huiu`; those were already closed. `809i` had it. `j66n` had
it — and contained its own refutation, line 35 against line 164 in one file.
`hqku` was carried as a live blocker for two days after it completed.

`k59d` is why this stream looked: *"an agent that trusts a stale path spends its
session on a closed box."* Both halves of its last Done-when are now satisfied —
stream 3 repaired `yg29`, stream 2 repaired `p5wm` — and
`stale-paths-baseline.json` reached **`[]` by every entry being repaired**, not
suppressed.

### Four owner rulings, and one I declined to apply

Re-parent five out of `kupb`; human/agentic judgement at the theme gateway; keep
the seven `qou` PDFs but remove the eighth; scrap `xffc`/`d3yq`.

The fifth — re-lane `Task_Review` — was **not applied**, because two facts were
not in front of the owner when they chose it and both were mine: no role carried
`theme-ui-review` at all, and the diagram already recorded the opposite decision
with a reason. Applying it would have laundered my own incomplete framing through
their answer. The owner then settled it a different way — *"theme review to
ingestion of graphical assets"* — which dissolved the contradiction rather than
picking a side, and closed all six `role-carries-activity-skill` findings.

### What this stream got wrong, kept rather than tidied

- **Duplicated `j66n`'s gateway.** Another session wired it independently while
  this one had the same work committed. Mine was discarded unpushed. One bean,
  two implementations, one thrown away.
- **Reported the who-iris pages unreachable.** `preview:site` omits the
  `mount-instance-docs.ts` step CI runs after Jekyll. Recorded in `yg29`.
- **Nearly claimed CI was not firing**, from `actions/runs?head_sha=`, which
  returns 0 for every sha on this branch including one with 7 passing checks.
  The real cause was `mergeable_state: dirty` — a `pull_request` run needs a
  merge ref, and a conflicted PR has none. Absent checks were the symptom of the
  conflict.
- **Pushed without `gates --all`.** The fast set is 135 gates; `--all` is 139.
  That gap let an e2e failure reach CI unseen, and `uml:overview:check` later
  caught a staleness caused by this session's own roles change (`RoleGraphSchema`
  256 → 258).

### Left open on purpose

`yg29` stays `in-progress`: its last clause is *"`kupb` closes"*, and `kupb` has
three children. `fgkb` stays `todo` — its remainder is the owner's merge of
qou#7451, which no agent does. `m4xy` and `cpmo` stay open. `9fdi` records that
`theme-ui-review.bpmn` was NOT moved into ingestion, as a question rather than an
omission.

*Stream 3/3 of the #956 consolidation — session_013vZiHGPug7PuHoMxRS82vw.*
