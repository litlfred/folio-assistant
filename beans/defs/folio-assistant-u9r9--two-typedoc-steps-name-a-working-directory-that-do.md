---
# folio-assistant-u9r9
title: TWO TypeDoc steps name a working-directory that does not exist, and both workflows are unjudged so nothing has said so
status: in-progress
type: bug
priority: normal
created_at: 2026-09-22T05:57:48Z
updated_at: 2026-09-22T07:19:07Z
parent: folio-assistant-1xhc
---

Found 2026-09-22 while re-deriving `j41m`'s own numbers adversarially, in the
spirit of `w4tq`. **Not fixed, because it cannot be confirmed from here** —
see §"Why this is a bean and not a push".

## What the files say

    .github/workflows/discoverability-docs.yml:206   working-directory: folio-assistant
    .github/workflows/publish.yml:566                working-directory: folio-assistant

Neither workflow's `actions/checkout` carries a `path:`, so the repository
lands at the workspace root and there is **no `folio-assistant/`
subdirectory** — `ls -d folio-assistant` fails in this checkout. GitHub
Actions fails a step whose `working-directory` does not exist, so on the
reading above both TypeDoc steps die before running.

This is the same class as the `scripts/` prefix that `AGENTS.md` records
outliving the split, and as `j41m`'s `cd content` — **a path that was true
before a rename and is nobody's to notice afterwards.**

## Why this is a bean and not a push

`bun run check:ci-health` places both workflows among the **32 that produced
no run in the window — "unjudged, not green."** So there is no failing run to
read, and the claim above rests on reading the file rather than on observing
the failure.

That is exactly the `ci-health` rule applied to myself: **could-not-determine
is never rendered as clean, and it is not rendered as broken either.** Editing
a publish workflow on a file-read suspicion is the speculative change this
repository forbids, and if the step really never runs then "fixing" it would
turn a dormant step into a live one — a behaviour change nobody asked for.

## What would settle it

Dispatch each workflow once and read the step. If it fails on the
`working-directory`, the fix is a one-line path correction; if it succeeds,
this bean is wrong and says so.

## While it stands, the two install lines inside those steps are baselined

`bun install || npm install` at `publish.yml:570` and
`discoverability-docs.yml:210` — unpinned, and the `|| npm install` half is a
RUNTIME fallback rather than a lockfile one, immediately after
`oven-sh/setup-bun@v2` has already installed bun. Both are in
`lockfile-pinning-baseline.json` rather than fixed, for the same reason: the
step they sit in may not run at all, and the baseline may only shrink, so if
this is resolved the entries go stale and the gate says so.

## Done when

- [ ] Each workflow is dispatched once and the step's real outcome recorded
- [ ] If it fails: the path is corrected and the two installs pinned in the
      same change, and their baseline entries removed
- [ ] If it succeeds: this bean is marked wrong, with what the checkout
      actually produces written down so the next reader does not re-derive it


_2026-09-22T07:20:00Z_ — CLAIMED on `claude/peaceful-heisenberg-dzgsf1` (PR #839). **The settlement this bean proposes does not work, and the reason is more interesting than the bean.**

## `publish.yml` cannot be settled by dispatching it

Its `schema-docs` job carries `needs: content-pipeline` (publish.yml:558). There is exactly **one run of `publish.yml` in this repository's whole history** — 2026-06-24, `workflow_dispatch`, run `28075159865`, conclusion `failure`. In it, `content-pipeline` failed at step 10, *"Check references.bib is in sync with references.ts"*, 23 s in — and **`TypeDoc — schema-docs/` is recorded `skipped`**, along with every other downstream job.

That preflight (publish.yml:209) reads `content/schema/references.ts`. **`content/` does not exist in this repository** — the platform carries no folio, which is the same by-design failure `AGENTS.md` already names for `qa-sweep` (preflights on `content/package.json`) and `witness-refresh`. So content-pipeline cannot pass here, so `schema-docs` cannot start here, so a dispatch yields another `skipped` rather than an outcome. Dispatching it a second time would produce the same non-answer at the cost of a publish attempt.

`discoverability-docs.yml` is the opposite case and its own comment explains why: its three jobs carry **no `needs:`** and run in parallel (the comment at :186 records `pdxk`'s objection to putting them in one concurrency group). So its `schema-docs` WOULD execute on a dispatch. It has **never run — `total_count: 0`, not once, ever.** Its `working-directory` claim is therefore still unobserved, and it is the only one of the two that a dispatch could settle.

## The prefix is dead in FOUR workflows, not two

`working-directory` values under `folio-assistant/`, across all workflows:

| workflow | value | count |
|---|---|---|
| `publish.yml` | `folio-assistant` | 1 |
| `discoverability-docs.yml` | `folio-assistant` | 1 |
| `snappea_wasm.yml` | `folio-assistant/snappea-wasm` | 4 |
| `hecke-engine-wasm.yml` | `folio-assistant/computations` | 2 |

Eight values, four workflows. This bean found two because it searched for the bare prefix.

**But they are two different failures wearing one prefix, and that is the distinction the fix turns on.** `computations/` and `snappea-wasm/` do not exist under *any* prefix here — they are folio content, and `AGENTS.md` already records `witness-refresh` needing `folio-assistant/computations/` as a by-design failure in the platform repo. Correcting their paths would be wrong: there is nothing to point them at. The two TypeDoc steps are different — they document the **platform's own** `schemas/`, which is right here at `cat-harness/schemas/`. Only those two are stale paths; the other six are absent content.

## The one-line fix holds — I checked rather than assuming

Both TypeDoc steps name entry points `schemas/ adapters/paper/schemas/`. At `cat-harness/`, `schemas/` exists and **`adapters/paper/schemas/` does not** (`cat-harness/adapters/` exists but has no `paper/schemas`). I expected that to make the fix bigger than one line, so I ran the exact invocation from `cat-harness/`:

    npx typedoc --entryPointStrategy expand --readme none --hideGenerator \
        schemas/ adapters/paper/schemas/
    → Found 0 errors and 215 warnings, html generated, EXIT 0

**TypeDoc tolerates the missing entry point.** So this bean's prediction — *"the fix is a one-line path correction"* — is right, and my read of it was wrong. Recorded because the next reader would otherwise re-derive the same wrong worry.

For reference, the TypeDoc step that demonstrably DOES run is `feature-staging.yml:501` (green on #839 minutes ago). It uses **no `working-directory`** and names eight explicit files under `cat-harness/schemas/`. That is the working shape, and it reached it by naming files from the repo root rather than by `cd`-ing.

## What is still open, and it is one question

Not "dispatch each workflow" — that is settled for `publish.yml` (impossible) and narrowed for `discoverability-docs.yml` (possible, never run). What remains is whether to dispatch `discoverability-docs.yml`, which **pushes to `gh-pages`** via `peaceiris/actions-gh-pages@v4` in all three of its jobs. That is an outward-facing publish from a workflow that has never once run, so it is the owner's call rather than mine, and it is being put to them rather than taken.
