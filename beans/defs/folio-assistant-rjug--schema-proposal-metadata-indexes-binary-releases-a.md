---
# folio-assistant-rjug
title: 'SCHEMA PROPOSAL: metadata indexes, binary releases and QA reports as declared graph kinds — options, not a single answer'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-09-22T20:23:45Z
parent: folio-assistant-uhkv
---

Three things the pipeline already produces and this graph cannot hold. Proposal
with **options**, because at least two of the three have more than one
defensible shape and picking silently is how a kind gets registered wrong.

## 1. Metadata indexes

Already partly solved: `fhir-artifact-index` exists, registered
`renderable: false`, reconstructed from four partial views with `provenance`
naming the published file each field came from.

What is NOT held: the Publisher's own metadata exports as a first-class thing —
`valueset-ref-list.json`, `codesystem-ref-list.json`, `usage-stats.json`.

- **Option A** — extend `fhir-artifact-index` with a `metadataExports` block.
  One kind, one place to look. Risks making the index a bag.
- **Option B** — a sibling kind `ig-metadata-index`, `holds: "derived"`. Keeps
  "what artefacts exist" apart from "what the toolchain reported". Two kinds to
  keep in step.

## 2. Binary releases

The published `package.tgz`, the release assets, and the >100 MB files the WHO
deploy phase DELETES before deployment.

- **Option A** — a `binary-release` kind, `holds: "state"`, one node per
  release, recording id, version, digest, size and where it is fetched from,
  never the bytes.
- **Option B** — reuse `materialization`, which already answers "are any of its
  bytes actually here". A release is arguably exactly that question.

Option B is attractive and may be wrong: a release is an EVENT with a version
and a digest, not a materialisation state. Worth deciding rather than assuming.

## 3. QA reports

**The strongest case of the three, because the data already exists and is
thrown away.** Every pre- and post-processing script instantiates a `QAReporter`
and emits `phase`, `timestamp`, `status`, `summary` with counts, and `details`
with `successes`, `warnings`, `errors`, `files_processed`, `files_expected`,
`files_missing`. The Publisher emits `qa.json`, uploaded as a workflow artifact.

Neither is read downstream by anything.

- **Option A** — a `qa-report` kind, `holds: "derived"`, shape taken from what
  the scripts already emit. Evidence-led, and the existing `qa` kind stays what
  it is: witnesses over authored content, a different subject.
- **Option B** — map onto the existing `qa` witness families. Cheapest, and
  conflates a tool's run report with a verdict on content.

`py74` already found six schemas and three incompatible verdict shapes, so
adding a fourth needs the argument made, not assumed.

## Done when
- [ ] each of the three has an option chosen BY THE OWNER, with the reason
- [ ] `holds` and `renderable` decided for each — a kind that has not decided
      does not compile
- [ ] `content-context-and-state-graphs` consulted before any registration

## RULED, 2026-09-22 — option A for QA reports, and it has shipped

The owner chose the evidence-led option: a new `qa-report` kind, shape taken
from what the scripts already emit.

| | |
|---|---|
| schema | `cat-harness/schemas/qa-report.ts` — `qa-report/v1` |
| kind | `qa-report`, `holds: "state"`, `renderable: false`, `recordsWork: false` |
| tests | `cat-harness/schemas/qa-report.test.ts` — 16 |

**`state`, and `derived` was considered and rejected.** A derived graph is
regenerated from a source that still exists; re-running a tool produces a
DIFFERENT report rather than the same one again. It is the same shape as
`health` one level in — where a RUN got to, rather than where the repository
got to.

**Upstream's snake_case field names are kept**, against this repository's own
convention, because that was the point of the option chosen: renaming them
would insert a translation step between a producer we do not control and a
consumer we do, and a translation step is a place for the two to drift
silently. The wrapper fields this module adds — `$schema`, `producer`,
`source`, `toolchain` — are ours, so the line between the two halves is visible
in the spelling.

**Three rules enforced structurally**, each already paid for in prose here:

1. a summary may not disagree with the details it counts — otherwise a report
   can lie about itself invisibly, because a reader sees only the number;
2. `files_missing` must be a subset of `files_expected` — which is what keeps
   "the DMN directory held no decisions" apart from "the DMN directory was not
   found", the most valuable property the upstream reporter already has;
3. `running` is never a pass — a script that died before writing anything has
   zero errors, and `qaReportVerdict` returns `unknown` for it.

**`py74`'s objection was answered, not waived.** It found six schemas with
three incompatible verdict shapes, so a fifth family needed the argument made.
The argument is the subject: a `qa` witness judges an ARTEFACT, a `health`
report judges the REPOSITORY, a `qa-report` records an EXECUTION. A test
asserts the three kinds stay distinct so a later tidy-up cannot fold them
silently.

## Still open — the other two of the three

Metadata indexes and binary releases are NOT ruled and nothing has been
registered for them. Their options stand as written above.
