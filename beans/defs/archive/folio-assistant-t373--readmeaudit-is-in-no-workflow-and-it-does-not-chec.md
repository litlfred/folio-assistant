---
# folio-assistant-t373
title: readme:audit is in no workflow, and it does not check HTML img src — main carried 8 dead README paths
status: completed
type: bug
priority: high
created_at: 2026-09-19T10:16:09Z
updated_at: 2026-09-19T11:40:54Z
parent: folio-assistant-1xhc
---

Found 2026-09-19 after the site root moved to `docs/<stub>/` (bean `x4a6`).

## What was broken on `main`

Eight paths in `README.md` pointed at `docs/…` locations that moved:

- `docs/guides/agent-onboarding.md` — the link the README uses to send a new
  agent to the onboarding guide, which is its single most load-bearing link
- **seven** workflow SVGs under `docs/assets/img/workflows/`

Verified dead at the old path and present at the new one, all eight.

## Two separate defects, and the second is the one worth keeping

**1. `readme:audit` is in no workflow.** Measured:

    grep -rn "readme:audit\|readme-links" .github/workflows/*.yml   # no matches

`AGENTS.md` describes it as the audited half of the README contract —
"between the two tools no link in a folio README is unaccounted for" — and
nothing runs it. So `main` went red on it and stayed red invisibly. This is
`xom7` (a workflow failing 30 times unseen) and `cnlf` (a workflow that
never runs) in a third form: a check that exists, works, and is wired to
nothing.

Reproduced on a clean worktree of `origin/main`, so it was the base's and
not a branch's.

**2. The audit does not check HTML `<img src>`.** Three of the seven dead
SVGs are `<img src="…">` rather than Markdown image syntax — the three big
BPMN diagrams at the top of the README. `readme:audit` reported **five**
dead links; the true count was **eight**. A reader of the README front page
saw three broken images and the tool that exists to prevent exactly that
was silent about them.

That is worse than the unwired gate, because it would survive wiring it up.

## Done when

- [ ] `readme:audit` runs in CI, or there is a recorded reason it should not
- [ ] it checks HTML `<img src>` and `<a href>`, not only Markdown links —
      or the limit is documented where a reader will meet it, since a link
      checker silent about a whole syntax is worse than none
- [ ] the count it prints distinguishes "checked" from "present but not
      checkable", the third state this repo applies everywhere else

## Already done

The eight paths are repointed, on the branch that found them. That is the
symptom; the two boxes above are the defect.

_2026-09-19T11:35:38Z_ — Claimed by claude/fervent-mccarthy-nw4olk — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Done 2026-09-19

Both boxes, measured before and after.

### Measured on `main` before touching anything

| claim | verified |
|---|---|
| `readme:audit` is in no workflow | `grep -rn "readme:audit\|readme-links\|readme_audit" .github/workflows/*.yml` → **no matches** |
| it does not check HTML | `readme-links.ts` contained **no** `img`, `src=`, `href=` or `<a` anywhere |
| the third state exists | it already printed `24 not checked · 24 × external URL (not fetched)` |

And the size of the blind spot, exactly: README carries **3** `<img src>` and
**0** `<a href>`. All three resolve today — so the live state was *three valid
but unaudited links on the front page*, which is why the count went 5 when the
truth was 8.

### `<img src>` and `<a href>` now parse

Added to `parseLinks`, so HTML links join the **same** `LinkRef` stream and
inherit every state the checker already has rather than getting a parallel path.
The audit went **20 → 23 checked**, which is the three that were invisible.

The attribute is matched wherever it sits in the tag, because
`<img width="700" src="…">` is this README's own form — a positional match would
have missed every real case while passing a naive fixture. `<a href>` is parsed
too although there are none today: an `<a>` added later must not reopen the hole.

**Probed by breaking one.** Pointed `editing-hci-validation.svg` back at its old
`docs/assets/…` path: audit exits **1**, names `README.md:104` and the dead
target, and reports `23 checked, 22 resolved, 1 dead`. Restored, clean again.

### Wired into CI

A step of its own in `code-quality-gates.yml`, and I checked it the way bean
`d2kp` taught: `Bun.YAML.parse` reports the step's `run` as **exactly**
`"bun run readme:audit"`, with nothing folded in. `d2kp` is the case where a
more-indented continuation line silently became trailing arguments to the step
above and a gate never ran for two months — worth re-checking rather than
assuming, since the fix for it landed in this same region.

**`readme:sync:check` is deliberately NOT wired beside it**, and the reason is in
the workflow comment: this README carries **zero** `<!-- folio:*:begin -->`
markers, because generated sections belong to a folio and this repository is the
platform. Wiring it would pass over nothing and read as coverage — the vacuous
green this repo's conventions exist to prevent.

### Third box: already satisfied, and now honestly so

The count already separated `checked` / `dead` / `not checked` with a reason.
What was wrong was that HTML links were in **none** of those buckets — not a
third state but no state at all, which is the one outcome the conventions never
allow. They are now counted.

### Guarded

Four new tests in `scripts/tests/readme-links.test.ts` (19 total): the three
syntaxes parse with correct line numbers; `src` is found wherever it sits,
including `<IMG SRC=`; a tag with no `src`/`href` contributes **no** link, so a
bare `<br>` cannot become an empty target that reports as dead; and the
integration half — a dead `<img src>` sets the exit code, blames line 4 rather
than the live link on line 3, and reports `2 checked, 1 dead`. The parse tests
alone would have left the extraction correct and the gate green.

### Not done

`readme:audit` still does not fetch external URLs, deliberately — 24 links are
`not checked` for that reason and making CI depend on the reachability of two
dozen third-party hosts would trade a silent hole for a flaky gate.

### A footnote the merge itself produced

Merging `main` conflicted on THIS file, between the claim `beans:claim` pushed
to `main` and the completion written here. That is the `35nj` hazard in a second
facet — and the good one. Mirroring the status locally stops a stale `todo`
**silently reverting** the claim; it does not stop a conflict when both sides
edit the bean, and it should not. A conflict is git asking a person to
reconcile, which is loud and correct; the revert was silent and wrong. Resolved
by keeping both: the claim is history, the completion is the outcome.
