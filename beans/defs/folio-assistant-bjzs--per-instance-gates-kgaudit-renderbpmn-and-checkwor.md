---
# folio-assistant-bjzs
title: 'PER-INSTANCE GATES: kg:audit, render:bpmn and check:workflow-refs run at the root only, so 15 nested instances are counted and none is audited'
status: in-progress
type: task
priority: normal
created_at: 2026-09-26T04:14:07Z
updated_at: 2026-09-26T14:05:33Z
parent: folio-assistant-d308
---

Split out of `sa8y` 2026-09-26. It was `sa8y`'s last genuinely open item and the
only one of its four; the other three are done and `sa8y` closed on the wording
fix that is its actual subject. It gets its own bean because it is a different
subject — `sa8y` is about a finding's **wording**, this is about a gate's
**range** — and because a wording bean carrying an infrastructure item is how
`sa8y` came to hold three lists that disagreed with each other.

## The gap, measured 2026-09-26

`kg:audit` runs once, from `cat-harness/`. Every other instance declares its own
graph, and the root deliberately does not read it —
`scripts/tests/instance-graph-isolation.test.ts` guards exactly that, after a
live defect on 2026-09-19 where `findBpmnDirs` walked the filesystem and
`_kg/folio-assistant.jsonld` carried **88** references to
`Process_InitializeHarness`.

So the isolation is correct and the silence is now REPORTED, as the
`nested-instance-audited` criterion (`minor`). From
`test/results/kg-qa/scenarios/kg.kg-qa.json`, this run:

| declaration | diagrams this run did not read |
|---|---|
| `bootstrap/bootstrap.json` | 3 |
| `folio-assistant-core/folio-assistant-core.json` | 1 |
| `smart-base/smart-base.json` | 1 |
| the other 12 declarations | 0 each |

**15 nested instances, 5 unread diagrams.** Read the sidecar for these figures,
never this table — `sa8y` quoted `(2)` in prose and the number was 15 by the
time anyone read it back, which is the rule about counts in prose earning
another instance.

## Why a report is not the fix

The criterion makes the gap **visible**; it does not close it. What is still
true of every nested instance:

- `kg:audit` writes it no sidecar, so "never audited" and "audited clean" are
  indistinguishable for its nodes — the exact argument `kg:audit` makes for
  being a committed sidecar rather than a console report, unapplied one level
  out.
- `translate-bpmn` — note this one **already** walks dependents' diagrams
  (69 of them, per bean `nafz`), so the gates do not even agree with each other
  about what "this corpus" means.
- `render:bpmn` never lists a nested diagram, so a process can execute and have
  no picture. `bootstrap`'s three were in that state until `sa8y` added the
  `BPMNDiagram` by hand.
- `check:workflow-refs` likewise.

`audit:coverage` is the report that would grade this, and it grades what the
root declares.

## What the fix has to get right

**Not by declaring the nested directories at the root.** That is the wrong fix
`sa8y` made and a test caught, and the `nested-instance-audited` detail string
warns against it in so many words. The shape is: run the gate **with each
declared instance as root**, and write each run's sidecars under that
instance's own results directory — so an instance's audit is an artefact OF
that instance, the same way its glossary is.

Two things to settle before writing it, and neither is the owner's judgement:

1. **`kgRoots(root)[0]` is read as "the root's graph"** while overlay order is
   deepest-dependency-first — `resolveSkillDirs` says so on itself. A per-instance
   loop must not quietly change which element that is.
2. **Which instances are in range.** `bootstrap` is nested and `smart-base` is a
   dependency; both are declarations, and a loop over all 15 audits `todos/` and
   `beans/` too, which hold no diagrams at all. Whether zero-diagram instances
   get an empty sidecar or no sidecar is the `dh4f` question — an empty sidecar
   says "looked, found nothing", no sidecar says nothing.

## Done when

- [ ] each declared instance is audited from its OWN root, with its sidecars
      under its own results directory
