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
  {
    repo: "test",
    prefixes: ["tests/", "scripts/tests/"],
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
      "scripts/check-corpus-gate.ts",        // editing-process authorisation gate
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
      "scripts/sync-docs-harness.ts",        // the declaration's title/mark → the docs data file
      "scripts/check-workflows.ts",          // YAML GitHub will actually parse

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
      // The composition root's own inventory of which content adapters this
      // instance ships. `src/` is claimed by subdirectory, so a new file at
      // its top level falls through — reported `unassigned`, which is the
      // tool working: it declined to guess rather than defaulting.
      "src/builtin-adapters.ts",
      // Two scripts that arrived from `main` and fell through every prefix.
      // Both are harness tooling about the KG's own artefacts, not about any
      // folio's content: one introspects which Tools this instance's MCP
      // server actually serves, the other refuses a `.bpmn`/`.dmn` whose
      // comments are not well-formed XML.
      "scripts/capture-mcp-tools.ts",
      "scripts/xml-comment-check.ts",

      // `adapters/mcp-server/` was claimed wholesale by the harness prefix
      // rule, but `server.ts` opens "QOU Paper Writing Assistant — MCP
      // Server" and offers PDF rendering, content validation, a Lean LSP
      // proxy and a content viewer. That is a CONTENT server, so the
      // directory is core (below) and only the genuinely harness-level
      // pieces stay here.
      "adapters/mcp-server/tools/check-deps.ts",  // what is installed on this machine
    ],
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
      "adapters/manifest-entries.ts",        // reads author-written manifests
      "scripts/gen-docs-pages.ts",           // webpage manifest → docs/<slug>.md
      "scripts/gen-jsonld-context.ts",       // from schemas/jsonld.ts
      "scripts/gen-schema-docs.ts",          // content-object model → reference
      "scripts/generate-docs.ts",            // schema documentation
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
  {
    repo: "harness",
    exact: [
      "src/server.ts",
      "src/index.ts",
      "src/types.ts",
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
    ],
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

  // ── folio-asst-sci: Lean, LaTeX, simulators, proofs
  {
    repo: "sci",
    prefixes: ["adapters/paper/", "skills/authoring-math/", "skills/folio-paper-adapter/", "simulators/", "computations/", "latex/", "scripts/render-tex/", "scripts/docker-latex-build/", "scripts/knot-plots/"],
    exact: ["schemas/formalization-types.ts", "schemas/precision-scalar.ts", "schemas/refactor-strategy.ts"],
  },
  {
    repo: "sci",
    keyword: /(^|[/-])(lean|latex|tex|proof|witness|simulator|sage|formaliz|knot)([/.-]|$)/i,
  },

  // ── smart-base: WHO L2-L3, DAK, FHIR, OCL
  {
    repo: "base",
    prefixes: ["skills/authoring-who-smart-guidelines/"],
    exact: ["schemas/dak-blocks.ts"],
  },
  {
    repo: "base",
    keyword: /(^|[/-])(dak|fhir|fsh|ocl|l2|l3|smart|who|ig)([/.-]|$)/i,
  },

  // ── folio-assist-core: the generic document model and its pipeline
  {
    repo: "core",
    prefixes: ["adapters/mcp-server/", "adapters/document/", "src/blocks/", "scripts/translation/", "skills/folio-core/", "skills/folio-document-adapter/", "skills/authoring-document/", "skills/content-lifecycle/", "content/pipeline/", "schemas/", "ui/", "viewer/", "blueprint/", "translations/"],
    exact: ["src/tools/readme-sync.ts", "src/tools/readme-audit.ts", "src/tools/translation.ts", "src/tools/preview.ts", "src/qa-agent-write.ts"],
  },
];

// ── Module discovery ────────────────────────────────────────────

const ROOT = resolve(import.meta.dir, "..");

/** Directories scanned for TypeScript modules. */
const SCAN_ROOTS = ["src", "schemas", "adapters", "content", "scripts", "tests", "types"];

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
      console.log(`\n${markdown ? "### " : ""}Every wrong-direction edge\n`);
      for (const e of crossEdges.sort((a, b) => a.from.localeCompare(b.from))) {
        console.log(`${markdown ? "- " : "  "}\`${e.from}\` (${repoName(e.fromRepo)}) → \`${e.to}\` (${repoName(e.toRepo)})`);
      }
    }
  }

  console.log(`\n${H}Edges touching an unassigned module: ${unresolvedEdges.length}`);
  console.log("These are not cross-edges — they are edges this tool declined to judge.");
  console.log("Classify the endpoints, then re-run; do not read them as clean.");

  if (strict && crossEdges.length > 0) process.exit(1);
}

if (import.meta.main) main();
