---
# folio-assistant-y1w9
title: 'MEMORY REACH: 113 skills are bound to no role or process, so nothing hands them to an agent'
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T18:34:19Z
updated_at: 2026-09-20T16:15:40Z
parent: folio-assistant-8jt6
---


**Found by paying the cost, 2026-09-19.** Not a survey finding — a measured
loss in one session, twice.

## What happened

While working `folio-assistant-n60j` I "discovered" that the gate list must
be derived from the CI workflow rather than from `package.json`, wrote a
runner and a skill around it, and reported it as a finding. It was already
recorded, that same day, in
`skills/memory/derive-the-gate-list-from-the-workflow.md`.

Separately I hit the same CI-reading confusion **three times** — that
`actions_list` filtered by branch returns runs for other commits, and that
`get_status` reports `pending / total_count: 0` on a PR whose checks are
green. Both are recorded, in `skills/memory/read-the-ref-not-the-url.md`,
which even names the remedy (`get_check_runs`, and compare `head_sha`
against the PR head).

Both entries are tagged `agents: [ci-health-watcher]`. I am the main
session. I never invoked that subagent, so its memory was never injected.

## The mechanism, and why it is not a memory problem

The knowledge is not only in memory — there is a **skill**,
`skills/folio-core/github-state-inspection.md`, 6 KB, covering exactly
these traps. Measured today:

    grep -rl 'github-state-inspection' processes/ scenarios/
    → nothing

**Bound by no diagram and no role.** So no process step hands it to
anybody, and an agent finds it only by already knowing it exists.

That is one instance of a number `kg:audit` already reports and nobody has
acted on: **`skill-in-role-or-process` — 113 findings.** 113 skills that
exist, are written, are published, and are attached to no lane and no
role. The audit grades them `major`, which is why `kg:audit:check` (which
fails only on `critical`) is green with 113 of them outstanding.

## Why this is worth its own bean rather than a sweep

The obvious fix — bind all 113 — is wrong. A skill bound to a role it does
not belong to is worse than an unbound one: it widens that role's closure
until an audit cannot fail, which is the same failure `role-model.md`
records for merging `inherits` with the subprocess stack.

So this is triage, not a sweep. Each unbound skill is one of:

- **belongs to a role** — bind it (done today for
  `github-state-inspection` → `authoring-agent`)
- **belongs to a process step** — bind it there, which usually means a
  diagram is missing rather than a ref
- **is reference material nobody performs** — then it is not a skill in
  the role model's sense, and saying so is the fix

## The sharpest question this raises

Should a fact an agent needs live in a SUBAGENT's memory at all? Memory is
`memory: project` per agent, so a fact filed to `ci-health-watcher` is
invisible to the session doing the work. Two documented traps cost time
today for exactly that reason. The skill is the source of truth and memory
only summarises — but the summary reached nobody, and neither did the
skill.

## Done when

- [ ] the 113 are triaged into the three buckets above, with counts
- [ ] no skill is bound to a role merely to clear the finding, and the
      audit records the "not performed by anyone" verdict as a real state
      rather than an omission
- [ ] whether agent-scoped memory can reach the main session is answered
      either way, and written down

## Triage attempt 2026-09-19 — the mechanical route is BLOCKED, and why

Count re-derived rather than quoted: **112**, not 113 — two bindings
earlier the same day had already moved it. Now **110**, see below.

### The hypothesis, and its failure

I expected the triage to be mostly evidence-backed rather than judgement:
skills declare `roles:` in their own front matter, so a skill saying who
performs it would justify the binding without my inventing anything.

**89 of the 112 do declare `roles:`. Only 2 name an actual swimlane role.**

The field is overloaded. Across all 178 skill files it carries 254 uses of
an undeclared vocabulary (`collaborator` 101, `owner` 95, `reader` 55,
plus `admin` and `auditor`) against 52 uses of the real registry — and
nothing validates either. Mixed within single files:
`library-ingestion.md` declares
`roles: [ingestion-agent, authoring-agent, collaborator, owner]`.

Filed as **`folio-assistant-qif9`**, which this bean now waits on for its
mechanical half.

