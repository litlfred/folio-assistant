---
# folio-assistant-ogit
title: Harness carries two senses
status: completed
type: task
priority: normal
created_at: 2026-09-23T14:59:06Z
updated_at: 2026-09-23T14:59:25Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23: *"why is detangle a harness? review all things labeled are harnesses -- are they? QA audit reports pls"*, then *"1 and 2"* — the wording fixes AND a criterion closing the gap.

**The wording fixes landed. The criterion did not, and this records why, with the measurement.**

## The gap is real

Nothing joins the word *harness* to the fact that makes one. Three neighbouring checks, each read before building:

- `prose-claims-resolve` — `applies: ["process","skill"]`, and only to declared prose↔code PAIRS. A docstring in `schemas/` is not a pair.
- `check:declaration-claims` — anchors on a **graph id** beside a `*.json`; a harness sentence names no graph id. Markdown only, and the defect was a `.ts` comment.
- `check:declaration-filename` — hunts the RETIRED name. Its own header: *"A wrong name is not a retired name."*

## The criterion was built, measured, and withdrawn

Anchored on declared instance names beside the word, instantiation read from a root `<name>.config.json`.

| run | findings | why |
|---|---|---|
| first | **246** | `fhir-harness → smart-base` matched `smart-base`, the letters sitting inside ANOTHER instance's name; every page under `cat-harness/docs/uml/` matched its own path |
| after stripping harness-bearing names | **31** | usable, and then readable |

Reading all 31 is what killed it. **Zero were the defect being hunted.**

- 10 — one generator template (fixed, below)
- 4 — the retired `harness.json` FILENAME, already counted by `check:declaration-filename`
- 6 — hyphenated ids (`confirm-harness`), directory-tree listings, and the check flagging its own docstring and its own fix comment
- ~11 — **legitimate sense-2 usage**

## The finding: two senses, and the owner uses both

1. **Instantiated here** — a `<name>.config.json` at the repository root (`harness-tiles`, `6n23`). 5 of 19.
2. **A layer others instantiate** — *"the DAK harness every smart-\* DAK repo instantiates"*, *"smart-base WHO SMART harness rules"*. The owner's own bean titles use it: `2yyh` **SMART-BASE HARNESS**, `wm63` **FHIR-HARNESS**.

Sense 2 is not a defect and is not going away. A checker cannot separate them from text — which makes *"is this a harness"* a **judgement**, and this repository already has the name for that: if a mechanism could decide it, the adjudication would not have been entered.

That is why nothing shipped. A 31-finding gate whose true-positive count is zero is the `dh4f` shape pointed at a new check, and `declaration-claims.ts` already records the cost: *"a wall of false findings is how a check gets switched off."*

## Done when

- [ ] Owner decides whether the two senses get two WORDS — so the question becomes computable — or stay one word and stay adjudicated.
- [ ] If two words: a criterion becomes writable and this bean reopens as that work.

## What DID land (same PR)

- `graph-kind-registry.ts` no longer calls `detangle` a harness.
- `fhir-harness.json` carries `_name_comment`: the name is not an instantiation claim — it is declared, not instantiated, and declares no visualiser.
- **`gen-uml-overview.ts` emitted "the `X` harness declares" on every page**, and 10 of the 22 instances it runs over are not harnesses. One template, ten pages — the largest single producer of this mislabelling in the corpus. Now `instance`, which is correct for all 22. Measured after: **0** occurrences left under `docs/uml/`.


## Decided — the owner, 2026-09-23: document both senses, no rename

Chosen over giving sense 2 its own word. The two senses are now a section of
[`harness-tiles`](../../../cat-harness/skills/folio-core/harness-tiles.md), beside
the instantiation rule they qualify: a table separating *instantiated here*
from *a layer others instantiate*, the evidence that sense 2 is deliberate
(`smart-stack-layering`, `fhir-harness`'s own description, bean titles `2yyh`
and `wm63`), and a **do not write a checker for this** subsection carrying the
246 → 31 → 0-true-positives measurement.

No rename, no criterion, no corpus churn. *"Is X a harness"* stays a judgement,
which the evidence says it genuinely is.

**One thing the work turned up about itself:** writing that section tripped
`check:declaration-filename`, because the paragraph explaining the false
positives named the retired declaration filename. The gate was right and the
prose was reworded. A page about a vocabulary defect produced one on its first
draft.

## Summary of Changes

`harness-tiles` gains §"Harness carries TWO senses, and only one of them is
this rule". Gates 135/135.
