#!/usr/bin/env bun
/**
 * Repo partition — Phase 0.2 of the separation-of-concerns migration (#223).
 *
 * Replaces the filename heuristic in `docs/architecture/current-state.md` with
 * a real import-graph partition. Answers two questions:
 *
 *   1. Which modules would land in each of the five proposed repositories?
 *   2. Which import edges cross a proposed boundary IN THE WRONG DIRECTION?
 *
 * Question 2 is the point. That cross-edge list is Phase I's worklist: every
 * entry is a module that must move, a dependency that must invert, or a
 * documented exception.
 *
 * ## Three states, not two
 *
 * A module this tool cannot classify is reported as `unassigned`, never
 * silently bucketed into core. Same discipline as `readme-sections.ts`: "could
 * not determine" is a distinct answer from "determined to be core", and
 * collapsing the two is how a wrong partition looks like a clean one.
 *
 * Every assignment carries its provenance:
 *
 *   - `rule`    — an explicit path rule. Trustworthy.
 *   - `triage`  — a per-file judgement someone made by hand, by the bean
 *                 `dh4f` question: does this read or write PLATFORM, or
 *                 CONTENT? Recorded separately from `rule` so a decision
 *                 stays visible as a decision, and can be revisited without
 *                 first working out which entries were judgements.
 *   - `keyword` — a domain keyword in the path. Probable, worth a human look.
 *   - `default` — fell through to core because nothing else claimed it.
 *                 This is the weakest signal in the report and is counted
 *                 separately so it cannot be mistaken for evidence.
 *
 * Usage:
 *   bun run scripts/repo-partition.ts                 # summary to stdout
 *   bun run scripts/repo-partition.ts --edges         # + every cross-edge
 *   bun run scripts/repo-partition.ts --markdown      # report as Markdown
 *   bun run scripts/repo-partition.ts --repo sci      # one repo's modules
 *   bun run scripts/repo-partition.ts --strict        # exit 1 if cross-edges
 *
 * @module scripts/repo-partition
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, relative, dirname, resolve } from "path";

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
const REPOS: Array<{ id: Repo; name: string }> = [
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
const ALLOWED: Record<Repo, Repo[]> = {
  harness: ["harness"],
  core: ["core", "harness"],
  sci: ["sci", "core", "harness"],
  kg: ["kg", "core", "harness"],
  base: ["base", "kg", "core", "harness"],
  // A test may reach anywhere it needs to; that is what a test is for.
  test: ["test", "base", "kg", "sci", "core", "harness"],
};

// ── Assignment rules, in priority order ─────────────────────────

type Provenance = "rule" | "triage" | "keyword" | "default";

interface Rule {
  repo: Repo;
  /** Marks this rule's assignments as hand-triaged rather than structural. */
  triaged?: boolean;
  /** Path prefixes (repo-relative, forward slashes). */
  prefixes?: string[];
  /** Exact repo-relative paths. */
  exact?: string[];
  /** Case-insensitive regex over the repo-relative path. */
  keyword?: RegExp;
}

/**
 * Ordered. First match wins, so explicit path rules must precede keyword
 * rules — otherwise `src/tools/workflow.ts` is claimed by the BPMN keyword
 * before the harness rule can claim it.
 */
