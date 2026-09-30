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