### What was done anyway — the two the evidence DID support

Both bound on the skill's OWN declaration, so a reviewer argues with the
declaration rather than with me:

- `library-ingestion` → `ingestion-agent`, `authoring-agent`
- `milnor-exposition-standard` → `author`, `editor`, `reviewer`,
  `narrative-reviewer`

112 → **110**. Plus `platform-gates` and `github-state-inspection` earlier
the same day, from 113.

### The revised route

1. **`qif9` first.** Once every `roles:` value resolves against a declared
   vocabulary, recount the evidence-backed bucket — it may be a large
   fraction of the 110, since 52 uses across the corpus already name real
   roles and some of those skills are unbound.
2. **Then the remainder**, which is genuine judgement, per skill, in
   batches small enough to argue with.
3. **Never a sweep.** Unchanged and load-bearing: a skill bound to a role
   it does not belong to widens that role's closure until an audit cannot
   fail.

### Still unanswered — the third criterion

Whether a fact in a SUBAGENT's memory can reach the main session. Not
touched here, deliberately: the triage had to say first whether "bind the
skill" is even the right remedy, and it now says the binding route is
**not blocked on `qif9`** — it is `completed`. Step 1 of the revised route
above (*"`qif9` first"*) is therefore satisfied, and the next action is its
step 2: recount the evidence-backed bucket now that every `roles:` value
resolves against a declared vocabulary. Worth noting that binding is not
obviously sufficient
anyway — a role carrying a skill makes it reachable, not injected.

---

## 2026-09-20 — the route this bean planned is CLOSED, and the measurement says why

Owner queued this after `qif9` merged. The plan was: *"`qif9` first. Once
every `roles:` value resolves, recount the evidence-backed bucket — it may
be a large fraction of the 110."*

**It is zero.** `qif9` did not make the evidence resolve; it established
that there was never any evidence there. Count unchanged at **110**.

### Every candidate evidence source, measured

| source | skills it covers | usable as ROLE evidence? |
|---|---|---|
| markdown `roles:` front matter | — | **gone** (`qif9`), and 90 % dangled |
| `.ts` `SkillDefinition.roles` | 23 of 24 modules | **no** — see below |
| Tool `satisfies` | 15 of the 110 | **no** — says what IMPLEMENTS a skill, not who performs it |
| BPMN lane bindings | 0 of the 110 | vacuous *by construction* — unbound means no lane names it |

### The `.ts` half of the field is still there, and it is worse

`qif9` removed the markdown field. `SkillDefinition.roles` in the sibling
`.ts` modules **survived**, carrying the identical undeclared vocabulary:

| uses | value | resolves |
|---|---|---|
| 22 | `owner` | **nothing** |
| 21 | `collaborator` | **nothing** |
| 8 | `reader` | **nothing** |
| 1 each | `validation-pipeline`, `attestation-service`, `publication-manager` | role |

**51 of 54 dangling — 94 %**, against 90 % for the markdown half. Exactly
**one** module of 24 declares roles that all resolve: `qa-report-signing.ts`,
written the day before under `85e8`.

Probed for readers the way `qif9` should have been, having been wrong
twice there: nothing reads `.roles` off a `SkillDefinition`; `kg-export`
never imports the modules, so the field cannot reach the graph (consistent
with 0 of 180 Skill nodes carrying a role key). It is **required** by
`SkillDefinitionSchema` and enforced by `validate-skills.ts` — validated,
and consumed by nothing.

Not excised here. Unlike the markdown field it is schema-REQUIRED, so
removal touches the schema and 24 modules, and its one correct use is
load-bearing for a process the owner is currently reconsidering. Raised
rather than taken.

### The second blocker, which is the more interesting one

**The 110 is not one population.** Read the list and two kinds are plainly
mixed:

- **performed** — `build-pdf`, `lean-generation`, `proof-triage`,
  `glossary-build`, `html-rendering-qc`, `bib-qa`, `latex-validation`
- **consulted** — `directory-conventions`, `bpmn-processes`,
  `opening-brief`, `turn-reporting`, `untrusted-input`,
  `where-a-proposal-goes`, `content-profiles`, `deterministic-and-agentic`