const RULES: Rule[] = [
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
      "scripts/render-bpmn.ts",              // BPMN → SVG (the skills/workflows one)
      "scripts/generate-registry.ts",        // scans skills/ → SkillRegistry
      "scripts/gen-skill-docs.ts",           // skill instruction bodies → docs
      "scripts/validate-skills.ts",          // skill package manifests
      "scripts/init-folio.ts",               // runs BEFORE a content type exists
      "scripts/repo-partition.ts",           // this tool; platform meta
      "scripts/check-workflow-refs.ts",      // every BPMN folio:skill ref resolves
      "scripts/eval-crdm-detect.ts",         // measures the crdm-detect signals
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
      "scripts/harness-schema-export.ts",    // the declaration's JSON Schema, at its `$id`
      "scripts/staging-stamp.ts",            // which BUILD wrote an artefact — CI identity, no folio
      "scripts/qa-results.ts",               // a QA process's findings about a PRODUCED artefact; `qa` is a base graph kind
      "scripts/sync-docs-harness.ts",        // the declaration's title/mark → the docs data file
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
      "scripts/ensure-landing-sticky.ts",    // creates folio/ and mints its landing stickies
      // Same repo and the same reason: it reads the folio graph's sticky nodes
      // and writes the data file the landing page renders from. It was part of
      // `sync-docs-harness.ts` (agentic-harness) until `--edges` reported that
      // as two wrong-direction edges — the harness reaching up into core.
      "scripts/gen-landing-data.ts",         // folio stickies -> docs/_data/stickies.json
      "scripts/generate-schemas.ts",         // Zod → JSON Schema
      "scripts/generate-schema-manifest.ts", // schemas/types.ts → viewer manifest
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
      "scripts/check-agents-xref.ts",
      "scripts/check-bean-parents.ts",
      "scripts/check-declared-paths.ts",
      "scripts/claim-bean.ts",
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
      "scripts/serve-rendering.ts",
      "scripts/staging-cleanup-preflight.ts",
      "src/tools/check-deps.ts",
      "src/tools/capabilities.ts",
      "src/tools/skill-fetch.ts",
      "src/tools/preferences.ts",
      "src/tools/beans-prime.ts",
      "src/tools/workflow.ts",
      "src/tools/folio-init.ts",
      "schemas/assistant-package.ts",
      "schemas/assistant-types.ts",
      "schemas/assistant-workflow.ts",
      // The CatHarness root declaration is harness-layer by concept even
      // though it sits in schemas/. It declares its own HARNESS_NS rather than
      // importing the content vocabulary, so classifying it here adds no
      // wrong-direction edge — see schemas/cat-harness.ts.
      "schemas/cat-harness.ts",
      // Roles, actors and the KG audit sidecar are harness-layer for the same
      // reason and on the same terms: `role-graph.ts` imports only
      // `namespaces.ts`, `kg-qa.ts` imports only zod. Neither touches the
      // content vocabulary, so classifying them here adds no wrong-direction
      // edge — and leaving them unclassified would have made `src/workflow/`
      // and `src/tools/workflow.ts` read as harness → core.
      "schemas/role-graph.ts",
      "schemas/kg-qa.ts",
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
      "scripts/kg-audit.ts",
      "scripts/known-skills.ts",
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
      "scripts/check-declared-assets.ts",   // the instance declaration
      "scripts/check-fallback-roles.ts",    // reads role-graph
      "scripts/check-instance-render.ts",   // can an instance render its own graph
      "scripts/check-kind-validators.ts",   // graph kinds and their validators
      "scripts/check-python-deps.ts",       // the repo's own toolchain
      "scripts/check-workflow-paths.ts",    // every workflow script path resolves (bean `52dz`)
      "scripts/gates.ts",                   // the gate runner itself
      "scripts/gen-avatars-css.ts",         // generated from the avatar nodes
      "scripts/gen-bootstrap-graph.ts",     // writes bootstrap/bootstrap.jsonld
      "scripts/gen-python-deps.ts",         // writes requirements.txt
      "scripts/kg-validate.ts",             // one Tool, parameterised by graph kind
      "scripts/repo-files.ts",              // enumerates files the way a GATE needs
      "scripts/strip-preview-seo.ts",       // the preview site build
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
    keyword: /(^|[/-])(dak|fhir|fsh|ocl|l2|l3|smart|who|ig)([/.-]|$)/i,
  },

  // ── folio-assist-core: the generic document model and its pipeline
  {
    repo: "core",
    // declared-path-literal: the TARGET layout of the five-repo split, which no
    // declaration in THIS repo describes — that is the whole point of the plan.
    prefixes: ["adapters/mcp-server/", "adapters/document/", "src/blocks/", "scripts/translation/", "skills/folio-core/", "skills/folio-document-adapter/", "skills/authoring-document/", "skills/content-lifecycle/", "content/pipeline/", "schemas/", "ui/", "viewer/", "blueprint/", "translations/"],
    exact: [
      "src/tools/readme-sync.ts", "src/tools/readme-audit.ts", "src/tools/translation.ts",
      "src/tools/preview.ts", "src/qa-agent-write.ts",
      // The voice-graph validator. It resolves each rule's citation into
      // `library/` — a FOLIO's reference library — and `schemas/voices.ts`,
      // which it reads, is core by the `schemas/` prefix. Arrived from `main`
      // and fell through every prefix.
      "scripts/check-voices.ts",
      // Reads `schemas/todo.ts` and `schemas/todo-graph.ts` and nothing else,
      // and its only consumer is `scripts/gen-docs-pages.ts`, which is core.
      // A script is not automatically tooling-side: this one operates
      // exclusively on core data for a core caller, and calling it harness
      // bought two wrong-direction edges for nothing.
      "scripts/todos.ts",
      // Three of the 19 unassigned that are CONTENT-side, by the same test
      // read the other way: each operates on a folio's own material, not on
      // the machinery that runs a process. Classifying them harness alongside
      // their sixteen siblings would have reached into `schemas/narrative.ts`,
      // `schemas/attribution.ts`, `schemas/archive-contents.ts` and
      // `schemas/tabular-records.ts` — all core — and bought four
      // wrong-direction edges for the tidiness of one homogeneous list.
      "scripts/check-l1-complete.ts",       // is a `library/<bib-slug>/` entry complete
      "scripts/ingest-document.ts",         // `uploads/` → `library/<bib-slug>/`
      "scripts/narratives.ts",              // the narrative review queue
      // Same test, same answer: it reads `library/<bib-slug>/images.json`,
      // which is a folio's own material, and imports `schemas/attribution.ts`
      // and `schemas/document-image.ts` — the latter reaching `narrative.ts`
      // in turn. Every one of those is core, so classifying it harness would
      // buy three wrong-direction edges for the tidiness of one list.
      "scripts/apply-image-verdicts.ts",    // agent verdicts → images.json
    ],
  },
];