- [ ] `instance-graph-isolation.test.ts` still passes — the loop must not merge
      graphs, and a mutation that merges them must fail it
- [ ] a zero-diagram instance's state is determined rather than absent, per `dh4f`
- [ ] `render:bpmn` and `check:workflow-refs` reach a nested diagram, or their
      not reaching it is a reported state rather than silence
- [ ] `nested-instance-audited` stops firing for an instance that IS audited, and
      still fires for one that is not — falsified by mutation, not by inspection

---

## CORRECTED 2026-09-26 — this bean was wrong about two of its three gates

I wrote this bean from `nested-instance-audited`'s finding text without opening
the three gates it names. Measured on `origin/main`:

| gate | this bean claimed | measured |
|---|---|---|
| `check:workflow-refs` | root-only | **already per-instance** — `INSTANCES = [INSTANCE_ROOT, …"bootstrap"]` since 2026-09-19, with a docblock arguing exactly why |
| `render:bpmn` | *"never lists a nested diagram"* | reaches `folio-assistant-core` and `smart-base`; **only bootstrap's 3 are missed** |
| `kg:audit` | root-only | true — `root` is a module constant, referenced **76** times across 2344 lines, plus 9 derived `*_DIR` constants |

So "15 nested instances, 5 unread diagrams" was two facts glued together: 15 is
the count of declarations, but **2 of the 5 diagrams were being read the whole
time**. The gap is `bootstrap` alone, and the reason is specific — the root
declares `bootstrap/skills/` and not `bootstrap/processes/`, which is `pve3`'s
"declares HALF of bootstrap", and declaring the other half is the wrong fix
established twice (`sa8y`, and the leak `instance-graph-isolation.test.ts`
guards).

### And `check:workflow-refs` was auditing a TYPO, which is the real find

`join(INSTANCE_ROOT, "bootstrap")` — `INSTANCE_ROOT` is `cat-harness/` and
`bootstrap/` is at the REPOSITORY root. So the second instance resolved to
`cat-harness/bootstrap`, **which has never existed**. `workflowFiles` returned
`[]`, the loop ran over nothing, and the summary printed *"2 instances"* beside
the root's own count:

    before   273 skills known across 2 instances, 71 diagrams
    after    303 skills known across 2 instances, 74 diagrams

For over a year the checker believed it was auditing **the first process a new
instance runs** and was auditing a path that is not there — in the gate whose own
docblock says *"a dangling ref in a diagram this checker never opens is a broken
reference reported as clean."* Exit 0 after the fix, so nothing was hiding; what
was lost was the coverage, not a finding.

**The path fix is one expression. The reason nobody noticed is the part worth
keeping**, so `emptyInstances()` now reports a listed instance that contributed
no diagram, and an ABSENT one is **fatal** — reporting without failing would
leave exactly the gate that cannot fire (`1xhc`), which is how this survived.
An instance that exists and holds no diagram stays a report, because that is a
different fact. Falsified both ways: reintroducing the original expression gives
exit 1 and names the path; restoring it gives exit 0.

## Done when — rewritten against what is actually true

- [x] `check:workflow-refs` reaches bootstrap — it did not, despite saying so
- [x] a listed instance contributing nothing is reported; an absent one fails
- [x] tests pin the property rather than the count — the expected diagram total
      is DERIVED from both instances, because a literal goes stale the day a
      diagram is added and teaches the next agent to edit the test
