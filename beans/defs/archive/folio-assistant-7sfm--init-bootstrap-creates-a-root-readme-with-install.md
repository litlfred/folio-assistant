---
# folio-assistant-7sfm
title: 'INIT: bootstrap creates a root README with install status — and says why creation at initialisation is not a process write'
status: completed
type: task
priority: normal
created_at: 2026-09-21T05:50:07Z
updated_at: 2026-09-21T07:04:18Z
parent: folio-assistant-zzmr
---


Carved out of `ie9l` when issue #592 was closed (2026-09-21, owner's word).
Two of `ie9l`'s six `Done when` boxes, together because `ie9l` itself showed
they are one thing.

Owner, on `ie9l`:

> whwn cat-harness boostrap init takes over it creates README.md if it does
> not exist and add link and overall harness install statue.

**Neither box was started.** Nothing in `bootstrap`'s initialisation
writes a root README, and the rule below is written nowhere — grepped
`skills/` and `docs/` on 2026-09-21, no match.

## Why the two are one bean

`ie9l` found an apparent contradiction in its own asks and resolved it:

> Ask 3 says bootstrap init **creates** README.md if absent — a write. Ask 6
> says it is an asset **like memories** — context, never written by a
> process. Both hold, because **initialisation is not process runtime.**

So whoever implements the write must also state the rule, in the same change,
or the next reader finds a `context` graph being written and calls it a
defect. Splitting them is how the statement never gets written.

## Done when

[x] `bootstrap`'s initialisation creates a root `README.md` when absent —
    `A_WriteRootReadme`, the last step of `initialize-harness.bpmn` before
    `End_Installed`, naming the new `root-readme` skill
[x] It carries the link and the overall harness install status — two things and
    no more; the harness's own `readme_sync` fills the rest once installed
[x] Wherever this lands, it states that creation at INITIALISATION is not a
    process write — `content-context-and-state-graphs` §"A declared ASSET
    carries a layer too", and the skill says that page wins where the two
    disagree

## How it was done, and the one thing that was not obvious

**There is no code to change.** bootstrap contains no executable code by
design (its own FR-7), so "initialisation creates a README" is a BPMN activity
plus the skill it names, not a `write()` call. `init-folio.ts` already writes a
folio README, and mistaking that for this bean would have satisfied the box in
the wrong repository layer: `init-folio` scaffolds a folio from a harness that
is already installed, while this is the step that runs when the harness has
just arrived.

**NEVER replaces an existing README.** The bean did not ask for this and the
skill states it anyway: an existing README is authored content, and
overwriting it to state a fact that belongs in a generated region is an
unrecoverable trade. The link and status go in a marker pair `readme_sync`
owns from then on.

Also updated: `bootstrap/README.md` gains step 6 and FR-8,
`package-manifest.json` registers the skill, and `AGENTS.md` stops counting
the skills (it said "two"; the manifest is the list).

Issue #668 · PR #666. Recorded both ways per `oh78` / PR #657: a bean
opened from an issue carries the link, and `check:bean-issue-links` now asks.
