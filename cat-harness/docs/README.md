<!-- kg:subgraph:begin -->
# docs

Documentation ABOUT the knowledge graph itself -- 241 markdown files, the entire published surface, and UNDECLARED until 2026-09-20. That is the dh4f defect in its purest form: every declaration-driven consumer scanned straight past the thing readers actually see. Owner, same day: 'docs/ is about documentation about the KG itself... docs/ in cat-harness', with the intent that this is WHERE DOCUMENTATION GOES and therefore the only place a forward reference may be authored. The `docs` kind is RENDERABLE and is registered by `schemas/docs-graph-kind.ts` rather than added to BASE_GRAPH_KINDS, so the assertion that the harness's base vocabulary carries no renderable kind stays true and its test stays unchanged. Distinct from `folio`, which is core's: the difference is the SUBJECT. A page explaining how ingestion works is `docs`; a note an author writes about an ingested catalogue is a `folio`; the catalogue itself is `library/`. `dependents` is `skip`, unlike the other renderable graph `folio`: this is documentation THIS instance publishes about the knowledge graph, so a dependent folio inherits the pages rather than an empty directory to refill — it authors its own subject matter under `folio/`, which is `reproduce`. CHANGED TO `reproduce` 2026-09-21 ON THE OWNER'S COMPOSE RULING (bean `n0nf`, issue #638), and the paragraph above is kept rather than deleted because its reasoning was right for the question it answered. It argued `skip` on the grounds that a dependent should INHERIT THE PAGES rather than get an empty directory to refill. Under compose it gets BOTH: the pages still reach it, and `reproduce` gives it the place to override one. So this is not a reversal of that argument, it is the second half of it arriving. The `dependents` doc warns that defaulting to `reproduce` ships junk -- twelve inherited directories, four of them the platform's own, each empty with a committed keep marker, the `dh4f` shape shipped downstream. That warning is about a DEFAULT, and the test it turns on is the one that schema states: is this directory part of the SHAPE a folio has, or merely where THIS instance's content lives? Before the ruling `docs/` was the second. After it, a folio is expected to author and override its own documentation, which makes it the first -- the same answer `uploads/` and `library/` get, and they are `reproduce` and also start empty. WHAT THIS DOES NOT DO is give the REPOSITORY ROOT a `docs/`. The root does not depend on cat-harness (measured: its declaration chain has length 1), so nothing is inherited there, and the root's own `harness.json` carries the owner's "only uploads/ on this repo's root". `n0nf` says the root's docs "is not its own: cat-harness installs it", which needs a dependency edge that does not exist. That is left for the owner rather than settled here. A viewer IS declared for this `docs` directory, and `owesVisualiser` not demanding one is not the same as forbidding one. The kind is `renderable`, so it does not OWE a viewer — but the owner's rule, quoted in full in `mount-instance-docs.ts`'s module note, is that a harness which instantiates a directory MAKES a visualiser for it, docs and library included. It points at the `docs-auto` index, NOT at the mount route `/docs/<instance>/`: that mount is a VERBATIM copy of the directory, and `visualiserHref` exists precisely because linking a rail to it lands on a byte-identical page — the owner's *"clicking on doc/ ... under who-iris navbar did nothing"*. The owner's sentence is CITED rather than quoted here on purpose: it names a graph whose viewer is `publish: "staging-only"`, and a test asserts that name appears NOWHERE in the built export — including in a declaration's own prose, which is where quoting it put it. The test caught that, and this paragraph is the second attempt.

Part of [C@T Harness](../README.md), declared as `docs`, holding `docs`.