- [x] `render:bpmn` renders bootstrap's 3 diagrams. **And the placement was not
      a question** — I raised it as one and it was already settled: all three
      SVGs ALREADY existed in `docs/assets/img/workflows/`, referenced by
      published pages under `docs/processes/`, and the root's site already
      publishes bootstrap content (`docs/bootstrap/`,
      `docs/uml/overview/bootstrap/`). Measuring took one command; asking would
      have cost a round.

      **It was a live defect, not a gap.** All three sources last changed
      2026-09-24 and all three SVGs were from 2026-09-20 — four days stale on the
      published site, with no gate able to say so, because `render:bpmn:check`
      judged 71 diagrams and named none of bootstrap's. Now 74, and the three
      re-rendered as CHANGED, which is what proves they were stale.

      The basename-collision caveat its docstring carried as *"today there is one
      such directory, so it is not a live defect"* is now evaluated:
      `collidingBasenames` reports it and it is FATAL, because both readings are
      wrong — in `--check` it compares one source against the other's picture, and
      in a write run the later render silently overwrites the earlier. A published
      page showing the WRONG process is worse than one showing none.
- [ ] `kg:audit` audits each declared instance from its own root. **This is the
      expensive one and it is the owner's call, not an agent's**: `root` is a
      module-level constant referenced 76 times in a 2344-line file, with 9
      derived `*_DIR` constants, and it is the gate that judges the whole
      knowledge graph. `sidecarPath` composes
      `dirname(join(root, subject.path))`, so a `../` subject escapes the
      results tree entirely (`chq5`) — meaning the ONLY correct shape is running
      it with each instance as its own root, exactly as
      `kg:locale:bootstrap` already does with `--instance ./bootstrap`. The
      precedent exists; the cost is the refactor
- [ ] whether bootstrap's `processes/` should be a declared directory of the
      root is NOT this bean's to reopen — `pve3` and `sa8y` both settled that it
      must not be



--------

## 2026-09-26T12:35Z — `--instance` works, and running it EXPOSED why the loop is not yet safe

Claimed and worked. `kg-audit.ts` now takes `--instance ROOT`, spelled as
`kg-locale-export.ts` spells it. **Two of this bean's premises were wrong in my
favour and one problem it did not anticipate is the real blocker.**

### The cost estimate was wrong, and the reason is worth keeping

This bean said *"`root` × 76 across 2344 lines plus 9 derived `*_DIR` constants"*
and I banked it as the owner's on grounds of expense. Measured: **the change is one
assignment.** Everything derives from the single `const root` — the nine `*_DIR`
constants, `knownSkills(root)`, and `sidecarPath`'s
`dirname(join(root, subject.path))` — and nothing needs a *different* root
part-way through a run, so pointing that constant elsewhere moves subject
discovery and output together with no change at any other site.

Two things fell out for free:

- **`chq5` is already answered.** `kgQaSidecarPath` composes with `relative` and
  handles an escaping subject explicitly (`escaped = rel.startsWith("..")`), so the
  `../` concern is handled in the helper rather than needing an answer here.
- **The sidecars land correctly.** Measured: `--instance ./bootstrap` wrote
  `bootstrap/test/results/kg-qa/{processes,scenarios,skills}/*.kg-qa.json` — 134
  subjects, 30 skills, 4 roles — and did **not** touch the root's sidecars. An
  instance's audit as an artefact OF that instance, which is the `## Done when`
  wording.

### One real break, found and fixed

    line 1998   sha256(readFileSync(join(root, "scripts", "kg-audit.ts")))

The auditor hash resolved against the INSTANCE. For `--instance ./bootstrap` that
is `bootstrap/scripts/kg-audit.ts`, which does not exist, so the run would have
thrown before auditing anything. One constant was answering two questions; split
into `AUDITOR_ROOT` (a fact about the program) and `root` (the instance under
audit).

### THE BLOCKER, and it would have shipped as 76 false criticals

The bootstrap run reports **CRITICAL — 76 findings**, of which
`graph:kg actor-roles-resolve` is **73**. Those are false.

    ACTOR_DIR = join(repoRootFor(root), ".claude", "skills", "actors")

`repoRootFor` returns the REPOSITORY root whatever the instance, so the actor set
does not follow `--instance`. Measured: **36 repo-level actors judged against
bootstrap's 4 roles**, so almost every actor names a role bootstrap's graph does
not declare, and each becomes a critical.