A consulted skill belongs in **no lane by its nature** — it is what the
performer reads, not a step anybody takes. `skill-in-role-or-process`
grades both `major`, so an unknown share of the 110 is a criterion
mismatch rather than a defect.

**No mechanical discriminator exists.** Tested two:

| discriminator | result |
|---|---|
| sibling `.ts` `SkillDefinition` | 20 of 110 — and `glossary-build`, `editor`, `rendering-fixes` have none |
| `allowed-tools:` in front matter | 58 of 110 — splits the same families arbitrarily |
| neither | 47, mixing `directory-conventions` with `html-rendering-qc` |

`kg-audit` has no per-skill applicability guard either — the criterion is
`entry(unmodelled)` over everything, with only a graph-level `unknown`
when no role graph exists.

So the distinction is **real, load-bearing for an audit criterion, and
declared nowhere.** That is the mirror of this repo's usual defect: not
"declared but read by nothing", but *relied upon and never declared*.

### What this bean now waits on — two questions, not 110 judgements

1. **Is a skill's performed/consulted status an axis worth declaring?** If
   yes, `skill-in-role-or-process` applies to performed skills only and its
   count becomes meaningful for the first time. If no, the criterion is
   wrong and should be dropped or downgraded.
2. **Does `SkillDefinition.roles` go the way of its markdown twin?**

**No binding was done.** The bean's own rule holds and is the reason:
a skill bound to a role it does not belong to widens that role's closure
until an audit cannot fail. With zero evidence sources, every binding
would be invention — which is how the retired field got its 260 dangling
values in the first place.

### Done when — revised

- [ ] the performed/consulted question answered, and the criterion made to
      match whichever way it goes
- [ ] `SkillDefinition.roles` decided
- [ ] only then: triage the remainder, in batches small enough to argue with

---

## 2026-09-20 — the axis is declared, and the count means something now

Owner: *"1"* — declare it, and have the audit read it.

### What landed

`consulted: true` in a skill's front matter says it is **reference
material nobody performs**. Absent means performed: the exception is
annotated, not the rule, because an axis whose default costs an edit in
every skill file does not get adopted.

| | |
|---|---|
| reader | `consultedSkills()` in `scripts/known-skills.ts` |
| exemption | `skill-in-role-or-process` skips a consulted skill |
| **guard** | `consulted-skill-not-performed`, `major` |
| annotated | **23** skills |
| criterion | **117 → 94** |

### A correction to this bean's own framing

Earlier entries here said the criterion grades these `major` and that the
110 dominates the audit. **Both wrong.** It is `severity: "minor"` and its
comment says *"NEVER gate on this, and it is `minor` so that it cannot"*.

More than that, the criterion's author had already reached the same
conclusion: *"A skill invoked directly by name — `corpus-grep`, `diff`,
`kg-export`, `mcp-contract`, the watcher family — is doing its job without
appearing in any diagram."* The gap was never that nobody knew; it is that
there was **no way to say so per skill**, so the knowledge lived in a
comment about the whole criterion and the count stayed uninterpretable.

That changes what this bean achieved. Not "a noisy gate quietened" — the
gate was never loud. It is that a number a reader could only take on faith
is now one they can check, and the 23 exemptions are individually
arguable rather than one blanket caveat.

### Why the guard is the load-bearing half

An exemption nobody can falsify is worse than the over-reporting it
replaces — it is `qif9`'s field with extra steps, since a wrong
`consulted: true` would silently remove a skill from the only criterion
watching it.

So a skill cannot be reference material AND a step somebody performs: if a
lane or a role claims one, `consulted-skill-not-performed` reports it.
Which of the two declarations is wrong takes a person, so it reports both
rather than choosing. Verified by annotating `todo-manager` — which IS
bound — and watching the guard fire, then restoring it.

### The 23, and how they were judged