| file | what it is | used by |
|---|---|---|
| [`Gemfile`](Gemfile) | a file |  |
| [`Gemfile.lock`](Gemfile.lock) | a file |  |
| [`_config.yml`](_config.yml) | a file |  |
| [`accessibility.md`](accessibility.md) | Accessibility |  |
| [`agentic-harness.md`](agentic-harness.md) | Agentic harness |  |
| [`architecture.md`](architecture.md) | Architecture |  |
| [`beans-and-todos.md`](beans-and-todos.md) | Beans and todos |  |
| [`content-types.md`](content-types.md) | Content types |  |
| [`contributing.md`](contributing.md) | Contributing |  |
| [`crdm-methodology.md`](crdm-methodology.md) | CRDM methodology |  |
| [`detangle.md`](detangle.md) | detangle |  |
| [`docs.json`](docs.json) | data |  |
| [`document-ingestion.md`](document-ingestion.md) | Document ingestion |  |
| [`evidence.md`](evidence.md) | Evidence for a recommendation |  |
| [`fhir-content.md`](fhir-content.md) | FHIR content |  |
| [`folio-assistant-migration.md`](folio-assistant-migration.md) | Folio-Assistant Infrastructure Migration (miga) |  |
| [`getting-started.md`](getting-started.md) | Getting started |  |
| [`harness.md`](harness.md) | The Harness |  |
| [`ig-publisher.md`](ig-publisher.md) | The FHIR IG Publisher |  |
| [`index.md`](index.md) | "folio-assistant — a content-agnostic agent skills framework." |  |
| [`installation.md`](installation.md) | Installation |  |
| [`kg-navigation.md`](kg-navigation.md) | kg-navigation |  |
| [`kgraph.md`](kgraph.md) | The KGraph |  |
| [`managing-agent-context.md`](managing-agent-context.md) | Managing agent context |  |
| [`platform.md`](platform.md) | "What the platform does, and how its processes, roles, tasks and skills fit together." |  |
| [`publication-workflow.md`](publication-workflow.md) | Publication workflow |  |
| [`qou-migration-checklist.md`](qou-migration-checklist.md) | qou migration checklist |  |
| [`sage-mcp.md`](sage-mcp.md) | Sage as an MCP server (lazily loaded) |  |
| [`skills.md`](skills.md) | Skills & roles |  |
| [`subgraph-viewers.md`](subgraph-viewers.md) | Subgraph viewers |  |
| [`swarm-management.md`](swarm-management.md) | Swarm management |  |
| [`tool-graph.md`](tool-graph.md) | "What a Tool is, how it differs from a skill, and how the two are joined without being conflated." |  |
| [`translation-support.md`](translation-support.md) | Translation support |  |
| [`_data/`](_data/) | 5 files | |
| [`_includes/`](_includes/) | 9 files | |
| [`ar/`](ar/) | 13 files | |
| [`architecture/`](architecture/) | 8 files | |
| [`assets/`](assets/) | 449 files | |
| [`beans/`](beans/) | 1 file | |
| [`bootstrap/`](bootstrap/) | 1 file | |
| [`cat-harness/`](cat-harness/) | 42 files | |
| [`es/`](es/) | 13 files | |
| [`external-schemas/`](external-schemas/) | 1 file | |
| [`fr/`](fr/) | 13 files | |
| [`fsh-guts/`](fsh-guts/) | 1 file | |
| [`glossary/`](glossary/) | 6 files | |
| [`guides/`](guides/) | 14 files | |
| [`health/`](health/) | 1 file | |
| [`issue-marks/`](issue-marks/) | 1 file | |
| [`methodologies/`](methodologies/) | 1 file | |
| [`processes/`](processes/) | 75 files | |
| [`proposals/`](proposals/) | 15 files | |
| [`prov-qaqc/`](prov-qaqc/) | 1 file | |
| [`qa/`](qa/) | 1 file | |
| [`reference/`](reference/) | 309 files | |
| [`requirements/`](requirements/) | 1 file | |
| [`research-and-analysis/`](research-and-analysis/) | 2 files | |
| [`ru/`](ru/) | 13 files | |
| [`swimlane-glossary/`](swimlane-glossary/) | 1 file | |
| [`themes/`](themes/) | 1 file | |
| [`todos/`](todos/) | 1 file | |
| [`tools/`](tools/) | 1 file | |
| [`translation-status/`](translation-status/) | 1 file | |
| [`uml/`](uml/) | 125 files | |
| [`uploads/`](uploads/) | 1 file | |
| [`wireframes/`](wireframes/) | 140 files | |
| [`zh/`](zh/) | 13 files | |
<!-- kg:subgraph:end -->
