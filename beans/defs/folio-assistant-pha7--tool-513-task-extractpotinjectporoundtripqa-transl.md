---
# folio-assistant-pha7
title: 'TOOL 5/13: Task_ExtractPOT/InjectPO/RoundTripQA — translation (24 files, 5 entry points)'
status: completed
type: task
priority: normal
created_at: 2026-09-20T04:34:35Z
updated_at: 2026-09-20T11:31:01Z
parent: folio-assistant-d308
---

Group 5 of 13 in `d308`. **24 files, 5 entry points.**

`pot-extract`, `po-inject`, `po-resolve`, `translation-index`,
`translation-block-qa`, `translation-qa-sweep`, `translation-roundtrip`,
`bpmn-translate`, `translate-bpmn`, `translate-kg-viewer`, `check-l1-complete`, and
`scripts/translation/` (13 files).

**BPMN:** `human-translation-workflow · Task_ExtractPOT · Task_InjectPO ·
Task_RoundTripQA` — three `serviceTask`s, so this is a strong candidate for three
Tool nodes rather than one. Also `ingest-l1-completeness-gate · Task_RoundTrip`.

**Target repo (#223):** `folio-assist-core`.

**Known live defect in this group, already paid for once:** `po-resolve.ts`
declared the translations directory a second time, which turned
`translation:block-qa:check` red in CI on 2026-09-19 and was fixed by REMOVING the
duplicate declaration rather than adding a third. A Tool node here should name the
declared directory, never compose the path.

## Done when
- [ ] Tool node(s) — likely three, one per serviceTask
- [ ] `satisfies` names the translation skills the diagram refs
- [ ] the declared `translation-sources` directory read, never composed
- [ ] `tool-coverage` reflects it

---

## CORRECTED 2026-09-20: these skills are ALREADY covered

**Five Tool nodes exist**: `translation-extract`, `translation-inject`,
`translation-status`, `translation-signoff`, `translation-validate`. And
`translation-manager` is covered too. `tool-coverage` therefore does not list the
translation skills in tier A at all — because they are not uncovered.

This bean was written as if they were. That was not checked before it was
opened, and it should have been: `check:tools` prints the covered list in eight
seconds.

## What is actually left, which is a smaller and different question

24 files, of which **5 are run from this repo's `package.json`** and 19 are
could-not-determine (see `d308`'s CORRECTION). The five existing nodes have
`inProcess` pointing at `src/tools/translation.ts`. So the real question is not
"does translation need Tools" but:

> **Are the 24 files reachable only through those five nodes, or does the
> mechanism live in `content/pipeline/` with the nodes wrapping a thin part of
> it?**

`po-inject`, `pot-extract`, `translation-roundtrip`, `translation-block-qa`,
`translation-qa-sweep`, `translation-index` are pipeline modules. If a node
covers the extract/inject pair but nothing reaches the round-trip QA, then the
skill is covered and the CODE is not — which is exactly the distinction `d308`
exists to make, and this group is its clearest test case.

## Done when — REPLACES the list above

- [ ] which of the 24 files the five existing nodes actually reach, measured
- [ ] any file in the group reachable from no node named, with what runs it
- [ ] `alternativeTo` / `selection` checked on the five — they are a five-step
      sequence, not five substitutable arms, so `alternativeTo` should be EMPTY
      (the schema's own note: 12 of 25 skills carry several Tools and nearly all
      are complementary)
- [ ] scrapped with reasons if the answer is "already fully reached"


---

## 2026-09-20: MEASURED. The prediction was right, and the answer is worse than it

This bean's corrected form asked a measurement question rather than for a node.
Here is the measurement.

### What the five existing nodes actually reach

All five (`translation-extract`, `-inject`, `-status`, `-signoff`, `-validate`)
have `inProcess` pointing at `src/tools/translation.ts`. That module imports
**exactly two** pipeline modules:

```
content/pipeline/pot-extract.js   → extractMarkdown, formatPot
content/pipeline/po-inject.js     → parsePo, injectMarkdown
```

So of the group, **two of twenty-four files are reachable through a Tool node.**

### The whole group, and what runs each

| file | entry point | what runs it |
|---|---|---|
| `pot-extract` | — | **a Tool node** (imported) |
| `po-inject` | — | **a Tool node** (imported) |
| `po-resolve` | — | library — `translation-drift`, `translation-tools` |
| `translation-index` | main | `translation:index` |
| `translation-block-qa` | main | `translation:block-qa` |
| `translation-qa-sweep` | main | no script, but imported by `translation-index` / `-block-qa`, so reached |
| `bpmn-translate` | — | library, under `translate-bpmn` |
| `translate-bpmn` | top-level | `translate-bpmn` |
| `translate-kg-viewer` | top-level | `translate-kg-viewer` |
| **`translation-roundtrip`** | **main** | **NOTHING** |
| **`check-l1-complete`** | **main** | **NOTHING** |

### The prediction, confirmed and then sharpened

The bean predicted: *"If a node covers the extract/inject pair but nothing reaches
the round-trip QA, then the skill is covered and the CODE is not."*

That is exactly what happened — and the reality is worse than "a node wraps a thin
part". `translation-roundtrip.ts` **has** an `import.meta.main`. What it does not
have is any caller:

- no Tool node
- no `package.json` script
- no GitHub workflow
- **no importer anywhere** — `grep "from.*translation-roundtrip"` returns nothing
- its only two mentions are a `@see` doc comment in `schemas/translation.ts` and a
  `console.log` in `scripts/translation/simulate-translation.ts` that prints
  *"then translation-roundtrip.ts with a pair of agents"*

Meanwhile `Task_RoundTripQA` is a live `serviceTask` on the **critical path** of
`translation-workflow.bpmn`: `Task_PoInject → Task_RoundTripQA → Gateway_Drift`.
The diagram asserts the step happens; the repository contains the program and no
way anything reaches it except a person reading a printed instruction.

**So this is `covered-is-not-reachable`'s third case inverted.** That case was a
mechanism with no entry point. This is a mechanism WITH an entry point and no
callers, while a process diagram claims the step runs. The skill is covered, the
step is drawn, and the code is orphaned — three surfaces agreeing that something
happens which nothing invokes.

`check-l1-complete.ts` is the same shape, smaller: it has a main, and its only
occurrence outside itself is a string literal in `repo-partition.ts`'s
classification table. The bean also names `ingest-l1-completeness-gate ·
Task_RoundTrip`, so that gate's mechanism is unreachable too.

### The two original boxes that were already satisfied

- **`alternativeTo` is EMPTY on all five**, verified by reading the nodes rather
  than by assuming: `alternativeTo: null` on each. They are a five-step sequence,
  and the schema's own note says sharing a skill does not make Tools
  substitutable.
- **The declared directory is read, never composed.**
  `src/tools/translation.ts` calls `directoryForGraph(repoRoot,
  "translation-sources")` with the convention only as a documented fallback,
  stated at the call site "so the choice is visible" — which is the live defect
  this bean warned about (`po-resolve` declaring the directory twice, red CI on
  2026-09-19) not being repeated.

### Not scrapped, and not fixed either

The corrected list offered "scrapped with reasons if the answer is *already fully
reached*". **It is not** — two files are orphaned, so the bean earned its keep.

Nor is the fix mine to pick: `translation-roundtrip` back-translates **with a pair
of agents**, so it is not a CI gate, and wiring it to one would assert a check
that cannot run unattended. Whether it becomes an npm script for a human, a step
an agent performs inside the workflow, or a `qa-sweep` axis is a design question.
Carried to its own bean with options.

## Done when — the corrected list

- [x] which of the 24 files the five nodes actually reach, measured — **2 of 24**
- [x] any file reachable from no node named, with what runs it — table above;
      `translation-roundtrip` and `check-l1-complete` are run by NOTHING
- [x] `alternativeTo` / `selection` checked on the five — empty on all five, as it
      should be
- [x] not scrapped: the answer was not "already fully reached"
