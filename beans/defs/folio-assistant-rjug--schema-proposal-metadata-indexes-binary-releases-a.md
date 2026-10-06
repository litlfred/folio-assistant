---
# folio-assistant-rjug
title: 'SCHEMA PROPOSAL: metadata indexes, binary releases and QA reports as declared graph kinds — options, not a single answer'
status: completed
type: feature
priority: normal
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-10-06T19:30:00Z
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
- [x] each of the three has an option chosen BY THE OWNER, with the reason
      — §3 ruled 2026-09-22 (option A, shipped); §1 and §2 ruled 2026-09-30
      (option B and option A), each with the rejected option's reason recorded
      in the registry beside the kind
- [x] `holds` and `renderable` decided for each — a kind that has not decided
      does not compile
- [x] `content-context-and-state-graphs` consulted before any registration

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



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open branch touches it; the sessions that held theme D (content folios, SMART/FHIR stack, ingest) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run beans:claim <id>`.

_2026-09-30T10:09:58Z_ — Claimed by claude/zhg2-direction-sidecar — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Claimed 2026-09-30 — by `claude/rjug-two-kinds`, and the holder note on `main` names the wrong branch

`bun run beans:claim folio-assistant-rjug` was run once from the WRONG
checkout. `cat-harness/scripts/claim-bean.ts` resolves its store from
`process.cwd()` and reads the holder branch from `git rev-parse --abbrev-ref
HEAD` in that same directory, so the claim landed correctly on `main`
(`e1815ab372f`, 10:09:58Z) while recording the holder as
**`claude/zhg2-direction-sidecar`** — the branch the OTHER checkout happened to
be sitting on, which has nothing to do with this bean.

Re-running it from the right worktree then refused `already-claimed by
claude/zhg2-direction-sidecar`: the script compares `heldBy` against the
current branch, and a mislabelled claim is indistinguishable from a sibling's.

Recorded here rather than worked around silently, because the holder note is
the only thing that tells a live claim from an abandoned one. **The real holder
is `claude/rjug-two-kinds`**, and the mislabel is a defect in the claim script,
not in this bean — filed separately as `ssfp` so this bean stays about the two
graph kinds.

## Summary of Changes — 2026-09-30 (§1 and §2; §3 shipped 2026-09-22)

PR #1571, issue #1569, branch `claude/rjug-two-kinds`.

### §1 metadata indexes — OPTION B

| | |
|---|---|
| schema | `cat-harness/schemas/ig-metadata-index.ts` — `folio-ig-metadata-index/v1` |
| kind | `ig-metadata-index`, `holds: "derived"`, `renderable: false` |
| tests | `cat-harness/schemas/ig-metadata-index.test.ts` — 21 |

A **sibling** of `fhir-artifact-index`, which is the whole content of the
ruling. That index is a RECONSTRUCTION — assembled from four partial published
views because no IG publishes such an index, every field naming the file it
came out of. This is a TRANSCRIPTION of three files the IG does publish. Option
A would have hung a `metadataExports` block off the index, and the bean's own
objection is why it lost: *"Risks making the index a bag."* One document
holding both leaves a consumer unable to tell a fact this repository assembled
from a fact the Publisher asserted.

**`derived`, and the axis's two questions agree.** It does not stand on its own
— every record is an edge or a count about artefacts named elsewhere. And you
would REGENERATE it: re-harvest an unchanged IG and the same file comes back.
That last clause is exactly what separates it from `binary-release`, where
re-running produces a different release, and it is why one is `derived` and the
other `state` although both sit downstream of a build.

**Bean `nsbb`'s two measured findings are carried as SHAPE**, because both are
absences that must not read as zeros: `uses` is declared-and-never-populated in
both IGs measured (hence a three-state `usesState`, where a bare array would
erase the finding), and nothing exports Library / PlanDefinition / Measure
edges at all (hence `IG_METADATA_UNREACHED_TYPES` and `dependencyReach`, so
silence over the decision-logic core reads as uninformative rather than clean).

### §2 binary releases — OPTION A

| | |
|---|---|
| schema | `cat-harness/schemas/binary-release.ts` — `folio-binary-release/v1` |
| kind | `binary-release`, `holds: "state"`, `renderable: false`, `recordsWork: false` |
| tests | `cat-harness/schemas/binary-release.test.ts` — 25 |

**The reservation was decided, not assumed, and `gpdo` changed the answer's
shape.** `gpdo` landed 2026-09-23 (owner: "Third purpose"; issue #1194 still
open), adding `compiled` to `MATERIALIZATION_PURPOSES`. It SHARPENS the
mismatch rather than softening it: all four purposes — `working`, `archival`,
`both`, `compiled` — are purposes of A COPY THIS INSTANCE HOLDS. A release's
subject is a publication UPSTREAM, true whether or not a byte was ever fetched
here and still true after every local copy is gone. `gpdo` added a third
question (validity against inputs) and a release answers it no better than the
other two: it has no inputs, it has a version. The two COMPOSE — a release node
says what was published; a materialization record says a copy is here.

**`recordsWork: false`** — live state, but nothing anybody is partway through.
A published release is a completed fact; an arriving agent cannot pick one up.

**The case it exists for is the deploy purge.** After the WHO deploy phase
deletes its >100 MB files, nothing else anywhere records that they existed —
not the deployed site, not the repository, not a materialization record,
because no copy was kept. Hence `deleted-before-deploy` as a disposition,
`fetchedFrom` required even on a purged asset, and the rule that a DECIDED
disposition must say why.

### `renderable` — the ruling did not settle it, so it is decided here

**Both `false`.** `renderable` asks whether a graph is wired to the SITE BUILD,
not whether a human could be shown it — the line `code`'s own entry already
draws, being legible and still `false` because `true` "would promise a page for
every module".

- `ig-metadata-index`: machine-readable edge lists harvested from somebody
  else's published site. `true` would promise a page per export for every IG
  ever harvested, and the IG's own rendering is the IG's — already published,
  at the URL `source.harvestedFrom` names.
- `binary-release`: a provenance ledger consulted when somebody asks where a
  file went. `true` would promise a published page per release listing every
  asset's fetch URL, **including the ones a deploy phase deleted on purpose**.
  The kind exists to make that history askable, not to republish it.

### NOTHING PRODUCES FILES OF EITHER KIND TODAY

Established before registering either, because `audit:coverage`'s own lesson is
*a validator over the nodes nobody produces is not coverage*:

- `ig-metadata-index` — no code reads `valueset-ref-list.json`,
  `codesystem-ref-list.json` or `usage-stats.json`. Every reference is prose
  (beans `nsbb`, `a9tx`; `docs/ig-publisher.md`; the `ig-publisher-fork`
  skill), all quoting a measurement taken by hand. `ingest-ig-artifacts.ts`
  builds `fhir-artifact-index` from a different set of files.
- `binary-release` — nothing enumerates releases. The one `releases/latest`
  hit in the tree is a third-party CLI download in `deploy-folio.yml`.

Registering both is still right: it reserves the axis and makes the declaration
expressible. **But the coverage story is "declared, no directory"** — the row
`qa-report` already carries — and it is not reported as though a real corpus is
being audited. **No fixture files were manufactured to make a count non-zero.**

`audit:coverage` went from 45 declared kinds to 47; both new rows are
`0 files, 0 criteria, 0 gates, 0 sidecars, no-directory`. `no-directory` is not
a `--strict` finding (`--strict` fails on `unaudited` and `typed-only`, both of
which mean a kind WITH files), so `audit:coverage:require-all` and
`audit:coverage:strict` both stay at exit 0, as do `check:kind-validators` and
`check:graph-kind-work`.

### Status

All three Done-when boxes are now ticked and all three sections are ruled and
implemented. **Left `in-progress` rather than closed**: #1571 is not merged, and
a bean closes on evidence that the work has landed.

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3 (7x5n sweep of in-progress beans whose work has landed). Every Done-when box was already ticked by its holder. That was NOT taken as the evidence: the measurement below was re-run on main at 24b221415 (2026-10-06), and no open PR names this bean.

- The holder left this open only because #1571 had not merged. **#1571 merged 2026-09-30T13:54:33Z** ("rjug §1 and §2: `ig-metadata-index` (derived) and `binary-release` (state) registered"), which discharges that reason.
