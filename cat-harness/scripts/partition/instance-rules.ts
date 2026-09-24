/**
 * THIS instance's partition data — the five-repo target of issue #223, the
 * layering it permits, and the ~190 path entries that say which module is
 * whose.
 *
 * ## It is a module rather than a JSON document, on purpose
 *
 * 65% of the rules below is comment. Those comments are not decoration: each
 * one records how its entry was arrived at, usually by measurement ("measured
 * by putting these in the harness list at the bottom first and watching the
 * two edges survive"; "omitting it cost 3 wrong-direction edges the day #468
 * merged"). A JSON table cannot hold a note positioned beside the entry it
 * explains, and a `why` field per rule would flatten per-ENTRY notes into
 * per-RULE ones. So the split keeps the mechanism generic and leaves the data
 * here, which is `detangler-topic-coherence`'s repair with the host chosen to
 * fit what the data actually is.
 *
 * ## What another instance does
 *
 * Writes its own file like this one and hands it to
 * `scripts/partition/engine.ts`. Nothing in the engine names a repo, a
 * directory or a layer.
 *
 * ## The declared-path literals live here now
 *
 * 36 of the 96 entries in `declared-path-baseline.json` were keyed on
 * `scripts/repo-partition.ts`; they are keyed on this file after the move.
 * That is not churn to be minimised — the literals genuinely moved, and the
 * baseline is keyed by the file that holds them so that a literal appearing
 * in a NEW file is visible as new.
 *
 * @module scripts/partition/instance-rules
 */

import { resolve } from "path";

import type { PartitionSpec, PermittedEdge, Rule } from "./engine.js";

// ── The proposed repositories ───────────────────────────────────

/**
 * The five target repositories from issue #223, plus `test`.
 *
 * `test` is NOT a sixth repo in the proposal — it is the Test-repo material
 * the taxonomy describes and Phase III builds. It is tracked separately here
 * because a test module is permitted to import across every boundary, so
 * counting its edges as violations would bury the 33 that matter.
 */
export type Repo = "harness" | "core" | "sci" | "kg" | "base" | "test";

/** Display names, in dependency order (most depended-upon first). */
export const REPOS: Array<{ id: Repo; name: string }> = [
  { id: "harness", name: "agentic-harness" },
  { id: "core", name: "folio-assist-core" },
  { id: "sci", name: "folio-asst-sci" },
  { id: "kg", name: "smart-kg" },
  { id: "base", name: "smart-base" },
  { id: "test", name: "(test material)" },
];

/**
 * What each repo is permitted to import from — itself plus its ancestors in
 * the dependency DAG. An edge to anything else is a wrong-direction edge.
 *
 * Mirrors the diagram in `docs/architecture/future-state.md`:
 *   core -> harness;  sci -> core;  kg -> core;  base -> kg
 */
export const ALLOWED: Record<Repo, Repo[]> = {
  harness: ["harness"],
  core: ["core", "harness"],
  sci: ["sci", "core", "harness"],
  kg: ["kg", "core", "harness"],
  base: ["base", "kg", "core", "harness"],
  // A test may reach anywhere it needs to; that is what a test is for.
  test: ["test", "base", "kg", "sci", "core", "harness"],
};

// ── Assignment rules, in priority order ───────────────────

/**
 * Ordered. First match wins, so explicit path rules must precede keyword
 * rules — otherwise `src/tools/workflow.ts` is claimed by the BPMN keyword
 * before the harness rule can claim it.
 */
