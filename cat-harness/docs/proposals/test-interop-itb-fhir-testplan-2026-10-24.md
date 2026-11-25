---
title: Test plans, FHIR TestPlan and the ITB — one model, several exports
parent: Proposals
---

# Test plans, FHIR TestPlan and the ITB: one model, several exports

**Superseded for reading by [Testing AI agents fairly: the WHO Assured AI test harness](assured-ai-test-harness-2026-11-03.md)** (2026-11-03), which combines this proposal with the other one on the topic in plain language. This document stays unchanged below as the record of how its decisions were reached.

**Draft, 2026-10-24. Not built.**

**Owner decisions, 2026-10-24 (all five answered):**

- **D1 = S2.** The system under test is a `system/v1` record, and runs point at it.
- **D2 = B7 → B5**, an option added after the first draft. Each test is tagged in its own code with the assertions it verifies (for example `@verifies("req:stt-ver-001#statement/test")`). A Tool reads the tags and writes the assertion-to-test map onto each `system/v1` record, and CI fails when the map is stale. There is no separate `test-binding/v1` node, and the plan never names an implementation. Where section 4 below says `test-binding/v1`, read "the bindings on the `system/v1` record".
- **D3: cat-harness-tools.** The ITB export and the TAR import live in the tools layer.
- **D4 = I1.** Plans reach the ITB through OpenTestBed Gherkin.
- **D5 = P3 first.** smart-trust-tools tries the fields locally first. The schemas move into cat-harness once they are proven there.

It answers four owner questions of
2026-10-24:

1. How do `test-plan/v1`, FHIR R5 TestPlan and the Interoperability Test Bed
   (ITB, GITB TDL) fit together? Can FHIR TestPlan sit downstream of the ITB?
   And what does the OpenTestBed organisation already provide?
2. What are the options for the "system under test" schema?
3. smart-trust-tools has a test plan that is partly narrative. What formal
   schema captures it, attached to skills such as `hcert-verify`, including
   the Rust library exposed as an MCP service?
