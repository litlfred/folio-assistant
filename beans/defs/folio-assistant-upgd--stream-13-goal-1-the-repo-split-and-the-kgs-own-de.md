---
# folio-assistant-upgd
title: 'STREAM 1/3: GOAL 1 — the repo split and the KG''s own declaration (vuip + zzmr, 47 open beans)'
status: in-progress
type: task
priority: high
created_at: 2026-09-22T18:08:55Z
updated_at: 2026-09-22T18:19:35Z
parent: folio-assistant-vuip
---

## What this is

A **consolidation claim**, not new subject matter. The work plan stalled: between
11:00Z and 15:19Z on 2026-09-22 seventeen PRs merged, and **nothing merged in the
2h40m after**. CI is not the cause — `check:ci-health` reports all eight
workflows that ran in the window green, 48 Pages deploys succeeded and 0 failed.
What stalled is that PRs went **conflicted** against a `main` moving ~128 commits
a day, and 95 beans sat `in-progress` with no session behind any of them.

The owner chose, 2026-09-22, to consolidate into **three streams aligned strictly
to the GOAL milestones**, accepting the stated trade-off: PR unblocking folds
into whichever stream trips over it, and no stream owns the stale-`in-progress`
cleanup as such.

This bean is stream 1 of 3. It owns **GOAL 1 (`vuip`) plus the KG epic (`zzmr`)**
— 47 open beans — because the split and the graph's own declaration are one
surface: `rnfl` renames `content/` → `folio/`, `hs08` says that rename has
reached the declaration and nothing that reads it, and `x4a6` is blocked on
core's folio registration. Those are the same edit seen from three sides.

## What this stream owns

**Beans** — `vuip` (21 open) and `zzmr` (26 open).

Critical path as `vuip` states it: `wggr` (invert the stub pattern) → `zlmp`
(drain wrong-direction import edges) → `rnfl` (the 2,408-occurrence rename),
with `x3bd`, `hfkl` and `x4a6` on the declaration layer.

**Pull requests on this surface** — every one measured 2026-09-22T15:2xZ:

| PR | state | note |
|---|---|---|
| #954 | **clean** | closes bean `itka`; 1 file; mergeable now |
| #938 | **dirty** | `feature` is a tier — **#953 merged that same work at 15:18Z**; verify superseded, then close |
| #951 | **dirty** | `check:bean-blocks`; 17 files |
| #944 | unknown | `tebu` — orphan sweep measured at 0 MiB; 266 files |
| #731 | unknown | spec-kit methodology; ~550 commits behind; author is not this session |
| #750 / #737 / #231 | stale 1–4 days | Windows / cross-platform; relates to `4dbr` forge portability |
| #907–#915 | untouched since 09:56Z | 10 dependabot PRs — three are the SAME `zod` 3→4 bump in three directories, so they collapse to one decision; `typescript` 5/6→7 is a separate and larger one |

## First three moves

1. **Re-verify the critical path before acting on it.** Bean `k59d` records that
   milestone critical paths go stale — `p5wm` and `yg29` both advertise blockers
   that are already complete. Check `vuip`'s and `zzmr`'s against the store
   first; an agent that trusts a stale path spends its session on a closed box.
2. **#954, then #938.** #954 is one file and clean. #938 is four files and its
   content appears to have landed as #953 — establish that by reading both
   diffs, not by matching titles, then close it with the evidence.
3. **The dependabot batch as one decision, not ten.** State what breaks under
   `zod` 4 and `typescript` 7 before merging either.

## Not this stream

The rendered surface (`p5wm`, stream 2) and who-iris (`yg29`, stream 3). Ingest
(`slw1`), deployment (`5a3l`), translation (`bzyu`), content model (`0lmb`),
memory (`8jt6`) and docs (`2upx`) — 49 beans — are parked by the owner's choice
of a three-stream split, not overlooked.

## Done when

- [ ] `vuip` and `zzmr` critical paths re-verified against the store, stale
      blockers withdrawn with their reasons
- [ ] #954 merged; #938 resolved (merged or closed on evidence)
- [ ] #951, #944 conflict-free and green, or a stated reason they are not
- [ ] The 10 dependabot PRs triaged with a recorded decision per major bump
- [ ] #731, #750, #737, #231 each either advanced or given an owner question


---

## Step 1 done — critical paths re-verified on `main` at `b7f8945b`, 2026-09-22

Every number below was produced by running the repo's own gates in this
checkout, not by reading a bean. `bun run gates`: **123 of 123, exit 0**,
10,270 tests across 398 files.

