---
# folio-assistant-a9tx
$schema: bean/1.0.0
title: 'IG PUBLISHER FORK: requirements for an agent working a local experimental fork, and what the AST must carry'
status: todo
type: feature
priority: normal
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-10-24T09:50:00Z
parent: folio-assistant-uhkv
---

> **Taking this over? Start at §"HANDOVER — start here (2026-10-01)" at the end of this bean.** Earlier sections are history; the order list in §"Prepared for the agent with network" is superseded.

Requirements for an agent working a **local experimental fork** of the IG
Publisher, and what the AST it emits must carry.

Scope this round: **requirements only, no Java.**

## Why a fork rather than an upstream ask alone

Measured, from `nsbb`, using the Publisher's current metadata exports as an AST
proxy across two real IGs:

| export | smart-trust | smart-immunizations |
|---|---|---|
| `valueset-ref-list.json` VS→CS edges | 17 over 14 | 431 over 252 |
| `codesystem-ref-list.json` `uses` populated | 0 of 15 | 0 of 14 |
| `usage-stats.json` extension→path | 6 | 35 (+5 profiles) |

Two findings, and the second is the case for the fork:

1. `uses` is **declared and never populated**, in both IGs.
2. **Nothing exports dependencies among Libraries, PlanDefinitions or
   Measures** — 458 artefacts, 61% of smart-immunizations, the CQL and
   decision-logic core, with no dependency edges at all.

So the proxy reaches TERMINOLOGY dependencies and **structurally cannot reach
the logic layer**. Re-derive these before quoting them.

## What the AST must carry, as acceptance criteria

