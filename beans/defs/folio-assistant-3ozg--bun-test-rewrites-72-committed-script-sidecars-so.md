---
# folio-assistant-3ozg
title: bun test rewrites 72 committed script-sidecars, so bun run gates reports NOT clean on every branch, main included
status: in-progress
type: bug
priority: normal
created_at: 2026-09-27T05:06:01Z
updated_at: 2026-09-27T05:48:31Z
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


## A second way the discard fails, measured 2026-09-27 (branch `claude/brave-hypatia-r820sf`)

Status untouched — this is evidence for whoever works it, not a claim on it.

Remedy 4, *document that these 72 are always discarded locally*, relies on the
agent knowing. It also relies on the agent's **inspection** being able to see
them, and there is a common case where it cannot:

1. `bun run gates` was started in the BACKGROUND while other work continued.
2. `git status --porcelain` was checked — clean at that moment, because the run
   had not reached the writer yet.
3. The run reached `saveQaScriptSidecar` and rewrote all 72.
4. `git add -A` swept them into a commit about something else entirely.

The commit was caught and amended before any push, so nothing landed. What makes
it worth recording is **how** it was nearly missed: the command used to inspect
the tree was

    git status --porcelain | grep -v 'script-sidecars'

— the filter that makes the churn tolerable day to day is the same filter that
hides it at the moment it matters. An agent following remedy 4 writes exactly
that pipeline, and it reports clean while 72 files are staged.

**This strengthens 2 and 3 over 4 rather than adding a fifth option.** Remedy 4
is the only one whose correctness depends on the timing of an unrelated
background process; 2 (stamp only on a real change) and 3 (move provenance out of
the committed file) both make the window not exist. It is also a reason to prefer
either over "just remember", independent of the `engine_version` downgrade
argument already recorded here.

One caveat on the count: this branch measures **86** sidecars committed, of which
**72** carry `bun-1.3.14` and **14** carry `bun-1.3.11`. So the corpus is already
MIXED — the churn has been committed at least once before, partially — and "main's
sidecars are stamped bun-1.3.14" is true of 72 of 86 rather than of all of them.
Whichever remedy is chosen, the 14 are a pre-existing divergence it has to
account for, not collateral of the fix.