And the actor set being repo-level is **correct** — AGENTS.md declares Actor in
`.claude/skills/actors/*.json` at the repository root, one set across instances,
because an actor persists across processes while a role is a swimlane inside one.
So the defect is not the path; it is that `actor-roles-resolve` compares a SHARED
actor set against ONE instance's role graph, which is only a meaningful question
at the root.

**This is the shape kg-audit.ts argues against in its own docblock** — *"a finding
nobody can act on … is a check somebody switches off"* (`readsProse`, on scoping
`role-has-persona`). A per-instance run that emits 73 unactionable criticals is
that, one level out.

### Second blocker, smaller

`bootstrap/test/` is an **undeclared directory**. The sidecars are correct and
their home is not declared in `bootstrap/bootstrap.json`, so committing them would
create a results graph no sweep reads — `dh4f` from the writing side, which is the
same defect `#1399` just fixed in `writeReport` (`process.cwd()` writing a
top-level `test/results/`).

### So what is pushed, and what is not

Pushed: the `--instance` flag, the `AUDITOR_ROOT` split, usage lines. Default
behaviour byte-identical — `kg:audit:check` exits 0 and the only sidecar change is
the manifest's own auditor hash, which necessarily moves when the auditor does.

**Not pushed: any loop, any CI wiring, and bootstrap's sidecars.** Shipping the
loop now would put 73 unactionable criticals in front of the next agent, and
committing the sidecars would declare a graph nothing reads. The output this run
produced was removed rather than left in the tree, because `audit:coverage` walks
from the repository root with no gitignore awareness (`xd1g`).

## Done when — revised against what was measured

[x] the gate can run from another declared instance's root, sidecars under that
    instance's own results directory
[x] the auditor hash survives a non-auditor root
[x] `instance-graph-isolation.test.ts` unaffected — this is a separate RUN, not a
    wider walk; no directory was declared at the root
[ ] **per-instance criteria are scoped**: a criterion whose subject is repo-level
    (`actor-roles-resolve`, and any other reading `repoRootFor`) must be `n/a` in
    an instance run rather than a finding. Needs a rule, not a patch — which
    criteria are instance-scoped is a property of each criterion
[ ] a nested instance DECLARES its results directory before its sidecars are
    committed
[ ] a zero-diagram instance's state is determined rather than absent (`dh4f`) —
    untouched, and it only becomes live once a loop exists
[ ] `nested-instance-audited` stops firing for an instance that IS audited —
    cannot be tested until the loop lands; note it still fired (15) inside the
    bootstrap run, which is itself suspect and unexamined



--------

## 2026-09-26T13:30Z — ALL 68 CRITERIA CLASSIFIED, at the owner's direction

Asked which of four shapes to use and **the owner chose classifying all 68**, over my
recommendation to declare only the one measured to misfire. Their choice was better,
and the reason is measurable: my recommendation would have caught 73 of the 76 false
criticals and left 3.

### What was added

`KgCriterionDefinition` gains **`scope: KgCriterionScope`** — `"instance" | "repo"` —
**required**, so a criterion that has not decided does not compile, the same argument
that makes `renderable` and `holds` required on a graph kind. Plus `scopeBasis`,
required for `repo` and asserted absent for `instance`.

    68 criteria   63 instance   5 repo

The five: `actor-roles-resolve`, `actor-capabilities-resolve`,
`actor-permissions-resolve`, `actor-is-not-a-role`, `nested-instance-audited`.

### The rule, and the case that proves it is the right rule

**Scope follows the SUBJECT, not the data consulted.** Reading repository-level data
is not the defect — `.claude/skills/local`, the convention refs and `git ls-files` are
all repo-wide by design and correct. The defect is comparing a repository-level SET
against an instance-level one.

