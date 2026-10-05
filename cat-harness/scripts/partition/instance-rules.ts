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

/**
 * Target repository names, in dependency order (most depended-upon first).
 *
 * ## `name` is the TARGET REPO; `instance` is where it is staged today
 *
 * These are two different facts and were one string until 2026-09-26, which
 * is how they drifted. `name` is what the repository will be called when
 * #223 cuts it. `instance` is the directory staging it in this pre-split
 * checkout, and it must equal that directory's own declared `name` — the
 * declaration is the source of truth, so `instance` is a POINTER to it, not
 * a second copy. `partition-names.test.ts` holds them equal.
 *
 * `kg` carries no `instance` ON PURPOSE. `smart-kg` is a Phase III target
 * for WHO L1 document and KG schemas that this checkout does not hold, so it
 * has 0 modules. That is a target not yet staged, NOT a `dh4f`
 * declared-but-absent defect, and the two must not be conflated: the first is
 * a plan, the second is a consumer scanning nothing and reporting a clean run.
 * `undefined` says "no instance yet"; it never means "the instance is missing".
 *
 * ## Why three of these were renamed
 *
 * `folio-assist-core` and `folio-asst-sci` were ABBREVIATIONS of the declared
 * names — no decision behind "asst", just terser — and `agentic-harness`
 * predates the owner's rename of the harness to `cat-harness`, which the
 * declaration, the directory and `AGENTS.md` all already carry. Only the
 * architecture docs and this table still said the old thing.
 *
 * The docs page `/agentic-harness.html` is NOT this name and was not touched:
 * it documents the agent-user interaction model, which is a concept rather
 * than a repository, and its slug is a published URL.
 */