export const RULES: Rule[] = [
  // ── Test material. FIRST, so that `scripts/tests/lean-witness.test.ts` is
  //    classified by what it IS (a test) rather than by what it exercises.
  //
  //    `"test/"` since 2026-09-19 (bean `auap`): the two test trees were
  //    consolidated onto `test/`. Leaving this as `"tests/"` would NOT have
  //    errored — the 10 `*.e2e.ts` specs, their two `support/` fixtures and
  //    the health sweep's three non-`.test.ts` modules would simply have
  //    fallen past this rule to keyword matching, since the rule below keys
  //    on `.test.ts`/`.spec.ts` and an `.e2e.ts` matches neither. Fifteen
  //    modules quietly reclassified, and a partition report that still
  //    printed a total.
  {
    repo: "harness",
    // BEFORE the `test/` prefix below, because rules are FIRST-MATCH and an
    // exact entry further down cannot override an earlier prefix — measured
    // by putting these in the harness list at the bottom first and watching
    // the two edges survive.
    //
    // `test/health/` is a LIBRARY that happens to live under `test/`: its own
    // header calls it "the registry, and the pure verdict logic", and
    // `scripts/staging-cleanup-preflight.ts` — a real workflow step, not a
    // test — imports it. The blanket prefix is right for everything else in
    // that tree.
    exact: ["test/health/checks.ts", "test/health/probes.ts"],
  },
  {
    repo: "test",
    // declared-path-literal: the TARGET layout of the five-repo split, which no
    // declaration in THIS repo describes — that is the whole point of the plan.
    prefixes: ["test/", "scripts/tests/"],
  },
  {
    repo: "test",
    keyword: /\.(test|spec)\.ts$/i,
  },

  // ── Hand-triaged platform meta-scripts (2026-09-18).
  //
  //    These 27 were reported `unassigned` by the structural rules: they are
  //    `gen-*`, `check-*`, `render-*` scripts that operate on the platform's
  //    own docs, schemas, skills and workflows. Each was read and assigned by
  //    the bean `dh4f` question — does it read or write PLATFORM or CONTENT?
  //    Kept as an explicit list rather than a prefix rule because the answer
  //    genuinely differs per file: `gen-skill-docs` is harness (Skills are a
  //    harness concept) while `gen-schema-docs` is core (the content-object
  //    model is core's), and no path pattern separates them.
  {
    repo: "harness",
    triaged: true,
    exact: [
      "scripts/check-ci-health.ts",          // workflow state on the default branch
      "scripts/check-workflow-policy.ts",    // BPMN relaxation legality
      "scripts/bpmn-render.ts",              // BPMN → SVG
      "scripts/render-bpmn.ts",              // BPMN → SVG (the processes one)
      "scripts/generate-registry.ts",        // scans skills/ → SkillRegistry
      "scripts/gen-skill-docs.ts",           // skill instruction bodies → docs
      "scripts/validate-skills.ts",          // skill package manifests
      "scripts/init-folio.ts",               // runs BEFORE a content type exists
      // HARNESS: the review page is rendered surface, which the harness owns
      // (bean txut; 7ofc's ruling for the folio visualiser). It imports
      // only harness modules (the diff renderers and their registry, bean
      // d903); build-document-site (core) calls it, core -> harness.
      "scripts/gen-review-page.ts",
      "scripts/review-renderers.ts",     // the diff renderers the review page embeds (bean `d903`)
      "scripts/word-diff.ts",            // the word diff those renderers run, embedded by toString (bean `d903`)
      "scripts/review-heat.ts",          // the review page heat map, embedded by toString (bean `qbfi`)
      "scripts/review-nav.ts",           // the review page outline, breadcrumb and minimap, embedded by toString (bean `eb4l`)
      "scripts/publish-block-qa.ts",     // a folio's QA verdicts summarised for the heat map (bean `qbfi`)
      "scripts/block-screenshots.ts",    // pictures of changed visual blocks, compared in Chromium (bean `0rxe`)
      "scripts/repo-partition.ts",           // this tool; platform meta
      "scripts/check-instance-config.ts",    // the config-naming gate
      // HARNESS, by the same test as `check-ci-health` above: its subject is
      // this repository's own Jekyll templates and the baseurl its site is
      // served under, and it reads no folio content at all. It parses HTML
      // with a regex and imports nothing but `fs` and `path`, so it cannot
      // drag a folio in (bean `blv9`).
      "scripts/check-docs-templates.ts",
      // HARNESS: its subject is the INSTANCE DECLARATION's `images[]` and the
      // harness code that consumes a role, not a folio's content. It reads
      // declarations through `cat-harness.ts` and walks `.ts` sources with a
      // regex; no folio content is opened (bean `5yrl`).
      //
      // IT CARRIED a bare `import "../schemas/folio-graph-kind.js"` until
      // #840 merged, because `readDeclaration` threw on this repo's own
      // declaration without it — one of the 25 harness -> core registration
      // edges bean `q2wn` measured. #840 moved the graph-kind registry to a
      // leaf and put the trigger at `cat-harness.ts`'s foot, so the import
      // became unnecessary AND became an edge the fixed regex can see. It was
      // REMOVED here in the same merge that brought #840 in, and the gate was
      // re-run to prove the registration still resolves without it rather
      // than assumed to.
      "scripts/check-image-roles.ts",
      // HARNESS: the one orphan-page selector (bean `s8nu`), extracted as a
      // LEAF so `state-visualizer.ts` can be a call site without importing
      // `gen-schema-viz.ts` -- a 1200-line page generator whose body is one
      // template literal. Same move #840 made for the graph-kind registry.
      // It imports `node:fs` and `node:path` and nothing else, so it cannot
      // drag a layer in behind it; its subject is which pages a generator in
      // this repository wrote, not any folio's content.
      "scripts/orphan-pages.ts",
      // HARNESS for the same reason as `check-ci-health` above: its subject
      // is this repository's own deploy workflow — which commands it runs
      // and whether they succeed — and it reads no folio content at all.
      // It builds an instance's KG the way `kg-export` (already harness,
      // below) does, one instance at a time (issue #720).
      "scripts/check-published-instance-exports.ts",
      // HARNESS on the same argument: its subject is this repository's own
      // workflows -- which generators each invokes -- and it reads no folio
      // content at all (issue #777, bean `qgpo`).
      "scripts/check-invocation-parity.ts",
      // Ported from main during the split (d8f23d39a2, bean `3pqn`): the
      // entry was added to `RULES` while `RULES` was moving to this file,
      // so it arrives here rather than where it was written.
      // The unattended half of the same question, and harness for the same
      // reasons: it reads the forge's view of this repository's pull requests.
      "scripts/check-prs-have-runs.ts",
      // The two halves this tool was split into, 2026-09-20. Both HARNESS,
      // and the target-before-importer test says why: `engine.ts` imports
      // nothing but `fs` and `path`, and this file imports one TYPE from
      // it. Neither reaches for a folio, so neither can drag one in.
      //
      // They are listed rather than covered by a `scripts/partition/`
      // prefix ON PURPOSE: a prefix would claim whatever lands in that
      // directory next, and a rule that classifies by location will keep
      // reclaiming. The gate caught both of these as unassigned the first
      // time it ran after the split, which is the behaviour worth keeping.
      "scripts/partition/engine.ts",         // the generic algorithm
      "scripts/partition/instance-rules.ts", // this file: the data it runs on
      // HARNESS, and the reasoning is the same as `check-ci-health` above:
      // it reasons about INSTANCES and their declarations — which harness
      // instantiated which directory, and where that mounts on the published
      // site. It never opens a content object. The owner's addressing rule
      // (`<base-url>/<path-to-kind-or-node>`) is a statement about harnesses,
      // not about what a folio holds.
      "scripts/mount-instance-docs.ts",      // instance-rendered content -> /<kind>/<instance>/
      // The harness navigation it injects into those pages. Same layer by the
      // same argument: the rail is the HARNESS's chrome, and it exists because
      // a mounted page gets no Jekyll layout. Putting it in a folio's
      // generator would give every instance its own copy of the platform's
      // navbar, which is the boundary AGENTS.md opens with.
      "scripts/lib/harness-rail.ts",
      // The renderer that rail became an adapter over (bean `sjic`). HARNESS
      // by the same argument and more strongly: it is now the ONE navbar, for
      // a mounted page and for a Jekyll page alike, so a folio owning it would
      // mean a folio owning the platform's chrome for every other instance
      // too. It renders a model and reads no content object -- the model's
      // regions are composed by the caller from declarations.
      "scripts/lib/navbar.ts",
      // The geometry that navbar became a reader of, and the generator that
      // renders it to CSS (bean `sjic`). HARNESS for the same reason as
      // `navbar.ts` and one step more plainly: the numbers are the width of
      // the PLATFORM's chrome on every instance's pages at once, so a folio
      // owning them would set the navbar's width for every other folio. The
      // generator writes into the site's own asset directory, deriving the
      // path from `siteDirFor` rather than naming it, so it does not know
      // which instance it is writing for either.
      "scripts/lib/navbar-geometry.ts",
      "scripts/gen-navbar-geometry-css.ts",
      // Its sibling: same question, same answer. `compose-docs.ts` reads the
      // `docs` declarations, works out which is the base and which the
      // overlay from `scope`, and lays them down in order. Every decision it
      // makes is about INSTANCES and where their directories resolve; it
      // opens the files only to copy bytes, and never asks what a page says.
      "scripts/compose-docs.ts",             // docs layers -> one composed tree
      "scripts/check-workflow-refs.ts",      // every BPMN folio:skill ref resolves
      // Whether a swimlane DEFINES itself — `name`, `<documentation>`, and
      // both reaching the translation templates. Harness by subject for the
      // same reason as its neighbour above: a lane is a ROLE boundary, which
      // is a platform concept, and the diagrams it reads are the platform's
      // own processes. A folio that draws none still inherits the rule.
      "scripts/check-lane-documentation.ts", // a lane has a name AND a definition
      "scripts/check-process-documentation.ts", // ...and the process says what it is FOR
      "scripts/eval-crdm-detect.ts",         // measures the crdm-detect signals
      "scripts/eval-crdm-detect-blind.ts",   // a blinded packet for a second annotator, and the kappa that scores it (bean `vjbl`)
      // ...and the signals themselves, lifted out of it by bean `xfoh` so the
      // patterns could be checked against the skill prose they transcribe.
      // Same side as its runner, and harness by subject too: whether a request
      // is a PLATFORM capability change is a question about the platform, and a
      // folio that never asks for one still needs the answer to be "no".
      "src/crdm/detect-signals.ts",         // ...the patterns, checked against the skill
      "scripts/stakeholder-map.ts",          // CRDM phase 1 CLI
      "src/tools/stakeholder-map.ts",        // ...as an MCP tool

      // Reported `unassigned` on 2026-09-18 and read one at a time, same
      // question as the rest of this list: does it act on PLATFORM or on
      // CONTENT? All six act on harness-level graphs — Tools, the knowledge
      // graph, the instance declaration, the CI workflows — so none of them
      // needs a folio to have anything to do.
      "src/mcp/project.ts",                  // Tool node → MCP declaration + argv
      "scripts/check-tools.ts",              // every Tool `satisfies` resolves to a skill
      "scripts/tool-coverage.ts",            // which uncovered skills warrant a Tool
      "scripts/kg-export.ts",                // the instance's KG → one JSON-LD file
      "scripts/glossary-export.ts",          // the instance's swimlane personas → SKOS
      "scripts/kg-locale-export.ts",         // that graph again, once per locale
      "scripts/publish-instance-files.ts",   // an instance's own files, .md also as .html (bean `iwtn`)
      "scripts/check-model-languages.ts",    // a model declares its languages, or it is a finding
      "scripts/harness-schema-export.ts",    // the declaration's JSON Schema, at its `$id`
      "scripts/gen-object-model-uml.ts",     // the harness object model, derived from its JSON Schemas
      "scripts/gen-uml-overview.ts",         // UML per named sub-graph, PlantUML + Mermaid from one model
      "scripts/uml-palette.ts",              // the UML colours, read from uml.css for the .puml files
      "scripts/plantuml-render.ts",          // shared: portrait/landscape, hash stamp, pinned jar, page figure
      "scripts/skill-contracts.ts",          // where a skill's input/output contracts are, read from the skill (#1168)
      "scripts/test-run-conformance.ts",     // a test run's cases against its skill's contract (#1168)
      "scripts/arrow-direction.ts",          // general nodes point only at general nodes (#1168)
      "scripts/prose-names.ts",              // file names in general nodes' prose still resolve (bean `epbt`)
      "scripts/spec-users.ts",               // who declares each external spec — read from the users (bean `u63y`)
      // Same relation as the line above, checked from the other end: that one
      // WRITES the maintained artefacts, this one asks whether every `maintains`
      // claim is in the published tree. Harness-level for the same reason — a
      // Tool node and a built site, no folio needed to have anything to do.
      "scripts/check-maintained-artefacts.ts", // every `maintains` claim is actually published
      // Third question about the same built tree, and harness-level for the same
      // reason: it asks whether the markdown converter refused a block of HTML
      // and escaped it, which is a property of the RENDER PIPELINE, not of any
      // folio's subject matter. It imports nothing but `node:fs` — a folio could
      // not make it answer differently.
      "scripts/check-escaped-markup.ts",     // no page publishes a block tag as visible text
      "scripts/staging-stamp.ts",            // which BUILD wrote an artefact — CI identity, no folio
      "scripts/qa-results.ts",               // a QA process's findings about a PRODUCED artefact; `qa` is a base graph kind
      // Its merge-time sibling, and harness-level for the same reason: it
      // resolves conflicts in the `qa` graph by re-running whichever writer
      // the sidecars name. It reads the DECLARATION, `package.json` and git's
      // index, and nothing in it is about any folio's subject matter — a folio
      // could not make it resolve differently, only give it more files.
      "scripts/qa-resolve-conflicts.ts",     // conflicts in the `qa` graph, resolved by regeneration
      // Its clean-merge counterpart, and harness-level for the same reason: it
      // loads the GATE SET from the workflow and re-runs whichever writers
      // their checks report stale. It knows nothing about any folio's subject
      // matter — a folio could not make it repair differently, only give it
      // more gates.
      "scripts/regen-after-merge.ts",        // artefacts a merge left wrong, repaired by asking the gates
      "scripts/sync-docs-harness.ts",        // the declaration's title/mark → the docs data file
      // Its tile half, and harness-level for the same reason: it reads every
      // INSTANCE's declaration and the published viewer tree, and asks which
      // harnesses exist and what each one has to look at. Nothing in it is
      // about any folio's subject matter — a folio could not make it answer
      // differently, only add a row.
      "scripts/harness-tiles.ts",            // every initiated harness → its navbar tile
      "scripts/harness-panel.ts",            // every harness → its config panel row (issue #1146)
      // Beside its sibling, and HARNESS rather than core — the opposite
      // classification to `gen-default-boards.ts`, for the reason that entry
      // records: what settles it is what a module is ABOUT. That one produces
      // folio content (a board); this one reads instance DECLARATIONS and
      // answers a question about the machinery — which directories an instance
      // says it renders. Its only import is `schemas/cat-harness.ts`, which is
      // harness, so the direction is flat rather than upward.
      //
      // Classified core first, on the reasoning that a tile is something a
      // reader sees. `check:partition` answered with a wrong-direction edge
      // from `sync-docs-harness.ts`, which is harness and calls it — the
      // import was right and the classification was wrong.
      "scripts/graph-tiles.ts",              // every declared visualisation → its tile
      "scripts/check-workflows.ts",          // YAML GitHub will actually parse
      // Same question, same answer: it projects the PLATFORM's own term
      // vocabulary — every class and property hanging off `FOLIO_NS` — and
      // needs no folio to have anything to do.
      "scripts/ns-export.ts",                // the folio namespace → a document that dereferences

      // `schemas/` is claimed wholesale by a core prefix rule, but the
      // directory holds schemas from all three layers. These four are the
      // harness's own, and classifying them core produced NINE
      // wrong-direction edges out of the harness — the harness importing
      // definitions it owns. Same defect as `lean-packages.ts`, at scale, and
      // the reason a `<graph>/<stub>/` layout would carry the answer in the
      // path instead of in this list.
      "schemas/tool.ts",                     // what a Tool IS — `tools` is a harness graph kind
      "schemas/tool-types.ts",               // the Tool I/O type vocabulary
      "schemas/kg-node.ts",                  // the labels every KG node carries
      "schemas/harness-config.ts",           // cross-instance dependency resolution
      "schemas/property-skills.ts",          // declaration key → its edit skills (issue #1146)
      "schemas/dependency-order.ts",         // the ONE resolve-then-walk: flatten, ancestors, conflicts (bean `a1lq`)
      "schemas/layer-direction.ts",          // the ONE wrong-direction verdict, shared with kg-detangle (bean `j79e`)
      "schemas/detangle.ts",                 // the detangle criterion — folded in from its own instance (bean `byql`)
      "schemas/detangle-sidecar.ts",         // what a detangle measurement pins (bean `byql`)
      "schemas/node-kind.ts",                // node kinds declare their parents; composed by that walk (bean `a1lq`)
      "schemas/diff-renderers.ts",           // the review page's diff renderers, declared as data (bean `d903`)
      // What a graph TILE shows. Same argument as `scripts/graph-tiles.ts`
      // twenty lines up, and it arrived the same way: classified core first
      // because a badge is something a reader sees, and `check:partition`
      // answered with a wrong-direction edge from `sync-docs-harness.ts`,
      // which is harness and reads it. A tile is harness machinery whatever
      // it looks like on the page.
      "schemas/tile-count.ts",               // a projection's declared headline number
      // The skill-framework vocabulary — actors, capabilities, skills,
      // requirements, the package registry. It was the top 240 lines of
      // `constraints.ts` and 32 aliases in `types.ts`, which put it under the
      // core `schemas/` prefix and made four harness modules read as depending
      // on the content layer. None of it describes a folio's content.
      "schemas/skill-package.ts",
      // What happened when a Tool ran, and under whose authority. Tools are
      // the HARNESS's vocabulary — the `tools` graph is declared by
      // `agentic-harness`, not by any folio — and this file imports only
      // `zod`, so it carries nothing of the content model with it. Its one
      // production consumer, `src/mcp/project.ts`, is the harness's too.
      "schemas/tool-invocation.ts",
      // A standing rule an actor holds while performing a task, bound to a
      // process, a lane or an activity. That is the HARNESS's vocabulary —
      // conventions are carried on BPMN nodes and resolved by
      // `src/workflow/process-model.ts`; no folio's content model mentions
      // them. Omitting it cost 3 wrong-direction edges out of the harness the
      // day `folio-assistant#468` merged, and the gate did not catch it
      // because `check:partition` reports without `--strict` and exits 0.
      "schemas/convention.ts",
      // The composition root's own inventory of which content adapters this
      // instance ships. `src/` is claimed by subdirectory, so a new file at
      // its top level falls through — reported `unassigned`, which is the
      // tool working: it declined to guess rather than defaulting.
      "src/builtin-adapters.ts",
      // The generic tool-group loader, shared by both servers. `src/` is
      // claimed by subdirectory, so a file at its top level falls through.
      "src/tool-groups.ts",
      // The generic route loader. Same shape and same reason as the tool-group
      // loader above, with one difference worth knowing: reclassifying the
      // three CONTENT routes without it makes the count WORSE, measured — 10
      // edges with them in the harness, 11 with them in core, because the
      // composition root then crosses the line to mount them. This file is
      // what lets the root stop naming them.
      "src/route-groups.ts",
      // Two scripts that arrived from `main` and fell through every prefix.
      // Both are harness tooling about the KG's own artefacts, not about any
      // folio's content: one introspects which Tools this instance's MCP
      // server actually serves, the other refuses a `.bpmn`/`.dmn` whose
      // comments are not well-formed XML.
      "scripts/capture-mcp-tools.ts",
      // Materialises the directories this instance DECLARES, from
      // `harness-config.ts`. It acts on the declaration and needs no folio to
      // have anything to do — arrived from `main` and fell through every
      // prefix, which the tool reported as `unassigned` rather than guessing.
      "scripts/harness-dirs.ts",
      // The `@graphNode` declarations under `schemas/` and the gate over them.
      // Harness because the `schemas` GRAPH KIND is the harness's vocabulary —
      // `harness.json` declares it — even though the directory holds
      // content-model schemas too. These read the declarations; they define no
      // part of the content model.
      "scripts/schema-nodes.ts",
      "scripts/check-schema-nodes.ts",
      // The retired-front-matter ratchet. Harness for the same reason: it
      // reads `harness.json` for where to sweep and for where the trashcan
      // is, and the keys it retires are the harness's own vocabulary. It
      // needs no folio to have anything to do.
      "scripts/check-retired-front-matter.ts",
      // RACI over the BPMN corpus and the role registry. Harness for the
      // same reason as the rest of this block: it reads the declaration
      // for where diagrams and roles live, and needs no folio to have
      // anything to do.
      "scripts/raci-chart.ts",
      // Subgraph containment and entanglement (bean `x4v4`). Harness for the
      // same reason as the block above, and more plainly than most: it reads
      // `harness.json` for the directories, DERIVES the nesting from their
      // declared paths, and has nothing to say about any folio's content.
      "scripts/check-subgraphs.ts",
      // Whether each methodology's cited `origin` resolves to an ingested
      // source. Harness for the same reason as the two above: it reads the
      // declaration for the `methodology` and `library` graphs and fans out
      // over every declared library, and it has nothing to say about any
      // folio's content — the methodologies it reads are the harness's own
      // judgement methods; WHO guideline method (GRADE) is a skill, not a node here.
      "scripts/check-methodology-evidence.ts",
      // The layout norm — no declared directory inside another declared
      // directory. Harness for the plainest reason in this block: its whole
      // input is the instance declarations, it reads no content of any kind,
      // and it runs across EVERY instance in the repository rather than for
      // one folio.
      "scripts/check-layout-norms.ts",
      // Issue #1023. Both read every instance's declaration (visualisers) or
      // every declared library (manifests), and hold no folio's content: the
      // same reason as the layout norm above.
      "scripts/check-source-licence.ts",
      "scripts/check-wireframes.ts",
      // The knowledge-graph viewer's generator — KG tooling, arrived from
      // `main` and fell through every prefix.
      "scripts/kg-viewer.ts",
      "scripts/xml-comment-check.ts",

      // `adapters/mcp-server/` was claimed wholesale by the harness prefix
      // rule, but `server.ts` opens "QOU Paper Writing Assistant — MCP
      // Server" and offers PDF rendering, content validation, a Lean LSP
      // proxy and a content viewer. That is a CONTENT server, so the
      // directory is core (below) and only the genuinely harness-level
      // pieces stay here.
      "adapters/mcp-server/tools/check-deps.ts",  // what is installed on this machine
    ],
    // declared-path-literal: the TARGET layout of the five-repo split, which no
    // declaration in THIS repo describes — that is the whole point of the plan.
    prefixes: ["src/impact/"],               // who a change affects: skills, roles, BPMN lanes
  },
  {
    repo: "sci",
    triaged: true,
    exact: [
      "scripts/audit-wiring.ts",             // Python .witness.json buckets
      "scripts/audit-wiring-migrate.ts",     // stamps auditOnly on witness JSON
      "scripts/check-duplicate-decls.ts",    // one Lake tree, two declarations
      "scripts/check-mirror-drift.ts",       // .lean sibling vs library decl
      "scripts/check-self-discharging-instances.ts", // free class hypotheses
      "scripts/migrate-computation-paths.ts",// computations/ codemod
      "scripts/refresh-authors-note.ts",     // rewrites a note with Lean coverage
      "scripts/render-changed-blocks.ts",    // per-block LaTeX PDFs
    ],
  },
  {
    repo: "core",
    triaged: true,
    exact: [
      // CORE despite matching the smart-base keyword rule, and the core's own
      // declaration is the evidence: `schemas/block-kinds.ts` (core) declares
      // `CONTENT_ADAPTERS = ["paper", "dak"]` and `DAK_BLOCK_KINDS`, so a DAK
      // block kind is part of the core content model. The module defining
      // their schemas cannot be in a different repository from the union that
      // names them — and calling it smart-base made the CORE barrel
      // `schemas/index.ts` re-export a smart-base module, which was the single
      // `folio-assist-core → smart-base` wrong-direction edge. The
      // classification was wrong, not the import.
      //
      // What stays smart-base is the L2/L3 AUTHORING skills: the procedures
      // for producing a DAK, as against the block kinds a folio may contain.
      "schemas/dak-blocks.ts",
      "adapters/manifest-entries.ts",        // reads author-written manifests
      "scripts/gen-docs-pages.ts",           // webpage manifest → docs/<slug>.md
      // CORE, not harness beside gen-uml-overview: it needs a folio to have
      // anything to do, and its input is the core content model
      // (`content/pipeline/content-graph.ts`). The shared PlantUML machinery it
      // imports (`scripts/plantuml-render.ts`) stays harness, so the edge runs
      // core → harness, the allowed direction.
      "scripts/gen-content-graph-uml.ts",    // a paper's block graph (uses[] vs Lean), graph-rendering rules
      "scripts/gen-jsonld-context.ts",       // from schemas/jsonld.ts
      // Re-triaged 2026-09-19, bean `zlmp`. Listed as harness until then, on
      // "editing-process authorisation gate". But AGENTS.md says it runs IN a
      // FOLIO repo, from that repo's pre-commit hook or CI, and the triage
      // question is whether a script reads PLATFORM or CONTENT: this one reads
      // changed content blocks. Enforcing a harness-defined process does not
      // make the enforcer harness, any more than a linter belongs to the
      // language it checks. With `labelFor` inverted out of corpus-gate.ts,
      // this classification is what actually removes the two edges — the
      // inversion alone just relocated them here, measured.
      "scripts/check-corpus-gate.ts",        // runs in the folio repo, over its content
      "scripts/gen-schema-docs.ts",          // content-object model → reference
      // CORE, not harness, and the test is the one this table uses elsewhere:
      // does it need a folio to have anything to do? This one CREATES the
      // folio graph and writes content nodes into it — the landing stickies —
      // so it does not merely need a folio, it is where one comes from. It also
      // imports `schemas/landing-sticky.ts` (a content node) and
      // `schemas/folio-graph-kind.ts`, which is core's by the argument written
      // on that module: a layer that cannot render must not own the renderable
      // kind. Classifying it harness would put core's own kind registration
      // behind a harness module.
      // CORE, and my first classification of it was WRONG. I filed it with
      // the harness because it reads the TOOL declarations, and `--edges`
      // immediately reported the consequence: a harness module importing
      // `schemas/tabular-csvw.ts`, which is core's. The table's own test
      // settles it — does it need a folio to have anything to do? It scans
      // `library/` for tabular records, so yes. Reading the tool graph is
      // core importing harness, which is the allowed direction.
      "scripts/check-tabular-stubs.ts",      // a stubbed tool must not read as a working one
      "scripts/ensure-landing-sticky.ts",    // creates folio/ and mints its landing stickies
      // Same repo and the same reason: it reads the folio graph's sticky nodes
      // and writes the data file the landing page renders from. It was part of
      // `sync-docs-harness.ts` (agentic-harness) until `--edges` reported that
      // as two wrong-direction edges — the harness reaching up into core.
      "scripts/gen-landing-data.ts",         // folio stickies -> docs/_data/stickies.json
      // Same reason as the two above, and it is the import that decides rather
      // than the subject. Its subject is theme art, which is harness
      // (`schemas/theme.ts` is classified so, nine entries down: site
      // presentation belongs to the platform that publishes the site). But it
      // reads THIS INSTANCE'S declaration, and this instance declares a `folio`
      // graph — so it must import `schemas/folio-graph-kind.ts` for the kind to
      // be registered, and that module is core's by the argument written on it.
      // Classifying it harness would put core's own kind registration behind a
      // harness module. The pure check it drives, `schemas/theme-art-intake.ts`,
      // needs none of that and is left to the `schemas/` prefix.
      "scripts/check-theme-art.ts",          // theme/avatar art intake, run over what shipped
      // The same shape as the entry above, arrived at independently: its
      // subject is the avatar crop boxes (harness — site presentation), and
      // its classification is decided by the import, because it reads THIS
      // INSTANCE'S declaration and so must register core's `folio` kind.
      "scripts/render-avatar-crops.ts",      // the declared avatarRegions, drawn so a person can look
      // The theming subgraph's VISUALISER, and core for the same reason as the
      // two above: it reads this instance's declaration to resolve each
      // theme's backdrop, so it must register core's `folio` kind.
      "scripts/render-theme-sheet.ts",       // every theme: palette, contrast, art, both regions
      // The reverse of `check-declared-assets` (declared -> disk): this walks
      // disk -> declared. Same reason it is core rather than harness — it reads
      // an instance's declaration, and this instance declares a `folio` graph,
      // so it imports core's kind registration.
      "scripts/check-undeclared-files.ts",   // present-but-undeclared, the dh4f shape inverted
      "scripts/generate-schemas.ts",         // Zod → JSON Schema
      "scripts/generate-schema-manifest.ts", // schemas/types.ts → viewer manifest
      // The schema and library visualisers, and the two readers behind them.
      //
      // CORE rather than harness for the reason every entry above shares: each
      // reads THIS INSTANCE'S declaration, and this instance declares a `folio`
      // graph, so each must import `schemas/folio-graph-kind.ts` for the kind
      // to be registered — and that module is core's by the argument written on
      // it ("a layer that cannot render must not own the renderable kind").
      //
      // The generators are core on a second count as well, and it is the
      // stronger one: they WRITE INTO THE RENDERED SITE. `cat-harness-minimum`
      // carries "if it produces something a human looks at, it is not the
      // harness", and a page under `docs/` is exactly that.
      "scripts/schema-graph.ts",             // schemas/*.ts → declarations + edges
      "scripts/gen-schema-viz.ts",           // that graph → projection + viewer
      // Guards the page template all four viewer generators build as one
      // string literal; the generators are core, so its gate is too.
      "scripts/check-viewer-backticks.ts",
      // The viewer page's COMMON FIXTURE and its audit (bean `edx7`). Core
      // beside `check-viewer-backticks.ts` and for the same two reasons: they
      // guard what every viewer generator writes, and they write into the
      // rendered site. The navbar MODEL is composed here from the
      // declarations; the component itself is `lib/navbar.ts`, so this adds a
      // caller and not a second answer to what the navigation looks like.
      "scripts/viewer-page.ts",
      "scripts/check-viewer-nav.ts",
      // The rail over the FINISHED site (bean `oi1y`). Core beside
      // `mount-instance-docs.ts`, whose pipeline it asks for the mount routes
      // rather than guessing them, and which it deliberately runs after.
      "scripts/rail-standalone-pages.ts",
      // The Jekyll sidebar's navbar, rendered by the shared module rather
      // than composed in Liquid (bean `sjic`). Core beside `lib/navbar.ts`,
      // which it calls: a generator that lived elsewhere would be a second
      // place deciding what a harness row contains, which is the defect.
      "scripts/gen-navbar-include.ts",
      // Zod in `bootstrap-tools` → JSON Schema in `bootstrap`. CORE for a
      // reason the others here do not have: bootstrap must hold no executable
      // code, so the generator cannot live beside what it generates.
      "scripts/gen-bootstrap-schemas.ts",
      "scripts/check-docs-populated.ts",     // every harness owes one populated doc page
      "scripts/library-refs.ts",             // who references a slug — the L1 property
      "scripts/library-graph.ts",            // library/ + uploads/ → the L1 corpus
      "scripts/gen-library-viz.ts",          // that corpus → projection + viewer
      "scripts/gen-uploads-viz.ts",          // the QUEUE half → a viewer only; the dataset stays library's (bean `flh4`)
      "scripts/voices-graph.ts",             // declared voices/ → voices + their citations
      "scripts/gen-voices-viz.ts",           // those voices → projection + viewer
      "scripts/gen-tools-viz.ts",            // the tools graph → projection + viewer, and its `satisfies` join against the skills corpus
      // The methodology graph → projection + viewer. CORE by the same two
      // counts as its siblings, and by a third: it renders the graph across
      // EVERY instance that declares one, so it is the harness answering
      // "what has this repository adopted", not one instance answering for
      // itself. Its node list and its evidence join both come from
      // `check-methodology-evidence.ts` rather than a second walk.
      "scripts/gen-methodologies-viz.ts",
      // The external-schema registry → projection + viewer, plus the one join
      // nothing else makes: whether each record's `usedBy` path still exists.
      // CORE beside `external-schemas.ts` itself, which is already here.
      "scripts/gen-external-schemas-viz.ts",
      "scripts/gen-processes-viz.ts", // the processes graph → a searchable index over every executable BPMN diagram
      "scripts/gen-folio-viz.ts",            // the folio GRAPH → projection + viewer. Its content already renders as the landing board; this is a view of the nodes behind it (bean `7ofc`)
      "scripts/check-materialized-fixity.ts", // materialized bytes vs their recorded digest — the read-only rule, enforced
      "scripts/sync-remote-skills.ts",       // a remote package's declared skills, materialized at its pinned commit (issue #556)
      "scripts/backfill-materialized-fixity.ts", // records the baseline digest that check reads
      "scripts/cache-index.ts",              // what is materialized, how big, how old, what could go — derived from the same walk (bean `54rk`)
      "scripts/check-read-only-graphs.ts", // a directory's `readOnly` declaration vs what its nodes say — the DECLARATION half of the same rule
      "scripts/gen-fsh-guts-viz.ts",         // the fsh-guts graph → projection + viewer; staging-only, so the page is withheld from the canonical deploy
      "scripts/gen-handler-index.ts",        // the handler namespace's own index, over the tiles model
      "scripts/gen-docs-auto.ts",            // declared sub-graphs → derived indexes (bean `06e3`)
      "scripts/declared-dirs.ts",            // graph kind → declared directories; CORE because it registers the folio kind, which is the whole reason the harness layer spawns it rather than importing it (bean `9c34`)
      "scripts/headless-render-qc.ts",       // viewer/HTML render QC
      "scripts/section-story-audit.ts",      // section + chapter narrative
      "scripts/pages-bootstrap.ts",          // where a folio publishes, and whether it is there
      "scripts/scan-repo-content.ts",        // scans a repo for material a folio could take over
      "scripts/translate-bpmn.ts",           // BPMN string extraction/injection per locale
    ],
  },

  // ── agentic-harness: Roles, Skills, Tools, BPMN, RBAC, the server itself
  // ── Content handlers that live under a harness prefix (2026-09-19).
  //
  //    `src/` is claimed by SUBDIRECTORY, and `src/core/` and `src/routes/`
  //    are claimed for the harness — but those directories hold modules from
  //    both layers. These three act on a FOLIO's content: its feedback items,
  //    its glossary candidates, its bibliography relevance. None of them has
  //    anything to do without a folio, which is the same question every entry
  //    in the harness triage list above was read against.
  //
  //    **Classifying them alone makes the count worse, and that was measured.**
  //    `check:partition` at d26a96fd: 10 wrong-direction edges with them in
  //    the harness, 11 with them here, because `src/server.ts`, `src/index.ts`
  //    and `src/routes/chat.ts` then crossed the line to MOUNT them. Content
  //    handlers mounted by a harness composition root cross whichever side
  //    holds them. `src/route-groups.ts` is what removed the mounting edges
  //    first; this rule is only safe after it.
  {
    repo: "core",
    triaged: true,
    exact: [
      "src/core/feedback.ts",    // the feedback/<paper>/*.ts store
      "src/routes/feedback.ts",  // /api/feedback
      "src/routes/relevance.ts", // /api/relevance — bibliography adjudication
      "src/routes/glossary.ts",  // /api/glossary — a folio's glossary candidates
    ],
  },

  {
    repo: "harness",
    exact: [
      "src/server.ts",
      "src/index.ts",
      // HARNESS, and the LAST wrong-direction edge lives here — left
      // deliberately, because moving it is worse and the fix is a design
      // decision rather than a filing one.
      //
      // Measured 2026-09-19, both ways. The file is 18 exports of which
      // SIXTEEN are content model, so `core` looks obviously right; assigning
      // it there takes the edge count from 1 to 4, because `src/core/rbac.ts`
      // needs `UserRole`/`ROLE_LEVELS` and `server.ts`/`chat.ts` need
      // `ContentAdapter`. Both halves have real consumers on their own side.
      //
      // So the file IS two things and wants splitting — except that
      // `ContentAdapter`, the half the harness calls into, is defined
      // ENTIRELY in content terms: every method returns `FolioItem`,
      // `ContentOutline`, `ChapterDetail`, `ResolvedSection` or
      // `ResolvedDocument`. Splitting it out does not remove the edge, it
      // moves it. The harness's plug-in interface being written in the
      // vocabulary of what it plugs into is the real question, and it is
      // task 10's.
      //
      // Recorded here rather than acted on: a partition-tuning pass is the
      // wrong place to redesign an adapter contract.
      "src/types.ts",
      // HARNESS, both re-triaged 2026-09-19 while draining the last edges.
      //
      // `schemas/contributions.ts` is what a DEPENDENCY may add to the root
      // instance — its own header calls it Phase 0.1 of the separation. It is
      // the composition mechanism of the harness, not a thing a folio
      // contains, so `harness-config.ts` importing it was never the wrong
      // direction; the target was on the wrong side. Its other importer,
      // `content/pipeline/render-discovery.ts`, is core, and core may import
      // harness.
      //
      // `content/pipeline/repo-root.ts` resolves WHERE the content repo is by
      // walking up for `computations/` and `content/`. Those directory names
      // are markers it matches on, not a model it defines — and the cut is
      // processes versus tooling. Measured: twelve importers, every one under
      // `scripts/`. A module used only by tooling, doing path resolution, is
      // tooling.
      "content/pipeline/repo-root.ts",
      // Ten scripts left unjudged, classified 2026-09-19. Every one is
      // TOOLING under the process-versus-tooling cut — four checkers, two
      // generators, two staging helpers, a bean-claim CLI and a front-matter
      // parser — and none reads content. Left unassigned they produced 21
      // edges the tool "declined to judge", which its own message says must
      // NOT be read as clean: an unjudged edge is not a passing one.
      //
      // Several arrived from sibling sessions within the hour, which is the
      // normal way this list goes stale rather than a lapse.
      // HARNESS, exposed once the ten above stopped hiding their edges.
      //
      // `schemas/theme.ts` / `themes.ts` are the STICKY-NOTE themes — colour
      // roles and layouts for the docs site, generated into CSS by
      // `gen-themes-css.ts`. Site presentation belongs to the platform that
      // publishes the site, not to a folio's content model, and their own
      // headers say so: "named colour roles plus the three layouts".
      //
      // `test/health/checks.ts` and `probes.ts` are a LIBRARY, not test
      // material: "the registry, and the pure verdict logic", imported by
      // `staging-cleanup-preflight.ts`, which is a real workflow step. A
      // module under `test/` that production code imports is shared tooling
      // that happens to live there; the blanket `test/` rule is right for
      // everything else in that tree and wrong for these two.
      "schemas/theme.ts",
      "schemas/themes.ts",
      // Exposed by moving `test/health/` here — the same reveal-on-move
      // pattern, third time in this pass. Both are harness by their own
      // headers: "Repository health reports — what the daily sweep under
      // `test/health/` wrote" is about the REPOSITORY, not a folio's content;
      // and the todo graph is the human half of the work plan, a sibling of
      // `beans/`, which is harness-level workflow rather than anything a
      // folio contains.
      "schemas/health-report.ts",
      "schemas/todo-graph.ts",
      // Imports `schemas/cat-harness.js` and nothing else, so unlike its
      // neighbour `check-agent-entry-links.ts` it inherits no wrong-direction
      // edge from the generic link auditor (bean `cp3l`). Harness by subject
      // as well as by dependency: it reads THIS repository's `AGENTS.md`
      // against THIS repository's source, and a folio has neither as content.
      // Reads GitHub's view of THIS repository's commits, and imports only
      // `src/core/git-refs.ts` and `schemas/cat-harness.ts` — both harness.
      // Harness by subject too: whether a commit got a CI run is a fact about
      // the forge and the pipeline, and a folio has neither as content.
      "scripts/check-head-has-run.ts",
      "scripts/check-agents-claims.ts",
      "scripts/check-agent-entry-links.ts",
      "scripts/check-command-paths.ts",
      "scripts/check-anchor-names.ts",
      // Its subject is the harness's OWN declaration filename — which file
      // names an instance — so it is harness by subject as well as by
      // dependency: it imports `schemas/cat-harness.js` for the constant and
      // nothing else, and a folio declares no instances. Bean `jijc`.
      "scripts/check-declaration-filename.ts",
      // Its sibling, bean `hrv2`: prose claiming which file declares a graph,
      // checked against the declarations. Harness by subject as well as by
      // dependency -- which file declares which graph is a fact about
      // instances, and a folio declares none.
      "scripts/check-declaration-claims.ts",
      "src/docs/declaration-claims.ts",
      // Who else is working THIS repository — a fact about the forge and this
      // checkout, not about any folio's material.
      "scripts/sibling-sessions.ts",
      // Its sibling: which sessions are WAITING on a person. Harness by
      // subject and by dependency -- a session is a fact about this checkout
      // and the forge, and a folio has no sessions. Bean `rq8s`.
      "scripts/check-session-staleness.ts",
      "src/sessions/staleness.ts",
      "scripts/check-agents-xref.ts",
      // The bean reader — HARNESS by subject as well as by dependency. It
      // reads the agent work plan, which `AGENTS.md` places in the
      // agent-actor half of its 2x2 and a folio has no content stake in. Its
      // consumers are `check-bean-parents.ts` here and `gen-docs-pages.ts` in
      // core, and core reading harness is downward.
      "scripts/beans.ts",
      "scripts/check-bean-parents.ts",
      // The work plan's own readers. Harness by subject and by dependency:
      // `beans/` is the AGENT's work plan, declared by the harness, and a
      // folio's content has no bean store. `bean-store-read.ts` is the shared
      // file reader the three import; `check-waivers.ts` reads the `waiver`
      // graph, which is the harness's confirmation model and nothing a folio
      // authors.
      "scripts/bean-store-read.ts",
      "scripts/check-bean-bodies.ts",
      "scripts/check-bean-front-matter.ts",
      "scripts/check-stale-paths.ts",
      "scripts/check-bean-issue-links.ts",
      // Harness for the same reason, and by its SUBJECT twice over: it reads
      // the agent work plan and compares it against `skills/`, which is the
      // `kg` graph the harness declares. Bean `8v0y` — a bean restating a
      // skill's contract is a defect in the harness's own discipline, and a
      // folio has neither a bean store nor a skill graph to be wrong about.
      "scripts/check-bean-restates-skill.ts",
      // Harness for the same reason, plus one of its own: its `--github`
      // half asks the forge which PRs are open, and a PR is a fact about
      // this checkout and the forge, not about any folio's material.
      "scripts/check-bean-rollup.ts",
      "scripts/check-ready-to-close.ts",
      "scripts/check-waivers.ts",
      "scripts/check-declared-paths.ts",
      // The external-specification registry — which edition of BPMN, DD or
      // DCMI Terms this repository conforms to, reconciled against the
      // namespaces its own diagrams and records actually bind. Harness by
      // its subject: the things it reconciles are this repository's
      // knowledge graph and CI processes, not a folio's material.
      "scripts/external-schemas.ts",
      // Runs the generators CI invokes from workflow YAML. Harness by
      // its subject twice over: it reads THIS repository's workflows,
      // and what it runs are the harness's own generators.
      "scripts/check-ci-invocations.ts",
      // Which `.github/workflows/*.yml` carry a BPMN diagram — bean `7yvd`.
      // Harness by its subject: it reads THIS REPOSITORY's CI processes and
      // its knowledge graph, and a folio has neither of those as content.
      "scripts/check-workflow-coverage.ts",
      // The `# bpmn:` / `# bpmn-node:` lines a workflow names its diagram with
      // (bean `61ca`). Same subject as the coverage check that reads them.
      "scripts/workflow-bpmn.ts",
      // Which docs page sections present which process, read from the pages
      // (bean `xl55`). Harness: it indexes the platform's own docs manifests.
      "scripts/process-presentations.ts",
      "scripts/claim-bean.ts",
      "scripts/beans-landed.ts",            // open beans named in a merged PR title — reported, never closed (bean `4d22`)
      "scripts/check-duplicate-ids.ts",     // no built page carries one id twice — run on the staged site (bean `uknu`)
      "scripts/front-matter.ts",
      "scripts/gen-themes-css.ts",
      "scripts/playwright-chromium.ts",
      // Both read the DECLARATION and write a string; neither needs a folio to
      // have anything to do, which is the same test `sync-docs-harness.ts` and
      // `harness-schema-export.ts` pass above.
      //
      // `upload-url.ts` sits here rather than with content tooling for a reason
      // worth keeping: it is the acquisition QUEUE's address, and the address is
      // a fact about the instance's layout — an instance-scoped declared path
      // resolved against the REPOSITORY root. What eventually lands in that
      // queue is content; where the queue IS, is not.
      "scripts/print-stub.ts",
      "scripts/upload-url.ts",
      // The staging-preview record and the script that writes it — bean `6pfo`,
      // arrived from `main` (#466) AFTER this pass began and was caught by the
      // unassigned gate added in the same change, on its first real encounter.
      // Before that gate it would have joined the 19 silently.
      //
      // Its two siblings `restore-staging.ts` and `staging-cleanup-preflight.ts`
      // were already harness; the schema moves WITH the script for the reason
      // the four shared targets above did, or classifying the script alone
      // mints the edge it was meant to retire. `staging-preview.ts` imports
      // only zod and `fsh-guts.ts` (harness), so it carries no content model.
      "schemas/staging-preview.ts",
      "scripts/staging-record.ts",
      "scripts/restore-staging.ts",
      // The render log — same family, same argument, and the schema moves WITH
      // the script for the reason stated just above. It describes what is on
      // the PUBLISH BRANCH, which is a property of the repository rather than
      // of any folio's content, and its only imports are zod and
      // `schemas/log-entry.ts` (harness). Caught by the unassigned gate added
      // in #469 on its first encounter, which is the gate working.
      //
      // Classifying the script alone minted exactly the two edges that comment
      // warns about — measured with `--edges`: `scripts/render-log.ts` and
      // `scripts/restore-staging.ts` both reaching into `folio-assist-core`,
      // taking the wrong-direction count from 1 to 3. With the schema here it
      // is back to 1, the `src/types.ts` residue this file already analyses.
      "schemas/render-log.ts",
      "scripts/render-log.ts",
      "scripts/serve-rendering.ts",
      "scripts/staging-cleanup-preflight.ts",
      "src/tools/check-deps.ts",
      "src/tools/capabilities.ts",
      // Beside `capabilities.ts` and for the same reason: it joins a skill's
      // declared `degradation` to the probe results. Both act on the
      // HARNESS's own declarations and need no folio to have anything to do.
      "src/tools/degradation.ts",
      "src/tools/skill-fetch.ts",
      "src/tools/preferences.ts",
      "src/tools/beans-prime.ts",
      "src/tools/workflow.ts",
      // User authN/authZ (issue #1207): asks GitHub and the ODRL policies,
      // the harness's own declarations, and needs no folio.
      "src/tools/auth.ts",
      "src/tools/folio-init.ts",
      "schemas/assistant-package.ts",
      "schemas/assistant-types.ts",
      "schemas/assistant-workflow.ts",
      // The CatHarness root declaration is harness-layer by concept even
      // though it sits in schemas/. It declares its own HARNESS_NS rather than
      // importing the content vocabulary, so classifying it here adds no
      // wrong-direction edge — see schemas/cat-harness.ts.
      "schemas/cat-harness.ts",
      // The graph-kind registry, split out of the line above so core could
      // import it without a cycle (bean `q2wn`). HARNESS on the same terms:
      // it holds `BASE_GRAPH_KINDS` — the harness's OWN three kinds — plus
      // the registry mechanism, and imports only `namespaces.ts`. Core does
      // not own it; core CONTRIBUTES `folio` to it, which is the whole
      // distinction `folio-graph-kind.ts` argues. Left to triage it landed
      // in core on a keyword, which had the ownership exactly backwards.
      "schemas/graph-kind-registry.ts",
      // Roles, actors and the KG audit sidecar are harness-layer for the same
      // reason and on the same terms: `role-graph.ts` imports only
      // `namespaces.ts`, `kg-qa.ts` imports zod and `portable-path.ts` below.
      // Neither touches the content vocabulary, so classifying them here adds
      // no wrong-direction edge — and leaving them unclassified would have made
      // `src/workflow/` and `src/tools/workflow.ts` read as harness → core.
      "schemas/role-graph.ts",
      "schemas/odrl.ts",                     // W3C ODRL 2.2 policies: what an Actor may do (issue #1180)
      "schemas/prov.ts",                     // W3C PROV-O task-run record (issue #1180)
      "schemas/kg-qa.ts",
      // Whether a path can be CHECKED OUT. It imports nothing at all, so it
      // sits at or below every consumer by construction — but it is harness by
      // subject too: its subject is this repository's own tree, and a folio has
      // no stake in whether a sidecar filename is legal on NTFS. Classifying it
      // in core is what the keyword pass guessed, and that read as
      // `schemas/kg-qa.ts [harness] -> [core]`, a wrong-direction edge for a
      // leaf with no dependencies of its own.
      "schemas/portable-path.ts",
      // The bean graph declares the harness's own work-plan store and imports
      // only zod. It was already harness-layer by concept; classifying the
      // scripts below is what made the edge to it visible, and the edge was
      // never core's to own.
      "schemas/bean-graph.ts",
      // The scripts that read those graphs. All four were `unassigned`, which
      // the tool's own report says not to read as clean: they are the work
      // plan's fallback writer, the `.beans.yml` cross-check, the KG audit and
      // the skill registry the audit and `check-workflow-refs` share. Every one
      // is harness machinery, and none imports the content vocabulary.
      "scripts/beans-fallback.ts",
      "scripts/check-harness-dirs.ts",
      // Issue #1164: bootstrap schemas name no outside concept, and a filed
      // requirement is a valid one with no name used twice. Harness
      // machinery over the harness's own declarations; neither imports the
      // content vocabulary.
      "scripts/check-bootstrap-concepts.ts",
      "scripts/check-requirements.ts",
      // Bean `95ir`: declared-but-absent is reported by a scanner, never
      // dropped. Harness machinery over declarations; imports only node:fs.
      "scripts/lib/declared-presence.ts",
      "scripts/kg-audit.ts",
      // WHICH audits reach which kind of node (bean `xutg`). Harness machinery
      // for the same reason `kg-audit.ts` is: its subject is the graph-kind
      // registry and the gate set, not the content vocabulary. Beside the audit
      // it complements rather than duplicates — that one judges the nodes it
      // covers, this one measures what is covered at all.
      "scripts/audit-coverage.ts",
      // The four state/context graphs nothing judged (bean `h1wq`). Harness for
      // the same reason as the two above: its subjects are the harness's own
      // bookkeeping — the health report, the work plan, interaction preferences,
      // issue marks — and it imports no content vocabulary.
      "scripts/check-harness-state.ts",
      // The PROV-O QA/QC report (#1180 step 5): workflow history → PROV-O,
      // re-checked with `authorizeTask`. Harness on the same terms as the
      // audit: it reads the harness's own work-plan store, role graph and
      // policies, and imports nothing from the content vocabulary.
      "scripts/prov-qaqc.ts",
      // Its one cross-run criterion — declared prose ↔ code pairs and their
      // attestations (bean `cuxx`). Same side as the auditor that calls it.
      "scripts/prose-code-pairs.ts",
      // ...and stage A, what that prose SAYS about the code (bean `ca4a`).
      "scripts/pair-claims.ts",
      "scripts/known-skills.ts",
      // The checkout-portability gate, beside the module it runs. Harness by
      // subject: it reads `git ls-files` over THIS repository and grades the
      // tree's own filenames, which is a fact about the checkout and not about
      // any folio's material.
      "scripts/check-portable-paths.ts",
      // The CI-wiring gate, and harness by the same argument one line up: it
      // reads this repository's own `.github/workflows/` and grades whether a
      // path-filtered workflow rebuilds when the scripts it runs change. That
      // is a fact about the checkout's build wiring, not about any folio's
      // material — it imports `repoRootFor` and nothing else.
      "scripts/check-workflow-script-paths.ts",
      // The supply-chain gate, and harness by the same argument: it reads this
      // repository's own `.github/workflows/` and grades whether a pinned
      // install can silently degrade to an unpinned one. A fact about the
      // checkout's build wiring, not about any folio's material — it imports
      // node builtins and nothing else.
      "scripts/check-lockfile-pinning.ts",
      // The workflow-injection gate. Harness by the same argument as its two
      // neighbours: it reads this repository's own `.github/workflows/` and
      // grades whether an attacker-supplied expression can reach a shell. A
      // fact about the checkout's build wiring, not about any folio's
      // material — node builtins only.
      "scripts/check-workflow-injection.ts",
      // The artefact-verification gate. Harness by the same argument as its
      // neighbours: it derives its inventory from THIS repository's own
      // package.json and grades whether a generated artefact has any
      // consumer-level verification. A fact about the checkout's build
      // wiring — node builtins only.
      "scripts/check-artefact-verification.ts",
      // The credential gate. Harness by SUBJECT rather than by import: it
      // walks this checkout's declared roots and grades the bytes committed
      // there. It reads a folio's files where one is present, but what it
      // asserts is a property of the CHECKOUT — "no credential is committed
      // here" — which is the same claim `check-portable-paths.ts` makes about
      // filenames. Imports node builtins only.
      "scripts/check-secret-leaks.ts",
      // The dependency-advisory gate. Harness by the same argument as its
      // neighbours, with one twist worth writing down: its SUBJECT is the
      // resolved dependency tree, which is a property of this checkout's
      // build wiring rather than of any folio's material — a folio's prose
      // does not acquire a CVE. It shells out to `bun audit` and otherwise
      // imports node builtins only.
      "scripts/check-dependency-advisories.ts",
      // The platform namespace leaf. It must sit at or below the harness:
      // core may import the harness, the harness may not import core, so a
      // constant BOTH need cannot live in core without reintroducing the edge
      // it was extracted to remove.
      "schemas/namespaces.ts",
      // What the terms in that namespace MEAN, and therefore the same
      // argument one step along: a core placement made `ns-export.ts` — which
      // is harness — import its definitions from core, the wrong-direction
      // edge `namespaces.ts` was extracted to remove. Measured on first run:
      // the prefix rule claimed it for core and the edge appeared immediately.
      "schemas/vocabulary.ts",
      // bootstrap's Zod (owner, 2026-09-24: "Validate/zod in cat-harness. Graph
      // and Subgraph too"). Moved in from the retired `bootstrap-tools`
      // instance; `vocabulary.ts` above reads BOOTSTRAP_TERMS from `graph.ts`,
      // so a core placement is a wrong-direction edge.
      "schemas/graph.ts",
      "schemas/discussion.ts",
      "schemas/bootstrap-graph.ts",
      // The Requirement bootstrap publishes (issue #1164); `skill-package.ts`
      // builds the harness Requirement on it, so core would be an edge downward.
      "schemas/requirement.ts",
      // Code lists (owner, 2026-09-23): the shape the ENGINE checks an
      // adjudication's codes against, and the loader `namespaces.ts` sits
      // beside. Needed to RUN a process, so harness — the same test as the
      // tooling below; a core placement made `process-model.ts` import down.
      "schemas/code-list.ts",
      "scripts/code-lists.ts",
      // The pre-deploy verifier set (bean `vigi`): needed to RUN the publish
      // process, so harness, beside the gates it sits among.
      "scripts/publish-verify.ts",
      // ── Tooling that the `schemas/` and `content/pipeline/` PREFIXES had
      //    claimed for core, on the content-versus-platform reading this list
      //    predates. The owner's cut, 2026-09-19, is different and sharper:
      //    "f-a-core has high level processes only, no tooling. f-a has all
      //    tooling KG." The test that follows from it — needed to RUN a
      //    process is tooling; DESCRIBES one is core — puts these six here.
      //
      //    Measured, because the prefix rules are load-bearing and a
      //    re-bucket that felt right could easily be worse: assigning the
      //    seven unassigned modules alone took wrong-direction edges from 5
      //    to 15, since each reached into one of these. Moving these first
      //    and the seven after gives 4 edges and 0 unassigned, against a
      //    baseline of 5 edges, 7 unassigned and 23 edges the tool had
      //    declined to judge. Better on every axis, and one baseline edge
      //    (`check-workflow-refs` → `translation-tools`) cleared outright.
      //
      //    Agent memory and carried notes are the unambiguous pair: an
      //    agent's memory has nothing to do with a folio, and `carried-note`
      //    is what an ACTOR carries across knowledge-graph nodes. Neither
      //    survives the "describes a process" test.
      "schemas/memory.ts",
      "schemas/carried-note.ts",
      // Same argument as `memory.ts`, one step along: a waiver is a permission
      // a PERSON gives an AGENT about a gate in this repository's process. It
      // is declared over the same directory as agent memory and it fails the
      // "describes a folio's material" test just as plainly. Keyword triage
      // put it in core on the word "confirmation"; the import direction is
      // what settles it — `scripts/check-waivers.ts` is harness and may not
      // reach into core.
      "schemas/waiver.ts",
      // How a DECISION is handed to a person. Harness by the same test again:
      // it is about the agent-human interaction this platform defines, and a
      // folio authors no decision requests.
      "schemas/decision-request.ts",
      // Translation is cat-harness's, stated directly: "ui stuff like
      // translations (skills, tooling) are not in bootstrap, it is in
      // cat-harness/". These three are the gettext machinery and the registry
      // that binds a content type to its extractors — the tools that DO the
      // translating, not the translated content.
      "content/pipeline/po-inject.ts",
      "content/pipeline/pot-extract.ts",
      "schemas/translation-tools.ts",
      // A README generator, not a README. It was the shared target of two
      // wrong-direction edges — `sync-docs-harness` and `site-links` both
      // reach it — so one re-bucket cleared both.
      "content/pipeline/readme-toc.ts",
      // ── The modules that fell through every rule and were reported
      //    `unassigned`. All are scripts or `src/` machinery, and with the
      //    six above moved, none of them reaches into core any more.
      // ── The SHARED TARGETS those scripts reach, moved FIRST and for the
      //    reason the seven-module batch above records: classifying the
      //    scripts alone took wrong-direction edges from 5 to 12, because
      //    each reached into one of these four and the `schemas/` prefix had
      //    claimed all four for core. The classification was wrong, not the
      //    tool — the falsifier this batch was measured against.
      //
      //    Every one is harness vocabulary by the owner's test, and every one
      //    imports only zod, node builtins or `cat-harness.ts` (already
      //    harness), so none carries the content model with it. Same argument
      //    as `role-graph.ts` and `kg-qa.ts` above, at four more sites.
      // Four more of the same shape, found by draining the batch above and
      // re-reading what each remaining edge actually reached. Each imports
      // only zod or node builtins, and each one's consumers are harness.
      //
      // `fsh-guts.ts` is the notable one: it is the TRASHCAN — "a node of the
      // trashcan, what `fsh-guts/` holds" — and it was `smart-base` because
      // the keyword rule `/(dak|fhir|fsh|ocl|l2|l3|smart|who|ig)/` matched
      // `fsh` in a name that has nothing to do with FHIR Shorthand. A keyword
      // rule cannot tell a homograph from a hit, which is why every keyword
      // assignment in this file is provisional against a read of the module.
      // It was the single `folio-assist-core -> smart-base` edge.
      "schemas/front-matter.ts",    // "this repository's self-declaring files"
      "schemas/test-run.ts",        // what was measured, with what; only eval-crdm-detect reads it
      "schemas/note-anchor.ts",     // read only by `carried-note.ts`, already harness
      // Declaration vocabulary, by the same test as the four above: it imports
      // only zod, and it carries no part of the content model. The direction is
      // what forces it — `CatHarnessDeclarationSchema` (harness) holds the
      // `stickies` field, so defining the shape in `landing-sticky.ts` (core)
      // would make the harness import core. That wrong-direction edge was the
      // falsifier the contribution design was measured against, and this is
      // where it is answered rather than absorbed.
      "schemas/sticky-contribution.ts",
      "schemas/fsh-guts.ts",        // the trashcan, not FHIR Shorthand
      "schemas/python-deps.ts",     // the repository's own Python toolchain
      "schemas/avatars.ts",         // an avatar for every declared kind
      "schemas/kind-validator.ts",  // a graph kind's validator
      "schemas/actor-reach.ts",     // which actors a declaration can reach
      // WHAT A REPOSITORY IS — the markers it carries. The word "content" in
      // the filename is what sends it to core by keyword, and it is a false
      // signal: this is not a content MODEL, it is machinery for recognising
      // marker files, and `harness-config.ts` composes it into
      // `describeRepositoryClosure`. The harness importing core was the edge
      // this gate caught the moment closure was wired.
      "schemas/content-type.ts",
      // The two markers the harness itself owns: `harness.json` says "an
      // instance", `harness.config.json` says "authors folio content". Both
      // are harness files even though one of them is what makes something a
      // FOLIO — a folio is recognised BY the harness, which is why
      // `cat-harness/` carries the first and not the second.
      "schemas/content-types-base.ts",

      // ── The 19 modules still reported `unassigned` on 2026-09-20, at
      //    `5b8277ea9b`. `scripts/` is in no prefix rule, so a top-level
      //    script falls through to `unassigned` — which the tool's own report
      //    refuses to call clean ("edges this tool declined to judge").
      //
      //    Sixteen of them are harness machinery by the owner's test — needed
      //    to RUN a process is tooling, DESCRIBES one is core. Each reads a
      //    declaration, a role, a graph kind or the gate set; none reads a
      //    folio's content model.
      "scripts/check-actor-reach.ts",       // reads role-graph
      "scripts/check-avatar-coverage.ts",   // avatars belong to roles
      "scripts/check-avatar-instances.ts",  // the same, on the INSTANCE axis
      "scripts/check-declared-assets.ts",   // the instance declaration
      "scripts/check-declared-dirs.ts",     // the same declaration, its DIRECTORIES
      "scripts/check-fallback-roles.ts",    // reads role-graph
      "scripts/check-instance-render.ts",   // can an instance render its own graph
      "scripts/check-kind-validators.ts",   // graph kinds and their validators
      "scripts/check-subgraph-coverage.ts", // is a declared subgraph reachable at all (bean `2krx`)
      "scripts/check-published-refs.ts",  // a SHA may stage, only a version may publish (issue #592)
      "scripts/ingest-ig-menu.ts",        // a FHIR IG's own navigation, read from its sushi-config (bean `0818`)
      "scripts/check-code-accounting.ts", // the two questions about a code file, kept apart (bean `ylj7`)
      "scripts/check-publishable.ts",     // is an instance PUBLISHED at all — the declaration, three-state (instance-versioning §3.1)
      "scripts/check-version-bump.ts",    // the bump computed from the exported surface (instance-versioning §4.1)
      "scripts/check-graph-kind-work.ts", // every state kind says whether it records work (bean `76sa`)
      "scripts/check-asset-roles.ts",     // one place says what an asset ROLE is (bean `7syd`)
      "scripts/check-instance-graph.ts",  // every instance's dependency graph resolves (bean `a1lq`)
      "scripts/check-module-scope-resolution.ts", // no module scope resolves the folio dir (bean `1hkj`)
      "scripts/check-python-deps.ts",       // the repo's own toolchain
      "scripts/check-workflow-paths.ts",    // every workflow script path resolves (bean `52dz`)
      "scripts/render-pipeline.ts",         // WHICH renders run and in what order, read from the declarations
      "scripts/render-selection.ts",        // WHICH of them must re-run against a seed, and why (bean `9c34`). Harness machinery: it computes a decision and writes no page, so it belongs beside the pipeline rather than with the renderers
      "scripts/gates.ts",                   // the gate runner itself
      "scripts/check-merged.ts",            // the gate runner, on the merged tree (bean `nytj`)
      "scripts/gen-avatars-css.ts",         // generated from the avatar nodes
      "scripts/gen-bootstrap-graph.ts", // writes bootstrap/bootstrap.jsonld
      "scripts/gen-python-deps.ts",         // writes requirements.txt
      "scripts/kg-validate.ts",             // one Tool, parameterised by graph kind
      "scripts/repo-files.ts",              // enumerates files the way a GATE needs
      "scripts/strip-preview-seo.ts",       // the preview site build
      "scripts/staging-banner.ts",          // ...and its banner (bean `g196`)
      "scripts/html-comments.ts",           // the one "is this inside a comment" scan the banner's body-finder and the folio mount's marker check share (bean `ur84`)
      "scripts/folio-mount.ts",             // the fragment that carries the reader's folio onto a library page — machinery, not a content model (bean `jpjt`)
      "scripts/check-folio-mount.ts",       // ...and the gate that every declared page carries it
      "scripts/backoff-sleep.ts",           // the one retry wait (bean `06kg`)
      "src/logging/log-writer.ts",
      "src/logging/log-sweep.ts",
      // The activity log's vocabulary: "what an agent did, when, and in which
      // process". Its only consumers are the two modules above and
      // `schemas/cat-harness.ts`, which is already harness. Left to the
      // `schemas/` prefix it lands in core, and classifying the pair above
      // would then MINT two wrong-direction edges rather than retire two —
      // which is why it moves in the same change and not after.
      "schemas/log-entry.ts",
      "scripts/agent-memory.ts",
      "scripts/check-upstream-pins.ts",
      "scripts/kg-viewer-strings.ts",
      "scripts/site-links.ts",
      "scripts/translate-kg-viewer.ts",
      "src/upstream/pins.ts",
    ],
    // declared-path-literal: the TARGET layout of the five-repo split, which no
    // declaration in THIS repo describes — that is the whole point of the plan.
    prefixes: ["src/core/", "src/workflow/", "src/routes/", "src/auth/", "src/skills/", "src/issue-watch/", "skills/framework/", "skills/remote-packages/"],
  },

  // ── Mechanism that carries a domain keyword. Hand-triaged, and placed
  //    BEFORE the domain rules because first match wins: the `lean` keyword
  //    would otherwise claim a module the generic content model depends on.
  //
  //    The test applied is not "does the name mention Lean" but "would core
  //    compile and function without the science layer installed". For
  //    `lean-packages.ts` it would not: `BlockBase` carries an optional `lean`
  //    field in `schemas/types.ts`, `schemas/constraints.ts` validates its
  //    `ref` against `LEAN_REF_PATTERN`, and the field is on shared block
  //    kinds by design — the document profile forbids its USE rather than its
  //    existence. So the grammar belongs wherever the field does. Only the
  //    package list is a property of a folio, and that is injected.
  {
    repo: "core",
    triaged: true,
    exact: [
      // The simulator-asset validator (bean `023p`). It falls to `sci` on the
      // keyword rule further down, which matches the WORD `simulator` — and
      // that is the CLASSIFICATION being wrong rather than the import, exactly
      // as `schemas/dak-blocks.ts` was in the `smart-base` block.
      //
      // MEASURED: `simulator` is in core's own `DOCUMENT_BLOCK_KINDS` and NOT
      // in `MATH_BLOCK_KINDS`. A simulator block is part of the generic
      // document model, so a check on its declared asset path belongs to the
      // layer that declares the kind. The module carries no Lean, no TeX and
      // no science — it asks whether a declared file is on disk.
      //
      // It sits in THIS rule rather than the core block below because first
      // match wins and the sci keyword rule comes first: an `exact` after it
      // never runs. The keyword rule itself stays — `simulators/` as CONTENT
      // is subject matter, which is what its own comment says. This is one
      // module whose NAME collides with it.
      "content/pipeline/validate-simulator.ts",
      "schemas/lean-packages.ts",           // the `lean.ref` grammar + the DI registry
      // Statement-level hashing for `.lean` files, by the same test: the
      // `lean_granularity: "statement"` field is on `QaCriterionDefinition` in
      // core, and `qa-utils` consults it on every freshness check. The
      // grammar belongs wherever the field does.
      "content/pipeline/lean-signature.ts",
      // The Lean LEXER — comment stripping and declaration splitting — which
      // `lean-signature.ts` is built on. Same test again: finding a
      // declaration in a file is grammar; what you then DO with it (Atlas
      // ingestion, triviality probing, coverage tables) is the science layer.
      "content/pipeline/lean-lexer.ts",
      // Where a witness lives and whether one is there. Same test a third
      // time: `export-json.ts` is the GENERIC exporter and emits `witnessed`
      // for every block carrying a `lean` field, so hashing the file and
      // looking for the sibling travels with the field. Producing and
      // invalidating witnesses stays in `scripts/lean-witness.ts`, which is
      // sci. Named for `witness`, which the sci keyword rule would otherwise
      // claim — hence the explicit entry.
      "content/pipeline/witness-address.ts",
      // The QA sidecar PROJECTION — the families (`block`, `translation`,
      // `script`, `kg`), their states and freshness, read by `gen-docs-pages`
      // to publish one file per (subject, family). Nothing in it is science:
      // it imports only `block-qa`, `kg-qa` and `script-qa`, all core. It is
      // here because the sci keyword rule matches `witness` in its NAME, which
      // is the second file that has caught — a reminder that the keyword rule
      // is a heuristic and the triage list is where its misses are corrected.
      "content/pipeline/qa-witness.ts",
      // `qa-reporting`'s first consumer — the gate that refuses a QA verdict
      // whose reviewer acts as an actor lacking the permission.
      //
      // CORE rather than harness, and the reason is an import direction rather
      // than a subject. Its subject would argue for harness: it grades the
      // actor/permission graph, which is harness material. But it imports
      // `schemas/block-qa.ts` for `QaReviewer` and
      // `content/pipeline/untainted-verification.ts` for the could-not-dispatch
      // predicate, and both are core. Core may import the harness; the harness
      // may not import core. Placing it in harness would reintroduce exactly
      // the wrong-direction edge `schemas/namespaces.ts` was extracted to
      // remove, a few rules up.
      "scripts/check-qa-reviewer-permission.ts",
    ],
  },

  // ── The MCP server's paper-only tools. Triaged, and BEFORE the core
  //    prefix that claims the rest of `adapters/mcp-server/`: these three
  //    need a TeX installation or a Lean toolchain, which is the line
  //    `adapters/paper/index.ts` already draws for the paper adapter.
  {
    repo: "sci",
    triaged: true,
    exact: [
      "adapters/mcp-server/tools/render.ts",   // PDF, HTML, formula preview — LaTeX
      "adapters/mcp-server/tools/lean.ts",     // Lean LSP proxy
      "adapters/mcp-server/tools/preview.ts",  // opens rendered LaTeX output
      // The refactoring-strategy DATABASE loader: version-gated candidate
      // rewrites for `proof-simplifier`, keyed by Lean version. Its schema is
      // already `sci` (`schemas/refactor-strategy.ts`) and the two were split
      // across the boundary by directory alone. Nothing in the pipeline
      // imports it; its only other consumer is its own test.
      "content/pipeline/refactor-strategy.ts",
      // Elaboration-cost checkers: "QA checkers for proof elaboration cost",
      // reading `docs/audits/lean-profile.json`. Entirely Lean, and blocked
      // from moving until now only because `qa-checkers-voice.ts` spread its
      // dispatch table into the merged `AUTOMATED_CHECKERS` — an aggregation
      // that lost its last production caller when the sweep began resolving
      // checkers from the registry. With the spread gone, this moves without
      // trading one wrong-direction edge for another.
      "content/pipeline/qa-checkers-cost.ts",
    ],
  },

  // ── The LaTeX build path. Triaged, and BEFORE the `content/pipeline/`
  //    core prefix that would otherwise claim it by directory.
  //
  //    The test is purpose, not location. `build.ts`'s own module doc reads
  //    "content objects → LaTeX chapters": it renders to TeX, generates
  //    `main.tex`, runs a LaTeX preflight and resolves Lean files for the
  //    coverage table. A document folio never reaches any of it — its render
  //    path is `render-markdown.ts` → pandoc, which `AGENTS.md` records as
  //    deliberately never falling back to `latexmk`. So these modules are the
  //    science layer's sitting in the pipeline directory, and classifying
  //    them by directory produced five wrong-direction edges out of one
  //    misreading.
  //
  //    Nothing IMPORTS `build.ts` except `generate-main-tex.ts`, which moves
  //    with it; every other caller spawns it as a subprocess, which is not an
  //    import edge and does not move.
  {
    repo: "sci",
    triaged: true,
    exact: [
      "content/pipeline/build.ts",              // content objects → LaTeX chapters
      "content/pipeline/generate-main-tex.ts",  // assembles main.tex
      "content/pipeline/latex-preflight.ts",    // checks the TeX toolchain
    ],
  },

  // ── folio-asst-sci: Lean, LaTeX, proofs
  {
    repo: "sci",
    // declared-path-literal: the TARGET layout of the five-repo split, which no
    // declaration in THIS repo describes — that is the whole point of the plan.
    // `simulators/` was here until they moved to the folio that owns them: a
    // simulator is subject matter, so no platform package is its target.
    prefixes: ["adapters/paper/", "skills/authoring-math/", "skills/folio-paper-adapter/", "computations/", "latex/", "scripts/render-tex/", "scripts/docker-latex-build/", "scripts/knot-plots/"],
    exact: ["schemas/formalization-types.ts", "schemas/precision-scalar.ts", "schemas/refactor-strategy.ts"],
  },
  {
    repo: "sci",
    keyword: /(^|[/-])(lean|latex|tex|proof|witness|simulator|sage|formaliz|knot)([/.-]|$)/i,
  },

  // ── smart-base: WHO L2-L3, DAK, FHIR, OCL
  {
    repo: "base",
    // declared-path-literal: the TARGET layout of the five-repo split, which no
    // declaration in THIS repo describes — that is the whole point of the plan.
    prefixes: ["skills/authoring-who-smart-guidelines/"],
    // `schemas/dak-blocks.ts` was here and is CORE. Measured: core's own
    // `schemas/block-kinds.ts` already declares `CONTENT_ADAPTERS =
    // ["paper", "dak"]` and `DAK_BLOCK_KINDS`, so the DAK block kinds are
    // part of the core content model by the core's own declaration. Calling
    // the module that defines their schemas `smart-base` made the core barrel
    // re-export a smart-base module — the one `folio-assist-core → smart-base`
    // wrong-direction edge, and it was the classification that was wrong
    // rather than the import.
    //
    // What IS smart-base is the L2/L3 AUTHORING skills above: the procedures
    // for producing a DAK, as against the block kinds a folio may contain.
  },
  {
    repo: "base",
    exact: [
      // Measures whether an IG's SOURCE graph carries dependency edges for its
      // logic layer — Library, PlanDefinition, Measure (bean `f4gj`). Its name
      // carries none of the keyword rule's tokens, so it fell through every
      // rule when it arrived.
      //
      // BASE rather than core, although its subject is content and
      // `check-artifact-index.ts` below is core on exactly that reasoning. The
      // difference is the import: this one reads `content/pipeline/fsh-cone.ts`
      // to compare against what that tool extracts, and `fsh-cone` is base by
      // the keyword rule underneath. Calling this core would buy the one thing
      // the partition exists to prevent — a `folio-assist-core -> smart-base`
      // wrong-direction edge — to gain nothing, since FHIR Shorthand and a
      // cpg/cqfmeasures profile URL are as WHO-specific as a subject gets.
      "scripts/measure-logic-layer-edges.ts",
    ],
  },
  {
    repo: "base",
    keyword: /(^|[/-])(dak|fhir|fsh|ocl|l2|l3|smart|who|ig)([/.-]|$)/i,
  },

  // ── folio-assist-core: the generic document model and its pipeline
  {
    repo: "core",
    // declared-path-literal: the TARGET layout of the five-repo split, which no
    // declaration in THIS repo describes — that is the whole point of the plan.
    prefixes: ["adapters/mcp-server/", "adapters/document/", "src/blocks/", "scripts/translation/", "skills/folio-core/", "skills/folio-document-adapter/", "skills/authoring-document/", "skills/content-lifecycle/", "content/pipeline/", "schemas/", "ui/", "viewer/", "blueprint/", "translations/"],
    exact: [
      // CORE: renders a DOCUMENT folio to a site through the document
      // pipeline's own `buildDocumentMarkdown` (content/pipeline, core). Its
      // subject is a folio's content, not the harness (bean `fyu2`).
      "scripts/build-document-site.ts",
      "src/tools/readme-sync.ts", "src/tools/readme-audit.ts", "src/tools/render-order.ts", "src/tools/translation.ts",
      "src/tools/preview.ts", "src/qa-agent-write.ts",
      // The voice-graph validator. It resolves each rule's citation into
      // `library/` — a FOLIO's reference library — and `schemas/voices.ts`,
      // which it reads, is core by the `schemas/` prefix. Arrived from `main`
      // and fell through every prefix.
      "scripts/check-voices.ts",
      // Its other half: the rules are cited, AND the instruction body beside
      // them does not restate them uncited (bean `n8br`). Core for the same
      // reason — its subject is a voice, which is content an instance derived,
      // and it reads `schemas/voices.ts`.
      "scripts/check-voice-skills.ts",
      // Counts every prefix the CONTENT `@context` binds against the published
      // `.jsonld` documents that emit it (bean `fd6i`). Core for the same
      // reason `check-voices.ts` is: its subject is content. It reads
      // `CONTENT_CONTEXT` from `schemas/jsonld.ts` — core by the `schemas/`
      // prefix — and walks documents a FOLIO produces.
      //
      // Calling it harness would buy a wrong-direction edge for nothing, which
      // is the mistake `check-context-emission`'s own sibling made earlier the
      // same day: `ns-export.ts` IS harness, and importing SKOS_NS from
      // `jsonld.ts` was refused. The difference is the subject, not the
      // filename — a script is not automatically tooling-side.
      "scripts/check-context-emission.ts",
      // Validates every committed `fhir-artifact-index` graph against
      // `schemas/fhir-artifact-index.ts` — core by the `schemas/` prefix. CORE
      // rather than harness for the reason the two entries above it give: a
      // script is not automatically tooling-side, and this one's SUBJECT is
      // content — an IG's artefacts, which is a `content`-layer graph. Calling
      // it harness would buy a wrong-direction edge into `schemas/` for
      // nothing. Its sibling `scripts/ingest-ig-artifacts.ts` writes the same
      // graph from the same schema and is core on the same reasoning.
      "scripts/check-artifact-index.ts",
      "scripts/ingest-ig-artifacts.ts",
      // Reads `schemas/todo.ts` and `schemas/todo-graph.ts` and nothing else.
      // A script is not automatically tooling-side: this one operates
      // exclusively on core data, and calling it harness bought two
      // wrong-direction edges for nothing.
      //
      // This note said "its ONLY consumer is `scripts/gen-docs-pages.ts`"
      // until 2026-09-20. That premise is gone — `state-visualizer.ts` is a
      // second consumer — and the conclusion survives it because BOTH callers
      // are core. A reason left standing on a fact that has changed is a
      // reason nobody can re-check, which is why this says so rather than
      // quietly keeping the old sentence.
      "scripts/todos.ts",
      // The default boards, and CORE rather than harness — which is the
      // checker's finding, not a preference. It was classified harness first,
      // on the reasoning that it asks which INSTANCES are instantiated and
      // which are above the floor. `check:partition` answered with two
      // wrong-direction edges: it imports `schemas/board.ts` and
      // `scripts/todos.ts`, both core, and the harness layer may not depend on
      // core. The imports were right and the classification was wrong — what
      // it PRODUCES is folio content, a board, whose type core owns. The
      // instance questions are how it decides WHICH folios, not what it makes.
      "scripts/gen-default-boards.ts",
      // The linear floor's renderer, and CORE for the reason
      // `state-visualizer.ts` records two entries down: it is a RENDERER, and
      // rendering is core's. Its only import is `schemas/todo-index.ts`, its
      // subject is a folio's own notes, and what it produces is the artefact a
      // reader gets when JavaScript never runs. `gen-docs-pages.ts` calling it
      // is core calling core; nothing about it is instance machinery.
      "scripts/todo-listing.ts",
      // The state visualiser, and it is core for the reason `gen-landing-data.ts`
      // records about itself: it is a RENDERER, and rendering is core's.
      //
      // Its subject is mixed — it reads instance declarations and the bean
      // store, both harness — and that is exactly why the direction settles
      // it. Core reading harness is downward and costs nothing; harness
      // reading `scripts/todos.ts` is upward, and `adapter-layering.test.ts`
      // reported that edge on the first draft, where this sat beside
      // `beans.ts` in the harness block. The fix is not an exemption, it is
      // the right owner — the same sentence `gen-landing-data.ts` opens with.
      "scripts/state-visualizer.ts",
      // The translation status page, and CORE by the same test read the same
      // way: it is a RENDERER. It reads the instance declaration to find the
      // `translation-sources` directory — harness, and downward, which costs
      // nothing — and its subject is the gettext corpus a folio is translated
      // from. What it PRODUCES is a page.
      //
      // Deliberately NOT beside `state-visualizer.ts` as a variant of it:
      // that generator draws only STATE graphs, and `translation-sources` is
      // not state. They are two renderers of two different things that happen
      // to share a shape, and folding one into the other would make the
      // state generator answer for a graph it correctly skips.
      "scripts/gen-translation-status.ts",
      // Three of the 19 unassigned that are CONTENT-side, by the same test
      // read the other way: each operates on a folio's own material, not on
      // the machinery that runs a process. Classifying them harness alongside
      // their sixteen siblings would have reached into `schemas/narrative.ts`,
      // `schemas/attribution.ts`, `schemas/archive-contents.ts` and
      // `schemas/tabular-records.ts` — all core — and bought four
      // wrong-direction edges for the tidiness of one homogeneous list.
      "scripts/check-l1-complete.ts",       // is a `library/<bib-slug>/` entry complete
      "scripts/ingest-document.ts",         // `uploads/` → `library/<bib-slug>/`
      "scripts/l1-blocks.ts",               // staged entry → manifest + blocks/, the arm between the two
      // Same test as the three above: it reads a CONTAINER a folio was
      // given — a zip, a PDF, a saved page — and writes a
      // `folio-extraction/v1` record beside it. Core material, and its
      // schema (`folio-assistant-core/schemas/extraction.ts`) is core too.
      "scripts/extract-assets.ts",          // container → extraction record, metadata by default
      "scripts/narratives.ts",              // the narrative review queue
      // Same test, same answer: it reads `library/<bib-slug>/blocks/` and
      // writes `summaries.json` beside them, a folio's own material, through
      // `schemas/block-summary.ts` and `schemas/narrative.ts` — both core.
      "scripts/summaries.ts",               // the block-summary drain
      // Same test, same answer: it reads `library/<bib-slug>/images.json`,
      // which is a folio's own material, and imports `schemas/attribution.ts`
      // and `schemas/document-image.ts` — the latter reaching `narrative.ts`
      // in turn. Every one of those is core, so classifying it harness would
      // buy three wrong-direction edges for the tidiness of one list.
      "scripts/apply-image-verdicts.ts",    // agent verdicts → images.json
    ],
  },
];

