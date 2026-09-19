---
# folio-assistant-pn6j
title: 'INGEST: L1 completeness gate — derived content must be present before L1 KG is complete'
status: in-progress
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T12:56:53Z
parent: folio-assistant-slw1
---

## What

**L1 source to L1 KG is NOT complete while a required derived artefact is
missing.** Make that a gate rather than an aspiration.

## What it checks

Archive contents, technical metadata, image descriptions, audio transcripts,
tabular records, and the provenance stamp on each narrative — each required
only where the document actually has that kind of content.

## Why a gate and not a report

Without it, every derivation step above is optional in practice: the document
lands in `library/`, reads as ingested, and the gap is discovered by whoever
next needs the missing artefact. A gate turns that into a tracked bean at
ingest time, which is the one moment the context is still in hand.

## Done when

The gate runs in the ingest path, a failure opens a bean and holds the document
in `uploads/`, and the verdict is recorded on the document.

Diagram: `skills/workflows/ingest-l1-completeness-gate.bpmn`.

_2026-09-19T12:23:18Z_ — Claimed by claude/ecstatic-goldberg-eroyaz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

_2026-09-19T12:31:11Z_ — DONE (first cut) as bun run check:l1-complete, wired into CI.

THREE states, never two: met / unmet / not-derivable. The third is what lets this ship before the nine INGEST arms exist -- archive contents, technical metadata, image descriptions, audio transcripts, tabular records and narrative provenance are reported as not-derivable, each naming the bean (twqe, nso8, d5f1, 1r0p, p67i, iqim) that would move it into the checked set. A check that cannot run is not a pass and is not silently dropped; that is dh4f's rule.

Checked today: structure.json parses and has sections; sections/ and blocks/ non-empty; manifest.jsonld has @id/@type/contains; provenance present. An empty structure with NO structure_note is unmet -- nothing then records whether the emptiness was determined. All four library entries pass.

NOT done, deliberately, and this is the gap between this and the bean's 'Done when':
- it does not OPEN A BEAN on failure. beans create is not idempotent and once produced 14,688 duplicates; a gate that mints one per run against that store is a bad trade.
- it does not HOLD THE DOCUMENT IN uploads/. Moving somebody's file is a deletion-shaped act and deletion-requires-confirmation says an agent reports what would move and waits.
- it does not record the verdict ON the document. That wants a decision about where a verdict lives on an L1 entry -- test/results/ by the provenance rule, or the manifest -- which is 2634's territory, in progress by someone else.
So this is a reporting gate, not yet the acting one the bean asks for. Left in-progress rather than completed.

_2026-09-19T12:56:53Z_ — The verdict is now RECORDED, closing the third 'Done when'.

bun run check:l1-complete -- --write emits one `qa-results/v1` document per library entry under test/results/library-qa/<slug>.qa-results.json; -- --check fails when a committed verdict is stale, and is wired into CI.

On the owner's question — sidecar on the tool, or on the asset? Neither needs choosing, and no sixth schema family was added. qa-results/v1 already carries BOTH: `subject {kind,id}` is an OPEN vocabulary, so the asset is subject {kind:'library-document', id:'library/<slug>'}; and `producer {script, script_hash}` means the tool was never a separate subject, it is provenance, and it was already on every one of these.

Two families, deliberately separate: `unmet` (a DEFECT in this entry, fixable by re-running an ingest rung) and `notDerivable` (a GAP — no arm builds it, each naming its bean). A reader tells one from the other at a glance.

total is NEVER zero and that is the honest reading. The tempting design counts only unmet so a good entry reads total:0; that would claim full verification while six requirements have never been checked by anything. 'Unknown rendered as a pass' is the failure this repo keeps paying for. Tested explicitly.

Staleness compares everything except updated_at, which churns per run. Verified by perturbing a committed file: --check exits 1 naming the entry, and 0 once rewritten. Note the consequence: editing this checker changes script_hash and invalidates all four verdicts, so a change to it must rewrite them — same property kg-audit has.

Still NOT done on this bean: opening a bean on failure, and holding the document in uploads/. Both unchanged from the previous note. Recording the verdict INSIDE the asset (manifest.jsonld) remains 2634's territory and is deliberately untouched.
