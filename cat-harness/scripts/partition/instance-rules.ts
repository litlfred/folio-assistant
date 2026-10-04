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
      "scripts/check-ci-health.ts",          // workflow state on the default branch
      "scripts/watch-ci.ts",                 // one commit's check runs → a three-state verdict
      "scripts/check-workflow-policy.ts",    // BPMN relaxation legality
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
      // HARNESS: the cross-instance half of check:declared-paths (bean `gz47`).
      // Its subject is every instance's declarations and source, read; it
      // reads no folio material.
      "scripts/check-foreign-paths.ts",
      // HARNESS, by the same test as `check-ci-health.ts` above: its subject is
      // this checkout's own ENVIRONMENT — whether a nested `node_modules` or a
      // symlinked root makes a tool answer a question about the repository from
      // something the repository does not contain (bean `3vc1`). It reads no
      // folio material and no content schema; it imports `node:fs` and
      // `node:path` and nothing else, so it cannot drag a folio in. `gates.ts`
      // is its only caller and is itself harness, so the edge runs
      // harness -> harness.
      "scripts/check-environment.ts",
      // HARNESS, by the same test again: its subject is a TEST RUN's timings and
      // the budgets this repository's own test files declare — harness meta, not
      // any folio's content. It reads a junit report and `.test.ts` sources, and
      // imports `node:fs`, `node:path` and `typescript` (for the AST) and nothing
      // else, so it cannot drag a folio in. Bean `sff8`.
      "scripts/check-test-budgets.ts",
      // The prose half of the same arrow this tool measures for imports, and
      // harness for the same reason `repo-partition.ts` is: its subject is
      // which INSTANCE a file belongs to and what that instance declares it
      // needs, which is platform meta. It reads no folio material, and its
      // rule (`schemas/reference-direction.ts`) consumes `layer-direction.ts`
      // — the module this tool already shares — so both axes are classified
      // by the same test and answer to the same declaration (bean `zhg2`).
      "scripts/check-reference-direction.ts",
      // The IMPORT half of that arrow, over every declared instance (bean
      // `p11x`). Harness for the same reason: it reads declarations and module
      // specifiers, consumes the same `layer-direction.ts`, and no folio content.
      "scripts/check-import-direction.ts",
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
      // HARNESS on the same argument as `check-image-roles` above: its two
      // subjects are this repository's own `<instance>.json` declarations and
      // its own client (`docs/assets/js/docs-ui.js`). It opens no folio
      // content — the declarations it reads are the harness's, and the glyph
      // registries it compares are the harness's own furniture.
      "scripts/check-navbar-consistency.ts",
      // HARNESS for the same reason: it asks the runtime's own question
      // through `schemas/theme-by-ref.ts` over this repository's declared
      // instances. The THEMES it loads are an instance's subject matter,
      // but this script reads no folio content — it validates a graph
      // against a schema the harness owns.
      "scripts/check-instance-themes.ts",
      // HARNESS: its subject is this repository's own work plan, read
      // through `scripts/beans.ts` — the one reader of the store. No folio
      // content is opened.
      "scripts/check-bean-parent-prose.ts",
      // HARNESS: it reads the NAMES of files in declared uploads/library
      // graphs and never their contents, so no folio content is opened.
      "scripts/check-upload-names.ts",
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
      // How a GRAPH-KIND row in that navbar is marked and named (bean `yag0`):
      // the kind's avatar glyph and hue, and the head of its registered
      // summary as the accessible name. HARNESS beside `navbar.ts` for the
      // same reason — it is the platform's chrome, read from the platform's
      // kind and avatar registries, and both navbar callers share it.
      "scripts/lib/graph-kind-nav.ts",
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
      "scripts/content-holds-code.ts",       // a content instance holds no code (kg-separation FR-7, bean `eayu`)
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
      // Where the `qa` graph is KEPT once it leaves main (bean `16ei`): the
      // read/write API over the `qa-reports` branch. Harness-level for the
      // same reason as its two neighbours — it reads the declaration and git,
      // and no folio's subject matter could make it answer differently.
      "scripts/qa-store.ts",                 // the qa-reports branch: readQa / publishQa / pruneQa
      // Its generalisation (bean `2h76`): the same branch-kept store for ANY
      // directory declaring `storage.keyedBy: "tip"`. Harness-level for the
      // same reason as `qa-store` — it reads the declaration and git, and no
      // folio's subject matter could make it answer differently.
      "scripts/branch-store.ts",             // a `keyedBy: "tip"` directory's own branch: one live copy
      // The declaration-driven face of the same store (bean `2h76` part 3): it
      // resolves a DIRECTORY ID to the branch its declaration names, so no
      // caller hardcodes a branch through a rename. Harness-level for the same
      // reason again: it reads the declaration and git, and no folio subject
      // matter could make it resolve differently.
      "scripts/state-store.ts",              // a declared tip-keyed directory, by id: read and splice-write
      // Its session-start step (bean `2h76` part 4): fetches the declared state
      // branch and checks it out as a read surface. Harness-level for the same
      // reason as the three above.
      "scripts/state-mount.ts",               // the state branch on disk, or a loud finding saying it is not
      // The write half of that mount: it turns the worktree diff into a splice
      // through the library rather than a push from the worktree, which is the
      // lost update. Harness-level for the same reason as its neighbours.
      "scripts/state-push.ts",                // the mount's edits, spliced onto the tip
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
      "scripts/merge-base.ts",               // merge the base in, resolve only declared patterns, prove
      "scripts/merge-conflict-patterns.ts",  // the declared patterns that merge reads
      "scripts/merge-main-comment.ts",       // the merge-main bot's PR comment, composed and tested (#1854)
      "scripts/merge-queue.ts",              // the merge train's order: live facts in, merge-priority.dmn's placement out (bean hfag)
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
      "scripts/resolve-subgraph.ts",         // the subgraph-source resolver from a shell (Tool `subgraph-resolve`)
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
      // Whether a translated page's links survived being one directory
      // deeper than the page they were translated from (bean `ahab`).
      // Harness for `check-subgraphs.ts`' reason and by the same route — it
      // consumes that tool's report and resolves the site root from the
      // declaration, so it knows which directories publish a site and
      // nothing at all about what any folio put in them.
      "scripts/check-translated-link-depth.ts",
      // Whether a page's `available_locales` names a locale a reader can
      // actually read it in (bean `9x01`). Harness by the same route as the two
      // above: it resolves the site root from the declaration, builds the
      // translation index from what the pages themselves declare (`lang` and
      // `translation_source`), and compares a page's claim with that index. The
      // CLAIM is structural — "is this readable in French" — so it says nothing
      // about what any folio wrote in French.
      "scripts/check-available-locales.ts",
      // Whether a gate that may be red BY DECISION sits last in its job, so the
      // set it masks is empty (bean `cpss`). Harness for the plainest reason in
      // this block: its subject is `.github/workflows/`, the harness's own CI
      // definition, and it reads no folio content of any kind.
      "scripts/check-red-gate-is-last.ts",
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
      // The layout norm — no declared directory inside another declared
      // directory. Harness for the plainest reason in this block: its whole
      // input is the instance declarations, it reads no content of any kind,
      // and it runs across EVERY instance in the repository rather than for
      // one folio.
      "scripts/check-layout-norms.ts",
      // Whether a rendered workflow diagram shows an XML character reference
      // as literal text (bean `li5y`). Harness for the same reason as the
      // layout norm above: its input is this instance's own process diagrams
      // under `workflows/`, it reads no folio content of any kind, and what it
      // judges is the harness's own published SVGs.
      "scripts/check-rendered-labels.ts",
      // Issue #1023. Both read every instance's declaration (visualisers) or
      // every declared library (manifests), and hold no folio's content: the
      // same reason as the layout norm above.
      "scripts/check-source-licence.ts",
      // Snapshots the SPDX License List ids that check validates against (bean
      // `sd5v`): the same subject — every declared library's licences — and
      // no folio's content.
      "scripts/pin-spdx-license-list.ts",
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
      // `schemas/dak-blocks.ts` was listed here as CORE until bean `1335`,
      // because core's `schemas/block-kinds.ts` then declared
      // `CONTENT_ADAPTERS = ["paper", "dak"]` and `DAK_BLOCK_KINDS`, and the
      // module defining their schemas could not sit in a different repository
      // from the union naming them. That premise was removed rather than the
      // classification argued again: smart-base now CONTRIBUTES the `dak`
      // adapter and its kinds (`smart-base/contributions.ts`), core's built-in
      // vocabulary is `paper` only, and `dak-blocks.ts`, `qa-checkers-dak.ts`
      // and `gen-dak-components-figure.ts` moved to `smart-base/`, outside this
      // tool's scope. Nothing under `cat-harness/` imports them.
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
      // gen-bootstrap-schemas and bootstrap-schema-page moved to the sibling
      // instance `bootstrap-tools/` (bean `xsqm`), outside this partition.
      // A README per declared directory, from the declaration. Core beside
      // `readme-sections`, whose file description and 'used by' it reuses.
      "scripts/subgraph-readmes.ts",
      // Its sibling for a library ITEM (bean `qgjh`): the same markers and
      // `splice`, the words from the item's own manifest. Core beside it.
      "scripts/library-readmes.ts",
      "scripts/check-docs-populated.ts",     // every harness owes one populated doc page
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
      "schemas/document-kind.ts",            // the document-kind graph kind's schema, beside theme.ts (stage D5, #1767)
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
      "scripts/check-command-paths.ts",
      "scripts/check-anchor-names.ts",
      // Bean `fx5r`. Harness by subject: its table names FORGE fields whose
      // served value goes stale, and a folio has no forge. It imports nothing
      // but `node:fs` and `node:path`, and the advice it sweeps is this
      // platform's skills and workflows.
      "scripts/check-stale-field-advice.ts",
      // Bean `e8m3`. Harness by subject: it reads the declared `bean-defs` graph
      // and the work plan is the harness's own, not any folio's content.
      "scripts/check-bean-archive.ts",
      // Bean `6ptx`. Harness by subject: a survey is of THIS repository's own
      // commit history and work plan, which no folio has as content.
      "scripts/survey.ts",
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
      // Same half again: it reads the declared `bean-defs` graph and asks
      // whether a bean claiming a block carries the four fields that make the
      // block readable — what it waits on, since, expires, handoff. Nothing in
      // it is about any folio's subject matter; a folio has no beans to block.
      "scripts/check-bean-blocks.ts",
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
      // Its sibling, and harness for the same reason twice over: it reads
      // THIS repository's workflow YAML, and what it asks about is whether a
      // job that runs the harness's own scripts checked out the harness's own
      // submodules. A folio could not make it answer differently.
      "scripts/check-workflow-submodules.ts",
      // The five merge-pipeline modules (bean `blgm`, PR #1895). Harness by
      // their subject, and not marginally: what they read is THIS
      // repository's open pull requests, its `merge-conflict-patterns`
      // declaration and its own branches. `merge-train` builds a train of
      // this repo's PRs; `merge-overlap` predicts conflicts between them;
      // `merge-leftover` asks whether a PR's intent reached this repo's
      // main. A folio has no queue for them to operate on, so none of the
      // five could be made to answer differently by swapping the content.
      "scripts/merge-train.ts",
      "scripts/merge-overlap.ts",
      "scripts/merge-leftover.ts",
      // `bean-rollover` joins them, and by the same test rather than by
      // adjacency: what it reads is THIS repository's open pull requests and
      // its `beans/` store, to answer a question only this repository has —
      // which bean edits must land before `beans/` can leave `main` (issue
      // #1850 step 2). It reuses `merge-pipeline-paths`'s classifiers for
      // exactly that reason. A folio has no bean store of its own to roll
      // over, so swapping the content could not make it answer differently.
      "scripts/bean-rollover.ts",
      // `mvp-status` is the same test again, and the clearest case of it: it
      // asks how far THIS repository is from its own separation point, and
      // every gate it reports is a fact about this repository — whether the
      // beans that define the plan are on its `main`, how many of its open
      // PRs still carry an authored conflict, whether any of them still
      // touches `cat-harness-tools`. A folio has no separation point and no
      // `cat-harness-tools`, so swapping the content could not make it
      // answer differently. It composes the four above rather than
      // re-measuring, which is why it belongs with them and not beside the
      // generic reporters.
      "scripts/mvp-status.ts",
      // Their two shared modules, classified with them rather than beside
      // the generic path helpers: `merge-pipeline-paths` reads path classes
      // out of this repository's `PATTERNS` declaration, and
      // `merge-pipeline-git` resolves member specs against this repository's
      // refs. Both are about this queue, not about paths or git in general.
      "scripts/merge-pipeline-paths.ts",
      "scripts/merge-pipeline-git.ts",
      // Builds every package this REPOSITORY publishes to npm (bean `rsi6`).
      // Harness by its subject: the thing it builds is this repository's own
      // shipped artefact, and a folio publishes prose and proofs rather than
      // a package. Its neighbour above reads the workflows; this one reads
      // what the workflows were failing to build.
      "scripts/check-published-packages.ts",
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
      "scripts/bean-notes.ts",              // per-branch notes on a bean and their generated index (bean `m61r`) — the harness's own work plan, no content type
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
      "src/tools/check-deps.ts",
      "src/tools/capabilities.ts",
      // Beside `capabilities.ts` and for the same reason: it joins a skill's
      // declared `degradation` to the probe results. Both act on the
      // HARNESS's own declarations and need no folio to have anything to do.
      "src/tools/degradation.ts",
      "src/tools/skill-fetch.ts",
      // The person-facing half of the same skills (bean `j6t3`): each
      // `user_invocable` skill as an MCP prompt. Harness for skill-fetch's reason.
      "src/tools/skill-prompts.ts",
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
      // Issue #1164: a filed requirement is a valid one with no name used
      // twice. Harness machinery over the harness's own declarations; it does
      // not import the content vocabulary. (Its sibling check-bootstrap-concepts
      // moved to `bootstrap-tools/`, bean `xsqm`.)
      "scripts/check-requirements.ts",
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
      // for the same reason `kg-audit.ts` is: its subject is the graph-kind
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
      "scripts/check-soft-hyphens.ts",
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
      "scripts/skill-voice-review.ts",     // skills reviewed against the skill voices, kept in the attestation store (beans rkqp, 2gst)
      // The one-shot move of those judgements out of kg-qa sidecars into the
      // attestation store (bean `2gst`). Same side as the auditor whose data it moves.
      "scripts/migrate-kg-attestations.ts",
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
      "scripts/check-concern-groups.ts",
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
      // bootstrap's own Zod (graph, discussion, requirement, and since
      // 2026-09-30 the graph document's) lives in `bootstrap-tools/` (bean
      // `xsqm`), outside this partition.
      // Code lists (owner, 2026-09-23): the shape the ENGINE checks an
      // adjudication's codes against, and the loader `namespaces.ts` sits
      // beside. Needed to RUN a process, so harness — the same test as the
      // tooling below; a core placement made `process-model.ts` import down.
      "schemas/code-list.ts",
      "scripts/code-lists.ts",
      // Vocabulary mapping tables' gate (bean `k74z`), beside the code-list
      // gate for the same reason: glossary-export, which the publish process
      // runs, applies the tables, so judging them is harness work.
      "scripts/vocab-mappings.ts",
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
      "scripts/check-landing-instance.ts",  // which instantiated harness is the site landing
      "scripts/check-declared-assets.ts",   // the instance declaration
      "scripts/check-declared-dirs.ts",     // the same declaration, its DIRECTORIES
      "scripts/check-fallback-roles.ts",    // reads role-graph
      "scripts/check-instance-render.ts",   // can an instance render its own graph
      "scripts/check-kind-validators.ts",   // graph kinds and their validators
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
      "scripts/check-uploads-retired.ts",   // an ingested upload is not still in the queue (bean `q7ey`)
      "scripts/check-subgraph-coverage.ts", // is a declared subgraph reachable at all (bean `2krx`)
      "scripts/check-quiet-claim-liveness.ts", // the work plan's own state against the remote (bean `omki`)
      "scripts/skill-governance.ts",        // which skill governs a directory, read from the skills (#1168 B7b)
      "scripts/docs-declarations.ts",       // which page documents a directory, read from the pages (#1168 B7c)
      "scripts/viewer-declarations.ts",     // which viewer page draws a directory, read from the pages (#1168 B7a-2)
      "scripts/governing-process.ts",       // which BPMN process governs a directory, read from `coverage.process`
      "scripts/check-published-refs.ts",  // a SHA may stage, only a version may publish (issue #592)
      "scripts/check-code-accounting.ts", // the two questions about a code file, kept apart (bean `ylj7`)
      "scripts/check-publishable.ts",     // is an instance PUBLISHED at all — the declaration, three-state (instance-versioning §3.1)
      "scripts/check-version-bump.ts",    // the bump computed from the exported surface (instance-versioning §4.1)
      "scripts/check-graph-kind-work.ts", // every state kind says whether it records work (bean `76sa`)
      "scripts/check-asset-roles.ts",     // one place says what an asset ROLE is (bean `7syd`)
      "scripts/check-instance-graph.ts",  // every instance's dependency graph resolves (bean `a1lq`)
      "scripts/check-module-scope-resolution.ts", // no module scope resolves the folio dir (bean `1hkj`)
      "scripts/check-python-deps.ts",       // the repo's own toolchain
      "scripts/check-workflow-paths.ts",    // every workflow script path resolves (bean `52dz`)
      "scripts/check-usage-paths.ts",       // a script's usage string names the script
      "scripts/render-pipeline.ts",         // WHICH renders run and in what order, read from the declarations
      "scripts/render-selection.ts",        // WHICH of them must re-run against a seed, and why (bean `9c34`). Harness machinery: it computes a decision and writes no page, so it belongs beside the pipeline rather than with the renderers
      "scripts/gates.ts",                   // the gate runner itself
      "scripts/gate-tree-guard.ts",         // ...and which gate changed the tree under it (bean `ymsu`). Harness for the same reason the runner is: it asks a question only the runner is positioned to ask, since no gate can observe what another gate did
      "scripts/task-pool.ts",               // the worker pool `gates` and `regen` share (bean `xpcu`): scheduling only, knows nothing about any content type
      "scripts/task-io.ts",                 // ...what each check script reads and writes, declared in one place, which the pool and the skip read
      "scripts/input-hash.ts",              // ...and `regen`'s input-hash skip: a local cache over the declared inputs, harness for the same reason `regen` is
      "scripts/decisions-named-not-asked.ts", // the `Stop` layer of `interaction-modality` §4.1 (bean `ahvw`). Harness: it reads a transcript and enforces how a QUESTION is put, which no content type varies
      "scripts/skill-register.ts",          // runs the generators a NEW SKILL stales AND gates the declarations (beans `v625`, `nfv3` — two commands one letter apart, consolidated here at the owner's decision 2026-09-26). Beside `gates.ts` for the same reason: it invokes the repo's own tooling and knows nothing about any content type. `ymsu`'s guard above is why it verifies with ISOLATED check runs: inside `gates`, `bun test` repairs two of the six artefacts before their checks read them
      "scripts/check-merged.ts",            // the gate runner, on the merged tree (bean `nytj`)
      "scripts/gen-avatars-css.ts",         // generated from the avatar nodes
      "scripts/gen-python-deps.ts",         // writes requirements.txt
      "scripts/kg-validate.ts",             // one Tool, parameterised by graph kind
      "scripts/repo-files.ts",              // enumerates files the way a GATE needs
      "scripts/strip-preview-seo.ts",       // the preview site build
      "scripts/set-html-lang.ts",           // ...and the served language on its `<html>` (bean `zru7`). Beside the SEO strip for the same reason: a pass over the EMITTED tree, coupling to no content type and to no theme file
      "scripts/minify-site.ts",             // ...and the last pass over it: the comments and unrendered whitespace drop out of every emitted page. Harness for the same reason as the two above — it reads the TREE, knows no content type, and could not: it decides by HTML's own rendering rules which bytes a reader can see
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
      "src/tools/readme-sync.ts", "src/tools/readme-audit.ts", "src/tools/render-order.ts", "src/tools/translation.ts",
      "src/tools/preview.ts", "src/qa-agent-write.ts",
      // `lsi_query` (bean `ansc`): registered beside the README and render
      // tools as a generic MCP tool, for the same reason — no block kind.
      "src/tools/lsi-query.ts",
      // `scripts/check-voices.ts` STOOD HERE and is GONE as of bean `yj6r`,
      // 2026-09-30: it now lives in `folio-assistant-core/scripts/` beside the
      // `schemas/library-ref.ts` it resolves citations through, so the
      // classification is carried by location rather than by this list. The
      // reasoning is kept because the next reader will ask why the voice-graph
      // validator is not adjudicated — it resolves each rule's citation into
      // `library/`, a FOLIO's reference library, and `schemas/voices.ts`, which
      // it reads, is core by the `schemas/` prefix. It arrived from `main` and
      // fell through every prefix, which is why it needed an exact entry at all.
      // CORE, by the same test and for the same stated reason: the subject is
      // CONTENT. It asks whether a change publishes a TRANSLATED PAGE with no
      // `.po` beside it, so both sides of the question are a folio's material —
      // the page under the site root and the catalogue under `translations/`,
      // which is core by its own prefix above.
      //
      // It reads `buildTranslationIndex`/`siteRoot` from
      // `content/pipeline/translation-index.ts` and `catalogueFor`/`fileForUrl`
      // from `content/pipeline/translation-drift.ts`, both core by the
      // `content/pipeline/` prefix.
      //
      // **Its second clause is RETRACTED, 2026-09-27.** It read "calling it harness
      // would buy a wrong-direction edge for nothing". Measured: reclassifying such
      // a script to `harness` leaves `Wrong-direction edges: 0`, because this file
      // has a `#!` line and `import.meta.main`, so `isCompositionRoot` holds and the
      // direction rule exempts its edges by design. The CONCLUSION stands and the
      // subject argument above it is untouched — only the layering reason was
      // wrong, and a right answer resting on a wrong reason is one the next entry
      // copies, which is exactly what happened to the `check-bun-runtime.ts` entry
      // above before it was falsified.
      "scripts/check-translation-catalogue.ts",
      // Whether the Bun RUNNING HERE is the one `.bun-version` pins, and how many
      // committed script sidecars a sweep in this container will therefore rewrite
      // (bean `3ozg`). CORE ON SUBJECT ALONE: what it measures and reports is the
      // sidecar corpus under `content/pipeline/script-sidecars/`, core by the
      // `content/pipeline/` prefix, and it reads `SCRIPT_SIDECAR_DIR` from
      // `content/pipeline/qa-utils.ts` to find it.
      //
      // The tension is worth naming rather than smoothing over: its REASON is the
      // harness's runtime, which is why `check-bun-pin.ts` is harness. Its SUBJECT
      // is what it counts, and that is core's. Subject decides.
      //
      // **AND THE LAYERING ARGUMENT DOES NOT DECIDE IT — measured, because a first
      // draft of this comment claimed it did.** That draft read "calling it harness
      // would buy a wrong-direction edge for nothing", copied from the
      // `check-translation-catalogue.ts` entry below. Falsified by reclassifying
      // this module to `harness` and re-running: `Wrong-direction edges: 0` and
      // rc=0, exactly as under `core`. The reason is `isCompositionRoot` — true for
      // any source with a `#!` line or `import.meta.main` — whose edges the
      // direction rule exempts by design. Every executable `scripts/check-*.ts`
      // here qualifies, this one and `check-translation-catalogue.ts` included, so
      // for a script in this block the direction rule is SILENT and cannot be
      // evidence for either repo. Subject is the only criterion that discriminates.
      "scripts/check-bun-runtime.ts",
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
      "scripts/check-library-qa.ts",        // is a `library/<bib-slug>/` entry any GOOD: title, metadata, blocks (#1794)
      "scripts/check-structure-accessor.ts", // `structure.json` is named only by its accessor (bean rkqp)
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
