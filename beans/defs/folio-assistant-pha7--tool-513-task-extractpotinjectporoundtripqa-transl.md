---
# folio-assistant-pha7
title: 'TOOL 5/13: Task_ExtractPOT/InjectPO/RoundTripQA — translation (24 files, 5 entry points)'
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:34:35Z
updated_at: 2026-09-20T04:34:35Z
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
