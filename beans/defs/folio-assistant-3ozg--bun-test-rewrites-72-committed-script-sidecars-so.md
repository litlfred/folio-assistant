---
# folio-assistant-3ozg
title: bun test rewrites 72 committed script-sidecars, so bun run gates reports NOT clean on every branch, main included
status: in-progress
type: bug
priority: normal
created_at: 2026-09-27T05:06:01Z
updated_at: 2026-09-27T05:20:13Z
parent: folio-assistant-1xhc
---

Measured 2026-09-27 on pristine main `c6960465301`, and the same on 2026-09-26 at `8fb8a041a8e`.

## What happens

A full `bun test` rewrites all 72 files under `cat-harness/content/pipeline/script-sidecars/`, changing only three fields in each:

    last_run_at     wall-clock time of this run
    last_run_sha    the checked-out HEAD
    engine_version  the local bun (bun-1.3.11 here; the committed copies say bun-1.3.14)

Nothing else in the tree changes. The writer is `saveQaScriptSidecar` (`qa-utils.ts`), and its callers are `script-sweep.ts` and `qa-sweep.ts`.

## Why it matters

`bun run gates` has a tree-mutation detector, which is how bean `ymsu` was made visible. It therefore ends *'every gate passed, and the run is NOT clean — 1 gate(s) changed the tree'* with exit 1, on every branch, pristine main included. A signal that is always red is one people stop reading, and then it cannot report the next real in-run repair, which is the `ymsu` failure class this detector exists for. This is the same class as `ymsu` (in-progress, another session's), but a different writer, and `ymsu` does not mention these files.

## Not yet isolated

Run alone, none of these writes the sidecars: `qa-review`, `profile-conformance-axis`, `corpus-gate`, `check-command-paths`, `lean-ref-coverage`, `qa-checker-discovery`, `pipeline-resolution`, `qa-sweep-merge`, `qa-witness`, `qa-tools`, `usage-paths-self-reference`, `publish-block-qa`. The full suite always does. So it is either an untried file or an interaction between files.

## Done when

- [ ] the test (or interaction) that triggers the write is named
- [ ] it writes into a temp directory, as the profile-conformance tests do, or the three volatile fields stop being committed
- [ ] `bun run gates` on pristine main ends clean, not 'NOT clean'

_2026-09-27T05:19:35Z_ — Claimed by claude/sleepy-babbage-ls90iz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## `rmcf` is the same defect, filed a day earlier — and it holds four unanswered remedies

Cross-reference added by another session; **status untouched, this is not mine to
resolve.** `rmcf` (2026-09-26) records the identical churn: 72 files, the same three
fields, the same `bun-1.3.14` committed against `bun-1.3.11` local.

**This bean is the better record** — `rmcf` never named the writer, and it only saw
the churn on a branch, where this one measured pristine `main` at two commits. So
work this one.

What `rmcf` has that this does not is **four remedies put to the owner and still
unanswered**:

1. stop recording `engine_version` at all;
2. stamp only on a real change (the `script_hash` / `source_file` fields, which do
   **not** move — verified across all 72 on 2026-09-27);
3. move run provenance out of the committed sidecar entirely;
4. document the discard as intended behaviour.

Option 2 looked right to the session that filed `rmcf`, on the ground that the three
churning fields are provenance while the two stable ones are the measurement — so a
sidecar that stamped only on a real change would stop moving without losing anything
a reader uses.

One caution that belongs with the remedy, from `#1430`'s `sfjo` rule: **read what a
regeneration writes before committing it.** Committing this churn stamps a
*downgrade* — `engine_version` goes backwards whenever the local bun is older than
main's — as though it were a fresh measurement. That is why the standing practice has
been to discard rather than commit, and why option 4 is not merely a cop-out: it at
least makes the discard deliberate.
