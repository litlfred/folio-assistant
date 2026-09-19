---
# folio-assistant-ce65
title: Tool nodes exist for 11 of 138 skills — audit which uncovered skills describe an action
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T20:21:01Z
updated_at: 2026-09-19T00:00:30Z
---


Opened 2026-09-18, after the work rather than before it — the same unclaimed-work
failure as `1dfh`, recorded rather than backfilled quietly. Twice in one session
is a pattern, not an accident: both times I went from a one-line instruction
("do schemas/tool.ts") straight to building.

## Done in #279

`schemas/tool.ts`, `schemas/tool-types.ts`, four Tool nodes in `tools/`,
`check:tools` gated in CI, Tool nodes published in the KG with `satisfies` as
resolving links. Verified against the published staging artefacts, which caught
a real bug — see below.

## The number, and what it does and does not mean

**4 Tools cover 11 of 138 skills.** `check:tools` reports that and does not fail
on it, deliberately: a great many skills are pure judgement
(`interaction-modality`, `one-voice-style-guide`, `symbiotic-interaction`) and
have no mechanism to name. A Tool for them would be an invention.

**What the check cannot tell you is which uncovered skills describe an ACTION.**
Those are the ones whose mechanism is still inlined in prose — the debt
`skills-and-tools` names. Distinguishing "no mechanism exists" from "the
mechanism is written into the skill body" is a judgement about what each skill
is for, and it needs a human read rather than a heuristic. A grep for backticks
or `gh `/`bun run` would over-report: a skill may legitimately quote a command
as an example while still stating its capability generically.

So the work is: read the 127 uncovered skills, mark each as
**judgement-only** / **mechanism-inlined** / **mechanism-exists-elsewhere**, and
open a Tool for the second group. Probably worth doing per package rather than
in one pass.

## Known-good starting points

`prepare-merge-auto`, `pickup`, `watch` and `coordinate` are already covered by
the `github` Tool, so the four PR-choreography skills are the worked example of
what "covered" looks like — their prose still carries `mcp__github__*` calls
inline, which is exactly the thing to strip now that a Tool exists to reference.
That is bean `4dbr`'s migration step 1 and this bean's clearest first slice.

## The bug worth remembering

The first staging build published `tool-types.schema.json` at the STAGING url —
its `$id` was correct — while the Tool nodes in the same document referenced the
CANONICAL one, a document that does not exist on main because #279 introduces
it. Every `io.*.schema` pointed at a 404 while looking like a resolvable
absolute IRI.

`tools/index.ts` read `canonicalUrl` from the declaration and ignored
`--base-url`. Found by fetching the published artefacts, not by any test, and
not by checking that the files existed — the `$id`s were all correct. **The
references BETWEEN documents were wrong.**

Rule now stated in the module and pinned by a test that was verified to bite:
anything that mints an IRI takes its base from the same source as the document
it will be published beside.

---

## Triaged 2026-09-18 — `bun run tools:coverage`

The bean said distinguishing judgement from inlined-mechanism "needs a human
read rather than a heuristic". That was half right: a **grep** is the wrong
instrument, but the corpus already carries a much better signal.

**BPMN task TYPE.** A process step is not merely "implemented by" a skill — it
is a `serviceTask` (runs without a person) or a `userTask` (performed by one),
and every diagram already says which.

| tier | evidence | count |
|---|---|---|
| **A** | a `serviceTask` names it, or it has an I/O contract under `schemas/skills/` | **16** |
| **B** | a `userTask` only — judgement inside a process | 3 |
| **C** | a shell block, no process edge — **ambiguous, needs a read** | 52 |
| **D** | nothing | 47 |

**The read shrinks from 118 files to 52.** Tier A is a list to act on; tier D is
a list to dismiss.

### What the triage overturned

`interaction-modality` was this bean's standing example of a pure-judgement
skill. It is in tier A. **Two** activities name it:

- `Task_DetectModality` — a `serviceTask` that reads `.harness/interaction.json`.
  That is a mechanism and could be a Tool.
- `Task_AskIntent` — a `userTask` about how to frame a question. That is
  judgement and never will be.