`actor-kind-fits-role` is the case that tests it: `applies: ["role"]`, so its subject
is one instance's role, yet it consults the repository actor set. Classified
`instance` — and measured to produce **no** findings in the bootstrap run, because it
degrades to `n/a` when no actor declares the role. Safe per instance rather than
arguably so.

And the actor criteria all carry `applies: ["graph"]`, which is why scope **cannot**
be derived from the subject kind: the graph roll-up holds both
`skill-in-role-or-process`, which every instance answers about itself, and
`actor-roles-resolve`, which only the repository can. That killed the "derive it
mechanically" option on evidence rather than taste.

### Suppression is LOUD, which is the mitigation for the risk the owner accepted

A `repo` criterion in an instance run records **`n/a` plus a finding naming the scope
and its basis**, and the run prints a counted line:

    instance run: bootstrap — 5 `repo`-scoped criterion result(s) recorded n/a, each
    with its basis in the sidecar. 5 of 68 criteria are `repo`-scoped.

`n/a` rather than a fifth `KgResult`, because this is `applies` on another axis —
not-applicable-here, not could-not-determine — and a new state would change every
consumer. But never a SILENT `n/a`: the whole hazard of a scope field is that a wrong
`repo` reads as clean forever, so the count is a number a reader can challenge.
Applied in `report()` **before `tally()`**, so totals describe what the run judged.

### Running it caught a misclassification of mine — the same way the 73 were caught

After the scope field, bootstrap still reported **3 criticals**, all
`satisfies-resolves` citing `../.claude/skills/capabilities/*.json` — a `where` that
escapes the instance, which is the tell. Decisive check: **at the root that criterion
passes with 0 findings**, so the 3 were created by the instance run.

Fixed at the data rather than by suppressing the criterion: `readSatisfiers()` skips
repository-level `CAPABILITY_DIR` when `INSTANCE_RUN`. Suppressing
`satisfies-resolves` outright would have thrown away the instance half — a
front-matter `satisfies` inside the instance is a real question.

    bootstrap criticals   76 → 3 (scope field) → 0 (satisfier scoping)
    root run              byte-identical: pass 3051 fail 144 n/a 1477 unknown 10

### And my own test broke a sibling test

`kg-criterion-scope.test.ts` first spawned the WRITING form and deleted
`bootstrap/test/` afterwards. `bun test` runs files in parallel, so for the length of
the run bootstrap transiently held sidecars naming paths above it — and
`graph.test.ts > only the listed structural names remain` (bean `iwtn`) reads exactly
that. **Passed alone, failed in the suite**: the `ymsu` shape, a test that writes what
another test reads. Now it spawns `--check`, which writes nothing, and asserts that it
wrote nothing. Root cause removed rather than cleaned up after.

Same pollution also silently changed bootstrap's generated UML and detangle
artefacts, which reverted once regenerated over a clean tree — `xd1g` a third time in
one day, and the first time it reached files I nearly committed.

### Falsified by mutation, both directions

    actor-roles-resolve → "instance"        2 tests fail, incl. the spawned run
    suppression line made unreachable        the spawned run fails
    restored                                 5 pass

## Done when

[x] each declared instance can be audited from its OWN root, sidecars under its own
    results directory
[x] the auditor hash survives a non-auditor root
[x] `instance-graph-isolation.test.ts` unaffected — a separate RUN, not a wider walk
[x] **per-instance criteria are scoped** — all 68 classified, `repo` requires a basis,
    suppression is counted and visible, falsified by mutation
[ ] a nested instance DECLARES its results directory before its sidecars are
    committed — still open, and still the reason no loop exists
[ ] a zero-diagram instance's state is determined rather than absent (`dh4f`) — only
    becomes live once a loop exists
[ ] `nested-instance-audited` stops firing for an instance that IS audited — now
    `repo`-scoped, so it no longer fires INSIDE an instance run (which was the
    unexamined 15). Whether the ROOT's copy should stop naming an instance that has
    its own sidecar is a different question and untouched
