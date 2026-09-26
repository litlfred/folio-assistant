---
# folio-assistant-ce65
title: Tool nodes exist for 11 of 138 skills — audit which uncovered skills describe an action
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T20:21:01Z
updated_at: 2026-09-19T07:07:53Z
parent: folio-assistant-zzmr
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

_2026-09-19T00:41:33Z_ — Checked 2026-09-19 on main at 17dc1e6 — GENUINELY LIVE. The build half is landed (#279: schemas/tool.ts, schemas/tool-types.ts, four Tool nodes, check:tools gated). What this bean's title asks for — auditing which of the uncovered skills describe an action — is editorial work that no commit can be checked against, so it stays open until someone does it.

_2026-09-19T05:52:08Z_ — ## Actor-kind slice shipped — PR #329, branch `claude/ce65-actor-kinds` (2026-09-19). NOT merged.

Owner's direction, verbatim: *"classify as you suggest. agentic, human or mechanical... corresponding to three actor types. tasks can be fulfilled by only certain actor types"*. Three kinds, and the POINT of them is a checkable constraint. Both halves are in #329.

### Re-measured on main, 2026-09-19 — do not quote later without re-running

24 actors (16 `person`, 8 `system`); 30 roles (17 person, 5 agent, 7 system, 1 external); 143 skills via `scripts/known-skills.ts`; 30 diagrams, 247 activities, 190 serviceTask + 72 userTask. **The bean's stated finding is CONFIRMED**: `type` had two values and `system` covered five LLM agents and three mechanical services alike.

### Two things the re-measure turned up that this bean did not have

1. **The three-way split was ALREADY in a schema — the wrong one of two.** `ACTOR_KINDS` in `schemas/role-graph.ts` has read `person|agent|system|external` all along, while `ActorTypeSchema` in `schemas/skill-package.ts` read `["person","system"]` — and `SkillRegistrySchema` validates the actor FILES against that narrower one. Two spellings of one concept, in the one place where the difference decides what a task may be handed to. Now one declaration in `skill-package.ts`, re-exported from `role-graph.ts`; `ActorType` deleted.
2. **The distinction was already written in the registry's own PROSE.** `ci-pipeline`: "runs a fixed program and exercises no judgement". `review-agent`: "NON-MECHANICAL validation ... judgement calls escalate". Unreadable by anything. The same failure `judgementOnly` exists for.

### The split: `type` -> `kind`. 16 person, 5 agent, 3 system

agent: authoring-agent, evidence-agent, ingestion-agent, onboarding-agent, review-agent.
system: ci-pipeline, ig-publisher-service, lean-mcp.
Each follows the entry's own description. An unknown `kind` THROWS; a legacy `type` still loads and is NEVER read as agent — an unmigrated registry has not said, so it is refused a judgement task rather than granted one on a guess.

### New criterion `activity-fulfilment-kind` (major)

Derived from the BPMN task type, which already answers it and was not being read: `userTask` -> person; `serviceTask` -> agent|system; `bpmn:Task` and `callActivity` assert NOTHING (`undefined`, never `[]` — an empty list would fail every plain task). `n/a` for actedUpon lanes; silent where `lane-binds-role` or `activity-in-lane` already reports. Override with `<folio:fulfilment kinds="..." reason="..."/>`, reason required AT LOAD, same rule as `<folio:no-skill reason>`.

**FOUND: 15 findings in 6 processes, ALL serviceTask in a human lane. ZERO on the 72 userTasks** — that half is a regression guard, not debt. Sharpest: `editing-hci-validation` `Task_AgentReview`, "Agent review of the change", a serviceTask in the `reviewer` (person) lane. **LEFT AS FINDINGS deliberately** — each has three possible answers (task type wrong / lane wrong / step really does admit that kind) and choosing is per-diagram judgement, not a sweep.

### OPEN QUESTION for the owner — measured, not guessed

Actor `kind` vs the `actorKind` of each role it declares: 7 mismatches before the split, 5 of them artefacts of the conflation. TWO remain and both are substantive:

    authoring-agent (agent) -> role editor   (person)
    review-agent    (agent) -> role reviewer (person)

These may not be bugs. `review-agent`'s own description says it DOES review and escalates only the judgement calls, so `reviewer`'s single `actorKind: person` may simply be too narrow. Two options, with costs:

- **(a) Role keeps ONE `actorKind`** — these are data errors; drop `editor` from `authoring-agent` and `reviewer` from `review-agent`. Near-zero cost, but it asserts an agent may never review, contradicting `review-agent`'s description AND `Task_AgentReview` in the corpus.
- **(b) Role declares a SET** — `reviewer: ["person","agent"]`. Costs a schema change, 30 role entries, and `readsProse` + `activity-fulfilment-kind` updated to read a set. Makes agent-assisted review sayable.

If nothing is said, it stays as it is: 2 measured mismatches, checked by nothing. I did NOT write an `actor-kind-fits-role` criterion, because writing one means picking (a) or (b), and a criterion whose summary must hedge is a bad criterion.

### Deliberately NOT done — still open on this bean

- **The bean's ORIGINAL question is untouched**: Tool nodes for 11 of 138 skills, the tier A/B/C/D triage, opening Tools for the mechanism-inlined group.
- **88 activities are drawn as abstract `bpmn:Task`**, which asserts nothing — about a third of the corpus is outside the new constraint for that reason. LARGEST remaining gap. Retyping them is a corpus sweep plus 30 regenerated SVGs, and guessing each type is the fake-ref failure.
- **No rename** of person/agent/system to human/agentic/mechanical. The ids are load-bearing in 30 roles, `kg-export`, `kg-audit` and the sidecars; the owner's words are documented as their READING. A second vocabulary alongside the first is the one thing I would not do.

### Gates — exit codes checked directly, never through a pipe

tsc 0; eslint 0; kg:audit:check 0; kg:schema:check 0; check:workflows 0; check:workflow-refs/policy/tools 0; gen-schema-docs / gen-skill-docs / gen-docs-pages `--check` all 0; gen:jsonld:check 0; playwright 60 passed after `rm -rf _kg`. `bun test` 2035 pass / 1 fail — `folio-root.test.ts` asserts REPO_ROOT ends in "folio-assistant" and this agent runs in a worktree; fails identically before this branch. `render:bpmn:check` could not run (bpmn-js absent from node_modules) but no `.bpmn` file changed.

### TRAP worth keeping

`gen-docs-pages` writes `docs/assets/qa/**/*.kg.json` witnesses that carry **kg-audit.ts's OWN script hash**. Editing the auditor made 134 of them stale and took the TypeScript gate red on the first commit — green alone, red together, bean `nytj`'s family. `gen-docs-pages` is NOT named in most briefs; it is the third generator after `gen-skill-docs` and `gen-schema-docs`. Re-run all three plus `gen:jsonld` after touching KG data.

### Fixed in passing

`role-model.md` and `AGENTS.md` both said "Fourteen criteria" while `KG_CRITERIA` held **32**. Replaced with a pointer to the registry rather than a fresh number — a count in prose is a claim.

_2026-09-19T07:07:53Z_ — The open modelling question is ANSWERED by the owner: "role can set of actor kinds". Implemented 2026-09-19 on branch claude/role-actor-kinds-set.

`Role.actorKind: ActorKind` -> `Role.actorKinds: ActorKind[]`, non-empty, across all 30 roles. A RENAME rather than "singular that also accepts an array", because two spellings of one concept is the drift this repo keeps paying for. The ACTOR keeps its single `kind`: an actor IS one kind of thing, a role ADMITS several, and collapsing either into the other loses a distinction the graph is built on. `kg-export` now declares both terms for exactly that reason -- and ovkk's new undeclared-term gate caught the mistake within seconds when I first renamed the wrong one.

THE TWO MISMATCHES TURNED OUT TO BE DIFFERENT QUESTIONS, which is why leaving them was right.

1. `review-agent (agent) -> reviewer (person)` is a role that was too narrow. Three independent pieces of corpus evidence: `reviewer`'s own description says "Reads a change and judges it. Cannot accept it"; `review-agent`'s description says it performs NON-MECHANICAL validation and escalates only the judgement calls; and the BPMN lane holding `Task_AgentReview` is literally named "Non-mechanical validation (review agent or SME)". Widened to ["person", "agent"].

2. `authoring-agent (agent) -> editor (person)` is NOT. `editor` is defined as "Author plus THE AUTHORITY TO ACCEPT a change into the corpus. The lane that sees QA findings and decides." And `authoring-agent`'s own description says "It NEVER COMMITS: its output enters the HCI validation pipeline and the editor accepts, revises or discards." The actor's description forbids it the role. So the defect is the `editor` entry in that actor's `roles` list, not the role's narrowness. LEFT as a recorded finding rather than resolved either way: removing a role from an actor and redefining `editor` are both larger than this change, and picking one silently is the failure this bean already avoided once.

NEW CRITERION `actor-kind-fits-role`, `major`, on the role subject -- the one this bean deliberately did not write. It was unwritable before because with one kind per role every finding had two readings and the criterion could not say which. Now that widening a role is SAYABLE, a surviving mismatch means the actor's `roles` list is wrong: one reading, so a finding somebody can act on. Scoped exactly like `role-has-actor` (`n/a` for an actedUpon lane, `unknown` when no entry declares `roles`) so the two directions of one question cannot disagree about when it is askable. It reports exactly 1 finding: `role:editor`, case 2 above.

FALSIFICATION CHECK, stated before the work and run after: if widening `reviewer` made the existing `activity-fulfilment-kind` findings disappear, the constraint had been loosened into uselessness. Measured: 15 findings / 6 processes -> 14 / 5. Exactly one cleared, and it is `editing-hci-validation`'s `Task_AgentReview` -- the case the widening was justified by. The constraint held.

Both readers updated to set semantics with the reasoning recorded: `readsProse` uses ANY (one reader is enough for prose to be reachable), and the fulfilment check uses a non-empty INTERSECTION between the step's allowed kinds and the role's admitted kinds -- requiring every kind would fail a lane the moment it was widened, which is exactly backwards.

Still untouched: the bean's ORIGINAL question (Tool nodes for 11 of 138 skills) and the 88 abstract bpmn:Task activities that assert nothing.