- [x] per-resource structured dump, keyed by canonical URL and version. smart-immunizations has 748 resources and 748 unique keys; the 36 examples without a canonical are keyed `Type/id` (measured: bean qzex round 2, `ast-results/2026-10-23-r2` @ `2aa23dd`, tx.fhir.org)
- [x] **dependency edges among Library / PlanDefinition / Measure** — the gap above. 458 of 458 have a logic edge in either direction (owner's reading, 2026-10-23) (measured: bean qzex round 2, `ast-results/2026-10-23-r2` @ `2aa23dd`, tx.fhir.org)
- [ ] page-fragment provenance: which source produced which output fragment
- [ ] the resolved dependency closure with pinned versions
- [ ] terminology expansion provenance — which server, which version
- [x] a `toolchain` object: publisher version, core version, SUSHI version. Recorded as publisher 3.0.0, core 7.0.1, SUSHI 3.20.1, java 21.0.3 (measured: bean qzex round 2, `ast-results/2026-10-23-r2` @ `2aa23dd`, tx.fhir.org)
- [x] emitted behind a flag; default behaviour byte-identical without it. Met by construction, since a separate launcher changes no Publisher code. Its output vs stock smart-trust: 4080 files differ, every one being XML/Turtle (excised), a timestamp, a per-run UUID, timing, the working-directory path, or the entry-point frame in 5 stack traces. **0 semantic differences** (measured: bean qzex round 2, `ast-results/2026-10-23-r2` @ `2aa23dd`, tx.fhir.org)

## Which repositories

`HL7/fhir-ig-publisher` is orchestration; `hapifhir/org.hl7.fhir.core` holds
the renderer and validator. **The logic-layer edges live in core**, so a
publisher-only fork cannot satisfy criterion 2. Both are git-reachable from
this environment.

## Constraints on the agent
- Upstreamable shape: a flag, not a rewrite. A fork that cannot be offered back
  becomes a maintenance burden with no exit.
- The AST is a CACHE, never an authority: indices, dependencies and versions
  are invalid until a full run. Anything reading it says so.

## Done when
- [ ] the requirements above are approved by the owner
- [ ] a brief exists an agent can start from without this bean's context



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open branch touches it; the sessions that held theme D (content folios, SMART/FHIR stack, ingest) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run cat beans:claim <id>`.


## Read of the fork, 2026-09-30 — and a correction to §"Which repositories"

Read-only clone of `litlfred/fhir-ig-publisher` at `e382dc3` (a plain mirror
of upstream, no local changes). Session
https://claude.ai/code/session_015v8WoYtr8gHuz9Tadg7KjV.

**Correction.** §"Which repositories" says *"the logic-layer edges live in
core, so a publisher-only fork cannot satisfy criterion 2"*. Read against the
code, that is wrong: `DependencyAnalyser` is in the **publisher**
(`org.hl7.fhir.publisher.core/.../igtools/publisher/DependencyAnalyser.java`).
Only criterion 3 (page-fragment provenance) needs `org.hl7.fhir.core`.

What already exists, all in the publisher:

- `fileList` → `FetchedResource` holds every loaded resource as both `Resource`
  and `Element` — the AST, in memory.
- `DependencyAnalyser` emits `(source, kind, target)` for terminology and
  conformance resources, consumed only by `DependencyRenderer` (HTML).
  `analysePD` and `analyseAD` are **empty stubs**; Library and Measure are not
  dispatched at all. That is the criterion-2 gap, exactly.
- `CqlSubSystem` computes CQL `depends-on` related artifacts, and
  `AdjunctFileLoader.java:311` attaches them to each Library — so
  Library→Library edges already exist on the resource; nothing exports them.
- Existing exports: `qa.json`, `usage-stats.json`, `expansions.json`,
  `canonicals.json` — none carries an edge.

| # | criterion | change | size |
|---|---|---|---|
| 7 | flag, byte-identical default | CLI flag (e.g. `-ast-export`), no-op when absent; diff a normal build before/after | S |
| 1 | per-resource dump by `canonical\|version` | `AstExporter` in `Publisher.execute()` after `validate()`, before `generate()`; walks `fileList`, writes `output/ast/` | S |
| 2 | Library / PlanDefinition / Measure edges | fill `analysePD` (`library`, `action.definitionCanonical`, `relatedArtifact`) and `analyseAD`; add Library and Measure; keep `\|version` on edges; export `dependencyList` | M |
| 6 | toolchain object | publisher + core version from the build; SUSHI version | S |
| 4 | pinned dependency closure | packages already resolved at load (`dependencyList`, ~`Publisher.java:11074`); export it | M |
| 5 | tx expansion provenance | tie `expansions.json` to server + version (`processTxLog`) | M |
| 3 | page-fragment provenance | across publisher and core renderers | L |

Work plan, each step small and upstreamable:

- [x] **W1** criteria 7, 1, 6 (round 2 of qzex measured them; see the criteria above): flag, `AstExporter`, per-resource dump, toolchain are BUILT; the byte-identical check and a real-IG run are **not yet measured** (both need the package registry)
- [x] **W2** criterion 2 — measure on smart-immunizations: 458 of 458, cross-checked against `fsh-cone`'s source count. That gives Library 279 = 279 `.cql` files in fsh-cone (2026-10-23), PlanDefinition 138, Measure 41. `ig-ast.ts validity` returns `valid` on both IGs (measured: bean qzex round 2, `ast-results/2026-10-23-r2` @ `2aa23dd`, tx.fhir.org)
- [ ] **W3** criteria 4, 5
- [ ] **W4** criterion 3 — scoped separately; the only step needing the core fork

Not started: this session has read access only, and Maven/JDK availability is
unchecked. The owner chose to record the plan first (2026-09-30).


## Built 2026-09-30 — as a LIBRARY on the Publisher, not a fork of it

Owner's direction: *"a library building on top... DO NOT change existing code,
unless absolutely have to. remarshal/reuse/sub-class"*. Branch
[`claude/ast-export`](https://github.com/litlfred/fhir-ig-publisher/tree/claude/ast-export)
on `litlfred/fhir-ig-publisher`, started from HL7 `master` at `8301fee`. The fork's
own `master` (2023, Carl Leitner's FML work) is untouched.

Everything is under `ast-export/`, a separate Maven project that depends on the
**released** `publisher.core` 2.3.4 from Maven Central. It is not a module of the
root pom, and no existing file changed. How it builds on the Publisher:

- `AstPublisher extends Publisher`, overriding nothing; it reads `getFileList()` after `execute()`.
- `AstFieldsAccess` is a read-only view of package-private `PublisherFields`, declared in
  the Publisher's package inside the library, so a rename upstream fails to compile.
- `AstExportCli` is a launcher in the style of `publishDirect`, because `Publisher.main`
  constructs a plain `Publisher`.
- Upstream's `DependencyAnalyser` is **reused unchanged**; `LogicEdges` sits beside it.

| step | status | evidence |
|---|---|---|
| W1 dump, toolchain, cache manifest | built | `manifest.json` (`authority: cache`, `provisional`), per-resource JSON keyed `canonical\|version`, `inputs` in the `gpdo` `compiled` shape |
| W2 logic-layer edges | built, **not measured** | `dependencies.json`: Library / PlanDefinition / ActivityDefinition / Measure plus `meta.profile`; out-of-IG targets are kept as `resolved: null` |
| W5 delta → resources | built | `fsh-index.json`, CQL by Library name, RuleSet users via `fsh-cone` when supplied |
| W6 cone + decision | built | `ig-ast-plan/v1`: `rebuild` (forward cone), `loadFromCache`, `remove`, `full` with reasons; "cannot tell" is never incremental; 40% threshold |

15 unit tests pass (`mvn test`). **Not measured on a real IG.** The environment's
proxy refuses `packages.fhir.org` / `packages2.fhir.org` (HTTP 403), so SUSHI and the
Publisher cannot fetch dependencies. The owner opened the network policy, but the
running container still gets 403; a new session should pick it up. W2's exit
criterion (458 of 458 on smart-immunizations) waits on that.

The incremental design (owner's question: *"import AST, remove dependency cone
based on delta file changes... then add in the changed files and recompute AST"*):

- [x] **W5** delta → resources
- [x] **W6** cone (forward = rebuild, backward = load) and decision
- [x] **W7** rebuild, PASSED in round 6 (bean `w7r6`, fork `8c2d917`): both probes converged in 1 round, exit 0. The fpmn round (2026-10-23) was decided `full` both times: the guard, and a base built over 202 leftover template pages. Fork `140e494` adds `-verify-incremental` (owner, option A). Round 2 (bean `wv7r`) acted on an incremental plan for the first time; its temporary IG failed in Jekyll (no `menu.xml`), fixed in `e3c7119` and `d2d4bfe`. Round 3 (`w7r3`) converged in 1 round for both probes; the W8 review (bean `w8rv`) found two causes of difference, fixed in `72b2ba9` and `3896c6c`. Round 4 (`w7r4`) matched the full build in content and edges; only narrative links to cached resources differed, fixed in `6abb8a5`. Round 5 (`w7r5`) crashed in that fix, fixed in `cf45726` and `8c2d917`.
- [x] **W8** diff a full build against the incremental AST, plus the threshold. PASSED in round 6: on both probes the diff is noise only, the same 649 date and temp-file changes that two full builds show; 0 edges and 0 resources added or removed. Both cones were under the 40% threshold (cql 11.2%, fml 0.3%).


## W7 built, 2026-09-30, untested end to end

`CachePackageWriter` (the unchanged part becomes a package written into the
package cache), `TempIgAssembler` (an IG of only the rebuild set, depending on
that package), `AstMerger` (mixed-provenance AST with `builtAt` per resource; edges
re-resolved; reports what the merged cone reaches that was not rebuilt), and
`IncrementalBuildCli`, which loops until nothing grows, up to 3 rounds, then asks
for a full build. 19 unit tests pass. The loop has never met a real Publisher.
The fork README lists the risks to check first: canonical collision between the
cache package and the temporary IG, dangling page/resource references, CQL
includes resolving from the package, and non-`Type-id.json` sources.

Network: the owner opened the policy, but this container's proxy still refuses
`packages.fhir.org`, `packages2.fhir.org` and `tx.fhir.org` ("organization
policy"), re-checked three times through 2026-09-30T15:00Z. The next step is a fresh session.


## Who picks this up, 2026-09-30

Owner's call: an agent with network access **claims this bean whole**
(`bun run cat beans:claim folio-assistant-a9tx`), W3 and W4 included, rather than a
child bean. W1 was un-ticked the same day. It had been ticked with the
byte-identical check never run, which was a false tick.


## Prepared for the agent with network, 2026-09-30

Done while the network-enabled agent could not yet start. Everything here is
built and unit-tested; **nothing is measured on a real IG yet.** Owner: no
GitHub Actions for now, and any CI later **calls these same scripts and
tools**. The one Actions run was cancelled while queued, and the workflow removed.

**Fork** (`claude/ast-export`, `45ec95d`, 21 Java tests):
- `inputs` in the manifest is now **exactly** folio-assistant's strict
  `CompiledInputsSchema`: `inputDigest` is 64 bare hex characters, and an unknown
  `sourceRevision` is omitted, with the reason in `inputsUnknown`. Before this, every AST
  would have read as `cannot-tell`.
- A golden-vector test for `InputDigest`
  (`58871352…82f1`), which folio-assistant's TypeScript twin asserts too.
- `-fsh-users <json>` on `AstPlanCli` / `IncrementalBuildCli`.
- The scripts are in `ast-export/scripts/`: `run-real-igs.sh` and `w7-round.sh`.

**folio-assistant** (PR #1708):
- `fhir-harness/scripts/ig-ast.ts`: `list`, `validity` (`compiledValidity`),
  `diff` (resources and edges, element-level differential), and `render`
  (just-the-docs pages, every one carrying the provisional mark). 10 tests.
- The skill `fhir-ig-base/ig-ast-delta`; six Tools in `fhir-harness/tools`.
- `fsh-cone --file-users` (`fsh-file-users/v1`), declared on the `fsh-cone` tool.
- `cat-harness/processes/ig-ast-delta-review.bpmn`, the review subprocess:
  validity, then diff and render, then "every difference explained?". An
  unexplained difference is noted here under W8 and ends in a full build. Its
  placement in `ig-incremental-build.bpmn` (between Task_Merge and Task_Qa) is
  **stated in the skill, not drawn**; that diagram is unchanged.
- Corrected: the `ig-publisher-fork` skill and `fhir-harness.json` said the
  logic-layer edges live in `org.hl7.fhir.core`.

**Found, not used: FHIR packages on npm.** `registry.npmjs.org` is reachable
here, and the npm account `grahamegrieve` publishes about 567 FHIR packages
(`@hl7/hl7.fhir.r4.core`, `smart.who.int.base`, `who.ddcc`, the templates).
The unscoped `hl7.fhir.r4.core` and `fhir.base.template` are npm
**malicious-package placeholders**, so FHIR names on npm are not
automatically HL7's. Nothing ties these tarballs to packages.fhir.org. IG
templates also carry scripts that the Publisher runs, so loading an unverified
one is code execution, not only data. **Not used.** Whether to use it for
measurement only is the owner's call.

**For the agent, in order:**
1. `ast-export/scripts/run-real-igs.sh <work> --byte-identical`.
2. Record W1 (layout, byte-identical diff) and W2 (per type, against 458).
3. `bun run fhir-harness/scripts/ig-ast.ts validity <smart-immunizations>/output-ast --ig <smart-immunizations>`
   must be `valid`. That is the first real cross-language check.
4. `ast-export/scripts/w7-round.sh <work>`. Then
   `ig-ast.ts diff <base> <work>/w7/ast --plan <work>/w7/plan.json --site <dir>` and
   review it per `ig-ast-delta-review.bpmn`.


## npm: the owner's ruling, and what it buys (2026-09-30)

Owner: *"grahamegrieve is trusted. he is founder of hl7 fhir"*, and then
**exact versions only**, over an approximate build with substituted
versions. The earlier note above ("Not used") is superseded on trust. It still
holds on coverage:

- the seeder is built (fork `45af0f5`,
  `ast-export/scripts/seed-fhir-cache-from-npm.py`, Tool `fhir-cache-seed-npm`,
  documented in the `ig-publisher-fork` skill). It was verified by installing
  8 packages into a scratch cache with integrity checked and provenance written,
  and by refusing the `0.0.1-security` placeholder;
- **coverage:** 10 of smart-trust's 30 pinned versions are on npm, and
  `who.template.root#current` (smart-immunizations' template) is not. **W1/W2
  still need packages.fhir.org.**


## Getting the rest of the dependencies (2026-10-01)

Owner: *"how get rest of deps?"*, then: add the publishers' own repos as
sources **and** a mirror script; *"dynamically load from repos... dont calc
once and assume fixed. avoid drift"*; *"fhir.base.template trusted"*.

Fork `47a8276`. The seeder now tries these, in order: npm `grahamegrieve`;
`WorldHealthOrganization/smart-html` and `IHE/publications`; template repos
through `FHIR/ig-registry/templates.json`, read live; and `--mirror`. Patch
wildcards resolve as the Publisher resolves them, and the resolution is recorded.
`mirror-fhir-packages.sh` (Tool `fhir-package-mirror`) fills a git repo from
packages.fhir.org on a machine that reaches it.

**Measured:** 20 packages install for both WHO IGs together, including both
templates. **Still missing:** the pinned HL7 versions (IPS, terminology,
extensions, CQL, CRMI, SDC, IPA), `fhir.cqf.common` and `us.nlm.vsac`. Next:
the owner runs the mirror script, then the seeder runs with `--mirror`.

**Upstream ask:** `who.template.root` is not in `FHIR/ig-registry`'s
templates.json, so its repo is passed with `--template-repo`. A PR to the
registry would remove that.

## HANDOVER — start here (2026-10-01)

**Claim it whole** (owner's ruling): `bun run cat beans:claim folio-assistant-a9tx`.
Everything is built and unit-tested, and **nothing has been measured on a real IG.**
Tick a box here only on a measurement, with its provenance.

### Where things are

| what | where | state |
|---|---|---|
| AST library (producer) | `litlfred/fhir-ig-publisher`, branch `claude/ast-export`, dir `ast-export/` (head `8fe4ec91`) | W1, W2, W5, W6 and W7 built; 22 Java tests (`mvn -q test`) |
| consumer tools | folio-assistant `main` (PR #1708 merged, `adc024eb`): `fhir-harness/scripts/ig-ast.ts` | `list`, `validity`, `diff`, `render`; 14 tests |
| skills | `fhir-harness/skills/fhir-ig-base/`: `ig-publisher-fork` (production, cache seeding), `ig-ast-delta` (consumption) | current |
| Tools | `fhir-harness/tools/index.ts`: ten `ig-ast-*` / `fhir-cache-*` / `fhir-package-mirror` | declared |
| process | `cat-harness/processes/ig-ast-delta-review.bpmn` | the W8 review step |
| RuleSet / Alias reach | `bun run cat-harness/content/pipeline/fsh-cone.ts <ig> --file-users <json>` → `AstPlanCli -fsh-users` | tested |

### Step 0: which environment are you in?

`curl -s -o /dev/null -w '%{http_code}' https://packages.fhir.org/hl7.fhir.uv.extensions.r5`

- **200: path A.** Go to Step 1.
- **000 or 403: path B.** packages.fhir.org is blocked (Claude Code cloud, 2026-09-30 to 10-01: organization policy).
  - Check whether `litlfred/fhir-package-mirror` exists. **As of 2026-10-01 it does not.**
  - If it is missing, **stop and ask the owner** to create it and run the mirror command (given below).
  - If it exists, seed the cache:
    `python3 ast-export/scripts/seed-fhir-cache-from-npm.py --sushi-config <ig>/sushi-config.yaml --template-repo who.template.root=WorldHealthOrganization/smart-ig-template --mirror https://github.com/litlfred/fhir-package-mirror`
  - Exit 0 means nothing is missing.
  - `tx.fhir.org` is blocked too, so build with `-tx n/a`. **Label every number "no terminology server".**

The owner's mirror command, run on a machine that reaches packages.fhir.org, from `~/space_cats`:

1. Clone the mirror repo, and check out `claude/ast-export` in `fhir-ig-publisher`.
2. Fetch both IGs' `sushi-config.yaml` from raw.githubusercontent.com.
3. Run the seeder with `--dry-run --missing-out /tmp/missing.txt` and the `--template-repo` argument above.
4. Run `fhir-ig-publisher/ast-export/scripts/mirror-fhir-packages.sh fhir-package-mirror /tmp/missing.txt`.

The exact one-liner is in the session that wrote this section, and in the fork's README §"Without packages.fhir.org".

### Step 1: measure (W1, W2)

`ast-export/scripts/run-real-igs.sh <work> --byte-identical`. Record:

- **W1, layout.** Are FSH sources under `fsh-generated/resources/`? `IncrementalPlan` assumes they are; if not, fix the source mapping in the library.
- **W1, byte-identical.** Diff the stock build's `output/` against the `AstExportCli` build's. Timestamps differ; any other difference is a finding.
- **W2.** Logic resources with at least one `ast-export` edge to another logic resource, **per type**, against 458 of 458 on smart-immunizations. Cross-check against `fsh-cone`.

### Step 2: the first real cross-language check

`bun run fhir-harness/scripts/ig-ast.ts validity <work>/smart-immunizations/output-ast --ig <work>/smart-immunizations`
must return `valid`. The Java and TypeScript digests share a golden vector in their tests, but they have never been compared on real data.

### Step 3: W7, then W8

1. `ast-export/scripts/w7-round.sh <work>`. It changes one CQL file, then runs the plan and the incremental build.
2. The fork README lists the risks to check first, starting with a **canonical collision** between the cache package and the temporary IG. Fix what breaks **in the library**.
3. `ig-ast.ts diff <base> <work>/w7/ast --plan <work>/w7/plan.json --site <dir>`, then review per `ig-ast-delta-review.bpmn`.
4. W8: do a full build of the same change and diff it against the incremental AST. Each difference is a missed coupling, or it gets an explanation, one entry at a time.

### Rules the owner set; do not relitigate

- **A library on top, not a fork in.** Do not modify existing Publisher code unless there is no other way. Subclass, reuse, remarshal.
- **No GitHub Actions for now.** If CI is ever added, it calls these same scripts and holds no logic of its own.
- **Exact package versions only.** No approximate builds with substituted versions.
- **Trust anchors:**
  - npm account `grahamegrieve`;
  - the publishers' own site repositories;
  - template repositories via `FHIR/ig-registry/templates.json` (`fhir.base.template` is trusted);
  - the owner's mirror.
- **Load dynamically.** Never compute a lookup once and keep it.
- **fhir-harness knows nothing about WHO.** WHO specifics go in the fork or in beans.
- **An AST is a cache, never an authority.** Every rendered page carries the provisional mark.
- **Never merge without the owner's explicit word.** Comment on the PR or on issue #222 after every push.
- **Writing a skill:** do not put the literal Liquid raw-block closing tag in skill text. `gen-skill-docs` wraps each page in one raw block, and that tag broke the staging build once. Hardening the generator is an open task.

### Open, not yours unless asked

- W3 (pinned closure, terminology provenance) and W4 (page-fragment provenance, which needs `org.hl7.fhir.core`).
- An upstream PR adding `who.template.root` to `FHIR/ig-registry/templates.json`.
- Phases P0 to P4 in `ig-publisher-reduction` beyond the AST work.

## Owner ruling 2026-10-01: every phase renders equivalent to the standard IG render

In the owner's words: *"each phase needs to render equivalent to existing IG standard render"*.

This is an invariant across **all** phases, not just P0's exit criterion. Whatever a phase changes in the pipeline, its output must stay equivalent to the IG Publisher's standard render of the same IG. The measured reference is `jut3`'s parity table: the Publisher's page set, by page kind.

**Open tension, put to the owner:** P2 as approved drops XML/Turtle ("recorded as a refusal"). Under this invariant, a refused representation is a difference from the standard render.

## First real builds, 2026-10-23

Session https://claude.ai/code/session_01UWbMcgvAqQvoE7H4hrB5nG. **Nothing has been measured yet**, so no box is ticked.

- The mirror `litlfred/fhir-package-mirror` exists, at `eead24e`. Seeding from it plus npm reports 0 missing for both IGs' declared dependencies.
- Fork `claude/ast-export` `1b23e27`: the seeder now keeps a repo template's own layout, and `run-real-igs.sh` gains `--no-tx`. 58 Java tests and 17 seeder tests pass, and fhir-harness `ig-ast` has 25 passing tests.
- Both IGs get through SUSHI (0 errors) and the template load. They then stop on packages the Publisher loads by itself. Bean `53rv` is fetching them on the owner's device. What these packages are is recorded in the `ig-publisher-fork` skill (fhir-harness#121), not here.
- **Owner, 2026-10-23:** build *with* a terminology server, so a `-tx n/a` run is diagnostic only. XML and Turtle are excised everywhere for now. That settles the P2 tension above, and the byte-identical check (W1) leaves those representations out.
- **Open, put to the owner:** the Publisher warns that `fhir.base.template` is *"no longer considered secure"*. It cites the fhir.org security notice `2026-03-npm-dependencies`, which cloud sessions can't fetch. This conflicts with the 2026-10-01 trust ruling.
- **Next:** the builds must run where `tx.fhir.org` is reachable. That means the owner's device (Remote Control), unless the network policy changes. Then do Step 1 of the HANDOVER.

## Measured, round 1 of bean qzex (2026-10-23): what holds and what doesn't

Provenance: bean `qzex`, Results 2026-10-23, branch `ast-results/2026-10-23` of the fork. The
**AST builds ran without a terminology server** because of a launcher bug, fixed in fork `ebb4bdd`.
So round 2 of `qzex` is the measurement. No box is ticked on round 1.

- **Step 2, cross-language check:** `ig-ast.ts validity` returns `valid` on both IGs. The input
  digests were computed in Java on the owner's Mac and recomputed in TypeScript on Linux, and they
  agree. Inputs don't depend on the terminology server, so this result stands.
- **W1, layout:** smart-trust has 682 of 682 resources under `fsh-generated/resources/`.
  smart-immunizations has 732 of 748. The other 16 are StructureMaps from `input/maps/*.fml`.
  `IncrementalPlan` must map `.fml` sources before W7 can be trusted on that IG.
- **W1, byte-identical:** 4081 files differ in round 1. Of those, 1504 are `.xml`/`.ttl`
  (excised) and 316 are timestamps. The other 2261 all come from the launcher bug, so round 2
  re-measures this.
- **W2:** 458 of 458 smart-immunizations logic resources have a logic-to-logic edge in either
  direction. 454 have one going out, and the 4 without are concept libraries. The criterion is
  the gap of 458 artefacts *"with no dependency edges at all"*, so **either direction** is the
  reading recorded here, pending the owner.
- **Security:** the HL7 notice of 17 March 2026 retires `fhir.base.template` in favour of
  `fhir2.base.template`, and the Publisher will soon refuse to build IGs that depend on the old
  one. The WHO template `who.template.root` depends on it, so the 2026-10-01 trust ruling needs
  revisiting.

**Owner, 2026-10-23 (after round 1):**
- W2 is measured as no isolated logic vertex: an edge in either direction counts. That reading is in the `ig-publisher-fork` skill (fhir-harness#121). Round 1 scores 458 of 458 on it, and round 2 is what gets ticked.
- The template issue was posted, with the owner's OK, as [WorldHealthOrganization/smart-ig-template#70](https://github.com/WorldHealthOrganization/smart-ig-template/issues/70): move to `fhir2.base.template`.
- `.fml` sources are covered in the incremental plan (fork `dbfdb03`). Run W7 with `w7-round.sh <work> fml` as well as `cql`, resetting the IG clone to its base revision between probes.

## W7/W8 review of bean fpmn (2026-10-23, `ast-results/2026-10-23-w7w8` @ `eaef931`)

The W7/W8 ticks of commit `c04156be58` are taken back. Both plans were `decision: full`, so no incremental build ran:
1. `INCREMENTAL_GUARD`, which forces full until W7 passes.
2. The base AST's `inputDigest` (e199bea) covered 202 placeholder pages in `input/pagecontent/`, left there by an earlier build (the WHO template's post-SUSHI step). The IG does not ignore them. A clean checkout of bd7fa72 digests to 3910eeb. Both values were reproduced exactly on Linux.

`ig-ast.ts diff` (the cloud thread):
- W7 vs W8, which is full against full on one commit: 649 resources changed, all noise (`*.date`, a temp-file name in the Library narratives, a rendered date in the PlanDefinition narratives). 0 semantic changes, 0 edge changes.
- Base vs W8 for `cql`: exactly 1 semantic change, `Library/IMMZAgeConcepts` `content[0].data`. It is inside the plan's rebuild set of 41.
- Base vs W8 for `fml`: 0 semantic changes. The probe added a comment, which compiles away.
- Side finding: all 279 Library narratives are "Exception parsing generated Narrative ... Unable to Parse" (a liquid template error).

Fixes on the fork, all 64 tests passing:
- `b4ae1b1`: `inputsNotAtRevision` is recorded and named in the plan's reason. `run-real-igs.sh` resets and cleans its scratch clone. The FML probe renames a rule. `w7-round.sh` runs W8 from a clean tree.
- `11fcc42`: `IncrementalBuildCli` uses the Publisher's terminology server rule on both branches. Before this, a run without `-tx` had no server at all.
- `140e494`: `-verify-incremental` (owner, option A). It acts on the plan while the guard stays on, stamps the output `unverifiedIncremental`, and `BaseAstCheck` refuses such an AST as a base.

## W7 round 2 (bean wv7r, 2026-10-23, `ast-results/2026-10-23-w7r2` @ `d195a78`)

- The base was clean: there was no "differ from the committed revision" warning, so `BaseAstCheck` passed.
- Both plans were computed `incremental`, and `-verify-incremental` acted on them:
  - `cql`: seeds 1, rebuild 41, load 95, cone 0.055;
  - `fml`: seeds 1, rebuild 2, load 5, cone 0.003.
- The cache package was written, the temporary IG was assembled, and the Publisher loaded, validated and generated. Jekyll then failed: `Could not locate the included file 'menu.xml'`, which SUSHI writes to `fsh-generated/includes/`. No AST was exported or merged, and `set -e` stopped the script before W8.
- `fml` also reported `path '.../input/cql' is not a valid directory`, because no Library was in its rebuild set.
- `Unknown FHIRTypes code 'Any'` (ELM generation) also appears 139 times in the full base build. It is the IG's or translator's issue, not the incremental path's.
- Fixes, 65 tests passing:
  - `e3c7119`: `TempIgAssembler` copies `input/includes/` and `fsh-generated/includes/`, and `w7-round.sh` runs W8 after a failed W7;
  - `d2d4bfe`: every `path-*` directory exists in the temporary IG.
- I checked the WHO template's layouts: they include no other static file that the IG supplies.

## W7 round 3 and the W8 review (beans w7r3 and w8rv, 2026-10-24, `ast-results/2026-10-23-w7r3` @ `539c086`)

**W7:** the incremental build converged in 1 round for both probes, and W8 ran (exit 0).
- `cql`: rebuild 41, load 95, 748 resources merged.
- `fml`: rebuild 2, load 5.

**W8**, `ig-ast.ts diff`, full against incremental:
- `fml`: 649 resources changed. All of it is noise (`*.date`, temp-file names in narratives, rendered dates), except 2 StructureMap narratives. Their links to cached resources went to `https://simplifier.net/resolve?scope=<cache package>` instead of `StructureMap-X.html`. 0 edge changes.
- `cql`: the same noise, plus 39 Measures that lost `contained` (the effective-data-requirements Library) and the `crmi-effectiveDataRequirements` extension. 460 edges were removed, all `relatedArtifact.depends-on` from those requirements.

**Causes and fixes:**
1. `IMMZIND01Logic` and its siblings name `http://smart.who.int/immunizations/Library/IMMZIndicatorElements`, but that library's url is `.../immunizations-measles/...`. The edge did not resolve, so the cone stopped and the Logic libraries came from the cache. The Publisher compiles a Measure's data requirements only from a library it compiles in the same run (`CqlSubSystem.getLibraryInfo` → `getCqlInfo`, by name). Fixed in `72b2ba9`:
   - an unresolved edge binds by `Type/name` when the name is unique (`edgesResolvedByName`);
   - each rebuilt artifact's primary library is compiled with it (`compiledWith`). Such a library does not widen the cone, and the merger seeds no growth from it.
   On the real full-build AST, the cql probe now plans 84 resources (43 Libraries, 41 Measures), with 82 edges bound by name.
2. The cache package had no `other/spec.internals`, so the Publisher linked its resources through simplifier.net. Fixed in `3896c6c`: a spec.internals maps each canonical to `Type-id.html`, with an empty package url so the link stays relative. The test drives `SpecMapManager` the way `loadIGPackage` does.

66 tests pass. Round 4 is bean `w7r4`.

**IG finding (WHO content, not changed here):** smart-immunizations' indicator Logic libraries reference `IMMZIndicatorElements` under `.../immunizations/Library/`, but the library is published as `.../immunizations-measles/Library/IMMZIndicatorElements`.

**Tooling note:** `ig-ast.ts diff` reports the noise as changes. Normalising `*.date` and the temp-file names would make W8 read 0 directly. That belongs in fhir-harness, as its own PR.

## W8 review of round 4 (bean w7r4, 2026-10-24, `ast-results/2026-10-24-w7r4` @ `2389671`)

**W7:** both probes converged in 1 round.
- `cql`: rebuild 84 (43 Libraries, 41 Measures), load 56, 82 edges bound by name.
- `fml`: rebuild 2, load 5.

**W8**, `ig-ast.ts diff`, full against incremental:
- **0 edge changes** in both probes.
- No resource added or removed.
- The Measures keep their effective data requirements.

What still differs:
- **Noise**, the same as between two full builds: `*.date`; the temp-file name in the 279 Library narratives ("Exception parsing generated Narrative", the template's liquid error); and the rendered date in 138 PlanDefinition narratives.
- **Narrative links to cached resources**, in 41 Measures and 2 StructureMaps:
  - the href was `/ValueSet-X.html` (pathToSpec `""` + `/` + page), not `ValueSet-X.html`;
  - the library link text showed the canonical, because a dependency's resource resolves through its spec map, which loads content only for examples.

  Fixed in `6abb8a5`, with 67 tests passing. `AstPublisher.checkDependencies` drops the leading `/` from cached web paths before rendering, and `AstPublisher.resolve` adds the cached content, so the name shows.

Round 5 (bean `w7r5`) checks that fix. If round 5 shows nothing but noise, W7 and W8 pass.

## Round 5 (bean w7r5, 2026-10-24, `ast-results/2026-10-24-w7r5` @ `a759fd9`)

Both incremental builds crashed in `AstPublisher.checkDependencies`: `fetchResourcesByType(Resource.class)` refuses to list ValueSets (`java.lang.Error`). The two W8 full builds passed. The plans were as before: cql rebuilds 84 and loads 56 from cache, fml rebuilds 2 and loads 5.

Fixed in `cf45726` and `8c2d917`, with 67 tests passing. The step fetches each cached canonical on its own, and nothing it throws can fail the build. Round 6 is bean `w7r6`.

## Round 6: W7 and W8 pass (bean w7r6, 2026-10-24, `ast-results/2026-10-24-w7r6` @ `38f8557`)

Fork `8c2d917`, 67 tests. Both incremental builds converged in 1 round with exit 0. `checkDependencies` made 250 (cql) and 289 (fml) cached links relative, with no warnings.

`ig-ast.ts diff`, the W8 full build against the incremental AST, for each probe: 0 added, 0 removed, 0 edge changes, 649 changed and 99 unchanged. Every one of the 649 changes is noise. Each is a `*.date`, a `liquid-<uuid>` temp-file name in the Library narratives, or the rendered build time in the PlanDefinition narratives. Once those are normalised, nothing is left. Two full builds on one commit differ in the same 649 (fpmn review), so the incremental build is as good as a full one on these probes.

`INCREMENTAL_GUARD` was lifted by the owner on 2026-10-24 (option A), in fork `1fffc3e`, 67 tests. Incremental is now the default, and a plan that cannot tell still decides `full`. `-verify-incremental` is accepted and ignored, and `w7-round.sh` no longer passes it.