export const REPOS: Array<{ id: Repo; name: string; instance?: string }> = [
  { id: "harness", name: "cat-harness", instance: "cat-harness" },
  { id: "core", name: "folio-assistant-core", instance: "folio-assistant-core" },
  { id: "sci", name: "folio-assistant-sci", instance: "folio-assistant-sci" },
  { id: "kg", name: "smart-kg" },
  { id: "base", name: "smart-base", instance: "smart-base" },
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
      "scripts/watch-ci.ts",                 // one commit's check runs → a three-state verdict
      "scripts/bpmn-render.ts",              // BPMN → SVG
      "scripts/render-bpmn.ts",              // BPMN → SVG (the processes one)
      "scripts/generate-registry.ts",        // scans skills/ → SkillRegistry
      "scripts/gen-skill-docs.ts",           // skill instruction bodies → docs
      "scripts/gen-skill-commands.ts",       // user_invocable skills → .claude/commands pointers (bean `j6t3`)
      "scripts/gen-upload-step-docs.ts",     // a process step's Tools → docs; both graphs are harness concepts
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
      "scripts/publish-main-site.ts",    // a folio's main site at the publish root: the before side (bean `5uuf`)
      "scripts/repo-partition.ts",           // this tool; platform meta
      // HARNESS, by the same test as `check-ci-health.ts` above: its subject is
      // this checkout's own ENVIRONMENT — whether a nested `node_modules` or a
      // symlinked root makes a tool answer a question about the repository from
      // something the repository does not contain (bean `3vc1`). It reads no
      // folio material and no content schema; it imports `node:fs` and
      // `node:path` and nothing else, so it cannot drag a folio in. `gates.ts`
      // is its only caller and is itself harness, so the edge runs
      // harness -> harness.
      "scripts/check-environment.ts",
      // The IMPORT half of that arrow, over every declared instance (bean
      // `p11x`). Harness for the same reason: it reads declarations and module
      // specifiers, consumes the same `layer-direction.ts`, and no folio content.
      "scripts/check-import-direction.ts",
      // The PROCESS-BINDING half of that arrow (owner, 2026-10-03): which
      // instance a BPMN's `<skill ref>` reaches. Harness for the same reason —
      // it reads declarations, BPMN extension elements and skill file names,
      // consumes the same `layer-direction.ts`, and no folio content.
      // HARNESS, for the same reason: it judges directory declarations'
      // `derivedFrom` edges with the same reach, and reads no folio content.
      "scripts/check-derived-from.ts",
      "scripts/derived-from.baseline.ts",
      // HARNESS: the staging cone (bean `4j86`) computes over declarations and
      // module specifiers, and reads no folio content.
      "scripts/staging-cone.ts",
      "scripts/process-bindings.baseline.ts",
      // HARNESS on the same argument: its subjects are this repository's own
      // generated navigation (`_data/harness.json`, the navbar include, the
      // rail written into viewer pages) and its landing templates. It opens
      // no folio content (bean `ob3m` finding 6).
      "scripts/lib/nav-label.ts",
      // HARNESS: the one orphan-page selector (bean `s8nu`), extracted as a
      // LEAF so `state-visualizer.ts` can be a call site without importing
      // `gen-schema-viz.ts` -- a 1200-line page generator whose body is one
      // template literal. Same move #840 made for the graph-typology registry.
      // It imports `node:fs` and `node:path` and nothing else, so it cannot
      // drag a layer in behind it; its subject is which pages a generator in
      // this repository wrote, not any folio's content.
      "scripts/orphan-pages.ts",
      // HARNESS with the gate above, which imports it: it runs `kg-export`
      // once per declared instance for this repository's deploy, and reads
      // only the declarations (bean `4ak5`).
      "scripts/instance-exports.ts",
      "scripts/root-index.ts",
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
      // Its reader of `withheld.json` (bean `mkao`): what an instance must not
      // publish. Same layer — it is a question about what a harness puts on
      // the site, answered from a list the instance declares — and shared with
      // the library viewer so the two publishing channels read ONE answer.
      "scripts/lib/withheld.ts",
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
      // The ONE conversion from a harness row's resolved mark to that
      // navbar's fields (bean `2vpn`). HARNESS beside `navbar.ts`: every
      // surface that draws a harness's mark calls it, so a folio owning it
      // would let one instance decide how every other instance's mark is read.
      "scripts/lib/harness-mark.ts",
      // How a GRAPH-TYPOLOGY row in that navbar is marked and named (bean `yag0`):
      // the kind's avatar glyph and hue, and the head of its registered
      // summary as the accessible name. HARNESS beside `navbar.ts` for the
      // same reason — it is the platform's chrome, read from the platform's
      // kind and avatar registries, and both navbar callers share it.
      "scripts/lib/graph-typology-nav.ts",
      // The light/dark half of that chrome (issue #2208): dark rules that
      // follow the navbar's switch, and the saved-scheme first-paint snippet.
      // HARNESS beside `navbar.ts` -- the switch is the platform's, and every
      // page carrying it, a folio's included, has to agree on what it means.
      "scripts/lib/scheme-css.ts",
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
      // The rail's shared assets (bean `lnoy`): `navbar.css` from `navbarCss()`
      // and `navbar.js` bundled from `navbar-client.ts`, the browser half of
      // `renderRailRegions`. HARNESS for the same reason as `navbar.ts`: the
      // platform's chrome on every instance's pages, written into the site's
      // own asset directory through `siteDirFor`.
      "scripts/gen-navbar-assets.ts",
      "scripts/navbar-client.ts",
      // Its sibling: same question, same answer. `compose-docs.ts` reads the
      // `docs` declarations, works out which is the base and which the
      // overlay from `scope`, and lays them down in order. Every decision it
      // makes is about INSTANCES and where their directories resolve; it
      // opens the files only to copy bytes, and never asks what a page says.
      "scripts/compose-docs.ts",             // docs layers -> one composed tree
      // Whether a swimlane DEFINES itself — `name`, `<documentation>`, and
      // both reaching the translation templates. Harness by subject for the
      // same reason as its neighbour above: a lane is a ROLE boundary, which
      // is a platform concept, and the diagrams it reads are the platform's
      // own processes. A folio that draws none still inherits the rule.
      "scripts/eval-crdm-detect.ts",         // measures the crdm-detect signals
      "scripts/eval-crdm-detect-blind.ts",   // a blinded packet for a second annotator, and the kappa that scores it (bean `vjbl`)
      // ...and the signals themselves, lifted out of it by bean `xfoh` so the
      // patterns could be checked against the skill prose they transcribe.
      // Same side as its runner, and harness by subject too: whether a request
      // is a PLATFORM capability change is a question about the platform, and a
      // folio that never asks for one still needs the answer to be "no".
      "src/crdm/detect-signals.ts",         // ...the patterns, checked against the skill
      "scripts/stakeholder-map.ts",          // CRDM phase 1 CLI

      // Reported `unassigned` on 2026-09-18 and read one at a time, same
      // question as the rest of this list: does it act on PLATFORM or on
      // CONTENT? All six act on harness-level graphs — Tools, the knowledge
      // graph, the instance declaration, the CI workflows — so none of them
      // needs a folio to have anything to do.
      "scripts/check-tools.ts",              // every Tool `satisfies` resolves to a skill
      "scripts/tool-coverage.ts",            // which uncovered skills warrant a Tool
      "scripts/kg-export.ts",                // the instance's KG → one JSON-LD file
      "scripts/gen-subgraph-jsonld.ts",      // that graph framed per named subgraph (bean `c1m4`)
      // Harness by subject: the slice is the platform's own work plan, and the
      // per-slice SQLite contract is a kg-export one (bean `q8ar`).
      "scripts/gen-slice-sqlite.ts",         // a named slice → one SQLite file a browser mounts
      "scripts/vendor-sqlite-wasm.ts",       // ...and the SQLite WASM build that mounts it, vendored
      "scripts/glossary-export.ts",          // the instance's swimlane personas → SKOS
      "scripts/kg-locale-export.ts",         // that graph again, once per locale
      "scripts/publish-instance-files.ts",   // an instance's own files, .md also as .html (bean `iwtn`)
      "scripts/harness-schema-export.ts",    // the declaration's JSON Schema, at its `$id`
      "scripts/gen-object-model-uml.ts",     // the harness object model, derived from its JSON Schemas
      "scripts/gen-uml-overview.ts",         // UML per named sub-graph, PlantUML + Mermaid from one model
      "scripts/uml-palette.ts",              // the UML colours, read from uml.css for the .puml files
      "scripts/plantuml-render.ts",          // shared: portrait/landscape, hash stamp, pinned jar, page figure
      "scripts/skill-contracts.ts",          // where a skill's input/output contracts are, read from the skill (#1168)
      "scripts/test-run-conformance.ts",     // a test run's cases against its skill's contract (#1168)
      "scripts/test-plan-audit.ts",          // plan <- run <- report, the four test-process criteria (bean `3o5b`)
      "scripts/arrow-direction.ts",          // general nodes point only at general nodes (#1168)
      "scripts/prose-names.ts",              // file names in general nodes' prose still resolve (bean `epbt`)
      "scripts/content-holds-code.ts",       // a content instance holds no code (kg-separation FR-7, bean `eayu`)
      "scripts/spec-users.ts",               // who declares each external spec — read from the users (bean `u63y`)
      // Third question about the same built tree, and harness-level for the same
      // reason: it asks whether the markdown converter refused a block of HTML
      // and escaped it, which is a property of the RENDER PIPELINE, not of any
      // folio's subject matter. It imports nothing but `node:fs` — a folio could
      // not make it answer differently.
      "scripts/staging-stamp.ts",            // which BUILD wrote an artefact — CI identity, no folio
      "scripts/qa-results.ts",               // a QA process's findings about a PRODUCED artefact; `qa` is a base graph typology
      // Its merge-time sibling, and harness-level for the same reason: it
      // resolves conflicts in the `qa` graph by re-running whichever writer
      // the sidecars name. It reads the DECLARATION, `package.json` and git's
      // index, and nothing in it is about any folio's subject matter — a folio
      // could not make it resolve differently, only give it more files.
      "scripts/qa-resolve-conflicts.ts",     // conflicts in the `qa` graph, resolved by regeneration
      // Where the `qa` graph is KEPT once it leaves main (bean `16ei`): the
      // read/write API over the `qa-reports` branch. Harness-level for the
      // same reason as its two neighbours — it reads the declaration and git,
      // and no folio's subject matter could make it answer differently.
      "scripts/qa-store.ts",                 // the qa-reports branch: readQa / publishQa / pruneQa
      "scripts/qa-verify-moved.ts",          // bean 5hox: hash-verify the moved QA files against a qa-reports entry
      "scripts/qa-site-assets.ts",           // a site build's QA evidence: fetch from qa-reports, verify the copy (tfqf)
      "scripts/qa-result-link.ts",           // the ONE address of a QA result file: main or qa-reports entry, by declaration (bejf)
      // Its generalisation (bean `2h76`): the same branch-kept store for ANY
      // directory declaring `storage.keyedBy: "tip"`. Harness-level for the
      // same reason as `qa-store` — it reads the declaration and git, and no
      // folio's subject matter could make it answer differently.
      "scripts/branch-store.ts",             // a `keyedBy: "tip"` directory's own branch: one live copy
      // Its session-start step (bean `2h76` part 4): fetches the declared state
      // branch and checks it out as a read surface. Harness-level for the same
      // reason as the three above.
      "scripts/state-mount.ts",               // the state branch on disk, or a loud finding saying it is not
      // The seeds' own freshness check (bean `9ofm`): it reads each special
      // branch's `manifest.json`, resolves the ref that manifest names, and
      // compares the two TREES. Harness-level for the same reason as its
      // neighbours, and one more: the branches it reads are declared in
      // `scripts/special-branches.json`, which is the harness's table — a
      // folio's subject matter cannot add a row to it or change what a tree
      // comparison concludes.
      "scripts/state-drift.ts",               // a seeded state branch still matches the ref it was seeded from
      // What every reader of a moved graph needs, written once (bean `9ofm`
      // row D): given a declared directory id, which directory to actually
      // read — the checkout, the mount, or a refusal. Harness-level for the
      // same reason as its neighbours: it reads the declaration, git and the
      // mount marker, and no folio's subject matter could make it resolve
      // differently — only give it more directories to resolve.
      "scripts/graph-read.ts",                // where to read a declared graph from: the checkout, or its mount
      // Its clean-merge counterpart, and harness-level for the same reason: it
      // loads the GATE SET from the workflow and re-runs whichever writers
      // their checks report stale. It knows nothing about any folio's subject
      // matter — a folio could not make it repair differently, only give it
      // more gates.
      "scripts/regen-after-merge.ts",        // artefacts a merge left wrong, repaired by asking the gates
      // The merge step that calls it, and harness-level for the same reason:
      // it classifies conflicted PATHS against declared patterns and proves
      // the result through `regen`. A folio could not make it resolve
      // differently, only give it more generated files (bean `d33q`).
      "scripts/git-ancestry.ts",             // is A an ancestor of B — with "cannot tell" as its own answer, deepened before it says no
      "scripts/merge-base.ts",               // merge the base in, resolve only declared patterns, prove
      "scripts/merge-conflict-patterns.ts",  // the declared patterns that merge reads
      "scripts/merge-main-comment.ts",       // the merge-main bot's PR comment, composed and tested (#1854)
      "scripts/merge-queue.ts",              // the merge train's order: live facts in, merge-priority.dmn's placement out (bean hfag)
      "scripts/merge-guard.ts",              // the single way a steward lands a PR: eight checks, then the pinned PUT (beans uoob, vihx)
      "scripts/merge-steward.ts",            // the command that CALLS merge-queue.ts — the entry point it was written for and never had
      // The queue's STORE and its command (bean `najo`), harness-level for the
      // same reason as the two above: they read and write the `merge-queue`
      // graph of THIS repository's declaration, through the generic branch
      // store, and a folio could not make either answer differently — only
      // record more decisions. The store is the reader (four states, and a
      // throw rather than an empty queue for the one that cannot be reached);
      // the CLI is `merge:queue:read` and `merge:queue:record`.
      "scripts/merge-queue-store.ts",        // the queue's four read states, and the splice that records a decision
      "scripts/merge-queue-cli.ts",          // merge:queue:read / merge:queue:record
      "scripts/sync-docs-harness.ts",        // the declaration's title/mark → the docs data file
      // Its tile half, and harness-level for the same reason: it reads every
      // INSTANCE's declaration and the published viewer tree, and asks which
      // harnesses exist and what each one has to look at. Nothing in it is
      // about any folio's subject matter — a folio could not make it answer
      // differently, only add a row.
      "scripts/harness-tiles.ts",            // every initiated harness → its navbar tile
      "scripts/harness-panel.ts",            // every harness → its config panel row (issue #1146)
      // The tile half of a KG subscription (issue #1719): which chosen harnesses
      // are instantiated at the root, read from their snapshots. HARNESS so the
      // tile above may import it; `kg-instantiate.ts` (core) imports it too.
      "scripts/subscribed-harnesses.ts",
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
      "schemas/tool.ts",                     // what a Tool IS — `tools` is a harness graph typology
      "schemas/tool-run.ts",                 // a downstream Tool's run record (bean `fq5u`)
      "schemas/withheld.ts",                 // what an instance must not publish — read by the harness mount (bean `mkao`)
      "schemas/tool-types.ts",               // the Tool I/O type vocabulary
      "schemas/repo-full-name.ts",           // `owner/name` — a Tool type AND the declaration's repository (bean `6rmv`)
      "schemas/instance-repositories.ts",    // the derived owner/repo ↔ instance map (bean `6rmv`)
      "schemas/skill-definitions-dir.ts",    // where the JSON skill definitions and conventions live (bean `rqao`)
      "schemas/kg-node.ts",                  // the labels every KG node carries
      "schemas/harness-config.ts",           // cross-instance dependency resolution
      "schemas/subgraph-source.ts",          // where a declared subgraph gets its content (bean `l4ay`) — read by the declaration schema itself
      "scripts/subgraph-node.ts",            // the declared Subgraph node as a publisher's container (bean `l4ay`); imports nothing
      "schemas/property-skills.ts",          // declaration key → its edit skills (issue #1146)
      "schemas/dependency-order.ts",         // the ONE resolve-then-walk: flatten, ancestors, conflicts (bean `a1lq`)
      "schemas/layer-direction.ts",          // the ONE wrong-direction verdict, shared with kg-detangle (bean `j79e`)
      // "what files does this REPOSITORY contain", asked of git rather than of
      // the disk (beans `rsi6`, `xd1g`). Harness by its subject: the corpus it
      // reports is a checkout's, and its whole point is that a folio's material
      // and a machine's untracked residue are not the same set.
      //
      // It sat under `scripts/` until 2026-09-26 and moved here on the owner's
      // ruling that a SKILL must not know about a script, and that a script
      // belongs to `tools`. `kg-detangle.ts` is a skill-directory node and
      // needs this rule, so leaving it in `scripts/` would have minted the
      // first `skills/` -> `scripts/` edge in the repository (measured: zero
      // such edges). Its neighbour above is the precedent rather than an
      // analogy -- the same shape, shared by the same two callers.
      "schemas/git-corpus.ts",
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
      // `skills.json`'s shape (bean `9umr`); read by `scripts/skill-topics.ts`.
      "schemas/skill-topics.ts",
      // The other grouping kinds' from-within group declaration (placement
      // PR0c, bean `ejye`); imports only zod. Concern groups are how the
      // harness's own subgraphs are laid out, not content.
      "schemas/concern-groups.ts",
      // Roles, actors and capabilities extended by id from a dependent's
      // `scenarios/` (placement PR0b). The role model is harness vocabulary
      // (`role-graph.ts` below), and this reads it and `harness-config.ts`.
      "schemas/scenario-overlay.ts",
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
      // Materialises the directories this instance DECLARES, from
      // `harness-config.ts`. It acts on the declaration and needs no folio to
      // have anything to do — arrived from `main` and fell through every
      // prefix, which the tool reported as `unassigned` rather than guessing.
      "scripts/harness-dirs.ts",
      // The `@graphNode` declarations under `schemas/` and the gate over them.
      // Harness because the `schemas` GRAPH TYPOLOGY is the harness's vocabulary —
      // `harness.json` declares it — even though the directory holds
      // content-model schemas too. These read the declarations; they define no
      // part of the content model.
      "scripts/schema-nodes.ts",
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
      // How many scripts enumerate the filesystem, and how many ask git what
      // the corpus is (bean `xd1g`). Harness for `check-subgraphs.ts`' reason
      // and more plainly still: its whole subject is this repository's own
      // `scripts/` directory read through `gitCorpus`, and it cannot express
      // an opinion about a folio because it never looks at one.
      "scripts/root-scan-census.ts",
      // Does a generator's COMMITTED OUTPUT change when gitignored content is
      // present (bean `qrlc`)? Harness by the same route as the census above:
      // its subjects are derived from this repository's own `package.json`
      // scripts, it compares them with `git status`, and it never opens a
      // folio's content — it only asks whether running a writer produced
      // different bytes.
      "scripts/detect-live-corpus.ts",
      // Whether every workflow installs the Bun that `.bun-version` names
      // (bean `3ozg`). Harness for the same reason as the line above: its
      // subject is `.github/workflows/` plus one repo-root pin file, and it
      // reads no folio content.
      "scripts/check-bun-pin.ts",
      // The shared "a gate that examined nothing must refuse" decision (bean
      // `iym1`). Harness because it is a helper for the harness's own gates and
      // reads nothing at all: it is handed a list of what a caller looked at and
      // returns a message. It has no corpus of its own, which is why it can be
      // tested over a CONSTRUCTED empty one while the gates it serves cannot.
      "scripts/vacuity-refusal.ts",
      // Whether each methodology's cited `origin` resolves to an ingested
      // source. Harness for the same reason as the two above: it reads the
      // declaration for the `methodology` and `library` graphs and fans out
      // over every declared library, and it has nothing to say about any
      // folio's content — the methodologies it reads are the harness's own
      // judgement methods; WHO guideline method (GRADE) is a skill, not a node here.
      "scripts/check-methodology-evidence.ts",
      // Snapshots the SPDX License List ids that check validates against (bean
      // `sd5v`): the same subject — every declared library's licences — and
      // no folio's content.
      "scripts/pin-spdx-license-list.ts",
      // The knowledge-graph viewer's generator — KG tooling, arrived from
      // `main` and fell through every prefix.
      "scripts/kg-viewer.ts",
      "scripts/xml-comment-check.ts",

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
      // 🟧 OWNER RULING 2026-09-27, verbatim: "field sits on shared kinds
      //    (remark, example, algorithm, simulator), so the grammar genuinely
      //    is vocabulary that goes tp f-a-sci" — reversing the inference the
      //    core triage block below applied FIVE times (see its header, now
      //    corrected). A `lean` field on a shared kind does not make the
      //    grammar core; it makes that field on those kinds part of the
      //    science vocabulary.
      //
      //    These two move FREE: MEASURED, reassigning them adds ZERO
      //    wrong-direction edges. The other two the ruling reaches
      //    (`schemas/lean-packages.ts`, `content/pipeline/lean-signature.ts`)
      //    cost SIX core -> sci edges and are held pending the owner's call on
      //    how core is to carry a formal reference it does not own. qou bean
      //    `qou-7ko6`.
      "content/pipeline/lean-lexer.ts",   // comment stripping, declaration splitting
      "content/pipeline/witness-address.ts", // where a witness lives; is one there
      "scripts/audit-wiring-migrate.ts",     // stamps auditOnly on witness JSON
      "scripts/migrate-computation-paths.ts",// computations/ codemod
      "scripts/refresh-authors-note.ts",     // rewrites a note with Lean coverage
      "scripts/render-changed-blocks.ts",    // per-block LaTeX PDFs
    ],
  },
  {
    repo: "core",
    triaged: true,
    exact: [
      // `schemas/dak-blocks.ts` was listed here as CORE until bean `1335`,
      // because core's `schemas/block-kinds.ts` then declared
      // `CONTENT_ADAPTERS = ["paper", "dak"]` and `DAK_BLOCK_KINDS`, and the
      // module defining their schemas could not sit in a different repository
      // from the union naming them. That premise was removed rather than the
      // classification argued again: smart-base now CONTRIBUTES the `dak`
      // adapter and its kinds (nodes in its own graphs since bean riit), core's built-in
      // vocabulary is `paper` only, and `dak-blocks.ts`, `qa-checkers-dak.ts`
      // and `gen-dak-components-figure.ts` moved to `smart-base/`, outside this
      // tool's scope. Nothing under `cat-harness/` imports them.
      "adapters/manifest-entries.ts",        // reads author-written manifests
      "scripts/gen-docs-pages.ts",           // webpage manifest → docs/<slug>.md
      "scripts/lib/json-shape.ts",           // its verdict projections' SHAPE gate (bean `324x`): a committed copy lacking a top-level key the generator now writes is stale
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
      "scripts/gen-schema-docs.ts",          // content-object model → reference
      // CORE, not harness, and the test is the one this table uses elsewhere:
      // does it need a folio to have anything to do? This one CREATES the
      // folio graph and writes content nodes into it — the landing stickies —
      // so it does not merely need a folio, it is where one comes from. It also
      // imports `schemas/landing-sticky.ts` (a content node) and
      // `schemas/folio-graph-typology.ts`, which is core's by the argument written
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
      "scripts/ensure-landing-sticky.ts",    // creates folio/ and mints its landing stickies
      // Same repo and the same reason: it reads the folio graph's sticky nodes
      // and writes the data file the landing page renders from. It was part of
      // `sync-docs-harness.ts` (agentic-harness) until `--edges` reported that
      // as two wrong-direction edges — the harness reaching up into core.
      "scripts/gen-landing-data.ts",         // folio stickies -> docs/_data/stickies.json
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
      "scripts/generate-schemas.ts",         // Zod → JSON Schema
      "scripts/generate-schema-manifest.ts", // schemas/types.ts → viewer manifest
      // The schema and library visualisers, and the two readers behind them.
      //
      // CORE rather than harness for the reason every entry above shares: each
      // reads THIS INSTANCE'S declaration, and this instance declares a `folio`
      // graph, so each must import `schemas/folio-graph-typology.ts` for the kind
      // to be registered — and that module is core's by the argument written on
      // it ("a layer that cannot render must not own the renderable kind").
      //
      // The generators are core on a second count as well, and it is the
      // stronger one: they WRITE INTO THE RENDERED SITE. `cat-harness-minimum`
      // carries "if it produces something a human looks at, it is not the
      // harness", and a page under `docs/` is exactly that.
      "scripts/schema-graph.ts",             // schemas/*.ts → declarations + edges
      "scripts/gen-schema-viz.ts",           // that graph → projection + viewer
      // The viewer page's COMMON FIXTURE and its audit (bean `edx7`). Core
      // beside `check-viewer-backticks.ts` and for the same two reasons: they
      // guard what every viewer generator writes, and they write into the
      // rendered site. The navbar MODEL is composed here from the
      // declarations; the component itself is `lib/navbar.ts`, so this adds a
      // caller and not a second answer to what the navigation looks like.
      "scripts/viewer-page.ts",
      // The rail over the FINISHED site (bean `oi1y`). Core beside
      // `mount-instance-docs.ts`, whose pipeline it asks for the mount routes
      // rather than guessing them, and which it deliberately runs after.
      "scripts/rail-standalone-pages.ts",
      // The Jekyll sidebar's navbar, rendered by the shared module rather
      // than composed in Liquid (bean `sjic`). Core beside `lib/navbar.ts`,
      // which it calls: a generator that lived elsewhere would be a second
      // place deciding what a harness row contains, which is the defect.
      "scripts/gen-navbar-include.ts",
      // gen-bootstrap-schemas and bootstrap-schema-page moved to the sibling
      // instance `bootstrap-tools/` (bean `xsqm`), outside this partition.
      // A README per declared directory, from the declaration. Core beside
      // `readme-sections`, whose file description and 'used by' it reuses.
      "scripts/subgraph-readmes.ts",
      // Its sibling for a library ITEM (bean `qgjh`): the same markers and
      // `splice`, the words from the item's own manifest. Core beside it.
      "scripts/library-readmes.ts",
      "scripts/library-refs.ts",             // who references a slug — the L1 property
      "scripts/library-graph.ts",            // library/ + uploads/ → the L1 corpus
      "scripts/gen-library-viz.ts",          // that corpus → projection + viewer
      "scripts/lib/library-withheld-view.ts", // that viewer's withheld rows + banner (#1794), embedded verbatim
      "scripts/lib/library-address.ts",    // that viewer's entry-IRI path parser (#1881), embedded verbatim
      "scripts/gen-uploads-viz.ts",         // the QUEUE half → a viewer only; the dataset stays library's (bean `flh4`)
      "scripts/voices-graph.ts",             // declared voices/ → voices + their citations
      "scripts/gen-voices-viz.ts",           // those voices → projection + viewer
      "scripts/gen-document-kinds-viz.ts",   // every harness's document kinds → a viewer (stage D5, #1767)
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
      // Its shared answer to "does this skill have a page" (bean `qgjh`): the
      // tools and processes visualisers link a skill only where one is, so the
      // module sits beside the two viewers that read it.
      "scripts/lib/skill-pages.ts",
      // The raw-block wrapper both of those visualisers emit authored text through
      // (bean `kjbb`): a closing tag inside the text must not end the block early.
      "scripts/lib/liquid-raw.ts",
      // Its library twin (bean `qgjh`): where a library reference links — the
      // viewer, the item README, the upstream record — read, never composed.
      "scripts/lib/library-links.ts",
      "scripts/gen-folio-viz.ts",            // the folio GRAPH → projection + viewer. Its content already renders as the landing board; this is a view of the nodes behind it (bean `7ofc`)
      // The three materialisation modules that stood here — `check-materialized-fixity.ts`
      // (materialized bytes vs their recorded digest, the read-only rule enforced),
      // `backfill-materialized-fixity.ts` (records the baseline digest that check reads)
      // and `cache-index.ts` (what is materialized, how big, how old, what could go —
      // bean `54rk`) — are GONE FROM THIS LIST because they are gone from this
      // instance. Bean `yj6r` moved them to `folio-assistant-core/scripts/`, where
      // `schemas/materialization.ts` already lived. The classification did not change;
      // the DIRECTORY caught up with it, so the fact is now carried by location rather
      // than by a rule, and an `exact` entry naming a path this scan can no longer see
      // would be a rule that fires on nothing while reading as an adjudication.
      "scripts/sync-remote-skills.ts",       // a remote package's declared skills, materialized at its pinned commit (issue #556)
      "scripts/kg-subscribe.ts",             // subscribe to an external Knowledge Graph at a pin: judge its root declaration, record the subscription (issue #1719)
      "scripts/kg-instantiate.ts",           // instantiate a harness a subscription chose: its config at the root and its state directories (issue #1719)
      "scripts/subscriptions-viz.ts",        // the KG subscriptions page: known substrates, what each instance subscribed to and chose, and each chosen part drawn from its materialisation record (issue #1719)
      "scripts/gen-fsh-guts-viz.ts",         // the fsh-guts graph → projection + viewer; staging-only, so the page is withheld from the canonical deploy
      "scripts/gen-handler-index.ts",        // the handler namespace's own index, over the tiles model
      "scripts/declared-dirs.ts",            // graph typology → declared directories; CORE because it registers the folio kind, which is the whole reason the harness layer spawns it rather than importing it (bean `9c34`)
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
    ],
  },

  {
    repo: "harness",
    exact: [
      // HARNESS. The content model and the content half of an adapter, split
      // out of `src/types.ts` (bean `w2gr`, step 1, owner ruling 2026-10-01):
      // the server half moves to `cat-harness-tools`, and core must not depend
      // on that, so the vocabulary both sides use stays here.
      "src/content-types.ts",
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
      "schemas/document-kind.ts",            // the document-kind graph typology's schema, beside theme.ts (stage D5, #1767)
      "schemas/themes.ts",
      // Resolves a ThemeRef against its owner's declared themes (bean `v8n5`):
      // the same sticky-note theme layer as the two above, reached through a
      // declaration rather than an import, so it holds no folio's values.
      "schemas/theme-by-ref.ts",
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
      // Bean `6ptx`. Harness by subject: a survey is of THIS repository's own
      // commit history and work plan, which no folio has as content.
      "scripts/survey.ts",
      // Its sibling, bean `hrv2`: prose claiming which file declares a graph,
      // checked against the declarations. Harness by subject as well as by
      // dependency -- which file declares which graph is a fact about
      // instances, and a folio declares none.
      "src/docs/declaration-claims.ts",
      // Who else is working THIS repository — a fact about the forge and this
      // checkout, not about any folio's material.
      "scripts/sibling-sessions.ts",
      // Its sibling: which sessions are WAITING on a person. Harness by
      // subject and by dependency -- a session is a fact about this checkout
      // and the forge, and a folio has no sessions. Bean `rq8s`.
      "src/sessions/staleness.ts",
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
      // Harness for the same reason, plus one of its own: its `--github`
      // half asks the forge which PRs are open, and a PR is a fact about
      // this checkout and the forge, not about any folio's material.
      "scripts/check-bean-rollup.ts",
      // The milestone closure, HARNESS for the same reason as its neighbours
      // and not for the one that suggests itself. It is a pure function with
      // no forge call and no path literal, so "generic" is tempting — but the
      // block above settles it by SUBJECT: `beans/` is the agent work plan the
      // harness declares, and a folio's content has no bean store to roll up.
      // Genericity is about whether swapping the content changes the answer;
      // this reads a graph a folio does not have.
      "scripts/milestone-rollup.ts",
      "scripts/check-declared-paths.ts",
      // The external-specification registry — which edition of BPMN, DD or
      // DCMI Terms this repository conforms to, reconciled against the
      // namespaces its own diagrams and records actually bind. Harness by
      // its subject: the things it reconciles are this repository's
      // knowledge graph and CI processes, not a folio's material.
      "scripts/external-schemas.ts",
      // Their two shared modules, classified with them rather than beside
      // the generic path helpers: `merge-pipeline-paths` reads path classes
      // out of this repository's `PATTERNS` declaration, and
      // `merge-pipeline-git` resolves member specs against this repository's
      // refs. Both are about this queue, not about paths or git in general.
      "scripts/merge-pipeline-paths.ts",
      "scripts/merge-pipeline-git.ts",
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
      // The preview cap (issue #1868) — same family as its imports above
      // (`restore-staging`, `render-log`, `staging-record`,
      // `staging-cleanup-preflight`, `staging-preview`), all harness.
      "scripts/staging-rotate.ts",
      // The staging rate limit (issue #1956) — same family, harness.
      "scripts/staging-push-gate.ts",
      // The adapter for an instance that holds no content (bean `zmdo`): the
      // server's fallback when no content adapter is installed above the
      // harness. Harness by definition — it exists for the harness alone.
      "schemas/assistant-package.ts",
      "schemas/assistant-types.ts",
      "schemas/assistant-workflow.ts",
      // The CatHarness root declaration is harness-layer by concept even
      // though it sits in schemas/. It declares its own HARNESS_NS rather than
      // importing the content vocabulary, so classifying it here adds no
      // wrong-direction edge — see schemas/cat-harness.ts.
      "schemas/cat-harness.ts",
      // The graph-typology registry, split out of the line above so core could
      // import it without a cycle (bean `q2wn`). HARNESS on the same terms:
      // it holds `BASE_GRAPH_TYPOLOGIES` — the harness's OWN three kinds — plus
      // the registry mechanism, and imports only `namespaces.ts`. Core does
      // not own it; core CONTRIBUTES `folio` to it, which is the whole
      // distinction `folio-graph-typology.ts` argues. Left to triage it landed
      // in core on a keyword, which had the ownership exactly backwards.
      "schemas/graph-typology-registry.ts",
      // declared-path-literal: a partition plan names modules by path, the
      // same base case as the TARGET layouts above. dmx1's and riit's leaves,
      // imported by the registry and the declaration schema: instance discovery
      // (moved verbatim out of cat-harness.ts), the graph-typology, validator,
      // block-kind and contribution node schemas, and the declared-node scan.
      // Harness for the same reason as their importers.
      "schemas/instance-roots.ts",
      "schemas/graph-typology-node.ts",
      "schemas/declared-nodes.ts",
      "schemas/validator-node.ts",
      "schemas/block-kind-node.ts",
      "schemas/content-adapter-node.ts",
      "schemas/contribution-nodes.ts",

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
      // Bean `95ir`: declared-but-absent is reported by a scanner, never
      // dropped. Harness machinery over declarations; imports only node:fs.
      "scripts/lib/declared-presence.ts",
      "scripts/kg-audit.ts",
      // The same audit over every declared instance rather than the root alone
      // (bean `bjzs`). Harness layer for exactly the reason `kg-audit.ts` is —
      // it spawns that audit and imports only `instanceRootsIn`, so its subject
      // is the instance declarations, never the content vocabulary. Assigned
      // here in the same change that added it: `unassigned` is what the tool's
      // own report says not to read as clean, and four scripts sat that way
      // until somebody looked.
      "scripts/kg-audit-all.ts",
      // WHICH audits reach which kind of node (bean `xutg`). Harness machinery
      // for the same reason `kg-audit.ts` is: its subject is the graph-typology
      // registry and the gate set, not the content vocabulary. Beside the audit
      // it complements rather than duplicates — that one judges the nodes it
      // covers, this one measures what is covered at all.
      "scripts/audit-coverage.ts",
      // WHICH declared executable artefacts can be reached at all (bean `dxqm`).
      // Harness machinery for the same reason as the coverage report beside it:
      // its subjects are the declared `.bpmn`/`.dmn` corpus, the engine's own
      // resolver and the module graph — never a folio's vocabulary. A folio
      // could not make it reach a different verdict, only give it more
      // artefacts to ask about. Assigned in the same change that added the
      // script, because `unassigned` is exactly what the partition's own report
      // says must not be read as clean.
      "scripts/audit-reachability.ts",
      // LSI over the declared prose graphs, and the epic-filing proposal it
      // drives (bean `ansc`). Harness for the same reason as the audit: its
      // subjects are the declarations and the work plan, and the engine it
      // imports (`content/pipeline/lsi.ts`) is linear algebra over any text.
      "scripts/lsi.ts",
      "scripts/lsi-epics.ts",
      "scripts/gen-lsi-viz.ts",
      // The PROV-O QA/QC report (#1180 step 5): workflow history → PROV-O,
      // re-checked with `authorizeTask`. Harness on the same terms as the
      // audit: it reads the harness's own work-plan store, role graph and
      // policies, and imports nothing from the content vocabulary.
      "scripts/prov-qaqc.ts",
      // Its one cross-run criterion — declared prose ↔ code pairs and their
      // attestations (bean `cuxx`). Same side as the auditor that calls it.
      "scripts/prose-code-pairs.ts",
      "scripts/skill-voice-review.ts",     // skills reviewed against the skill voices, kept in the attestation store (beans rkqp, 2gst)
      // ...and stage A, what that prose SAYS about the code (bean `ca4a`).
      "scripts/pair-claims.ts",
      "scripts/known-skills.ts",
      // Which skill packages this checkout serves — moved here from the
      // `skill_fetch` Tool (bean `9umr`) so the harness callers, `kg-audit`
      // and the workflow engine, stop importing from a Tool. Harness beside
      // `known-skills.ts`, which it builds on.
      "scripts/skill-packages.ts",
      // The user-invocable skill list, moved out of the `skill-prompts` Tool
      // (bean `w2gr`) so `gen-skill-commands` stops importing from a Tool.
      "scripts/invocable-skills.ts",
      // ...and the topic level it walks through (bean `9umr`): which
      // subdirectories of a skills directory are topics, from `skills.json`.
      "scripts/skill-topics.ts",
      // ...which now delegates to the ONE grouped walk every grouping kind
      // shares (placement PR0c, bean `ejye`), and that walk's gate.
      "scripts/concern-groups.ts",
      // The checkout-portability gate, beside the module it runs. Harness by
      // subject: it reads `git ls-files` over THIS repository and grades the
      // tree's own filenames, which is a fact about the checkout and not about
      // any folio's material.
      "scripts/check-portable-paths.ts",
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
      // bootstrap's own Zod (graph, discussion, requirement, and since
      // 2026-09-30 the graph document's) lives in `bootstrap-tools/` (bean
      // `xsqm`), outside this partition.
      // Code lists (owner, 2026-09-23): the shape the ENGINE checks an
      // adjudication's codes against, and the loader `namespaces.ts` sits
      // beside. Needed to RUN a process, so harness — the same test as the
      // tooling below; a core placement made `process-model.ts` import down.
      "schemas/code-list.ts",
      "scripts/code-lists.ts",
      // The pre-deploy verifier set (bean `vigi`): needed to RUN the publish
      // process, so harness, beside the gates it sits among.
      "scripts/publish-verify.ts",
      // The per-scope search split (bean `m7mn`): the publish process runs it
      // after the build, and publish-verify imports its shapes, so it sits
      // beside the verifier rather than below it.
      "scripts/search-split.ts",
      // The downstream-tool criterion family (bean `fq5u`): kg:audit's reader
      // of Tool run records, harness for the same reason as the audit itself.
      "scripts/downstream-runs.ts",
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
      // The BPMN process element id (#1168 B8): a leaf `carried-note`'s
      // TaskRef and the log / invocation records all reference.
      "schemas/process-element-id.ts",
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
      // The TEST PROCESS's other two schemas (beans `ygzh`, `3o5b`), by the
      // same test as `test-run.ts` beside them: a plan and a report describe
      // how a SYSTEM UNDER TEST is judged, not a folio's content, and their
      // reader is `kg-audit` (harness) through `scripts/test-plan-audit.ts`.
      // Left `core` by the `schemas/` rule they made `kg-audit` import core,
      // and the system-under-test facet on `skill-package.ts` (harness) import
      // `test-plan.ts` for `SUT_KINDS` — two wrong-direction edges.
      "schemas/test-plan.ts",
      "schemas/test-report.ts",
      // ...which forces `attribution.ts` too: both import `ATTRIBUTION_KINDS`
      // from it. It is the reviewer-identity vocabulary of every QA verdict
      // (`script` / `agent` / `human`), it imports only `tool-types.ts`
      // (harness) and bootstrap's model registry, and its core consumers
      // (`apply-image-verdicts.ts`, the narrative and image schemas) may import
      // the harness — so the move adds no wrong-direction edge. Bean `3o5b`.
      "schemas/attribution.ts",
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
      "schemas/substrate-snapshot.ts", // the node schema of `substrate-snapshot`, a kind the harness registers (issue #1719)
      "schemas/kind-validator.ts",  // a graph typology's validator
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
      //    declaration, a role, a graph typology or the gate set; none reads a
      //    folio's content model.
      "scripts/check-declared-dirs.ts",     // the same declaration, its DIRECTORIES
      "scripts/check-fallback-roles.ts",    // reads role-graph
      // HARNESS, although what it reads is core's glossary — the test is the
      // module's imports, not the data's home. It reaches only
      // `schemas/term-mapping.ts` and `scripts/qa-results.ts`, both harness,
      // so classifying it core would buy two wrong-direction edges for the
      // tidiness of filing it beside the glossary it inspects. Same reasoning
      // the content-side block below states in the other direction.
      "scripts/check-term-mapping.ts",      // is a minted candidate already somebody's concept (bean `7wou`)
      // HARNESS on the same test, and it is worth stating because the
      // instinct pulls the other way: what this reads is `uploads/` and
      // `library/`, a folio's own material, and its three nearest
      // neighbours by SUBJECT — `check-l1-complete`, `ingest-document`,
      // `l1-blocks` — are all in the content-side block below. It imports
      // `schemas/cat-harness.ts` and nothing else. The declaration resolver
      // is harness, so filing this core would buy a wrong-direction edge for
      // the tidiness of sitting beside the pipeline it audits. The three
      // below are core because THEY reach `schemas/narrative.ts` and its
      // siblings; this one reaches no core schema at all, which is what
      // makes it a different answer rather than an inconsistent one.
      "scripts/skill-governance.ts",        // which skill governs a directory, read from the skills (#1168 B7b)
      "scripts/docs-declarations.ts",       // which page documents a directory, read from the pages (#1168 B7c)
      "scripts/viewer-declarations.ts",     // which viewer page draws a directory, read from the pages (#1168 B7a-2)
      "scripts/governing-process.ts",       // which BPMN process governs a directory, read from `coverage.process`
      "scripts/render-pipeline.ts",         // WHICH renders run and in what order, read from the declarations
      "scripts/render-selection.ts",        // WHICH of them must re-run against a seed, and why (bean `9c34`). Harness machinery: it computes a decision and writes no page, so it belongs beside the pipeline rather than with the renderers
      "scripts/gates.ts",                   // the gate runner itself
      "scripts/gate-tree-guard.ts",         // ...and which gate changed the tree under it (bean `ymsu`). Harness for the same reason the runner is: it asks a question only the runner is positioned to ask, since no gate can observe what another gate did
      "scripts/task-pool.ts",               // the worker pool `gates` and `regen` share (bean `xpcu`): scheduling only, knows nothing about any content type
      "scripts/task-io.ts",                 // ...what each check script reads and writes, declared in one place, which the pool and the skip read
      "scripts/pair-cover.ts",              // ...and which regen pairs FOLD into one another's check (bean `8qyc`): a gate whose chain the pool already asks is replaced by its residual. Scheduling only, beside the pool for the same reason
      "scripts/input-hash.ts",              // ...and `regen`'s input-hash skip: a local cache over the declared inputs, harness for the same reason `regen` is
      "scripts/changed-paths.ts",           // ...and `regen --changed` / the narrowed fixpoint (bean `94zs`): which pairs a set of changed paths can reach, over the same declarations
      "scripts/decisions-named-not-asked.ts", // the `Stop` layer of `interaction-modality` §4.1 (bean `ahvw`). Harness: it reads a transcript and enforces how a QUESTION is put, which no content type varies
      "scripts/kind-table.ts",              // the reader over the graph-typology TABLE in `directory-conventions.md`, which `kind-register` and `graph-typology-docs.test.ts` both ask. Harness: the table is the harness's own documentation of its own registry
      "scripts/route-authority.ts",         // WHICH COPY a route-keyed generator's --check compares against — the checkout, the branch, or both. Harness: it reads a declaration and a branch manifest and knows nothing about any content type. Its `unknown` state is the point (bean `xsrv` Done-when 3: a branch it cannot fetch is never a pass)
      "scripts/skill-register.ts",          // runs the generators a NEW SKILL stales AND gates the declarations (beans `v625`, `nfv3` — two commands one letter apart, consolidated here at the owner's decision 2026-09-26). Beside `gates.ts` for the same reason: it invokes the repo's own tooling and knows nothing about any content type. `ymsu`'s guard above is why it verifies with ISOLATED check runs: inside `gates`, `bun test` repairs two of the six artefacts before their checks read them
      "scripts/gen-avatars-css.ts",         // generated from the avatar nodes
      "scripts/gen-python-deps.ts",         // writes requirements.txt
      "scripts/kg-validate.ts",             // one Tool, parameterised by graph typology
      "scripts/repo-files.ts",              // enumerates files the way a GATE needs
      "scripts/strip-preview-seo.ts",       // the preview site build
      "scripts/set-html-lang.ts",           // ...and the served language on its `<html>` (bean `zru7`). Beside the SEO strip for the same reason: a pass over the EMITTED tree, coupling to no content type and to no theme file
      "scripts/minify-site.ts",             // ...and the last pass over it: the comments and unrendered whitespace drop out of every emitted page. Harness for the same reason as the two above — it reads the TREE, knows no content type, and could not: it decides by HTML's own rendering rules which bytes a reader can see
      "scripts/staging-banner.ts",          // ...and its banner (bean `g196`)
      "scripts/html-comments.ts",           // the one "is this inside a comment" scan the banner's body-finder and the folio mount's marker check share (bean `ur84`)
      "scripts/folio-mount.ts",             // the fragment that carries the reader's folio onto a library page — machinery, not a content model (bean `jpjt`)
      "scripts/pdf-viewer.ts",              // the pinned pdf.js viewer installed into a built site, and the fragment that embeds it — machinery over the TREE and a URL, no content model (bean `folio-assistant-5ea6`)
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
  //    The test applied WAS not "does the name mention Lean" but "would core
  //    compile and function without the science layer installed". For
  //    `lean-packages.ts` it would not: `BlockBase` carries an optional `lean`
  //    field in `schemas/types.ts`, `schemas/constraints.ts` validates its
  //    `ref` against `LEAN_REF_PATTERN`, and the field is on shared block
  //    kinds by design — the document profile forbids its USE rather than its
  //    existence. So the grammar belongs wherever the field does. Only the
  //    package list is a property of a folio, and that is injected.
  //
  //    🟧 THAT TEST IS OVERRULED (owner, 2026-09-27), and it is the premise
  //    rather than the reasoning that was rejected. Verbatim: "field sits on
  //    shared kinds (remark, example, algorithm, simulator), so the grammar
  //    genuinely is vocabulary that goes tp f-a-sci", following
  //    "f-a-sci __should__ have scehams for math/science papers". A `lean`
  //    field appearing on a shared kind does NOT make the grammar core; it
  //    makes that field on those kinds part of the science vocabulary.
  //
  //    The test was applied FIVE times in this block ("Same test again",
  //    "Same test a third time"), so the ruling reached four entries, not one.
  //    Two moved to the sci block above and cost NOTHING. The other two --
  //    `schemas/lean-packages.ts` and `content/pipeline/lean-signature.ts` --
  //    cost SIX core -> sci edges, measured twice (at `.folio-assistant-pin`
  //    and on current `main`, so not a pin artifact):
  //      schemas/constraints.ts          -> lean-packages
  //      adapters/mcp-server/server.ts   -> lean-packages
  //      adapters/document/resolver.ts   -> lean-packages
  //      adapters/manifest-entries.ts    -> lean-packages
  //      content/pipeline/qa-utils.ts    -> lean-packages
  //      content/pipeline/qa-utils.ts    -> lean-signature
  //
  //    🟩 PAID. All six are gone and both modules are now `sci` (they fall
  //    there on the `lean` keyword rule below, so they need no entry at all).
  //    `schemas/formal-ref.ts` is the injection point core reaches instead --
  //    the third instance of the `references-registry-di` / `value-registry-di`
  //    pattern -- and `content/pipeline/lean-formal-ref.ts` is the sci-side
  //    implementation, which is where the resolution bodies moved verbatim from
  //    `qa-utils.ts`. `BlockBase` is UNCHANGED: core still carries a field
  //    named `lean`, it simply no longer knows the grammar of its `ref`. The
  //    earlier note here said the ruling "changes `BlockBase`, so it is the
  //    owner's call" -- that was wrong, and the whole cost was five call sites,
  //    one of which dissolved by deleting a helper. qou bean `qou-7ko6`.
  //
  //    NOTE: NINE core modules import `lean-packages`, not six. The other
  //    three -- `export-json.ts`, `conjectural-propagation-audit.ts`,
  //    `conditional-class-banner-audit.ts` -- are composition roots
  //    (`import.meta.main`), and `engine.ts` exempts a composition root from
  //    the direction rule while still counting its edge in `totalEdges`. So a
  //    reader who greps importers finds nine; re-measure with `--edges`, and
  //    do not read six as an undercount.
  {
    repo: "core",
    triaged: true,
    exact: [
      // The simulator-asset validator (bean `023p`). It falls to `sci` on the
      // keyword rule further down, which matches the WORD `simulator` — and
      // that is the CLASSIFICATION being wrong rather than the import, as
      // `schemas/dak-blocks.ts`'s was in the `smart-base` block before bean
      // `1335` moved that module to smart-base outright.
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
      // The QA sidecar PROJECTION — the families (`block`, `translation`,
      // `script`, `kg`), their states and freshness, read by `gen-docs-pages`
      // to publish one file per (subject, family). Nothing in it is science:
      // it imports only `block-qa`, `kg-qa` and `script-qa`, all core. It is
      // here because the sci keyword rule matches `witness` in its NAME, which
      // is the second file that has caught — a reminder that the keyword rule
      // is a heuristic and the triage list is where its misses are corrected.
      "content/pipeline/qa-witness.ts",
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
      // The refactoring-strategy DATABASE loader: version-gated candidate
      // rewrites for `proof-simplifier`, keyed by Lean version. Its schema is
      // already `sci` (`schemas/refactor-strategy.ts`) and the two were split
      // across the boundary by directory alone. Nothing in the pipeline
      // imports it; its only other consumer is its own test.
      "content/pipeline/refactor-strategy.ts",
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
    //
    // `adapters/paper/` was here until 2026-09-30, and its removal is the rule
    // SUCCEEDING rather than being withdrawn. It named `PaperContentAdapter`
    // as sci-layer code, and bean `y5si` moved the directory to
    // `folio-assistant-sci/` on that adjudication plus the matching
    // `layer: "sci"` in `src/builtin-adapters.ts`. This scan is rooted at
    // `cat-harness/`, so the prefix now matches nothing — and a rule that
    // fires on nothing while reading as a live adjudication is worse than no
    // rule, because the next reader takes it as evidence the file is still
    // here. The reasoning is kept; the dead prefix is not. The same went for
    // `skills/authoring/{authoring-math,folio-paper-adapter}/` on 2026-10-01:
    // placement PR1 (bean `ybwt`) moved both packages to
    // `folio-assistant-sci/skills/content/`.
    prefixes: ["computations/", "latex/", "scripts/render-tex/", "scripts/docker-latex-build/", "scripts/knot-plots/"],
    exact: ["schemas/formalization-types.ts", "schemas/precision-scalar.ts", "schemas/refactor-strategy.ts"],
  },
  {
    repo: "sci",
    keyword: /(^|[/-])(lean|latex|tex|proof|witness|simulator|sage|formaliz|knot)([/.-]|$)/i,
  },

  // ── smart-base: WHO L2-L3, DAK, FHIR, OCL
  // `skills/authoring/authoring-who-smart-guidelines/` was the one prefix of a
  // smart-base rule here until placement PR1 (bean `ybwt`, 2026-10-01) moved
  // the package to `smart-base/skills/content/` and its four generic FHIR IG
  // skills to `fhir-harness/skills/content/fhir-ig-authoring/`. Its note stays:
  // `schemas/dak-blocks.ts` was here, then re-triaged CORE because core's
  // `block-kinds.ts` declared `CONTENT_ADAPTERS = ["paper", "dak"]` and
  // `DAK_BLOCK_KINDS`. Bean `1335` removed that premise instead: the `dak`
  // adapter and its kinds are a smart-base CONTRIBUTION now, and the module —
  // with `qa-checkers-dak.ts` and `gen-dak-components-figure.ts` — lives in
  // `smart-base/`, which this tool does not scan.
  {
    repo: "base",
    exact: [
      // Measures whether an IG's SOURCE graph carries dependency edges for its
      // logic layer — Library, PlanDefinition, Measure (bean `f4gj`). Its name
      // carries none of the keyword rule's tokens, so it fell through every
      // rule when it arrived.
      //
      // BASE rather than core, although its subject is content and
      // `check-artifact-index.ts` was core on exactly that reasoning — it has since
      // MOVED to `folio-assistant-core/scripts/` under bean `yj6r`, so no rule in
      // this file adjudicates it any more; see the note where its entry stood. The
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
  //
  // The `content/pipeline/` prefix below classifies that whole directory as
  // core, which is why `check:partition` has always read 0 for it. Bean `yj6r`
  // acted on that classification for the GLOSSARY cluster: `build-glossary.ts`,
  // `codemod-refterm.ts` and their three tests now live in
  // `folio-assistant-core/scripts/`. Nothing was removed from the prefix — a
  // prefix stops matching a path that is no longer under it — but the fact is
  // recorded here because the next reader will count `content/pipeline/` and
  // find two files missing from a directory this rule claims in full.
  //
  // What the move BOUGHT is not a change of classification: it was already
  // core. It removed the three imports reaching UP out of `cat-harness/` into
  // `folio-assistant-core/schemas/glossary.ts` and `scripts/glossary-page.ts`,
  // which this scan cannot see at all (its root is `cat-harness/`, so an edge
  // leaving it is not resolved and not counted). That blindness is the whole
  // subject of `yj6r`, and it is why a green `check:partition` was never
  // evidence about this cluster either way.
  {
    repo: "core",
    // declared-path-literal: the TARGET layout of the five-repo split, which no
    // declaration in THIS repo describes — that is the whole point of the plan.
    prefixes: ["adapters/mcp-server/", "adapters/document/", "src/blocks/", "scripts/translation/", "skills/folio-core/", "skills/authoring-document/", "skills/authoring/content-lifecycle/", "content/pipeline/", "schemas/", "ui/", "viewer/", "translations/"],
    // `blueprint/` STOOD in the prefixes above until 2026-09-30 (bean `vov0`):
    // it held a hand-written QOU blueprint, folio content in the platform, and
    // is removed now that `blueprint-layout.ts` generates a paper's
    // `blueprint/src` from its manifest (#1598).
    exact: [
      // `scripts/build-document-site.ts` STOOD HERE and is GONE as of bean
      // `yj6r`, 2026-09-30: it now lives in `folio-assistant-core/scripts/`
      // beside the `schemas/changeset.ts` its test reads, so the classification
      // is carried by location. Reasoning kept: it renders a DOCUMENT folio to
      // a site through the document pipeline's own `buildDocumentMarkdown`
      // (content/pipeline, core), and its subject is a folio's content, not the
      // harness (bean `fyu2`). The `gen-review-page.ts` entry above still names
      // it as a core caller reaching DOWN into the harness, which is now true
      // by location as well as by rule.
      "src/qa-agent-write.ts",
      // Validates every committed `fhir-artifact-index` graph against
      // `schemas/fhir-artifact-index.ts` — core by the `schemas/` prefix. CORE
      // rather than harness for the reason the two entries above it give: a
      // script is not automatically tooling-side, and this one's SUBJECT is
      // content — an IG's artefacts, which is a `content`-layer graph. Calling
      // it harness would buy a wrong-direction edge into `schemas/` for
      // nothing. Its sibling `scripts/ingest-ig-artifacts.ts` writes the same
      // graph from the same schema and is core on the same reasoning.
      //
      // Both are GONE FROM THIS LIST as of bean `yj6r`, for the reason given on the
      // materialisation trio above: they now live in `folio-assistant-core/scripts/`
      // beside the schema they read, so the classification is carried by location.
      // The reasoning is kept here rather than only in the commit because the next
      // reader of this rule set will ask why an IG tool is not adjudicated, and
      // "it is, by where it sits" is the answer.
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
      // Issue #1908: the todo graph's JSON-LD builder, a todo's thin page, the
      // ONE seam that says where published todos are read from, and the
      // generic thin-page shell they render with. CORE for the reason
      // `todo-listing.ts` gives: renderers of a folio's own notes, called by
      // `gen-docs-pages.ts` (core). They import `schemas/jsonld.ts`,
      // `schemas/todo-index.ts`, `scripts/todos.ts` and `viewer-page.ts`, all
      // core, so harness here would be four wrong-direction edges.
      "scripts/todo-graph.ts",
      "scripts/todo-page.ts",
      "scripts/todo-source.ts",
      "scripts/thin-page.ts",
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
      "scripts/notebook-structure.ts",      // the notebook rung: a folio's `.ipynb` → `notebook-structure/v1` (bean rkqp)
      "scripts/text-structure.ts",          // the text rung: Markdown/XML at a commit → `text-structure/v1` (bean y4uj)
      // `scripts/extract-assets.ts` STOOD HERE and is GONE as of bean `yj6r`,
      // 2026-09-30, for the reason the materialisation trio above gives: it
      // moved to `folio-assistant-core/scripts/` beside the
      // `schemas/extraction.ts` it reads, so the classification was carried by
      // location. SUPERSEDED 2026-10-02 by owner ruling 2 of the placement
      // proposal (bean `tlat`, PR5): the pair is the tool behind the harness's
      // own `asset-extraction` skill, so the schema moved DOWN to
      // `cat-harness/schemas/extraction.ts` and the script to
      // `cat-harness-tools/scripts/extract-assets.ts`. Neither is in this
      // core list again; the reasoning below is kept as the record of why it
      // was ever classified core. Its reasoning is kept rather than deleted with the entry,
      // because the next reader will ask why a container-extraction tool is not
      // adjudicated and "it is, by where it sits" is the answer: same test as
      // the three above — it reads a CONTAINER a folio was given (a zip, a PDF,
      // a saved page) and writes a `folio-extraction/v1` record beside it. Core
      // material, and its schema is core too. A rule naming a path its own scan
      // can no longer see fires on nothing while reading as an adjudication.
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
 * `cat-harness.ts` imports core's `folio-graph-typology.ts` for its side effect,
 * which is what makes the `folio` registration automatic instead of something
 * 110 commands had to remember. Bean `q2wn`, and the header of
 * `schemas/graph-typology-registry.ts` for why the alternatives were worse.
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
    to: "schemas/folio-graph-typology.ts",
    reason:
      "The registration trigger. Core owns `folio`; this import is what makes it registered " +
      "by the time any reader can be called, because a reader lives in `cat-harness.ts` and " +
      "loading that module is therefore a precondition of calling one. Without it the kind is " +
      "registered only if the process happened to import core first — an import-order property " +
      "that threw `unknown graph typology \"folio\"` on a valid declaration, five times in PR #465.",
  },
  {
    from: "schemas/cat-harness.ts",
    to: "schemas/glossary-graph-typology.ts",
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
