---
# folio-assistant-7bg9
title: 'INGESTION: a licence check subprocess, and the marker coverage the ingest family is missing'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T15:25:27Z
updated_at: 2026-09-30T09:25:37Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-20: *"liscence check task (subprocess) is part of document/asset
ingestion pipeline"*.

Queued rather than started, per the standing instruction to queue new topics in
parallel and not pivot.

## The gap is real, and the shape already fits

Measured 2026-09-20 against `origin/main` at `dc78e7ccf`:

    cat-harness/processes/document-ingestion.bpmn
      "Document ingestion — uploads/ to the L1 source knowledge graph"
      callActivity -> Process_ExtractStructure
                      Process_DeriveContent
                      Process_BuildL1Kg
                      Process_L1Gate

    grep -lniE "licen[cs]e" document-ingestion.bpmn ingest-*.bpmn
      (no match)

**Four subprocesses, and not one of them asks whether the file may be used.**

The ask is structurally cheap because the pipeline is *already* composed of
`callActivity` subprocesses — a licence check is a fifth in a shape that takes
fifths. It is not a new mechanism, which is the best kind of feature request.

## Where it goes, and why the position is the design question

The pipeline runs `uploads/` → L1 source KG. A licence check placed **after**
derivation means the repository has already extracted structure, derived
content and built graph nodes from a file it may not be entitled to — and
`library/` is `holds: content`, so that output is committed. Removing it later
is a deletion, which under `deletion-requires-confirmation` is not something an
agent does on its own.

So the default should be **early**: between "a file lands in `uploads/`" and
`Process_ExtractStructure`. That is a claim about cost, not a ruling — the
owner may want it as a gate beside `Process_L1Gate` instead, and the trade is
worth stating rather than assuming:

| position | catches it before | cost when it fails |
|---|---|---|
| before ExtractStructure | any derivation happens | a file is refused with nothing to show for it |
| beside L1Gate | publication | derived artefacts already exist and must be removed |

## What "licence check" has to answer, and what already exists

There is no licence handling in the pipeline, but there IS licence vocabulary
elsewhere — `schemas/theme.ts`, `schemas/kg-node.ts`,
`schemas/assistant-package.ts` all carry the word. **Check those before
inventing a field**: a second licence vocabulary would be the "rule stated in
two places" failure this repository names in its own `AGENTS.md` banner.

Three different questions hide under one name, and a subprocess that conflates
them will pass things it should not:

1. **Is a licence declared at all?** Absent is not permissive. This is the
   `holds`-style third state — an undetermined licence must not render as
   cleared, the same rule `ci-health` and `kg:audit` already follow.
2. **Is the declared licence compatible with the folio's own?** qou is
   CC-BY-4.0; folio-assistant is not necessarily. Compatibility is a pair, not
   a property.
3. **Does the derived output inherit it?** An asset under one licence, quoted
   into prose published under another, is the case the check exists for.

A first cut that answers only (1) is still worth having, provided it reports
"undeclared" rather than passing.

## While in here: the ingest family's marker coverage

`skills/workflow/bpmn-processes.md:30` requires `<folio:skill ref>` **and**
`<folio:bean>` on an activity that touches the work plan. Measured on
`document-ingestion.bpmn`:

    activities 7      folio:skill 12  ✓      folio:bean 2   ✗ (partial)

Better than `initialize-harness.bpmn`, which has 8 skill refs and **zero** bean
markers (bean `b5f0` §4) — but still partial, and the process declares a
`Work plan — beans` lane, so the untagged activities are untagged against the
diagram's own stated lane.

**The licence subprocess is authored with both markers from the first commit**,
and the five existing activities get theirs in the same change. Adding a fifth
subprocess to a family that is partially tagged, without fixing the tagging, is
how the gap becomes permanent.

## Done when

- [ ] the existing licence vocabulary (`theme.ts`, `kg-node.ts`,
      `assistant-package.ts`) is read BEFORE a field is designed
- [ ] **owner:** early gate (before ExtractStructure) or late (beside L1Gate)?
- [ ] the subprocess distinguishes *undeclared* from *cleared* — undetermined is
      never rendered as clean
- [ ] `<folio:skill ref>` and `<folio:bean>` on every new activity, and the
      seven existing ones brought up to the same bar in the same change
- [ ] a `.pot` and an SVG — `render:bpmn` and `translate-bpmn` both consume the
      family, and a new diagram that skips them is stale on arrival

## Cross-references

- **`b5f0`** — the marker-coverage rule and the `initialize-harness` zero-bean
  measurement; same defect class, different process
- **`zzmr`** — parent epic
- `uploads` is `holds: state`, `library` is `holds: content` — the licence
  question sits exactly on that boundary, which is why it belongs in the
  pipeline rather than beside it

## RULED, owner, 2026-09-20 — EARLY

> "3 early"

The licence check goes **before `Process_ExtractStructure`**, between "a file
lands in `uploads/`" and any derivation — not beside `Process_L1Gate`.

That is the cheaper failure by the measure recorded above: `library/` is
`holds: content`, so anything derived before the check is COMMITTED, and
removing it afterwards is a deletion nobody may take on their own initiative.
Refusing a file with nothing derived costs a refusal; refusing it after
derivation costs a cleanup that needs permission.

Consequence to carry into the implementation: an early gate sees only what is
on the file itself — declared licence metadata, a LICENSE sibling, whatever the
uploader supplied. It cannot use anything `ExtractStructure` would have found.
If a licence can only be determined from extracted structure, the early gate
must report **undetermined** and let the pipeline proceed to a second check,
rather than passing it. Undetermined is never rendered as cleared; that rule
holds here as everywhere else in this repository.


## 2026-09-30 — the early step, built to the ruling
- [x] existing vocabulary read first, and REUSED: the stated / unknown / absent record check:source-licence reads from a manifest's meta.licence moved to cat-harness/schemas/source-licence.ts (SourceLicenceSchema + licenceProblem, one rule set; check-source-licence re-exports it). intake.json (folio-intake/v1) gains an optional `licence` of that same record — no second licence vocabulary.
- [x] EARLY, per the ruling: document-ingestion.bpmn gains Task_Licence 'Establish the licence from the upload alone' between Task_Detect and CallActivity_Extract (Lane_1, skill document-intake; DI shifted right one slot; render:bpmn, check:workflow-refs, check:lane-documentation pass; .pot re-extracted for 5 locales).
- [x] undetermined ≠ cleared: ingest-document.ts earlyLicence() reads only the upload — intake.json licence, or a LICENSE sibling (named, never read) — and prints 'licence: stated|unknown|undetermined — …' before the first arm runs. Undetermined proceeds, as ruled; a malformed intake reports 'does not validate', never 'no licence'. Test: scripts/tests/early-licence.test.ts (5 cases).
- [x] document-intake skill: 'Record the licence in intake.json when you know it', with the three verdicts.
- [ ] STILL OPEN — carry the intake licence into the promoted manifest's meta.licence, so check:source-licence sees it (today no manifest records one: every current document is 'undetermined').
- [ ] STILL OPEN — the marker sweep over the seven existing activities; same rule as b5f0.
Found in passing: bean eowd (regen cannot repair translate-bpmn:check).