**So the question is not "is this skill a Tool?" but "which PART of it is."**
Ten of the sixteen in tier A are `serviceTask` AND `userTask`. A skill with both
is not mis-modelled — it has a mechanical half that should move to a Tool and a
judgement half that stays. That reframing is the useful output here, and it
changes what "migrate a skill" means: it is a split, not a move.

### Tier A, the list to act on

content-author, content-feedback, content-plan, content-publish, content-review,
content-test, content-validate, document-authoring, document-intake,
document-publishing, document-structure, getting-started, interaction-modality,
normative-statements, repo-conversion, translation-manager.

Note how many are `content-*` lifecycle skills with I/O contracts already
declared — those are the cheapest, because the contract that a Tool's `io` needs
is written.

### Why a grep would have failed

52 uncovered skills contain a fenced shell block — 44 % of them. A skill may
legitimately quote a command as an example while stating its capability
generically. That is tier C, and it is precisely the set where no mechanical
signal decides it.

_2026-09-18T22:50:27Z_ — Migrated this instance's twenty served MCP tools into Tool nodes (tools/mcp.ts) on branch claude/migrate-mcp-tools. Coverage 11/138 -> 26/141 skills. Contracts read from the live registrars via 'bun run mcp:capture' rather than from source text — an earlier regex pass over server.tool(...) produced parameter names lifted out of description prose. A test compares the two sides on every run. Two vocabulary gaps closed: ToolInput.repeated (folio_init.authors, stakeholder_map.paths, readme_sync.only are lists) and invoke.inProcess (17 of 20 are TypeScript functions with no shell arm). Shared type vocabulary 14 -> 31 defs, 27 of them injection-safe by construction.

_2026-09-18T23:58:56Z_ — OWNER DIRECTION 2026-09-19, superseding the three-way split in the body above. Classify each uncovered skill by the ACTOR TYPE that can fulfil it — agentic, human, or mechanical — corresponding to the three actor types in the role model, with the rule that a task can be fulfilled by only certain actor types. This is better than judgement-only/mechanism-inlined/mechanism-exists-elsewhere because it is the same axis the corpus already carries rather than a new vocabulary: BPMN already distinguishes serviceTask (mechanical, runs without a person) from userTask (human), and the role model now carries judgementOnly (acts, but no procedure yields the answer) and actedUpon (written to, never acts). So the classification is checkable against the diagrams instead of being one reader's opinion, and it makes the Tool question fall out rather than be asked separately: a mechanical task needs a Tool, an agentic one needs a skill, a human one needs neither and must not be given a fake skill ref. Open question for implementation: whether the three are a property of the SKILL, of the TASK that names it, or of both — a skill may be mechanical in one process and agentic in another.

_2026-09-19T00:00:30Z_ — MEASURED 2026-09-19, and the three types do not exist yet. .claude/skills/actors/ carries TWO: person (16) and system (8). `system` conflates agentic with mechanical, so the owner's three-way split needs that field widened before anything can be classified against it. Triaging the eight by their own descriptions: AGENTIC (an LLM exercising judgement) = authoring-agent ('LLM agent that drafts and revises a PROPOSED change'), review-agent ('LLM agent performing NON-MECHANICAL validation'), evidence-agent ('retrieves and appraises'), ingestion-agent ('runs unattended... every gate it reaches'), onboarding-agent ('the authoring agent acting before there is a folio'). MECHANICAL (deterministic, no judgement) = ci-pipeline ('the build and validation system'), ig-publisher-service ('FHIR IG Publisher build and QA reporting'), lean-mcp ('Lean 4 proof checking and diagnostics'). So 5 agentic, 3 mechanical, 16 human. Note the boundary is judgement, not autonomy: ci-pipeline runs unattended and is still mechanical, while ingestion-agent also runs unattended and is agentic because it decides. SEPARATELY: Actor.type currently COLLIDES with the JSON-LD `type` alias for @type in the published graph (24 nodes), so whatever this field is renamed or widened to must not be called `type` — see the kg-viewer branch.
