---
# folio-assistant-pn6j
title: 'INGEST: L1 completeness gate — derived content must be present before L1 KG is complete'
status: completed
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-20T10:59:25Z
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

Diagram: `processes/ingest-l1-completeness-gate.bpmn`.

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

*2026-09-20* — The third state stopped expiring, and had already expired.

`image-descriptions` sat in NOT_DERIVABLE naming `d5f1` while all four library
entries carried a complete `images.json` — 2 / 20 / 121 / 21 images, every one
with a role and a basis, 24 of them describable and described. The gate
reported "no arm builds this yet" and checked none of it.

The entry above read *"this list shrinks by work rather than by editing"*. It
does not: nothing forced the edit. So each remaining entry now carries a
`probe` — the artefact whose EXISTENCE means the arm runs — and
`expiredExceptions` fails the gate when one is found. The probe is the CORPUS,
not the bean's status: `d5f1` is still `in-progress` while its output is
committed and complete, so a status field would have reported this as
correctly not-derivable. A human-maintained flag is the weak signal.

That is the third time this session one repository has paid for the same
shape: a reason in a YAML comment that nothing compared and had become false
(`ot9a`), a drift backlog that exempted a whole page so it could drift further
in silence (`07p7`), and this. Each was a declared exception that outlived its
premise because nothing re-derived it.

`image-descriptions` is now CHECKED, with three states of its own: `images:
null` is the sidecar's could-not-determine and carries its reason; an image
with an `undetermined` ROLE is unmet, because whether it needs describing is
unknown; a page scan needs no narrative, which matters when 140 of 164 images
are page scans.

Also fixed here, and it is bean `04vl` a second time: `narrative-review`
RESTATED the review queue's bearing list — the same three files, the same
`doc.narrative` single-narrative read — and went stale at the same moment and
for the same reason, reporting "no narrative-bearing file in this entry" over
four entries holding 24 drafts. It imports `NARRATIVE_BEARING` and
`narrativesIn` from `scripts/narratives.ts` now. One rule in two places is two
rules.

Ten mutations, each caught by a NAMED test. Three were first caught only by
the sidecar-staleness test, which fires on any edit to this file and so proves
nothing about the branch; targeted tests were added and the three re-run.

The four committed verdicts were rewritten, as this bean's own note requires:
editing the checker changes `script_hash`.

STILL NOT DONE, unchanged and deliberate: opening a bean on failure, and
holding the document in uploads/. Both are blocked on standing rules rather
than on effort — see below.

*2026-09-20* — Both remaining Done-whens CLOSED, by the owner's decision.

**Open a bean on failure: NO.** The owner chose reporting-only. `beans create`
dedupes on nothing and once produced 14,688 duplicates; a gate minting one per
run against that store is a bad trade, and a person reading the refusal has
context a bean would only approximate. Recorded as a decision, not left as a
gap.

**Hold the document in uploads/: reframed as REFUSE TO PROMOTE, and built.**
The arms already take `-o <dir>`, so the only change needed was which
directory. They write into `ingest-staging/<slug>/`, and `--promote` is the
single moment anything crosses into `library/`. Nothing is ever moved OUT of
the library and nothing is deleted, so `deletion-requires-confirmation` is
untouched — which is why this reframing was available and "move it back" was
not.

The first placement was WRONG and the measurement caught it. Gating at the end
of the ingest command refused milnorlink on SEVEN unmet requirements, because
`planFor` runs ONE rung: `pdf-pages.py` alone yields page files and none of
structure.json, sections/, blocks/, manifest.jsonld or images.json. That gate
would have refused every document ever ingested, and a gate that always
refuses is one somebody switches off. Hence a separate promote step.

Verified end-to-end on the real corpus, both directions:
- incomplete staging + `--promote` → refused, exit 1, `library/` untouched,
  staged output left in place for inspection;
- `library/milnorlink/` copied into staging + `--promote` → promoted, exit 0,
  byte-identical no-op, staging cleaned.

Staging is NOT dot-prefixed, for the reason `8xzw`/`x89g` moved `.beans/` and
`.harness/` out: a staging tree holding a REFUSED document is exactly what
somebody comes looking for.

Eight mutations. Seven caught by a named test. The eighth — replacing the CLI's
`if (ingestMode(argv) === "stage")` with `if (false)` — is control flow no unit
test reaches without running the whole CLI against a real PDF, and it is
recorded here rather than papered over. Both branches WERE exercised by hand
end-to-end, which is evidence and not a test. Two decisions were extracted into
`mayPromote` and `ingestMode` precisely because the first pass covered them
only with source-text greps, and two mutations survived that read fine
textually.