// ── Module discovery ───────────────────────────────

// ── Module discovery ────────────────────────────────────────────

/** This instance's root: two levels up from `scripts/partition/`. */
// declared-path-literal: the base case — a module cannot resolve its own
// instance root through a declaration without first knowing where it is.
export const ROOT = resolve(import.meta.dir, "..", "..");

/** Directories scanned for TypeScript modules. */
// `"test"`, not `"tests"`: the two test trees were consolidated onto `test/`
// on 2026-09-19 (bean `auap`). A scan root that names a directory which no
// longer exists is not an error here — `walkTs` returns early on a missing
// dir — so this would have gone on partitioning the repo while silently
// seeing none of the e2e specs or the health sweep.
export const SCAN_ROOTS = ["src", "schemas", "adapters", "content", "scripts", "test", "types"];

export const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "beans", "docs"]);

/** This instance's spec, ready to hand to the engine. */
/**
 * The one edge permitted despite the direction rule.
 *
 * `cat-harness.ts` imports core's `folio-graph-kind.ts` for its side effect,
 * which is what makes the `folio` registration automatic instead of something
 * 110 commands had to remember. Bean `q2wn`, and the header of
 * `schemas/graph-kind-registry.ts` for why the alternatives were worse.
 *
 * ONE entry, naming BOTH endpoints. That is the difference between this and
 * the blanket rule first tried here — "a bare side-effect import is exempt"
 * would have let any harness module reach any core module silently, which is
 * the blindness `q2wn` was opened about wearing a different hat. Any other
 * edge across this boundary still fails.
 *
 * It is a debt and is recorded as one: it exists because the two layers live
 * in one repository (#223). After the split, core is a dependency that
 * registers its own kinds on load and this line goes away.
 */
const PERMITTED_EDGES: readonly PermittedEdge[] = [
  {
    from: "schemas/cat-harness.ts",
    to: "schemas/folio-graph-kind.ts",
    reason:
      "The registration trigger. Core owns `folio`; this import is what makes it registered " +
      "by the time any reader can be called, because a reader lives in `cat-harness.ts` and " +
      "loading that module is therefore a precondition of calling one. Without it the kind is " +
      "registered only if the process happened to import core first — an import-order property " +
      "that threw `unknown graph kind \"folio\"` on a valid declaration, five times in PR #465.",
  },
  {
    from: "schemas/cat-harness.ts",
    to: "schemas/glossary-graph-kind.ts",
    reason:
      "The same trigger for core's second kind, `glossary` (owner, 2026-09-23: \"put glossary " +
      "into folio-assistant-core\"). One entry per endpoint pair, as this list's rule requires; " +
      "it goes away with the folio entry when the split lands (#223).",
  },
];

export const SPEC: PartitionSpec = {
  root: ROOT,
  repos: REPOS,
  allowed: ALLOWED,
  rules: RULES,
  scanRoots: SCAN_ROOTS,
  permittedEdges: PERMITTED_EDGES,
  skipDirs: SKIP_DIRS,
};
