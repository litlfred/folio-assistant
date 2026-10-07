---
# folio-assistant-q885
title: 'DOCBLOCK CLAIMS: check:agents-claims reaches AGENTS.md but not script docblocks — check-theme-art.ts says nothing runs --check in CI, and CI runs it'
status: todo
type: task
created_at: 2026-09-30T11:33:55Z
parent: folio-assistant-ahvw
updated_at: 2026-09-30T11:33:55Z
---

## The finding, and how it was measured

`cat-harness/scripts/check-theme-art.ts`, line 24, in its own module docblock:

> So: `--check` exits non-zero on a refusal, and nothing runs `--check` in CI

`.github/workflows/code-quality-gates.yml`, line 1384:

>           bun run check:theme-art:check

and `package.json:169` binds that script to `check-theme-art.ts --check`. So CI
has run it since the gate landed, and the file that says otherwise is the file
being run.

Provenance: three greps on `claude/cool-fermi-htir5p` at parity with
`origin/main`, 2026-09-30 — the docblock, the workflow, the script binding.

## Why a stale gap notice is worse than no notice

This is not cosmetic. An agent that reads *"nothing runs `--check` in CI"*
concludes the guard is advisory and either weakens it or stops trusting it —
and the same agent, reading the true state, would have left it alone. `AGENTS.md`
states the general form of this in its own banner (*"a stale gap notice is worse
than none, because an agent that believes it either avoids the feature or
rebuilds it"*), and bean `77ex` shipped `check:agents-claims` for exactly this
failure **in `AGENTS.md`**. Script docblocks are the same carrier one layer in,
and that checker does not read them.

**Scope, stated so this is not over-generalised.** A docblock can say anything;
only a claim whose subject is a *file in this repository* is checkable. This
bean covers one phrasing family — a docblock asserting that some script, gate or
workflow is or is not run by CI — and nothing else. A detector that recognised
one form and reported the corpus clean is the `vq8g` defect, already paid for.

## Done when

1. A check fails on a docblock claiming a script is not run by CI when
   `code-quality-gates.yml` runs it, and on the converse.
2. `check-theme-art.ts`'s docblock is corrected, and the sweep reports how many
   other docblocks carried the same stale claim — **as a count with a
   denominator**, not as prose.
3. The check is falsified before it ships: plant the claim, watch it fire,
   restore, watch it pass.


---

## 2026-09-30 — the docblock corrected; the sweep found ONE, not more

Done-when #1 and #2 are done; #3 (a check for the claim class) is not.

**The claim, and both sides of it.** `check-theme-art.ts` said *"nothing runs
`--check` in CI yet"*. `code-quality-gates.yml:1384` runs
`check:theme-art:check`, and that step's own comment dates the change:
*"Reported but ungated until 2026-09-24 because `landing-architecture` had no
mobile crop; the owner supplied it, so a refusal here is now a regression."*

**A SECOND stale claim in the same docblock.** It also said *"Running it today
refuses `landing-architecture`, which is declared with laptop and card and no
mobile."* `bun run check:theme-art:check` now exits 0 with *"landing-architecture:
3 layouts accepted"* — laptop, mobile and card all present. Both sentences are
corrected, and the section heading with them (*"Why this REPORTS and does not yet
gate"* -> *"Why this reported before it gated"*).

**The denominator: 1 of 1.** Sweeping every `.ts` docblock for the same claim
family — `nothing runs \`--check\` in CI`, `not run in CI`, `ungated in CI`,
`no CI step runs` — returns **zero other instances**. So this was one file, not
a pattern, and the bean's Done-when #2 asked for the count rather than an
impression: here it is with its denominator.

**Done-when #3 is still open** and is deliberately not attempted yet. The
checkable form of this claim family is narrow — a docblock asserting that some
named script *is* or *is not* run by CI, cross-read against
`code-quality-gates.yml` — and with a corpus of one there is nothing to
validate a detector against. Writing one now would be a detector whose only
test case is the defect it was written from, which is the `vq8g` failure: it
recognises one phrasing and reports the corpus clean.
