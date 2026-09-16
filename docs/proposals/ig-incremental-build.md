# Proposal — an incremental IG build: dependency cones, a warm validator, and a separate meta-index

**Status:** analysis complete, design proposed, nothing wired into a build yet. §3's cone
measurements are real; §3.1 says exactly what could not be measured from this sandbox and
how to measure it from a DAK's own published site.
**Bean:** `267x` · **Issue:** [#181](https://github.com/litlfred/folio-assistant/issues/181)
· **PR:** [#182](https://github.com/litlfred/folio-assistant/pull/182)
**Ships with this proposal:** `content/pipeline/fsh-cone.ts`, the measurement instrument
of §3.3, which is also the first component of §5.

A WHO SMART Guidelines DAK publishes its FHIR Implementation Guide through
`smart-base`'s `ghbuild.yml`: one monolithic `publisher.jar` run per push, and every
run re-derives everything from source. A one-line edit to one profile costs the full
build. This proposal is the bottleneck analysis, and a design for an intermediary
derived-artefact layer with **dependency cones**, in the shape the Lean cache already
has in this repo — restore-first, content-hash keyed, verified seed, resumable phases,
exit codes as the contract — split into the three separable steps the author named:

1. a **warm validator** whose loaded object model is tied to a hash of its source cone
   and cached;
2. **re-rendering of only the changed artefact's cone**;
3. a **meta-index rebuild** that runs on its own.

The headline measurements (§3.3, §3.5): over the 1,059 artefacts of
`smart-immunizations`, the median artefact has **zero** dependents and the 90th
percentile has **six**. The tail is real — a dozen shared RuleSets, CQL libraries and
ActivityDefinitions each invalidate a quarter of the IG — but it is a dozen nodes out of
a thousand. Replayed over 257 real commits, an incremental build would have done
**about an eighth** of the per-artefact work a full rebuild does on every push: half
the commits rebuild under five per cent of the IG, two in five land on a hub and rebuild
a quarter. Neither number touches the fixed per-run cost, which is why the design has
three steps and not one.

---

## 1. What runs today, and what it throws away

Read from `WorldHealthOrganization/smart-base@main` on 2026-09-16 — `ghbuild.yml`
(49.7 KB, the reusable workflow every DAK's own `ghbuild.yml` calls with
`uses: WorldHealthOrganization/smart-base/.github/workflows/ghbuild.yml@main`) and
`input/scripts/run_ig_publisher.py` (50.3 KB). `smart-immunizations` and `smart-base`
were shallow-cloned to check what the workflow finds in a real DAK.

### 1.1 The run, step by step

```
checkout ──► overlay smart-base scripts ──► pip deps ──► DAK preprocessing (python)
   │  generate_dak_from_sushi · DMN questionnaires · DMN→HTML · inject translations
   ▼
docker hl7fhir/ig-publisher-base:latest
   │  curl  .../releases/latest/download/publisher.jar        (every run)
   │  mkdir ./fhir-package-cache                               (empty, every run)
   │  apt-get python3 · pip install · npm install -g fsh-sushi (every run)
   │  java -Xmx6g -jar publisher.jar publisher -ig . -auto-ig-build
   │        -package-cache-folder ./fhir-package-cache [-tx URL]
   ▼
upload qa.json ──► POT collection ──► DAK postprocessing (strip Library binaries,
JSON Schemas, JSON-LD vocabularies, DAK API hub, smart.liquid) ──► banner, links
   ▼
delete files > 100 MB ──► deploy whole output/ to gh-pages (JamesIves, with a retry)
```

### 1.2 What is derived from scratch on every run

| Derived thing | Depends on | Cached between runs? |
|---|---|---|
| `publisher.jar` | `releases/latest` — **unpinned** | No. Also non-reproducible: two runs a day apart can use different publishers. |
| SUSHI, Python, pip packages inside the container | image + registries | No. `npm install -g fsh-sushi` per run. |
| FHIR package cache (`hl7.fhir.r4.core`, `smart.who.int.base`, 8 dependencies for `smart-immunizations`) | `sushi-config.yaml` dependencies | No. `-package-cache-folder ./fhir-package-cache` is created empty each run. `grep actions/cache ghbuild.yml` → 0 hits; only the four translation workflows use `actions/cache`. |
| IG template | `template = who.template.root#current` in `ig.ini` | No — and `#current` resolves to `pcm.loadPackage(id, "current")`, the build-server head. Uncacheable by content, and a second source of run-to-run drift. |
| Terminology cache (`txCache/`) | every ValueSet expansion and code validation the run asked tx.fhir.org | No. The publisher writes it to `<repo>/txCache` (`PublisherIGLoader.java:335`, overridable in `ig.ini`). Neither DAK checkout has one committed, neither `.gitignore` mentions it, and the runner is ephemeral — so **every CI run is cold against the terminology server.** |
| Parsed dependency context, snapshots, expansions, validation outcomes, narratives, fragments, Jekyll site | everything | No. None of it survives the run except as `output/`. |
| `output/` | everything | Only as the deployed site. Deploy is a whole-tree commit of `output/` to `gh-pages` every time, which is why a "delete files > 100 MB" step exists. |

Two more facts from the same files. The deploy build passes **no phase flags**: no
`-no-sushi`, `-generation-off`, `-validation-off`, `-no-validate`, `-no-narrative`. Yet
the same repository's translation pass (`run_ig_publisher.py`,
`run_publisher_and_commit_pot`) already runs the publisher with `-generation-off
-validation-off` by default, "since neither is needed for translation-template extraction
and both significantly slow down the build" — so WHO already uses the phase levers,
just not on the build that matters. And the JVM gets `-Xmx6g` on a `ubuntu-latest`
runner, which is a 7 GB machine: the loaded context is the memory bound, which is the
same object the "binary AST" ask wants to cache.

### 1.3 What this repo says it has, and does not

`.claude/skills/local/{ig-publication,fhir-validation,l3-fhir-authoring,quality-control}.json`
reference `scripts/ig-publisher-build.sh`, `scripts/sushi-build.sh`,
`scripts/create-release.sh` and `scripts/run-qa.sh`. **None exists.** The package
manifest also claims to provide a `fhir-validator` capability with no probe file behind
it. The IG build lives in smart-base and the DAK repositories' Actions, which
`skills/authoring-who-smart-guidelines/smart-base-tools.md` says deliberately ("the IG
build and CI scripts want no skill: GitHub Actions is their caller"). The four dangling
script references are recorded here as findings; §6 says where they go.

---

## 2. The publisher's phase model

Grounded in the source, not memory: `HL7/fhir-ig-publisher@master`,
`org.hl7.fhir.publisher.core/.../igtools/publisher/` (133 files, 34,741 lines), sparse
checkout 2026-09-16; and `hapifhir/org.hl7.fhir.core@master`,
`org.hl7.fhir.validation{,.cli}`.

### 2.1 Phases, and what each depends on

The publisher times itself. `TimeTracker` sessions in the source — `loading`,
`template`, `validation`, `narrative generation`, `generate`, `jekyll`, `realm-rules`,
`propagating status`, `previous-version` — are written to **`qa-time-report.json`** and
`qa-time-report.txt` in the output directory (`Publisher.java:709,724`) and logged as
`Built. <report>`. That file is on every published DAK site; §3.1 uses it.

| Phase | Log line | Depends on | Unit of work |
|---|---|---|---|
| Load | `Load IG`, `Load Content`, `Run Sushi on …`, `Package Cache: …`, `Terminology Cache is at …` | dependency packages, template, the whole FSH tank (SUSHI compiles the tank as one unit) | whole IG |
| Snapshots | `Generating Snapshots` | each StructureDefinition + its `baseDefinition` chain + referenced types and extensions | per resource |
| Validation | `Validating Conformance Resources`, `Validating Resources`, `     validating ` | each resource + the profiles it claims + every bound ValueSet and CodeSystem + terminology server answers | per resource |
| Narrative | `Generating Narratives`, `Regenerating Narratives` | each resource + the display names of everything it references | per resource |
| Generate | `Generating Outputs in …`, `Generate HTML Outputs`, `Generate Native Outputs`, `Generate Summaries`, `Generate Spreadsheets`, `Generating QA`, `Generating combined package` | per-resource fragments; then the whole-IG aggregates | per resource, then whole IG |
| Template + Jekyll | `Run Template`, `Run jekyll: … build --destination …` | every page and every fragment | whole IG |

The per-resource **fragment fan-out** is what makes "generate" expensive: counting
`fragment("<Type>-…")` call sites in `PublisherGenerator.java` gives ~71 fragment kinds
for a StructureDefinition, 8 each for ValueSet and Questionnaire, 6 each for CodeSystem
and StructureMap, plus the `-xml`, `-json`, `-ttl` and `-html` representations of every
resource. A thousand-resource IG produces tens of thousands of fragment files, and
Jekyll then reads every one of them.

The **whole-IG aggregates** — the meta-index of step 3 — are a closed list, also from
the source: `artifacts`, `toc.html`/`toc.xml`, `searchform.html`, `canonicals.json`,
`expansions.json`/`.xml`(`.zip`), `package.tgz`, `package.manifest.json`,
`full-ig.zip`, `definitions.{json,xml}.zip`, `validator.pack`, `usage-stats.json`,
`fragment-usage-analysis.csv`, `.index.json`, `qa.html`/`qa.json`/`qa.txt`,
`spec.internals`, `package-list.json`, `history.html`, and the
`ImplementationGuide.definition.resource[]` list itself.

### 2.2 The levers that already exist

From `documentation.md` and `Publisher.java`:

| Flag | Effect | Granularity |
|---|---|---|
| `-no-sushi` | do not run SUSHI first | whole run |
| `-generation-off` | no narratives, no HTML generation, no HTML inspection | whole run |
| `-validation-off` | no validation | whole run |
| `-no-narrative T/id,…` | suppress narrative for the listed resources | **per resource**, `*/*`, `Type/*`, `*/id` wildcards (`passesNarrativeFilter`) |
| `-no-validate T/id,…` | skip validation for the listed resources | **per resource**, same wildcards (`passesValidationFilter`, `PublisherProcessor.java:1415`) |
| `-no-network` | fail on any network access — offline build | whole run |
| `-package-cache-folder DIR` | where dependency packages live | — |
| `-tx URL` / `-resetTx` / `-resetTxErrors` | terminology server; clear its cache; clear only the errors | — |
| `-rapido` / `-cascais`, `-watch` | **experimental differential build** (§2.3) | per file |

The two skip lists are the important ones: they are the publisher's existing,
shipped mechanism for "do the expensive per-resource work for *these* and not
*those*", and their complement is exactly a cone.

### 2.3 Upstream is already halfway there: Rapido mode

`-rapido` (alias `-cascais`) prints "Running in Cascais:Rapido mode. Report issues to
Grahame on Zulip" and does the following (`Publisher.java:196–243, 881–945`,
`PublisherBase.java:612–620`):

- keeps a **build tracker**, `.build-tracker.ini` inside the terminology-cache
  directory, with two per-file hash tables: `[source]` (the file's own hash) and
  `[tracked]` (a *calculated* hash taken after `loadDependencyList(f, igf)` has run —
  i.e. dependency-aware);
- computes a `changeList` of files whose tracked hash moved, and drives the
  processor and generator loops — validation, narrative, fragment generation, 25 loop
  sites — over `changeList` rather than `fileList`, logging
  `Rapido Mode: Differential Build (N files)`;
- falls back to a complete build when nothing changed, when everything changed, or
  when the previous build started and did not complete; clears `temp/` only then, so
  unchanged fragments survive in `temp/` for Jekyll;
- with `-watch`, monitors `ig.ini`, `sushi-config.yaml`, `input/`, `fsh-generated/`
  and re-runs on change.

Two limits matter for CI. The loop constructs a fresh `PublisherFields` every
iteration (`Publisher.java:208`) and re-runs `Load IG`, so the **loaded context is
not kept warm** even in watch mode; what Rapido saves is the per-file work, which is
precisely the per-resource column of §2.1. And the tracker lives beside the terminology
cache, which §1.2 showed nobody persists — so in the DAK pipeline Rapido would start
cold every run and do a complete build every time. Rapido is the publisher-side half
of this proposal; the CI-persistence half is missing, and that half is ours to build.

### 2.4 The validator already runs as a service

`hapifhir/org.hl7.fhir.core`, `org.hl7.fhir.validation.cli`:

- **`server <port>`** (`HTTPServerCommand`): "Run the validator as a lightweight HTTP
  server … provides a `/validateResource` endpoint … runs until terminated"; loads
  `-version` and any number of `-ig` packages or folders; local-only unless
  `-allowNetworkAccess`. **`client -port N <file>`** and `client -port N stop` drive it.
- **`ValidationService`** keeps loaded `ValidationEngine`s in a `SessionCache`
  (`PassiveExpiringSessionCache`, 60-minute TTL), "so callers do not have to
  re-instantiate a new instance for each validation request". This is the engine
  behind validator.fhir.org (`validator-wrapper`).
- **`-watch-mode single|all`** with `-watch-scan-delay` (default 1000 ms) and
  `-watch-settle-time` (default 100 ms): revalidate what changed, keeping the engine.
- One-shot **`snapshot`** and **`narrative`** commands exist for a single resource.
- `-txCache DIR` names the terminology cache the engine reads and writes.

And one negative fact: `ValidationEngine.java` contains no `Serializable`,
`ObjectOutputStream` or any save/load of the loaded context. **The loaded object model
is warm in a process or it does not exist.** §5.3 takes that as a design constraint
rather than a gap to fill in Java.

---

## 3. Measurements

### 3.1 What could not be measured here, and where to get it

The sandbox's egress proxy blocks `packages.fhir.org`, `packages2.fhir.org`,
`packages.simplifier.net`, `hl7.org`, `tx.fhir.org`, `build.fhir.org` and
`*.github.io`. SUSHI 3.20.1 installed but failed in 17 s on the first dependency
download; the publisher jar is fetchable but cannot load `hl7.fhir.r4.core`. So **no
phase timings were measured in this session**, and none are quoted below as if they
had been.

They are one fetch away for anyone outside the sandbox: every published DAK site
carries `qa-time-report.json` (§2.1), e.g.
`https://worldhealthorganization.github.io/smart-immunizations/qa-time-report.json`,
and every CI log has the `Built. …` line. The falsifier in §7 Phase 1 is stated
against that file.

### 3.2 Two real DAKs

Shallow clones at `main`, 2026-09-16.

| | `smart-immunizations` | `smart-base` |
|---|---|---|
| package | `smart.who.int.immunizations` 0.2.0, FHIR 4.0.1 | `smart.who.int.base` 0.3.0, FHIR 4.0.1 |
| dependencies | `smart.who.int.base`, `hl7.fhir.uv.extensions.r4`, `uv.cql`, `uv.crmi`, `uv.sdc`, `uv.cpg`, `us.cqfmeasures`, `fhir.cqf.common` (+ core) | `hl7.terminology`, `extensions.r4`, `cql`, `cpg`, `crmi` (+ core) |
| `input/fsh` | 739 `.fsh`: 279 libraries, 192 valuesets, 138 plandefinitions, 41 measures, 36 examples, 10 questionnaires, 10 models, 8 extensions, 7 rulesets, 6 codesystems, **5 profiles**, 3 conceptmaps, 3 activitydefinitions | 117 `.fsh`: 32 actors, 23 valuesets, 17 profiles, 17 models, 12 codesystems, 7 extensions, 4 conceptmaps |
| `input/cql` | 279 `.cql` | 1 |
| `input/pagecontent` | 39 | 125 |
| terminology cache committed | no | no |

Worth noticing before any design: a DAK is **not profile-heavy**. `smart-immunizations`
has five profiles and 279 CQL libraries. The "Person profile changed" case the ask uses
is the *easy* case; the hard case, as §3.3 shows, is the shared CQL library.

### 3.3 Dependency cones, at source level

`content/pipeline/fsh-cone.ts` (shipped with this proposal) reads the `.fsh` and `.cql`
files directly. Every FSH entity is a node; edges `u → v` ("u depends on v") come from
`Parent:`, `InstanceOf:`, `insert`, `from` (bindings and includes), `Canonical()`,
`Reference()`, `obeys`, `codes from system` / `valueset`, canonical assignments, and
`$alias#code` code-system use; CQL `include` statements are edges between libraries,
and a `Library` instance whose `Id` matches a CQL library depends on it. The **forward
cone** of a node is its transitive dependents — what a change to it invalidates. The
**backward cone** is its transitive dependencies — the restricted checkout needed to
rebuild it.

```
bun run content/pipeline/fsh-cone.ts <ig-root> [--top N] [--csv out.csv]
bun run content/pipeline/fsh-cone.ts <ig-root> --changed input/fsh/profiles/IMMZPatient.fsh
```

One parser fact that changed the tail of these numbers and is worth knowing about any
DAK: **every RuleSet in both repositories is parameterised** (`RuleSet: Name(p1, p2)`),
and `smart-immunizations` inserts them 4,419 times. A first pass that keyed RuleSets by
their full declaration text resolved none of those inserts and reported RuleSets as
leaves; the shipped tool keys them by name.

| | `smart-immunizations` | `smart-base` |
|---|---|---|
| nodes / internal edges | 1,059 / 2,478 | 157 / 128 |
| nodes with **no** dependents | 715 (68 %) | 112 (71 %) |
| forward cone — median · p75 · p90 · p99 · max | **0 · 1 · 6 · 241 · 278** | 0 · 1 · 2 · 13 · 41 |
| backward cone (nodes) — median · p90 · max | 3 · 10 · 71 | 0 · 2 · 10 |
| backward cone (source **files**, incl. own) — median · p90 · max | **3 · 11 · 58** of 1,017 | 1 · 3 · 11 of 107 |

The distribution is two-humped. 715 nodes invalidate nothing and another 214 invalidate
one or two; then almost nothing until a cluster of hubs, each a quarter of the IG:

| forward cone | node | kind | why it is a hub |
|---|---|---|---|
| 278 | `LogicLibrary` | RuleSet | inserted by every Library instance |
| 275 – 271 | `WHOCommon`, `WHOConcepts`, `WHOElements`, `IMMZCommon`, `IMMZConcepts`, `IMMZElements` | CQL | included by every decision and indicator library |
| 265 / 108 | `IMMZD2DTCR` / `IMMZD2DTMR` | ActivityDefinition | the shared CommunicationRequest / MedicationRequest actions every PlanDefinition points at |
| 264 | `PlanDefMain`, `PlanDefCommunicationRequestAction` | RuleSet | inserted by every PlanDefinition |
| 241 / 73 | `AddWithExpandCanonical` / `AddWithExpand` | RuleSet | inserted 1,364 / 461 times across value sets and plans |
| 184 / 183 | `WHOEncounterElements` / `IMMZEncounterElements` | CQL | |
| 38 | **34** value sets `IMMZ.Z.DE1` … `IMMZ.Z.DE33` | ValueSet | all bound into the same 38 questionnaire and model artefacts |
| 36 | `IMMZPatient` | Profile | the Patient profile — the ask's own example |

Every hub is an **authoring convenience**: a RuleSet, a common library, a shared action.
That is the right thing to be a hub — the whole point of a RuleSet is that one edit
changes every user — and it is also the thing that changes least often once an IG is
past its first drafts (§3.5 measures this rather than asserting it).

By kind, in `smart-immunizations`: the 510 Instances have median 0 and p90 1
dependents; the 192 ValueSets median 0, p90 38 (the shared family); the 14 RuleSets
median 43, p90 264; the 5 Profiles median 1 and max 36. The largest backward cones are
the two data-model Logicals (`IMMZD1`: 71 nodes in 50 files; `IMMZD13`: 67 in 54) and
the QuestionnaireResponse examples that instantiate them (58 nodes, 58 files).

`--changed` answers the incremental-build question for a concrete edit — what to
rebuild (the forward cone including the changed nodes) and what to check out (the
files of the rebuilt nodes and their backward cones):

| changed file | declares | rebuild (nodes) | checkout (files of 1,017) |
|---|---|---|---|
| `profiles/IMMZAdverseEvent.fsh` | a profile nothing points at | **1** | 4 |
| `profiles/IMMZPatient.fsh` | the Patient profile | 37 | 102 |
| `valuesets/IMMZ.Z.DE33.fsh` | one of the shared value-set family | 39 | 98 |
| `cql/WHOCommon.cql` | the common CQL library | 276 | 279 |
| `rulesets/rulesets-plandefinition.fsh` | four PlanDefinition RuleSets | 268 | 269 |

### 3.4 What the numbers say, and what they cannot

**The falsifier did not fire, but it left a mark.** The brief for this work said: if a
typical artefact's dependents are most of the IG, a per-cone rebuild saves little and
the design has to lean on phase-level caching instead. A p90 of six dependents is the
opposite finding: for nine edits in ten, the per-resource work after a change is seven
resources or fewer out of a thousand. The mark is the p99 of 241 — about a dozen nodes,
all shared RuleSets, common CQL and two shared ActivityDefinitions, each of which
legitimately invalidates a quarter of the IG. Those cones are correct, not a defect in
the graph; a quarter is still not the whole; and §3.5 shows how often real commits land
on them.

**The restricted checkout is small.** SUSHI compiles a tank as one unit and fails on a
missing referenced entity, so a checkout that compiles must contain the backward cone.
That is a median of three files and a p90 of eleven, out of 1,017 — plus the alias
file(s) and `sushi-config.yaml`, which every checkout needs. (The median is three rather
than one because almost every instance inserts a RuleSet, and the RuleSet file comes
along.)

Three caveats, stated so nobody quotes these numbers past their reach. (i) This is the
**source-level** graph, not the publisher's: it does not see rendering-time edges
(every page carries the menu and the TOC — which is exactly why the meta-index is a
separate step, §5.5). (ii) Edges into dependency packages are not counted; a change
*there* is a toolchain change and re-keys the whole cache (§5.1). (iii) The CQL →
Library edge is by naming convention, and `insert` RuleSets are counted as
dependencies — correctly, since SUSHI expands them at compile time, and it is this
edge that makes the RuleSets hubs.

### 3.5 What real commits would have rebuilt

Cone sizes describe artefacts; what a build pays for is commits. So the graph at HEAD
was applied to the changed-file list of every commit in the DAKs' own histories
(`fsh-cone.ts --history N`; `git fetch --deepen` on the shallow clones):

| | `smart-immunizations` | `smart-base` |
|---|---|---|
| commits inspected (`--history 400`) · window | 400 · 2023-03 → 2026-07 | 400 · 2026-03 → 2026-08 |
| of which touch `input/fsh` or `input/cql` | 257 | 35 |
| … touching only files that declare nothing at HEAD (renamed or deleted since) | 94 | 7 |
| rebuild per commit, all 257 / 35 — median · p75 · p90 · max | 6 · 272 · 278 · 630 | 5 · 34 · 41 · 61 |
| rebuild per commit, the 163 / 28 that resolve — median · p75 · p90 · mean | **44 · 274 · 283 · 137** | 6 · 34 · 41 · 17 |
| commits rebuilding ≤ 50 nodes / > 200 nodes (of those that resolve) | 86 / 67 | 26 / 0 |
| **mean per-commit rebuild as a share of the IG** | **8.2 %** (12.9 % excluding the zeros) | 8.5 % (10.6 %) |
| checkout per commit (files) — median · p90 · max | 20 · 286 · 676 of 1,017 | 7 · 35 · 36 of 107 |

Read it as two populations, because that is what it is. **Half** of the resolving
`smart-immunizations` commits rebuild fifty nodes or fewer — under five per cent of the
IG. **Two in five** land on a hub (a RuleSet, a common CQL library, the value-set
family) and rebuild a quarter or more; the four largest are the mass refactors of
2024-03, 2024-12 and 2025-02, each touching dozens of source files at once. Averaged
over the whole history, an incremental build would have done **about an eighth of the
per-artefact work** a full rebuild does on every push — a twelvefold reduction on the
work that scales with the IG, with the fixed per-run cost of §4 untouched and needing
its own remedy.

Two honesty notes. The graph is HEAD's, so a commit that touched files since renamed
or deleted declares nothing and scores zero; those 94 commits are reported separately
above rather than pulled into the median. And a commit is not a push: several commits
per push shrink the count of builds but not the union of their cones.

---

## 4. Where the time goes, and what a cone can and cannot do about it

Two kinds of cost, and they need two different remedies.

**Fixed per-run cost, independent of what changed:** install the toolchain, download
the publisher and the template, download and parse the dependency packages, ask the
terminology server everything again, run Jekyll over the whole site, deploy the whole
site. A cone does **nothing** for these. They are removed by *caching loaded and
derived state* — the "once the CodeSystems and ValueSets are loaded and the binary
representation exists, tie it to the source and cache it" ask — and by pinning what is
currently `latest` and `#current` so that a content hash means something.

**Per-artefact cost, proportional to the IG:** snapshot, validate, narrate, generate
fragments, for each of ~1,060 resources, with ~71 fragments per StructureDefinition.
This is what a cone attacks, and §3.3 and §3.5 say the attack works: p90 six
dependents per artefact, and about an eighth of the work per commit over the real
history.

What is *not* in the cone graph but changes everything, and must therefore key the
cache rather than be tracked as an edge: the publisher version, the template version,
the SUSHI version, the dependency package versions in `sushi-config.yaml`, and the
terminology server. In Lean terms these are `lean-toolchain`; the Lean cache names its
branches `lake-cache/<pkg>-<toolchain-slug>` for exactly this reason, and a toolchain
bump is a whole-cache reseed, not an incremental step.

---

## 5. Design — three steps, three services

### 5.0 The Lean mapping, so the shape is recognisable

| Lean (`scripts/lake-cache.sh`, `lake-cache-produce.py`, `reseed-lean-cache.sh`) | IG |
|---|---|
| a module's `.lean` source | an FSH entity, a CQL library, a page |
| `.olean` — the compiled module | the compiled resource JSON, its snapshot, its expansion, its validation outcome, its narrative, its fragment set |
| `.trace` — hash of source + import traces; Lake rebuilds when it moves | `.trace` = hash(source) ⊕ hash(backward-cone traces) ⊕ toolchain slug |
| `lean-toolchain` pin → `lake-cache/<pkg>-<slug>` | publisher + template + SUSHI + dependency versions + tx identity → `ig-cache/<pkg>-<slug>` |
| Mathlib's upstream olean cache (`lake exe cache get`) — someone else's compiled dependencies | the dependency packages *with* their snapshots and expansions, and the terminology cache |
| an out-of-cone module compiles from source; "that is not a broken restore" | an artefact absent from the cache builds from source; not a broken restore |
| `lake build <Module>` — one module's cone | a publisher run restricted to a cone via `-no-validate`/`-no-narrative` complements, or Rapido's differential build |
| `restore` before `build`, always; exit 0/1/2/3 as the contract | `ig-cache restore` before any publisher run; the same four exit codes |
| `reseed-lean-cache.sh` phases, `-test` branch, `--promote` | `ig-cache seed` phases; safe-by-default; promote only after a verified restore |
| README regeneration from the tree (`readme-sections.ts`) | the meta-index rebuild |

### 5.1 The key

```
toolchain slug  = publisher <version> · template <id>#<pinned version> · sushi <version>
                  · sha256(sorted sushi-config dependencies) · tx <server identity>
artefact trace  = sha256( source bytes · toolchain slug · trace of every backward-cone member )
```

Content-addressed, so a `git mv` or a whitespace-only commit is a hit. Two things this
forces on the DAK side, and both are improvements independent of any cache: **pin the
publisher** (a version tag, not `releases/latest`) and **pin the template**
(`who.template.root#<version>`, not `#current`). Until they are pinned, no two runs
share a slug and no cache can be honest.

### 5.2 The per-artefact record (the "olean")

```
ig-cache/<slug>/<Type>-<id>/
  resource.json        SUSHI output, as loaded (with snapshot for a StructureDefinition)
  expansion.json       for a ValueSet, if expanded
  outcome.json         validation messages for this resource (the qa.json rows)
  narrative.xhtml
  fragments/           the publisher's temp/ fragments for this resource
  .trace               the artefact trace of §5.1, plus the toolchain slug in clear
```

This is deliberately **FHIR-native, not JVM-native**. The publisher's own
`package.tgz` is already "the IG's resources with snapshots", `expansions.json` is
already "the expansions", and `qa.json` is already per-file messages; the record is
those, split per artefact and keyed. Anything that consumes FHIR can read it, and
nothing in it is tied to a publisher build or a Java version — which §2.4 showed the
loaded context itself would be.

### 5.3 Step 1 — the warm validator, and what "cache the binary AST" means in practice

The loaded object model — dependency packages parsed, snapshots generated,
expansions and terminology answers in hand — is the thing the ask wants tied to source
and cached. §2.4 established that it cannot be serialised as such. It can be realised
two ways, and the design uses both:

**Warm in a process.** Run the validator as the service it already is —
`java -jar validator_cli.jar server <port> -version 4.0 -ig <dependency>… -ig <ig-root>
-txCache <dir>` — behind an MCP server in this repo, with the engine held in its
`SessionCache`. Proposed tools, all thin wrappers over the HTTP service or the
in-process `ValidationEngine` API:

| MCP tool | Does | Backed by |
|---|---|---|
| `fhir_context_load(igRoot)` | load dependencies + the IG's own conformance resources; return the toolchain slug and context hash | `server` startup / session |
| `fhir_validate(resource, profiles?)` | validate one resource against a warm context | `/validateResource` |
| `fhir_snapshot(sd)` | generate a snapshot | `snapshot` command, in-process |
| `fhir_expand(valueSet)` | expand, through the shared `txCache` | engine + tx |
| `fhir_narrative(resource)` | render narrative — the "AST re-render" of one artefact | `narrative` command, in-process |
| `fhir_context_status()` | slug, age, what is loaded, whether the tx cache is warm | session |

This is the authoring-loop win: an agent editing a profile validates it in the time
one resource takes, not the time a build takes, and the JVM stays up across edits.
The capability probe `fhir-validator` that the package manifest already claims gets a
real detection command here.

**Cold-startable from derived FHIR.** When there is no warm process — a fresh CI
runner — the context is rebuilt not from *source* but from the **derived** form:
dependency packages from a restored package cache, the IG's own StructureDefinitions
*with snapshots already present* (the context skips snapshot generation when a
snapshot is there), expansions from `expansions.json`, and the terminology cache
restored so that tx.fhir.org is asked only what is genuinely new. That is the
`lake exe cache get` move: someone else's compiled dependencies, restored in minutes,
instead of recompiled. What it does **not** save is JSON parsing of the dependency
packages — which is why §7 Phase 1 measures the `loading` phase before assuming this is
where the time is.

### 5.4 Step 2 — re-render only the cone

Given the changed files, `fsh-cone.ts` yields the forward cone C. The rebuild then
runs the publisher over C only, by one of two mechanisms, chosen by what upstream
supports at the time:

- **Skip-list complement (works with today's publisher):** restore `temp/`,
  `txCache/` and the package cache; run with `-no-sushi` on a SUSHI output that was
  itself produced from the restricted checkout, and with `-no-validate` and
  `-no-narrative` set to *everything not in C* (the `Type/*` and `*/id` wildcards keep
  the lists short). Fragment generation still runs for all resources — `-generation-off`
  is all-or-nothing — which is the measured limit of this route (§7 Phase 3's
  falsifier).
- **Rapido differential (upstream, experimental):** persist `.build-tracker.ini` and
  `temp/` across runs via the cache, and let the publisher compute the change list
  itself. This covers fragment generation too, and is where the upstream conversation
  in §7 Phase 5 points.

The **restricted checkout** is the backward cone of C — `git sparse-checkout` of those
files plus `sushi-config.yaml`, `ig.ini`, the alias file(s) and the pages in C — which
§3.3 measured at a median of three files and a p90 of eleven. Its purpose is to let SUSHI
compile *only* what the rebuild needs; the publisher's site assembly is not run on the
restricted tree but on the **merge** of restored records and the freshly built ones,
which is step 3.

### 5.5 Step 3 — the meta-index rebuild

Inputs: the full set of artefact records (restored + rebuilt) and the IG resource.
Outputs: the closed list of whole-IG aggregates in §2.1 — `ImplementationGuide
.definition.resource[]`, `artifacts`, `toc`, `searchform`, `canonicals.json`,
`expansions.json`, `package.tgz`, `full-ig.zip`, `definitions.*.zip`,
`validator.pack`, `usage-stats.json`, `.index.json`, and `qa.html`/`qa.json` as the
**aggregate of per-artefact outcomes** — then the template and Jekyll over the merged
`temp/`. It is deterministic from the index, it is the only step that is whole-IG by
nature, and it is cheap relative to validation. One MCP tool, `ig_metaindex_rebuild`,
and one rule: **it never re-derives an artefact.** If a record is missing it reports
the miss (exit 1, "build required"), it does not quietly rebuild — that is the third
state this repo insists on everywhere from the README TOC to CI health.

Jekyll is the residual whole-site cost. Two honest options, in order: `jekyll build
--incremental` over a `temp/` in which unchanged fragments are byte-identical (Jekyll
skips them), and, longer term, page-level rendering that treats the site as one more
per-artefact output — which is a template question for WHO's `who.template.root`, not
a platform one.

### 5.6 The cache service

`scripts/ig-cache.sh status | restore | seed | verify | doctor | list`, with
`lake-cache.sh`'s contract verbatim: **0** present and usable, **1** miss (a full build
is required — and that is a normal outcome, not an error), **2** usage or environment
error, **3** present but unusable (toolchain slug mismatch: publisher or template
moved). `restore` first, always. `seed` runs the phases toolchain → dependencies → full
build → write records → verify a restore from a clean clone → promote, each resumable,
and writes to `<branch>-test` unless `--promote`. Store: an orphan branch
`ig-cache/<pkg>-<slug>` in the DAK repository, split into `< 100 MB` parts as the Lean
cache already does, with GitHub Actions' cache as an optional first tier (it evicts
after seven days and caps at 10 GB, so it cannot be the only copy). `doctor` says which
of the six slug components moved, because "publisher bumped" and "someone changed a
dependency version" want different responses.

What is deliberately **not** cached: anything keyed on `latest` or `#current`, and
`qa.html` as a file — it is recomputed from outcomes every time, so it can never
describe a build that did not happen.

---

## 6. Ownership — publisher, smart-base CI, folio-assistant

folio-assistant is the platform, not the content, and not the DAK pipeline either.

| Piece | Owner | Why there |
|---|---|---|
| Rapido differential build; persisting its tracker in a nameable place; keeping the loaded context across watch iterations | **HL7 publisher** (Grahame, Zulip) | It is their experimental mode and their process model. We consume it; we do not fork it. |
| Pin `publisher.jar` and `who.template.root`; `actions/cache` (or the orphan-branch restore) for the package cache and `txCache`; pass the skip lists; split "build" from "index and deploy" | **smart-base** `ghbuild.yml` | GitHub Actions is the caller of the IG build; `smart-base-tools.md` already rules the build scripts out of this platform. |
| `fsh-cone.ts` (this PR); `ig-cache.sh`; the MCP tools of §5.3 and §5.5; the `fhir-validator` capability probe; retiring the four dangling script references of §1.3 | **folio-assistant** | Content-type-generic: nothing in them names WHO. A paper folio's Lean cache and a document folio's IG cache are the same service with a different toolchain slug. |
| Which artefacts a DAK treats as a hub (the CQL commons), and whether a DAK commits its terminology cache | **the DAK repository** | Content decisions belong to the content. |

---

## 7. Phased plan, gates, and what would falsify each phase

**Phase 0 — this PR.** The analysis, and `fsh-cone.ts` with a fixture test.
Gate: `bun test`, `eslint`. Falsifier: none; this is the instrument.

**Phase 1 — stop paying the fixed cost (smart-base CI; cheapest, largest expected
win).** Pin publisher and template. Cache the package cache and `txCache` keyed by the
slug. Measure `qa-time-report.json` before and after on one DAK.
Falsifier: if `loading` is under a tenth of the total in the *before* report, the fixed
cost is not where the time is, and Phase 1 shrinks to the pins.

**Phase 2 — the warm validator MCP (folio-assistant).** `server` mode + `client`
behind the tools of §5.3, with `-ig <ig-root>` loading the DAK's own conformance
resources. Gate: validating one changed profile after warm-up takes seconds, not a
build; `--check-deps` reports `fhir-validator` from a real probe.
Falsifier: if the HTTP service cannot load a local IG folder's conformance resources
without a package build, the in-process API is used instead and the service boundary
moves one layer down.

**Phase 3 — the cone-restricted run.** Orchestrate: changed files → `fsh-cone`
forward cone → restricted checkout → SUSHI → publisher with the skip-list complements
and restored `temp/`, `txCache/`, package cache. Measure `validation` and
`narrative generation` in the time report against Phase 1's baseline.
Falsifier: if `generate` dominates after validation and narrative have collapsed —
because fragment generation ignores the skip lists — then the skip-list route has hit
its ceiling and Phase 3 becomes "persist Rapido's tracker and `temp/` across runs" and
nothing else.

**Phase 4 — records and the index.** `ig-cache.sh` seed/restore/verify/doctor over the
per-artefact records of §5.2, and `ig_metaindex_rebuild`. Gate: a clean clone plus
`restore` plus a one-profile edit produces a site byte-identical, outside the cone, to
the full build's. Falsifier: any aggregate that cannot be regenerated from records
alone — that aggregate is then a per-run cost and is listed as such, not hidden.

**Phase 5 — upstream.** Take §2.3's two limits to Zulip with the measurements of §3.3
in hand: keep the context warm across watch iterations, and make the tracker location
a parameter so CI can persist it.

## Not done, and not verified

Not done here, on purpose: no change to smart-base's workflow (their repository, their
caller); no MCP service yet (the design is the deliverable the author asked for, and
which piece to build first is their call); no publisher Java. Not verified: no
publisher run and therefore no phase timings (§3.1); the dependency-awareness of
Rapido's tracked hash is inferred from `loadDependencyList` preceding `getCalcHash`,
not traced through; the cone graph is source-level (§3.4).