One at a time, from each skill's own **description**, never its name: does
it state a rule, a model, a convention or a standard that a performer
reads? `rendering-fixes` calls itself *"quick-fix reference"*;
`one-voice-style-guide` says *"Reference when authoring"*;
`content-profiles` is *"Adapters and profiles are different axes"*.

**Borderline cases were deliberately left out** — `process-state`,
`log-message`, `corpus-grep`, `diff`, `coordinate`, `session-intent`,
`pickup`. An over-broad annotation is the unfalsifiable exemption above;
leaving one out costs a line in a report.

Four tests hold the axis non-vacuous from both ends: the set is non-empty
and contains known reference skills; known performed skills are NOT in it;
it stays a minority of the corpus; and every annotation resolves to a
skill this instance knows. A fifth pins the spelling, because the reader
matches `"true"` exactly and `yes` would read as absent.

### Done when — revised

- [x] the performed/consulted question answered, and the criterion made to
      match
- [ ] `SkillDefinition.roles` decided — the `.ts` half of the retired
      field, 94 % dangling, still open
- [ ] the remainder triaged, in batches small enough to argue with. Now
      **possible**: 94 skills, each of which is either performed-and-unbound
      (a real finding) or a missed annotation (one line).

---

## `SkillDefinition.roles` excised 2026-09-20 — and my own measurement of it was wrong

### The correction first

I reported this field earlier as **"51 of 54 values dangling (94 %)"**. The
arithmetic is right and **the diagnosis is wrong**: that number comes from
resolving every value against `scenarios/roles.json`, and 51 of them were
never role-graph references. Measuring against the wrong registry made a
vocabulary collision look like a pile of broken links.

### What the 54 values actually are

| value | uses | what it is |
|---|---:|---|
| `owner` | 22 | an HTTP access tier (`UserRole` in `src/types.ts`) |
| `collaborator` | 21 | the same tier |
| `reader` | 8 | **nothing** — that tier is spelled `viewer` |
| `validation-pipeline`, `attestation-service`, `publication-manager` | 3 | declared BPMN roles |

So the field mixed **two vocabularies**, and its doc line — *"Actor IDs
(roles) that may invoke this skill"* — named a **third**, actors, as though
all three were one thing.

### The real defect is worse than dead weight

`src/core/rbac.ts` is entirely header-driven, and every route hardcodes its
own minimum (`hasRole(req, "collaborator")` in `relevance.ts`, `glossary.ts`,
`feedback.ts`). **Nothing reads `SkillDefinition.roles`** — searched `src/`,
`schemas/`, `scripts/`, `adapters/`, the MCP tool layer, `skill-fetch` and
`skill-list`.

A field spelled `roles: ["reader", "collaborator", "owner"]` sitting next to a
working RBAC module **reads as an access control that is enforced**. It is
not. That is why leaving it was the worst of the three options: dead weight is
cheap, a false claim of enforcement is not.

### Removed rather than wired up, on a precedent set hours earlier

`SkillDefinition.schemaRefs` was retired the same day (beans `3w0i`, `t2yg`)
on the identical finding, and its note states the rule: **reinstating means
writing the consumer first.** Skill-level RBAC may well be worth having;
building it is a FEATURE and goes through CRDM, not in as a side effect of a
cleanup.

### What changed

- 23 declarations removed across 23 files.
- `roles` made **optional** in `SkillDefinitionSchema` — it was required, so
  removing the declarations without that makes `skill()` throw on every
  definition. That ordering is the whole reason the schema edit is part of
  this and not a separate tidy.
- Property kept, optional and `@deprecated`, exactly as `schemaRefs` was: a
  downstream instance may hold one, and removing an exported property is a
  breaking change for something that costs nothing to leave declarable.
- Record: `fsh-guts/retired/skill-definition-roles.md`.
- Origin, from archaeology rather than assumption: commit `2734a70f21`,
  2026-06-15, the bulk *"migrate MCP core and adapters from qou"*. It was
  never designed in this repository — no commit here argues for it.

### The guard, and a defect in its first draft

`scripts/tests/retired-skill-fields.test.ts` pins that no `SkillDefinition`
declares either retired field. An optional property re-declared typechecks
cleanly, so without this the field returns with nothing failing — which is
the `dhol` lesson (an unargued decision survives because there is nothing to
disagree with) applied at the cheapest possible price.

