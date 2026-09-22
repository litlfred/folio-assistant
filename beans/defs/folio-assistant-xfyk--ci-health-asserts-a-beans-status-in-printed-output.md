---
# folio-assistant-xfyk
title: ci-health asserts a bean's status in printed output and it went stale — yzsj reads 'is not done' while completed
status: completed
type: bug
priority: normal
created_at: 2026-09-22T09:31:57Z
updated_at: 2026-09-22T09:39:18Z
parent: folio-assistant-1xhc
---

_2026-09-22T09:45:00Z_ — Found by being misled by it, ~10 minutes before fixing it. `bun run check:ci-health` printed:

> Cancellations NOT listed here are several sessions racing for the publish ref (`yzsj`), **which is a different fix and is not done.**

`yzsj` has been `completed` since 2026-09-21. I read that sentence, opened the bean, and read 200 lines of finished work — including its own closing ruling — before checking `status:`. That is the cost, and the next agent pays it too.

## The class, which the same function already names

Eight lines above the defect, a comment records fixing a **mis-citation** in this exact output — `6pfo` → `yzsj` — and names what it was:

> *"An agent reading the report below was sent to a bean about metadata when the problem in front of it was a race — the `b963` shape, one level up: a reference inside printed output that resolves to the wrong thing."*

**The pointer was fixed. The claim attached to the pointer was left hardcoded, so it drifted instead.** A citation has two parts and only one of them was made maintainable.

That is `AGENTS.md`'s own rule about rules — *"a rule stated in two places is a rule free to drift"* — applied to a status rather than a rule, and it fails identically. A bean's status lives in the work plan; a copy of it in a renderer is a second place for one fact.

## Measured before generalising, and the generalisation does NOT hold

I expected a class and went looking: **34 distinct bean ids are cited in tool output strings** across `src/` and `scripts/`. Every one of them resolves — 32 in `beans/defs/`, 2 (`xom7`, `5rfy`) only in `defs/archive/`, which a reader that stops at `defs/` would call missing. The 35th apparent hit, `doco`, is the **DoCO vocabulary prefix**, not a bean; my four-character regex false-positived on it.

So **there are no dangling citations**, and a gate checking that ids resolve would find nothing today. It is not built, and this is why. Only ONE citation asserted a status, and it was the wrong one.

## The fix: read it, do not state it

`renderPages` is a **pure function of its report** — the file imports `yaml` and nothing else, and knows no repository root. Making it read the bean store would have broken that, so:

- `CitedBean` and `citationClause(id, bean)` in `ci-health.ts` — phrasing only, four branches, no I/O.
- `check-ci-health.ts` resolves the statuses, because that is where a root exists, and passes them on `PagesReport.citedBeans`.

Four states, and each is honest about something different: **settled** (`completed`/`scrapped`) says cancellations past a shipped fix are NEW ground rather than its residue, which is the actionable part; **open** keeps the original sentence for as long as it is true; **unreadable** and **nobody-looked** both say the work plan could not be read and assume nothing — the house rule, and the branch a fresh container actually takes; **absent** says the citation is stale, since beans are never deleted here.

`PAGES_CITES` is a written list rather than a derivation, because a renderer's citations are a property of its PROSE and nothing can derive them from a report object. Adding one to the output without adding it here renders `unknown` — the honest failure, never a confident wrong claim.

## Two defects in my own change, both caught by this repo rather than by me

1. **`process.cwd()`** for the store root. That is bean `a6kl` exactly, which `check-workflow-paths.ts` documents: a corpus resolved from the cwd *"found nothing, and reported `nothing to check` over 1,402 files."* Here it would have rendered every citation `unknown` whenever the script ran from a subdirectory — failing safe, and silently wrong. Now `repoRootFor(resolve(import.meta.dir, ".."))`.
2. **The clause did not wrap.** One 140-character line reads fine in a terminal and raggedly in the markdown the watchdog commits, which is the surface people read. `citationClause` returns LINES, and a test asserts none exceeds 90 characters.

And a third, caught by `check:bean-bodies`: **this bean was created with an empty body** and the gate refused the run — *"`todo` with front matter and nothing else — a sibling reading the store learns nothing about it"*, the `70c7` defect. Recorded because the gate working on its author is the evidence it is worth having.

## Mutation-tested

7 new tests (44 in the file), and a red case that holds by construction is `t6s7`:

| mutation | result |
|---|---|
| revert to the hardcoded *"is not done"* | **6 fail** |
| render `unreadable` as open | **3 fail** |
| drop `scrapped` from `SETTLED` | **1 fail** |

Restored: 44 pass.

## Summary of Changes

- `src/workflow/ci-health.ts`: `CitedBean`, `SETTLED`, `citationClause`, `PagesReport.citedBeans`; the stale comment corrected rather than deleted
- `scripts/check-ci-health.ts`: `PAGES_CITES`, `citedBeans()`, resolved from a real repo root
- `scripts/tests/pages-health.test.ts`: +7 tests covering all four branches and the wrap

## Not done

No gate over bean citations. 34 of 34 resolve, so the evidence does not support one, and building it would be work justified by its own plausibility rather than by a defect.