### The path this claim states is wrong in its ordering

This bean states **`wggr` → `zlmp` → `rnfl`**. `vuip` states *"wggr, then
b5f0 / zkgs, then zmdo"*. The two disagree, and **`zlmp`'s own §Status
disagrees with both**: *"`wggr` / `b5f0` / `zmdo` are not waiting on it."*
`check:partition` re-run here confirms why — 920 modules, 2045 edges,
**0 wrong-direction, 0 unassigned**. `zlmp` stays `in-progress` for descendant
work (`rfev`, the A/B/C registration question, settled as *C now, B as the
destination*) and is gating nothing. Position in the path withdrawn; status
untouched.

`zkgs`, which `vuip` puts on the path, is parented to **`1swy`** — the QA root,
which is in no stream. A milestone's critical path naming a bean outside every
stream is worth stating plainly.

### Stale blockers withdrawn, with reasons

| bean | what it advertised | measured |
|---|---|---|
| `x4a6` | title: *blocked on core's folio registration reaching every declaration reader* | its own body records **31 of 31 readers reach it** (via `bun build`). Its one open box names `q2wn` — **completed 2026-09-22T10:28:50Z**, and `partition/engine.ts` now documents the bare side-effect form naming `folio-graph-kind` at lines 172/189. Blocker withdrawn; title corrected; what remains is a **decision**, below. |
| `hs08` | 86 non-test sites, 25 test files, 8 workflows, `init-folio` scaffolds `content/` | **4** renameable sites (6 matches, 2 of which this bean itself says must NOT move), **11** test sites, **6** workflow files — and `init-folio` **already scaffolds `folio/`**, so that box is done. |

### One finding neither bean had

The four renameable sites all build **`cat-harness/content/docs/`**, which holds
**14 documentation subgraphs** the docs-site generators read today — and which
**`cat-harness.json` does not declare at all**, while the declared `folio/`
holds three JSON files. `hs08` records the absence of a `content` entry as the
rename having *landed*. It is the opposite: the declaration was emptied before
the directory was moved, so 14 live subgraphs are invisible to any consumer
that scans the declaration. `dh4f` pointed the other way — present-but-undeclared
rather than declared-but-absent.

### The PR table in this claim is already stale in two places

Re-measured against the live API, ~18:2xZ:

- **#731 is `clean`**, not `unknown`. The *"~550 commits behind"* note no longer
  describes it.
- There are **four** `zod` 3→4 PRs, not three: **#909** (root), #911, #912,
  #913. #956 says three as well. The collapse is one decision over four PRs.

### #938 is NOT superseded by #953 — the instruction's premise is false, and it is reproducible

This claim says to *"verify superseded by reading both diffs, not by matching
titles, then close with the evidence."* Read, and the evidence says **do not
close it**. Both implement the owner's `feature`-is-a-tier ruling; they close
the hole that widening `PARENT_TYPES` opens **differently**, and #953's closure
is narrower in two ways that are live on `main` right now.

**1. `feature` under `feature` passes.** #953 guards epics only
(`b.type === "epic" && p.type !== "milestone"`). #938 adds a `RANK` table and
checks **direction** for every ranked pair. Probed against merged `main` with a
five-bean fixture (`m1` ← `e1` ← `f1` ← `f2`, plus `t1`):

    problems: []
    flagged f2 (feature-under-feature)? false

**2. The summary asserts a universal the next line refutes.** `check:bean-parents`
on this repo, verbatim:

    ✓ every open bean hangs from a milestone, epic or feature, and every epic from a milestone
    · outstanding (baselined): folio-assistant-d308 …: an epic's parent is a `milestone` (a goal) — `folio-assistant-zzmr` has type `epic`

That is the defect #938 names — *"a reader who stops at the tick is entitled to
believe it"* — and #938's fix (say **"no NEW epic"** whenever the baseline is
non-empty) did not land with #953.

A third, smaller one: main's `parent-type` message still reads *"not an epic or
a milestone"* after `feature` became a legal parent.

So #938 reduces to a delta over #953 rather than closing: the `RANK` direction
check, the baseline-aware summary, the message fix, and its test.

### Carried to the owner as decisions, not taken here

1. `x4a6`'s reachability gate — *not red on arrival*, 31 of 31 pass today.
2. `hs08`'s `cat-harness/content/docs/` → where, and declared as what.
3. The four `zod` PRs and the two `typescript` PRs.