Its first draft pointed `schemaRefs` at `fsh-guts/retired/schema-refs.md`,
**which was never written** — the sibling documented that retirement inline on
the `SchemaRef` type instead. A dangling link in a retirement note is the
`blv9` class at its most costly, because the reader who needs it is the one
about to reinstate the field. The test now **asserts every record it names
dereferences**, so this cannot recur in the registry itself.

Verification: `bun run gates` **56/56**; `bun test` **3801 pass, 0 fail**;
`tsc` and `eslint` clean.

### Still open on this bean

The ~94 skills bound to no role or process. Now separable: `consulted: true`
marks reference material nobody performs, so each remaining one is either a
missed annotation or a genuine gap.

---

## Sample of 15, 2026-09-20 — the population is three problems, not one

Owner chose "sample first, measure the split, report back" over triaging all
of them. That was the right call, and the reason is the result: **the split
the sample was drawn to measure is not the useful cut.**

### First, a count I had been repeating wrongly

I quoted **94** unbound skills across several turns. The audit says **101**,
and it had said 98 an hour earlier — the population moves as `main` and I
both add skills. Quoting a count from memory is exactly what
`never quote a count from prose` exists to stop, and I did it four times.
**Take the number from `kg:audit`, not from this bean.**

### The sample

15, drawn by walking each package's sorted list at an even stride so the
choice could not be cherry-picked: 7 `folio-paper-adapter`, 6 `folio-core`,
1 `remote-stubs`, 1 `graph-management`.

Classified by reading each: **12 performed tasks** (a role should carry them),
**2 reference material** (`mcp-projection`, which explains a design
distinction and instructs nobody; `fhir-client-operations`, whose own first
line is *"This skill is declared, not implemented here. Do not follow it as
guidance"*), **1 borderline** (`domain-fencing` — a discipline, but a
`platform-boundary-guard` actor already exists to perform it, so it leans
performed).

**80 % missed annotation. And that ratio is close to useless**, because it
averages over packages that are in completely different states.

### The cut that matters

| package | on disk | unbound | |
|---|---:|---:|---:|
| `content-lifecycle` | 9 | 0 | **0 %** |
| `workflow` | 8 | 1 | 12 % |
| `authoring-who-smart-guidelines` | 7 | 1 | 14 % |
| `folio-core` | 107 | 43 | 40 % |
| `bootstrap` | 4 | 3 | 75 % |
| `graph-management` | 3 | 3 | 100 % |
| `remote-stubs` | 5 | 5 | 100 % |
| `folio-paper-adapter` | 47 | 44 | **93 %** |

Three different problems:

1. **`folio-paper-adapter` (44) — unmodelled, not untriaged.** Its 3 bound
   skills sit one-apiece across six unrelated roles: incidental bindings, no
   owner. All 7 sampled are performed tasks, so the triage question has the
   same answer 44 times and answering it produces nothing. The real question
   is *who performs paper work*, which is a modelling decision. **Bean
   `3025`.**
2. **`folio-core` (43) — a genuine triage.** 64 of 107 ARE bound, so roles
   exist and these sit outside them. Mixed: mostly performed, with real
   reference material among them. **This is what remains on `y1w9`.**
3. **`bootstrap` (3) — a tooling blind spot, not a corpus fact.** All three
   ARE named by activities in `bootstrap/workflows/*.bpmn`; `workflowDirs`
   composes `<kgdir>/workflows` and bootstrap's diagrams are a SIBLING of its
   skills, so nothing scans them. **Bean `7u3g`.**

`remote-stubs` (5) is 100 % unbound by design — declared-not-implemented — and
should be `consulted: true` or exempted, which is cheap and uncontested.

### What the sample cost, and what it bought

Reading 15 skills. It bought the knowledge that triaging 101 items would have
spent most of its effort on 44 that needed a design decision instead, and
would have reported 3 as unreachable that are merely unscanned.

### `content-lifecycle` at 0 % is the control

