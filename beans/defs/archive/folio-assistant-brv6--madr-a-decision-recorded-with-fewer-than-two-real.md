---
# folio-assistant-brv6
title: 'MADR: a decision recorded with fewer than two real options — the refusal made checkable'
status: completed
type: task
priority: normal
created_at: 2026-09-20T10:27:43Z
updated_at: 2026-09-20T10:38:54Z
parent: folio-assistant-d308
---


MADR was adopted whole on 2026-09-20 and its refusal — *"never fewer than two
considered options; one option is not a choice, and a straw option is worse than
a short list"* — was prose nothing checked. Carried over from `u4hs` as the last
open item of the methodology work.

## Where it went, and where it did NOT

**Not `kg:audit`.** That audits the `kg` graph — skills, roles, workflow
activities — and cannot see beans at all. A criterion there would have had no
subjects by construction.

**`bun run health`'s `bean-store` check.** It already reads the bean store and
emits measurements plus findings, and `HealthContext` is a record of probes
precisely so a fixture is a literal. The extraction lives in the probe, the
judgement in the check.

## The trap this nearly walked into

**Detecting on MADR's canonical `## Considered options` would have had ZERO
subjects.** Measured: no bean in this store uses that spelling. The two that
record options write `## Options, with what each costs` and `## Options, none
chosen here`. A filter over nothing passes — the same failure
`NoCheckScriptsFound` refuses one layer along, and it would have shipped as a
green tick.

So the detector matches `^##\s+(?:considered\s+)?options\b`, case-insensitively.
The `\b` is load-bearing: two real headings here begin "Optional" ("Provenance is
not optional", "Accessibility is not optional here") and counting their bullets
would have invented decision records.

## Three states, not two

`consideredOptions` is `number | undefined`, and the check must not collapse them:

| state | meaning | treatment |
|---|---|---|
| `undefined` | no options section | NOT a decision record — `madr.md`: a bean recording work needs no such section |
| `0` | section present, nothing in it | a finding, and a DIFFERENT one: it claims an analysis that did not happen |
| `1` | one option | the finding MADR names |

Reading `undefined` as `0` would have made all 172 work beans findings.

## The subject count is reported even though nothing thresholds it

`bean-decision-records` sits beside `bean-thin-decision-records` on purpose. The
finding can only fire on a bean the first count includes, so a detector that
stops matching — a heading respelled, the regex narrowed — shows as **zero
subjects** rather than as a clean run.

## The remedy refuses the shortcut

A criterion satisfiable by padding would make the records worse than no
criterion, so the action offers MADR's own escape (*say why no alternative
existed* — a finding about the constraint, not a decision) and says outright
**never invent a straw option to reach two**. A test asserts both strings, so
softening the remedy fails.

`minor`, not `major`: this maps analytical debt. A thin record misleads a future
reader; it does not break a consumer.

## Falsifier run in both directions, on the real pipeline

Not just fixtures — the fixtures would pass whatever the extractor did.

1. **Subjects exist:** the real probe over the real store finds **2** decision
   records (`qif9`, `x4a6`), each with 3 options. Zero would have meant the trap.
2. **It fires:** a one-option bean planted in a COPY of the store (never in
   `beans/`) is detected as thin, through the real probe against a real
   directory. Exit 0 on the assertion that exactly one was found.

So it locks in a property the store already has rather than demanding work —
priced at zero today, which is the only honest time to add a ratchet.

## Two incidental corrections

- **The measurement provenance was wrong at first.** Both new measurements
  inherited `command: "beans/defs/*.md front matter"` from their neighbours, and
  they read the BODY. A measurement that misreports where it came from sends
  whoever re-derives it to the wrong place, which is the entire reason `command`
  is on the record. They now carry their own.
- **One test expectation was wrong, not the code.** I asserted 3 options in a
  fixture holding 2 — miscounted my own text. Corrected the expectation and made
  the comment say which half of the behaviour each item demonstrates.

## A `beans` CLI gotcha worth knowing

`beans update <id> -s in-progress --parent <epic>` applied **only one** of the
two and reported success. Run as two calls it worked. Anything setting several
properties at once should be verified by reading the front matter back — which is
how this was caught, by `check-bean-parents` failing on an orphan I believed I
had parented.

## Done when

- [x] detection that has real subjects, verified against the store rather than assumed
- [x] the three states kept distinct, with `undefined` never read as zero
- [x] the subject count reported so a broken detector is not green
- [x] a remedy that cannot be satisfied by padding, with tests pinning that
- [x] falsifier run in both directions on the real pipeline
- [x] `madr.md` says the rule is checked, and what its limits are

Verified: 3491 tests 0 failures, eslint clean, 53 gates — the whole set.
