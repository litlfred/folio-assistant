---
# folio-assistant-4v62
title: 'QUOTATION GUARD SCOPE: a table cell is not a quotation, and the corpus is what says so'
status: completed
type: task
priority: normal
created_at: 2026-09-21T17:33:34Z
updated_at: 2026-09-21T17:33:45Z
parent: folio-assistant-ahvw
---



Issue: https://github.com/litlfred/folio-assistant/issues/696 — this closes
`k59d`'s one remaining agent-ownable Done-when:

> The quotation guard covers a markdown table cell, or the guard's stated
> scope says it does not and why — a workaround in one bean is not a fix

## Measured before deciding, and the measurement went against my first instinct

`insideQuotation` in `check-bean-bodies.ts` reads `"` and nothing else. Probed
directly against six attribution forms: a **table cell** and a **blockquote**
both read as assertions. My first reading was that both were gaps. The corpus
says otherwise — every bean body, `blocked on \`id\`` on a line beginning `|`:

| bean | the cell | what it is |
|---|---|---|
| `k59d` | `"blocked on \`hqku\`, …"` | yg29's sentence, quoted — already marked, already skipped |
| `xgd8` | `blocked on \`slw1\`, see above` | **its own** blocker, asserted in a cell. `slw1` is `todo`, so the block is LIVE |

**The only unquoted cell in the store is a genuine self-assertion that must
keep being read.** Treating a cell as a quotation would silently exempt
exactly it, and every future one — a table is where a bean naturally states
structured facts about itself.

So the second branch of the Done-when is the correct one, on evidence rather
than taste. And `k59d`'s double-quoting was never a workaround: quoting what
you quote is correct English AND is precisely the signal the guard reads.

## What shipped

- The guard's docstring states its scope, with that table as the reason.
- **The finding message teaches the marking** on the one line shape where an
  author is most likely to have meant a quotation and left the marks off: a
  table row now carries *"if it quotes another bean, put the cell's text in
  double quotes"*. The checker does not guess; the author is told how to say it.
- `insideQuotation` and `BLOCKER` are exported so the scope is testable rather
  than asserted in prose. Six cases, one per attribution form.

## Deliberately NOT built

A **blockquote** rule. `>` is unambiguously a quotation in markdown and would
be defensible — and the store contains **zero** of them, measured the same
way. Building it would be building for a case that does not exist. The
docstring and a test both record the choice, so the gap is priced rather than
missed, and the test is the one to flip if the form appears.

## Done when

- [x] the guard's scope is stated, with the corpus measurement that settles it
- [x] a table row's finding teaches the marking rather than bending the rule
- [x] the scope is tested, not asserted — including the blockquote case as a
      record of the choice
- [x] falsified: a planted unquoted cell naming a `completed` bean fails with
      exit 1 and carries the hint; `xgd8`'s live blocker stays unflagged;
      `k59d` stays quiet

## Two repairs that rode along, both instances of the class

- `ivfw`'s closing entry said *"`5y4b` remains the other half"*. `5y4b` is
  `completed`. **I wrote that line myself**, hours earlier, by copying a
  cross-reference forward from an entry written the previous day — `k59d`'s
  defect at leaf level, committed by the agent closing the bean. Corrected in
  place with what is actually still open (`tfo1`'s crop gap, which is `tfo1`'s).
- `bean-bodies-baseline.json` carried `folio-assistant-ivfw:shadow-checklist`,
  which the checker itself reported as no longer matching once `ivfw`'s
  checklist was ticked. Removed — that report exists so the file cannot
  quietly stop shrinking.


## A neighbouring ruling, recorded here because it has no bean of its own

Asked in the same round, 2026-09-21: the `staging-review` skill is **388 lines**
against a skill-corpus p75 of **279**, and `skill-is-brief` was already failing
at 289 before that change. Three options: leave it, trim ~110 lines of
justification prose, or split the skill in two.

**The owner chose: leave it at 388.**

So the `major` finding in
`test/results/kg-qa/skills/folio-core/staging-review.kg-qa.json` is **known and
accepted**, not unnoticed. `kg:audit:check` does not gate on it; `kg:audit:strict`
would, and that is the cost of the decision, stated rather than buried.

The reasoning behind the recommendation, kept because the next agent will meet
the same finding: the threshold is a percentile rather than a limit, and this
repository's own experience is that a rule stripped of the measurement behind it
drifts back. If brevity is wanted later, the cut is the justification prose —
never the contract tables.