It is the reason 93 % reads as a defect rather than as the natural state of a
package. Without it in the table the paper-adapter number has nothing to be
surprising against.

---

## folio-core drained as far as it goes without the owner, 2026-09-20

**101 → 98.** Three skills declared `consulted: true`; the remaining 41 need
a decision that is not mine.

### The three, and why only three

`retry-backoff`, `unverified-constraints`, `mcp-projection`. Each was
verified by reading, not by a heuristic, and each carries its reason in
front matter beside the flag.

I first filtered on "has no imperative markers" and it returned **eight**.
Two were false positives and the reason is worth keeping: `readability-editing`
is a checklist an editor works through, but its steps are `###` headings
rather than `1.` list items, so the regex missed them; and `kg-viewer`'s
headings are imperatives in disguise — *"Do not draw the whole graph"*,
*"No dependencies, and that is a requirement rather than a preference"*.
Three more (`mcp-assembly`, `mcp-contract`, `serving-renderings`) describe
rules but each opens with an action or carries a *"Running one"* section.

**A wrong `consulted: true` is a silent exemption**, and the
`consulted-skill-not-performed` guard only catches the opposite direction.
So the filter selected candidates and reading decided. It still passes:
`consulted-skill-not-performed: pass, 0 findings`.

### The 41 that remain are SIX decisions, not 41

Every one clusters, with nothing left over:

| cluster | n | skills |
|---|---:|---|
| integration watchers | 9 | `canonical-`, `compute-`, `detangler-`, `devils-advocate-`, `one-voice-`, `bib-photo-ingestion-watcher`, plus `integration-watch` / `-audit` / `-backlog` |
| editorial review | 11 | `block-density`, `chapter-complexity-review`, `readability-editing`, `scientific-accuracy`, `one-voice-audit`, `ontologist`, `md-authoring`, `html-rendering-qc`, `markdown-render-check`, `exposition-swarm-drain`, `todo-review` |
| docs & presentation | 8 | `docs-generation`, `glossary-build`, `create-sticky-note`, `theme-art-intake`, `tabular-metadata`, `deployment-auth`, `editor`, `fsh-guts` |
| session & coordination | 6 | `coordinate`, `pickup`, `session-intent`, `pending-show`, `idle-backlog`, `diff` |
| MCP / serving | 5 | `mcp-assembly`, `mcp-contract`, `serving-renderings`, `kg-export`, `kg-viewer` |
| bibliography | 2 | `bib-human-review`, `bib-qa` |

### Why I stopped here rather than assigning them

A role is a **BPMN swimlane** — "an actor performs a task in a process as a
role". Choosing which lane performs "audit a chapter's dependency graph" is a
statement about how this project works, not an annotation. Existing roles
already carry 64 folio-core skills, so there is precedent to extend
(`authoring-agent` 34, `build-pipeline` 14, `reviewer` 9,
`narrative-reviewer` 7, `code-reviewer` 6) — but extending `authoring-agent`
to 75 would make one lane that performs most of the platform, which is the
caution bean `3025` already records.

**The question is six rows wide**: for each cluster, an existing role, a new
one, or split. Answer that and the 41 are mechanical.

### Done when

- [ ] the six clusters are bound to roles
- [ ] `skill-in-role-or-process` reports only skills that are genuinely
      reference, each carrying `consulted: true` with its reason

---

## 101 → 9, and every one of the 9 is unbound for a STATED reason

The residue is now fully explained, which is the state this bean was actually
after. Nobody should try to "fix" these:

| skill | why it is unbound, and correctly so |
|---|---|
| `confirm-harness`, `discussion`, `log-message` | bootstrap's, and the audit does not read a nested instance's graph **by design** — `instance-graph-isolation.test.ts` guards an 88-reference leak. Declaring `bootstrap/workflows/` at the root re-introduces it; that is bean `7u3g`, **scrapped** for exactly that |
| `fhir-client-operations`, `hypothesis-generation`, `scientific-critical-thinking`, `scientific-visualization`, `smart-launch` | `remote-stubs`, whose manifest says the quiet part outright: *"every one is reported by kg:audit under `skill-is-a-stub` so filling the gap does not hide it"*. The remedy is upstream (bean `wlqd`) |
| `fsh-guts` | **structurally unbindable.** `isPublishedSkill` strips any skill NAMED `fsh-guts`, so a published role carrying it emits a dangling `hasSkill` edge — the leak the owner's "never let fsh-guts reach the KG" rule exists to prevent |

