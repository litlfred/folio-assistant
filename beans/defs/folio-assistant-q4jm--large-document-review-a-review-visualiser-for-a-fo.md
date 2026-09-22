---
# folio-assistant-q4jm
title: 'LARGE-DOCUMENT REVIEW: a review/ visualiser for a folio''s diff from main — pluggable renderers, heat maps, navigation and review comments, keyed on folio/ block ids'
status: todo
type: epic
priority: high
created_at: 2026-09-22T21:02:29Z
updated_at: 2026-09-22T21:09:45Z
---

## What this is

Owner, 2026-09-22 (session_017nyJj3PsjvszpF3DyGeBgE), verbatim across four
turns because each one moved the scope:

> learn skills for document review for large things like a DAK or L1 digital
> transofrmation hadbook. use it to develop tools in redendering/visauatlion as
> part of docuemnt editiing and review process. will use feature branch
> /staging for comparison against main. review navigation, heat map skills.
> bean up workplan to flush this out completley, process, roels, tools.
> integrate into current processes. bean up and roast.

> doc ingest

> put into folio-assistant-core, need a new visualizer under the harness maybe,
> like review/ which shows things in folio diff from main, select different
> diff rednerers/viz, ? and then manage review comments etc.

> blocks are in the knoledge graph folio/. QA, to manage IDs

## The shape

A reviewer of a 300-page DAK or L1 handbook has three problems, and today the
repo solves none of them for a document that size:

1. **Where to look**: outline, "where am I", and next change / next unreviewed.
2. **What changed**: `main` against the feature branch's STAGING build, block
   by block, through a renderer they choose.
3. **What has been reviewed**: comments anchored to blocks, coverage per
   section, and a heat map that aggregates it.

Everything is keyed on the **block id in the `folio/` graph**. That makes id
stability, which is **QA's job**, the load-bearing precondition. If ids drift
on re-ingest or re-render, every diff reads "all removed, all added" and every
comment orphans.

## Placement (owner: "put into folio-assistant-core")

| piece | home | why |
|---|---|---|
| review skills, the ChangeSet / ReviewComment schemas, the id-stability QA criterion | `folio-assistant-core/` (`skills/review/`, `schemas/`) | content vocabulary: what a block IS and how it changed. See the core AGENTS.md rule |
| the `review/` visualiser page and its generator | `cat-harness/` (a `gen-review-viz.ts` beside the other `gen-*-viz.ts` generators) | the harness owns the rendered surface. Precedent: 7ofc, where the owner ruled the folio/ visualiser is owned by cat-harness |
| the BPMN process | `cat-harness/processes/` | processes are harness `kg` |

## Children

The ordering is: ids, then the change set, then the views, then comments.
Each child's `Done when` is its contract.

## Not in scope

- **Rebuilding staging.** lx2s, g196, oz5w and 1lfx own that.
- **Rebuilding the navbar.** sjic and 603s own it. The review page PLUGS INTO
  it rather than competing with it.
- **Generic QA verdicts.** 9gyz owns Finding/Decision/AuditNote, and review
  comments ARE Findings, not a parallel type.


## ROAST HELD 2026-09-22: eight findings, three of them plan-breaking

Held in the same session that wrote the plan. Each finding was measured
against the repository, not argued. The claims in the children are
**corrected in place** (each child carries a `## Roast correction`), not
deleted, so the next agent sees what was believed and why it changed.

### Plan-breaking

**R1. A folio in its own repository gets NO staging build, so review/ has no
"after".**
- `.github/workflows/feature-staging.yml` triggers on `pull_request`,
  `pull_request_target` and `workflow_dispatch`. It has no `workflow_call`, so
  another repository cannot reuse it.
- `init-folio.ts` mentions staging **0** times.

Today, STAGING exists only for this platform's own docs site. A DAK or L1
folio lives in a separate repo, so the whole epic would ship a comparison page
with nothing to compare against. New child: FOLIO STAGING.