4. Where do machine QA results and the model benchmark fit
   (model swarm and benchmark, [PR #500](https://github.com/litlfred/cat-harness/pull/500))?

The short answers:

- **One model, several exports.** `test-plan/v1` stays the one place a plan is
  written. FHIR TestPlan and GITB TDL are both generated from it, as
  siblings. That is what OpenTestBed's own compiler already does from Gherkin.
- **FHIR TestPlan can sit downstream of the ITB, by reference.** A TestPlan's
  `testCase.testRun.script` can point at the GITB test case that executes it.
  The ITB then runs the plan, and the TestPlan describes it. Converting TDL
  into TestPlan is lossy and is not recommended.
- **The system under test becomes a node** (`system/v1`): a system, its
  versions, the actors it plays and the surfaces it exposes (library, WIT
  component, MCP server, CLI, HTTP). A run names the system, version, actor,
  surface, target and, for agents, model and configuration. This is the ITB's
  own model (a system playing an actor in a conformance statement), so the
  ITB export is a mapping, not a translation.
- **smart-trust-tools is already mostly formal.** Its two plans are
  `test-plan/v1` nodes generated from the skills and the requirements'
  success criteria. What is still prose is: the test level of each case, the
  implementations and targets each case runs on, and the named test that
  stands for each assertion in each implementation. Three additive fields and
  one new node, `test-binding/v1`, make all of it checkable. An MCP server is
  then one more binding of the same plan.
- **Machine QA and the benchmark reuse the same plan and run records.** A
  machine QA criterion is an assertion id, a fixed finding becomes a
  regression case, and a benchmark is several runs of one plan against
  several systems under test.

## 1. What exists today

### In the platform (cat-harness, on main)

| Piece | Where | What it holds |
|---|---|---|
| `test-plan/v1` | `schemas/test-plan.ts` (work item `ygzh`) | Shaped after FHIR R5 TestPlan: `scope` (`kind` ∈ skill, agent, tool, machine, ig, process; `target`; `versionRange`), `requirements[]` (`req:` refs, at least one), `testCases[]` with `assertions[]` (required or informative), `testData[]` (fixed with a reviewer, or generated with a seed), `dependsOn`, `dependencies[]` with a `predecessor` plan, and `exitCriteria` as a DMN reference. |
| `folio-test-run/v1` | `schemas/test-run.ts` | A run of a skill or plan: data and process hashes, `plan` (id and version), `sut`. `sut` is `{actor, version, reach}` today, and a run that names a plan must name it. |
| `test-report/v1` | `qa-reports` branch, `tests/<plan>/<sut>/<run>/` | The certifier's report. |
| Test process | `processes/sdlc/test-plan-execution.bpmn`, `decisions/test-certification.dmn` (work items `3o5b`, `4iey`) | Tester and certifier roles, the execution loop, the exit rule. |
| Certification attestations | `qa-attestations/v1`, family `certification` (work item `zaui`) | What a certified run attests to. |
| The first plan | `test/plans/crdm-detect-evaluation.test-plan.json` (work item `ff09`) | Certifies the `crdm-detect` skill. |

Open work items on this side:

- `18p1` (draft): export `test-plan/v1` to FHIR R5 TestPlan, in fhir-harness.
  The owner's ruling there is that FHIR TestPlan is a **downstream target**,
  and that the platform stays FHIR-free.
- `y4uj`: the GITB and ITB sources are held in `fhir-harness/library`. CWA
  16408 could not be obtained.
- [Tool releases](tool-releases-2026-10-07.md), decision C2, unanswered, so
  its default (a) stands: **the ITB is an export**. A GITB TAR is generated
  from `folio-test-run` by `test:itb-export`.

### In smart-trust-tools

The plan is more formal than "narrative" suggests:

- `test/plans/hcert-library-conformance.test-plan.json` is a `test-plan/v1`
  node with 15 cases, one per skill (`hcert-verify`, `hcert-sign-cose`,
  `vhl-share`, …). It is **generated** by the `test-plan` Tool
  (`tools/test-plan/make_test_plan.py`) from the skills' `satisfies` lists
  and the requirements' success criteria, and CI fails if it is stale.
- Each assertion id is a success-criterion address,
  `req:<id>#<statement>/<criterion>` (for example
  `req:stt-tst-009#statement/verify`). A verdict on an assertion is therefore
  a verdict on a criterion.
- `test/plans/who-itb-agreement.test-plan.json` compares the library with
  WHO-ITB's three HCERT tracks. It has the first plan as its `predecessor`.
- `check:req-nodes` checks that each assertion names a criterion, each data
  path exists, and each predecessor names a plan.

What is still prose, in `test/plans/README.md` and in the assertions'
`expectation` text:

1. **The test level of each case**: skill tests, conformance vectors,
   negative vectors, fuzzing, coverage floor, targets, cross-implementation,
   one TypeScript suite, schema checks, WHO-ITB agreement. This is a table in
   the README.
2. **Which implementations and targets a case runs on**: Kotlin on JVM and
   Node, Rust on native and wasm32, and Android, which is named but not run.
   The assertions read "passes in each implementation's suite".
3. **Which test stands for an assertion**: the convention that a test is
   named after its requirement (`STT-PAY-001 …`), with the Kotlin test names
   pasted into the `expectation` string. Nothing checks that the named test
   exists or that each implementation has one.
4. **The library's interface**: the operations a skill uses are listed in
   each skill page (`verifier.verify`, `trust.trust-store`, …, from
   `api/wit/`). The plan does not say which interface it tests, so it cannot
   say that an MCP server exposing the same operations can run it.
5. **Release-review criteria** (verification `inspection` or `review`) are
   left out of the plan "to be judged at release" (work item `oi32`). Nothing
   records the judgement yet.

### In OpenTestBed (read only; an outside organisation)

| Repository | What it is |
|---|---|
| `itb-cli` | Authoring and packaging. `@opentestbed/otb-gherkin` and its dialects compile Gherkin features into GITB TDL test suites for the ITB. `build-test-ig.mjs` packages the same plans as a FHIR IG, one TestPlan FSH file per plan, built with SUSHI. It also has a "WHO-ITB-style" package layout. |
| `itb-manager` | Deploys and drives an ITB instance. |
| `itb-plugin-authoring` | How to write an ITB plugin (a GITB processing or validation service). |
| `itb-plugin-fhir-validator`, `itb-plugin-jwt`, `itb-plugin-oauth` | Validators and processors as ITB services. |
| `itb-plugin-hcert-decoder` | An HCERT decoder as an ITB service. This is the same job as smart-trust-tools' `hcert-verify` skill. |

The ITB's data model: **domains → specifications → actors → test suites**, on
one side. **Communities → organisations → systems**, on the other. A
**conformance statement** is one system against one actor of one
specification, and test results accumulate against it.

The fact that decides the architecture: **OpenTestBed treats FHIR TestPlan
and GITB TDL as siblings compiled from one source** (Gherkin plus a plan
config). It does not derive one from the other.

## 2. How they fit together

### The options

| | Source of truth | FHIR TestPlan | GITB TDL | Fits the platform rules? |
|---|---|---|---|---|
| **H1** | `test-plan/v1` | generated (work item `18p1`) | generated | Yes. The platform stays FHIR-free and ITB-free, and both exports live outside the core. |
| **H2** | OTB Gherkin plus plan config | compiled by OTB | compiled by OTB | Partly. Gherkin has no `req:` links, success criteria, DMN exit rule or data hashes, so `test-plan/v1` would still be needed beside it and the two would drift. |
| **H3** | FHIR TestPlan | the store | generated from it | No. It breaks the FHIR-free rule (`18p1`). |
| **H4** | GITB TDL | derived from TDL | the store | No. TDL is an executable step language. Requirements, assertions as criteria and exit rules do not survive into it, so nothing can be derived back. |

**Recommended: H1, with OTB as the ITB backend.**

```
                         test-plan/v1  (the one written plan)
                        /       |       \
     fhir-harness export        |        ITB export
     (bean 18p1)                |        (two routes, below)
            |                   |              |
  FHIR R5 TestPlan    folio-test-run/v1   GITB TDL suite in a TAR-ready package
  testRun.script ──────────────────────────► (the ITB test case that executes it)
            |                   ▲              |
  FHIR R5 TestReport ◄──────────┴──── GITB TAR results (import)
```

### Can FHIR TestPlan be downstream of the ITB?

Yes, in one precise sense, and no in another.

- **Yes, by reference.** FHIR R5 `TestPlan.testCase.testRun.script` names the
  script that executes a case: `language` and `source[x]`, which can be a
  canonical, a URL or a reference. The export can set it to the GITB test
  case that the ITB export generated (language `GITB-TDL`, a URL into the
  ITB package). The TestPlan then *describes* a plan that the ITB *executes*.
  That is downstream in the sense that matters: the TestPlan points at the
  ITB, and the ITB does not need the TestPlan.
- **No, by conversion.** Generating a TestPlan from TDL would lose the
  requirements, the criteria and the exit rule, which TDL never held.
  OpenTestBed does not do it either.

So the export order is: `test-plan/v1` → GITB TDL first, then FHIR TestPlan,
with `testRun.script` pointing at the TDL. When a plan has no ITB route, the
TestPlan's `testRun.narrative` says how it is run instead.

### Two routes to the ITB

| | Route | Gains | Costs |
|---|---|---|---|
| **I1** | Emit Gherkin features and an OTB plan config from `test-plan/v1`, and let `otb-gherkin` compile them to TDL. | Reuses OTB's compiler, dialects and plugins (`hcert-decoder`, `fhir-validator`, `jwt`, `oauth`). Output matches what WHO-ITB users already deploy. | Each assertion needs a Gherkin step that a dialect implements. Where no dialect fits, the case cannot go to the ITB. |
| **I2** | Emit GITB TDL directly. | No dependency on OTB's toolchain. | We would write and maintain a TDL emitter and our own ITB services. |

**Recommended: I1.** It is the route WHO-ITB's own community uses, and the
HCERT plugin already exists. A case with no dialect stays in-house: its run
is a `folio-test-run`, and the export marks it "not exported: no OTB
dialect" rather than leaving it out silently.

### Results coming back

C2's default treats the ITB as an export of *runs*. This proposal adds the
reverse direction for runs the ITB executes: **import a GITB TAR into
`folio-test-run/v1`**, keyed by the conformance statement (system × actor).
The certifier then judges an ITB run with the same DMN as an in-house run.
A FHIR TestReport is generated from the run, not stored.

### Where the code lives

| Piece | Layer | Why |
|---|---|---|
| `test-plan/v1`, `folio-test-run/v1`, `system/v1`, `test-binding/v1` | cat-harness | Definitions, as today. |
| FHIR TestPlan and TestReport export | fhir-harness | FHIR knowledge stays there (`18p1`). |
| GITB export (Gherkin plus config) and TAR import | Decision D3 below: cat-harness-tools, or fhir-harness beside the held GITB sources (`y4uj`). GITB is not FHIR, so the tools layer fits better. |
| HCERT bindings, dialect mapping, the MCP server | smart-trust-tools | They name its implementations. |
| OpenTestBed packages | used as pinned dependencies, never changed | An outside organisation. |

## 3. The system under test

### What it has to say

Each run has to name everything a verdict depends on. For smart-trust-tools
that means *which implementation* (Kotlin or Rust), *which target* (JVM,
Node, native, wasm32, Android), *which surface* (direct library call, WIT
component through jco, MCP tool call), and *which version*. For an agent it
also means *which model* and *which configuration* (benchmark gap 1 in
PR #500).

### The options

| | Shape | Gains | Costs |
|---|---|---|---|
| **S1** | Widen `SutRefSchema` in place: optional `implementation`, `target`, `surface`, `model`, `configuration` (a hash plus a short map). | Smallest change, and backward compatible. | Every run repeats the system's description. Nothing says which systems exist, so "certified on every target" cannot be checked. |
| **S2** | **A `system/v1` node**, plus a run reference to it. The node declares the system's versions, the actors it can play, its surfaces and its targets. The run says which of each it used. | This is the ITB's model (system, actor, conformance statement), so the export maps one to one. It also lets a check say that a plan has a run for every declared target, which is the claim the smart-trust-tools README makes in prose. | One more node kind, and every SUT needs a declaration before it can be certified. |
| **S3** | Reuse FHIR `Device` or `TestReport.participant`. | Nothing to design. | Breaks the FHIR-free rule. It stays an export target only. |
| **S4** | Reuse the deployment description's placements ([deployment descriptions](deployment-descriptions.md), work item `o1by`). | One registry for "what runs where". | A placement says where something runs, not what it is, so it answers a different question. A `system/v1` should *reference* a placement, not replace one. |

**Recommended: S2, with S1's fields as the run's reference to it.**

### The shape (sketch)

```ts
// schemas/system.ts (cat-harness): what can be tested
SystemSchema = z.strictObject({
  $schema: z.literal("system/v1"),
  id: SLUG,                                   // "hcert-rust"
  title: z.string(),
  kind: SutKindSchema,                        // skill | agent | tool | machine | ig | process
  implements: z.array(InterfaceRefSchema),    // e.g. "smart-trust-tools:api/wit/worlds.wit#hcert"
  actors: z.array(z.string()).min(1),         // roles it can play: "verifier", "issuer"
  surfaces: z.array(z.strictObject({
    id: SLUG,                                 // "library" | "wit-component" | "mcp" | "cli" | "http"
    kind: z.enum(["library", "component", "mcp", "cli", "http"]),
    entry: z.string().optional(),             // package, MCP server id, CLI, URL template
  })).min(1),
  targets: z.array(SLUG).default([]),         // "native", "wasm32", "jvm", "node", "android"
  placement: z.string().optional(),           // a deployment placement, when one exists
});

// folio-test-run/v1: sut widens to a reference (S1's fields, all named by the node)
SutRefSchema = z.strictObject({
  system: SLUG,            // a system/v1 id
  version: z.string(),     // the system version, or a commit
  actor: z.string(),       // one of the system's actors
  surface: SLUG,           // one of its surfaces
  target: SLUG.optional(), // one of its targets
  model: ModelIdSchema.optional(),                  // agents only (bootstrap/models)
  configuration: z.strictObject({ sha256: HEX64, summary: z.record(z.string(), z.string()) }).optional(),
  reach: z.enum([...NETWORK_REACHES, REACH_UNKNOWN]),
});
```

The current `{actor, version, reach}` runs migrate by adding `system` and
`surface`. A converter can fill them in, because today's `actor` is always a
skill or agent name.

ITB mapping: `system/v1` → ITB system; `actors[]` → specification actors;
(system, actor, plan) → conformance statement; a run → a test session result
against it.

## 4. A formal plan for smart-trust-tools, attached to skills

### What is added

Three optional fields on `test-plan/v1`, and one new node.

| Addition | On | What it replaces |
|---|---|---|
| `skill` | each test case | The convention that the case id equals the skill name. `kg-audit` can then check that every skill with `satisfies` has a case, and that the case's assertions cover those criteria. |
| `level` | each test case | The README's test-level table. Values: `skill`, `vector`, `negative`, `fuzz`, `coverage`, `target`, `cross-implementation`, `interface-suite`, `schema`, `agreement`, `review`. |
| `interface` | the plan's `scope` | "The library", in prose. It names the contract the plan tests (the WIT world `hcert`, its operations), so any system that `implements` that interface can run the plan, MCP servers included. |
| **`test-binding/v1`** | a node per system | The test names pasted into `expectation`. It maps each assertion id to the selector that runs it in that system, per surface and target. |

A sketch of the binding:

```jsonc
{
  "$schema": "test-binding/v1",
  "plan": { "id": "hcert-library-conformance", "version": "1" },
  "system": "hcert-rust",
  "runner": {                                   // how this system's suite runs
    "native":  { "shell": "cargo test --manifest-path tools/hcert-rust/Cargo.toml" },
    "wasm32":  { "shell": "node tools/conformance-ts/run.mjs rust $COMPONENT_DIR" },
    "mcp":     { "shell": "node tools/conformance-ts/run.mjs mcp $MCP_SERVER" }
  },
  "bindings": [
    {
      "assertion": "req:stt-ver-001#statement/test",
      "case": "hcert-verify",
      "tests": [
        { "surface": "library",       "target": "native", "selector": "verify::stt_ver_001_valid_signature_verifies" },
        { "surface": "wit-component", "target": "wasm32", "selector": "conformance-ts:STT-VER-001" },
        { "surface": "mcp",                               "selector": "conformance-ts:STT-VER-001" }
      ]
    }
  ],
  "unbound": [                                  // said out loud, never left out
    { "assertion": "req:stt-gen-004#statement/test", "target": "android", "reason": "no Android runtime in CI" }
  ]
}
```

What becomes checkable that is prose today:

- Every required assertion has a binding in every system that claims the
  plan's interface, or an `unbound` entry with a reason. (Today: "87 of 94"
  is counted by hand in work item `oi32`.)
- Every selector exists in that system's suite. A Tool lists the test names
  (`cargo test -- --list`, the JUnit report, the TypeScript suite's
  manifest) and compares.
- The run records verdicts per (assertion, surface, target), so "passes on
  every target" is computed, not asserted.
- The `test-plan` Tool keeps generating the plan, and gains a
  `--bindings` step that writes each system's binding from the skills'
  `tested-by` lists and the test names. CI fails if a binding is stale, the
  same as the plan today.

### The MCP server

An MCP server that exposes the Rust library (for example `verifier.verify`
as an MCP tool) is **one more surface of the `hcert-rust` system**: a
`surfaces` entry of kind `mcp`, and a third runner in the binding. The
TypeScript conformance suite already drives two packages through
`api/generated/ts`. A third adapter in that suite calls the MCP tools, so the
same 45 checks run through MCP with no new test text. The plan does not
change, because it tests the interface, not the transport.

### The agent that uses it

"Verify HCERT" is also something an *agent* can be asked to do, using that
MCP tool. That is a different system under test (kind `agent`, with a model
and a configuration), against a different plan: does the agent call the
tool rather than decode by hand, report the tool's reason faithfully, and
refuse to call an unverified certificate valid? That plan's cases name the
same skill (`skill: hcert-verify`) and reuse the vectors as test data. It is
also where the benchmark of PR #500 gets its first smart-* task (section 5).

### Release-review criteria

Criteria verified by `inspection` or `review` become cases of `level:
review`, in a separate plan run at release, whose witness kind is `human`.
The certifier's DMN treats a missing review verdict as undetermined, which
is the existing rule. This closes the last part of work item `oi32`.

### The WHO-ITB agreement plan

`who-itb-agreement` is the first plan that would use the ITB route (I1):
its three tracks are already ITB test cases (`tc-vhl-001`, `tc-icvp-001`,
`tc-ph4h-qr-001`). Once the data is usable (work item OI-33: no licence file yet,
no pinned QR reader, the DEV trust list not reachable from CI), a tester
runs the ITB and the TAR import records the result against the plan.
Nothing in WHO-ITB or any WHO repository is changed.

## 5. Machine QA and the benchmark

| Thing | Becomes |
|---|---|
| A machine QA criterion (a `QaWitness` of kind `script`) | An assertion id, so a QA verdict and a test verdict are the same kind of record. |
| A fixed machine finding | A regression case, generated with the finding's input as fixed test data (benchmark gap 4; it overlaps work item `vm6m`). |
| A spec-kit success criterion | An assertion id of the form `req:<id>#<statement>/<key>`, exactly as smart-trust-tools already does (benchmark gap 5). |
| A benchmark | One plan, several runs, each with a different `system/v1` reference (model, configuration). The side-by-side view groups runs by plan version and data hash (benchmark gaps 1 and 2). |
| Cost and tokens | Optional fields on the run (benchmark gap 3). |

The first shared task for the benchmark: **an agent verifies an HCERT
through the MCP tool**, scored against the smart-trust-tools vectors. It
has fixed data, known right answers, negative cases with named reasons, and
no WHO repository to change.

## 6. Phasing

| Step | What | Where | Depends on |
|---|---|---|---|
| P1 | `system/v1` and the widened `SutRefSchema`, with a converter for existing runs | cat-harness | D1 |
| P2 | `skill`, `level` and `scope.interface` on `test-plan/v1`; `test-binding/v1` | cat-harness | D2 |
| P3 | smart-trust-tools adopts: systems `hcert-kotlin` and `hcert-rust`, generated bindings, `check:req-nodes` checks them | smart-trust-tools | P1, P2 |
| P4 | The MCP surface: a server over the Rust library and a third adapter in `tools/conformance-ts` | smart-trust-tools | P3 |
| P5 | FHIR TestPlan export, with `testRun.script` pointing at the ITB case where there is one (work item `18p1`) | fhir-harness | P2 |
| P6 | ITB route I1 (Gherkin plus OTB config) and TAR import | D3 | P1, P2 |
| P7 | The agent plan for "Verify HCERT", and the first benchmark runs | smart-trust-tools, cat-harness | P4, PR #500 |

Each step is a draft PR with its own issue, and is useful on its own. P3 and
P4 alone close what work item `oi32` counts by hand.

## 7. Decisions for the owner

| | Question | Options | Recommended |
|---|---|---|---|
| **D1** | System-under-test shape | S1 widen the run's field · S2 a `system/v1` node · S3 FHIR Device (export only) | **S2** |
| **D2** | Where the assertion-to-test mapping lives | B1 a `test-binding/v1` node per system · B2 inside the plan, per assertion · B3 keep the naming convention and only check it | **B1**: the plan stays implementation-free, so Rust, Kotlin and MCP share one plan |
| **D3** | Where the ITB export and TAR import live | cat-harness-tools · fhir-harness, beside the GITB sources | **cat-harness-tools**: GITB is not FHIR |
| **D4** | ITB route | I1 through OTB Gherkin · I2 emit TDL directly | **I1** |
| **D5** | First step | P1+P2 (schemas) · P3 (smart-trust-tools adopts, schemas proved there first) | **P1+P2** first, then P3 straight after |

The tool-releases decision C2 (the ITB is an export) stays as it is. This
proposal only adds the TAR import beside it.

## Sources

- cat-harness `schemas/test-plan.ts`, `schemas/test-run.ts`,
  `processes/sdlc/test-plan-execution.bpmn`; work items `ygzh`, `3o5b`, `4iey`,
  `ff09`, `zaui`, `18p1`, `y4uj`, `3fva`.
- litlfred/smart-trust-tools at `ae4eb269`: `test/plans/`,
  `tools/test-plan/`, `skills/hcert/hcert-verify.md`,
  `skills/hcert-library/hcert-conformance-testing.md`,
  `skills/requirements/stt-*.json`, work item `oi32`.
- github.com/OpenTestBed: `itb-cli` (`otb-gherkin`, `build-test-ig.mjs`),
  `itb-manager`, `itb-plugin-authoring`, `itb-plugin-fhir-validator`,
  `itb-plugin-jwt`, `itb-plugin-oauth`, `itb-plugin-hcert-decoder` (READMEs,
  read 2026-10-24).
- HL7 FHIR R5 TestPlan (`testCase.testRun.script`, `testRun.narrative`) and
  TestReport.
- [Tool releases](tool-releases-2026-10-07.md) decision C2;
  [model swarm and benchmark](https://github.com/litlfred/cat-harness/pull/500)
  (PR #500); [deployment descriptions](deployment-descriptions.md).