### The five stubs are the case I nearly got wrong

They look like obvious `consulted: true` candidates — declared, not
implemented, nobody performs them. **That would have been a silent
exemption of the worst kind:** `consulted` means reference material nobody
performs, while a stub is a skill that *would* be performed once vendored.
Marking them would have hidden a gap the package deliberately keeps visible,
and the package manifest says so in its own description. I read it before
acting, and did nothing, which was the work.

### `fsh-guts` is a real structural question, not a defect

The strip is name-based, so this skill can never be carried by a published
role. That is right for the KG and means `skill-in-role-or-process` will
report it forever. Worth deciding whether the criterion should exempt a skill
`isPublishedSkill` excludes — **but that is a change to what the criterion
MEANS**, not a cleanup, so it is left for the owner.

### The last five bound

`corpus-grep` and `process-state` → `session-coordinator`; `domain-fencing` →
`platform-authoring-agent`; `smart-base-tools` → `build-pipeline` (which
already carries four WHO-guideline skills); and
`edge-kinds-and-blast-radius` declared `consulted: true` — zero imperative
markers and every heading a claim.

Verification: `bun run gates` **58/58**; `bun test` **4033 pass, 0 fail**;
`consulted-skill-not-performed` pass, 0 findings.

---

## `fsh-guts` exempted, and the strip now reads a DECLARATION

Owner, 2026-09-20: *"yes exempt. can we model the other way?"*

### The code had already asked the same question

`isPublishedSkill` strips a skill whose NAME is an unpublished graph kind,
and its own note says where that stops:

> *"Same list, because the skill and the kind share a name by construction.
> **If that ever stops being true this needs its own list, not a cleverer
> derivation.**"*

So this is that list — and a **declaration** rather than a list in code, which
is the same "a directory is a place to look and the file says what it is" rule
the repository applies to `isSkillMd`, to bean front matter and to a workflow
instance's `$schema`. A skill that must not be published says so, in the place
its author is already looking.

### It EXTENDS the name rule rather than replacing it

Both inputs are checked. They answer different questions — *is it named after
the trashcan* and *did it say not to publish it* — and the second was
previously unexpressible: a skill whose subject is an unpublished graph but
whose name is something else had no way to opt out.

Two inputs to one predicate is a duplicate, and the rule is that an
**unchecked** duplicate is the problem. The blanket test asserts the OUTCOME
over the built document at any depth, so neither input can quietly stop
working.

### Why the exemption is narrow

`skill-in-role-or-process` now skips a skill that declares `published: false`
— **not** one that merely happens to be unbound. The reason is structural, and
measured: a published role carrying `fsh-guts` emits a dangling `hasSkill`
edge, because every emitter strips the node while the edge keeps the name.
Adding it to `docs-authoring-agent` earlier the same day broke
`kg-export.test.ts` on exactly that. So the criterion would have reported it
forever, and the only available "fix" would re-introduce the leak.

### Guarding the input, because the outcome test cannot

Three tests pin the declared half. The blanket test is what makes the
mechanism safe to change — but an outcome test cannot say WHY it passed: if
`published: false` silently vanished, the name rule would carry it and nobody
would learn the declared half had stopped working. So one test asserts the
declaration exists, one asserts both inputs independently, and one is a
vacuity check — an ordinary skill is neither declared nor name-matched, and
the declared set stays small, because a predicate that matched everything
would pass the first two while stripping the corpus.

`skill-in-role-or-process`: **9 → 8**, and the 8 remaining are the three
bootstrap skills and the five `remote-stubs`, both deliberate.

Verification: export still contains **zero** occurrences of `fsh-guts`;
`bun run gates` **58/58**; `bun test` **4051 pass, 0 fail**.