// ── Module discovery ────────────────────────────────────────────

const ROOT = resolve(import.meta.dir, "..");

/** Directories scanned for TypeScript modules. */
// `"test"`, not `"tests"`: the two test trees were consolidated onto `test/`
// on 2026-09-19 (bean `auap`). A scan root that names a directory which no
// longer exists is not an error here — `walkTs` returns early on a missing
// dir — so this would have gone on partitioning the repo while silently
// seeing none of the e2e specs or the health sweep.
const SCAN_ROOTS = ["src", "schemas", "adapters", "content", "scripts", "test", "types"];

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "beans", "docs"]);

function walkTs(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue; // broken symlink
    }
    if (st.isDirectory()) walkTs(full, out);
    else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

// ── Classification ──────────────────────────────────────────────

export interface Assignment {
  repo: Repo | "unassigned";
  provenance: Provenance;
}

export function classify(relPath: string): Assignment {
  for (const rule of RULES) {
    const explicit: Provenance = rule.triaged ? "triage" : "rule";
    if (rule.exact?.includes(relPath)) return { repo: rule.repo, provenance: explicit };
    if (rule.prefixes?.some((p) => relPath.startsWith(p))) return { repo: rule.repo, provenance: explicit };
    if (rule.keyword?.test(relPath)) return { repo: rule.repo, provenance: "keyword" };
  }
  // Nothing claimed it. `scripts/` and stray `src/` modules land here; they
  // are NOT silently called core — that judgement is a human's to make.
  return { repo: "unassigned", provenance: "default" };
}

// ── Import extraction ───────────────────────────────────────────

/**
 * Static and dynamic import specifiers. Deliberately regex-based rather than
 * a full parse: we need the edge set, not a type-checked AST, and a missed
 * exotic form is a false negative we can live with — it understates the
 * cross-edge count, which is the safe direction for a worklist.
 */
const IMPORT_RE = /(?:^|\n)\s*(?:import|export)[\s\S]{0,400}?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

function extractSpecifiers(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2];
    if (spec) out.push(spec);
  }
  return out;
}

/**
 * Resolve a relative specifier to a repo-relative module path.
 *
 * This codebase writes all three forms — bare (`./qa-utils`), `.js` for
 * TypeScript files (`./core/git.js`, the NodeNext convention), and directory
 * imports — so every candidate is tried before giving up.
 */