**R2. "Accept = PR approval" cannot work for the owner's own edit sets.** The
last five PRs here (#961–#967) were all opened as `litlfred`, because agents
push through the owner's identity, and **GitHub refuses an approval from the
PR's author**. Approval works when an SME or second editor accepts. For a
single-owner folio the accept path needs a second mechanism. Options for q4cm:
1. require a second GitHub account in the editor lane;
2. treat an owner's review with a fixed marker plus the "merge it" instruction
   as acceptance;
3. branch protection with a CODEOWNERS approval by a separate reviewer account.

This is the owner's call.

**R3. The process mostly EXISTS, and it fuses the two steps the owner just
separated.** `content-change-review.bpmn` already has Author, Agent, Review
Committee and CI lanes; "Create feature branch"; "Deploy to STAGING/<slug>/";
"Comment staging URL on PR"; **"Compare main vs staging"**; "Changes
approved?" and **"Approve and merge"**. That last one is a single task. The
owner's rule (*"accept=approve for publishing"*) and the existing
merge-confirmation rule both need approval and merge as TWO steps. en2d should
therefore EXTEND this diagram (a sliced-review sub-process at "Compare main vs
staging", plus the coverage gate) and split "Approve and merge". It should not
draw a second diagram answering the same question.

### Corrections to what the children claim

**R4. The review comment is not a new schema, and today it cannot carry a
hash or a SHA.** `schemas/qa-review.ts`: `QaReview.subject` is `{kind, id,
path}`, where `kind: "block"` is already allowed. `Finding.subject` is a free
string. Neither carries a content hash or commit SHA. Anchoring as 423d
describes it is a change to **cat-harness/schemas/qa-review.ts**, which is
9gyz's file. Name that collision before touching it (coordinate.md: *the
collision surface is FILES*).

**R5. The placement table was wrong on two rows.** folio-assistant-core's
rule is *"A schema describing skills, workflows, roles or tools belongs in
cat-harness/"*.
- The renderer registry describes rendering TOOLS, so it is harness. Only
  **ChangeSet** is content vocabulary and belongs in core.
- Review comments are already a harness schema (R4).

The skills stay in core: the rule is about schemas, and core already hosts
`skills/voices/`.

**R6. The TOC ruling does not forbid an outline, but it does not permit one
either.** docs-auto.md: *"no toc,... ther is no meanging at folio level/.
(mayber later)"*, *"a sub-graph has no single order to take one over"*. A
DOCUMENT folio (an L1 handbook) HAS a single order: its manifest's. That puts
the outline inside "maybe later", not against the ruling. It is still the
owner's call, so eb4l keeps it as a question and does not assume the answer.

**R7. There is no in-repo folio to demo on.** `folio-assistant-core/folios/`
holds only a README. `smart-immunizations` renders no HTML by the owner's
ruling and is provisional (nsbb). So xp72's fixture must be synthetic, or
come from xtpc's ingest. It cannot be borrowed.

**R8. Collision with stream 2.** `docs-ui.js` is 6,300 lines and is stream
10uc's main file. The review page's JS goes in its **own module**, loaded only
on review/ pages. Adding to docs-ui.js would make every child of this epic
collide with every navbar PR.

### Held, and still true

- No diff library is present (`package.json`: none matching diff or pixel).
- There is no block-id stability or uniqueness criterion. The duplicate-id
  checks that exist cover references (`validate-references.ts`) and
  dependency steps (`dependency-order.ts`), not folio blocks.
- `document-intake` sits only in folio-paper-adapter. The document adapter's
  pandoc hits are about PUBLISHING (md → pdf), not intake.

### Priority

Filed `todo`, not `in-progress`. Three streams are already queued
(`jo87`, `k660`, `mkqf`) and #957 measured a stall from over-claiming.
Nothing here is claimed until a session actually takes it. **Which goal this
epic joins (p5wm, yg29, or a new one) is unasked**: it is parented to nothing,
like 1swy.


### R9. The owner already filed half of this, as issue #197 (2026-09-17), and the plan missed its other half

#197 covers DOCX ingest with page/line provenance (now on xtpc) **and** a Public Comment process: a line-numbered frozen draft goes out, and comments come back as CSV/XLSX to be triaged, reassigned, assigned and dispensed. The first draft of this plan had only in-page comments. That is not how DAK and L1 consultations are run. It is a new child, and it shares 423d's Finding store rather than getting its own.