function resolveSpecifier(fromFile: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null; // package import, not ours
  const base = resolve(dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    base.replace(/\.js$/, ".ts"),
    join(base, "index.ts"),
    `${base.replace(/\.js$/, "")}/index.ts`,
  ];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return relative(ROOT, c).replace(/\\/g, "/");
  }
  return null;
}

// ── Analysis ────────────────────────────────────────────────────

export interface CrossEdge {
  from: string;
  fromRepo: Repo;
  to: string;
  toRepo: Repo;
}

export interface PartitionReport {
  modules: Map<string, Assignment>;
  crossEdges: CrossEdge[];
  /** Edges whose target this tool could not classify. */
  unresolvedEdges: Array<{ from: string; to: string }>;
  totalEdges: number;
}

export function analyse(): PartitionReport {
  const files: string[] = [];
  for (const r of SCAN_ROOTS) walkTs(join(ROOT, r), files);

  const modules = new Map<string, Assignment>();
  for (const f of files) modules.set(relative(ROOT, f).replace(/\\/g, "/"), classify(relative(ROOT, f).replace(/\\/g, "/")));

  const crossEdges: CrossEdge[] = [];
  const unresolvedEdges: Array<{ from: string; to: string }> = [];
  let totalEdges = 0;

  for (const f of files) {
    const rel = relative(ROOT, f).replace(/\\/g, "/");
    const fromA = modules.get(rel)!;
    let src: string;
    try {
      src = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    for (const spec of extractSpecifiers(src)) {
      const target = resolveSpecifier(f, spec);
      if (!target) continue;
      totalEdges++;
      const toA = modules.get(target);
      if (!toA) continue;
      if (fromA.repo === "unassigned" || toA.repo === "unassigned") {
        unresolvedEdges.push({ from: rel, to: target });
        continue;
      }
      if (!ALLOWED[fromA.repo].includes(toA.repo)) {
        crossEdges.push({ from: rel, fromRepo: fromA.repo, to: target, toRepo: toA.repo });
      }
    }
  }

  return { modules, crossEdges, unresolvedEdges, totalEdges };
}

// ── Reporting ───────────────────────────────────────────────────

function repoName(id: Repo | "unassigned"): string {
  return REPOS.find((r) => r.id === id)?.name ?? "unassigned";
}

function main(): void {
  const args = process.argv.slice(2);
  const wantEdges = args.includes("--edges");
  const markdown = args.includes("--markdown");
  const strict = args.includes("--strict");
  const only = args[args.indexOf("--repo") + 1];

  const { modules, crossEdges, unresolvedEdges, totalEdges } = analyse();

  if (modules.size === 0) {
    console.error("repo-partition: scanned 0 modules — wrong root, or the tree moved.");
    process.exit(2);
  }

  if (only && args.includes("--repo")) {
    for (const [path, a] of [...modules].sort()) {
      if (a.repo === only) console.log(`${a.provenance.padEnd(8)} ${path}`);
    }
    return;
  }

  const H = markdown ? "## " : "";
  const counts = new Map<string, Record<Provenance, number>>();
  for (const [, a] of modules) {
    const key = a.repo;
    const c = counts.get(key) ?? { rule: 0, triage: 0, keyword: 0, default: 0 };
    c[a.provenance]++;
    counts.set(key, c);
  }

  console.log(`${H}Partition — ${modules.size} modules, ${totalEdges} internal import edges\n`);
  if (markdown) console.log("| repo | modules | by rule | hand-triaged | by keyword | fell through |\n|---|---:|---:|---:|---:|---:|");
  for (const id of [...REPOS.map((r) => r.id), "unassigned" as const]) {
    const c = counts.get(id) ?? { rule: 0, triage: 0, keyword: 0, default: 0 };
    const total = c.rule + c.triage + c.keyword + c.default;
    if (markdown) console.log(`| \`${repoName(id)}\` | ${total} | ${c.rule} | ${c.triage} | ${c.keyword} | ${c.default} |`);
    else console.log(`  ${repoName(id).padEnd(20)} ${String(total).padStart(4)}  (rule ${c.rule}, triage ${c.triage}, keyword ${c.keyword}, unclaimed ${c.default})`);
  }

  console.log(`\n${H}Wrong-direction edges: ${crossEdges.length}\n`);
  if (crossEdges.length > 0) {
    const byPair = new Map<string, CrossEdge[]>();
    for (const e of crossEdges) {
      const k = `${e.fromRepo}->${e.toRepo}`;
      byPair.set(k, [...(byPair.get(k) ?? []), e]);
    }
    if (markdown) console.log("| importer repo | imports from | edges |\n|---|---|---:|");
    for (const [pair, es] of [...byPair].sort((a, b) => b[1].length - a[1].length)) {
      const [f, t] = pair.split("->") as [Repo, Repo];
      if (markdown) console.log(`| \`${repoName(f)}\` | \`${repoName(t)}\` | ${es.length} |`);
      else console.log(`  ${repoName(f)} → ${repoName(t)}: ${es.length}`);
    }
    if (wantEdges) {
      const un = [...new Set(unresolvedEdges.flatMap((e) => [e.from, e.to]))]
        .filter((m) => modules.get(m)?.repo === "unassigned")
        .sort();
      if (un.length) console.log(`\n${markdown ? "### " : ""}Unassigned modules\n${un.map((m) => `  ${m}`).join("\n")}`);
      console.log(`\n${markdown ? "### " : ""}Every wrong-direction edge\n`);
      for (const e of crossEdges.sort((a, b) => a.from.localeCompare(b.from))) {
        console.log(`${markdown ? "- " : "  "}\`${e.from}\` (${repoName(e.fromRepo)}) → \`${e.to}\` (${repoName(e.toRepo)})`);
      }
    }
  }

  console.log(`\n${H}Edges touching an unassigned module: ${unresolvedEdges.length}`);
  console.log("These are not cross-edges — they are edges this tool declined to judge.");
  console.log("Classify the endpoints, then re-run; do not read them as clean.");

  // ── What this gate ENFORCES. Both axes, as of 2026-09-20.
  //
  // `check:partition` ran in CI WITHOUT `--strict`, so its only failing path
  // was one nothing invoked: it reported 8 wrong-direction edges and exited 0
  // while the board read 43/43, and three of those edges had been introduced
  // that morning. A gate that CANNOT fail is indistinguishable, from the
  // outside, from one that passed — bean `xom7`, one level up from the
  // workflow it was written about.
  //
  // The repository's precedent for switching a reporter into an enforcer is
  // the ruff comment in `code-quality-gates.yml`: **a check is an error only
  // once its count is zero.** Turning a red gate on just teaches the next
  // agent to append `|| true`.
  //
  // So it was applied per axis as each reached zero. Unassigned reached zero
  // first (bean `4j3h`) and was enforced then; the comment there said to
  // delete the distinction once the edges followed. They have — `jcmx`
  // retired the last one, `src/types.ts -> schemas/types.ts`, by declaring
  // the structural minimum a harness signature needs instead of importing
  // the content model. Both axes are now zero and both are enforced.
  //
  // `--strict` is kept as an accepted no-op so existing invocations do not
  // break; there is no longer a laxer mode for it to select.
  const unassigned = [...modules].filter(([, a]) => a.repo === "unassigned").map(([m]) => m);
  let failed = false;
  if (unassigned.length > 0) {
    failed = true;
    console.error(`\n\u2717 ${unassigned.length} module(s) fell through every rule:`);
    for (const m of unassigned.sort()) console.error(`    ${m}`);
    console.error("    Classify each in REPO_RULES. An unassigned module is not a clean result.");
  }
  if (crossEdges.length > 0) {
    failed = true;
    console.error(`\n\u2717 ${crossEdges.length} wrong-direction edge(s):`);
    for (const e of crossEdges) {
      console.error(`    ${e.from} [${repoName(e.fromRepo)}] -> ${e.to} [${repoName(e.toRepo)}]`);
    }
    console.error(
      "    A repo may not import one that depends on it. Either the CLASSIFICATION is wrong —" +
        "\n    check the target's layer before the importer's — or the import is.",
    );
  }
  if (failed) process.exit(1);
  void strict;
}

if (import.meta.main) main();
