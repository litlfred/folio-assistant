#!/usr/bin/env bun
/**
 * readme-metadata.ts — Extracts project metadata for README generation.
 *
 * Outputs JSON with papers, chapters, lean modules, simulators, and workflows.
 * Used by scripts/generate-readme.sh to avoid GNU-specific shell tools.
 */

import { readdir, readFile } from "fs/promises";
import { join, basename } from "path";

// The FOLIO's root. `join(import.meta.dir, "..")` is the PLATFORM's, which
// holds no `content/folio.ts`, no papers and no `.github/workflows` for a
// folio — every path below was resolving into the wrong repo. The
// `folio-assistant/simulators` path below stays folio-relative on purpose:
// the folio embeds the platform there as a symlink.
const root = findContentRepoRoot();

// ── Papers ──────────────────────────────────────────────────────────────────

interface PaperInfo { title: string; dir: string; abstract?: string }

/**
 * The folio's papers, in authored order, with abstracts.
 *
 * Discovery (folio.ts order, manifest titles) is `readme-toc.ts`'s — it is
 * the same question the contents table asks, and two regex copies of it drift.
 * Only the abstract, which no table shows, is read here.
 */
async function getPapers(): Promise<PaperInfo[]> {
  const contentDir = join(root, "content");
  return Promise.all(
    discoverPapers(root).map(async (p) => {
      let abstract: string | undefined;
      try {
        const src = await readFile(join(contentDir, p.dir, `${p.dir}.ts`), "utf-8");
        abstract = src.match(/abstract:\s*\n?\s*("|')((?:\\.|(?!\1).)*)\1/)?.[2];
      } catch { /* a paper without an abstract is not an error */ }
      return { title: p.title, dir: p.dir, abstract };
    }),
  );
}

// ── Chapters (from paper manifest, preserving authored order) ───────────────

interface ChapterInfo { dir: string; title: string; kind: "chapter" | "appendix" | "index" }

async function getChapters(): Promise<ChapterInfo[]> {
  const { paper } = statsTarget();
  return chaptersOf(root, paper);
}

// ── Lean modules ────────────────────────────────────────────────────────────

interface LeanModule { name: string; source: string; fileCount?: number }

async function getLeanModules(): Promise<LeanModule[]> {
  const { paper } = statsTarget();
  // The Lean library directory, from the registered Lake packages, rather than
  // one folio's `QOU` namespace baked into a platform script.
  const pkg = LEAN_PACKAGES.find((k) => k.lakeRoot.includes(`/${paper}/`) || k.lakeRoot.includes(paper));
  const qouDir = pkg
    ? join(root, pkg.lakeRoot, pkg.lib)
    : join(root, "content", paper, "lean");
  const modules: LeanModule[] = [];

  try {
    const entries = await readdir(qouDir, { withFileTypes: true });

    // Top-level .lean files
    for (const e of entries.filter(e => e.isFile() && e.name.endsWith(".lean")).sort((a, b) => a.name.localeCompare(b.name))) {
      modules.push({ name: `QOU.${basename(e.name, ".lean")}`, source: e.name });
    }

    // Subdirectories
    for (const e of entries.filter(e => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      const subFiles = await readdir(join(qouDir, e.name));
      const count = subFiles.filter(f => f.endsWith(".lean")).length;
      modules.push({ name: `QOU.${e.name}.*`, source: `${count} files`, fileCount: count });
    }
  } catch {}

  return modules;
}

// ── Simulators ──────────────────────────────────────────────────────────────

interface SimInfo { name: string; file: string }

async function getSimulators(): Promise<SimInfo[]> {
  const simDir = join(root, "folio-assistant/simulators");
  const sims: SimInfo[] = [];
  try {
    const entries = await readdir(simDir);
    for (const f of entries.filter(f => f.endsWith(".html")).sort()) {
      const raw = basename(f, ".html");
      // Title-case: split on underscores, capitalize each word
      const pretty = raw.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      sims.push({ name: pretty, file: `simulators/${raw}.html` });
    }
  } catch {}
  return sims;
}

// ── Workflows ───────────────────────────────────────────────────────────────

interface WorkflowInfo { file: string; description: string }

const WORKFLOW_DESCRIPTIONS: Record<string, string> = {
  "lean_ci.yml": "Lean build, proof status, axiom report, doc generation",
  "publish.yml": "Full paper build — PDF, HTML, viewer, schema docs, deploy to gh-pages",
  "blueprint.yml": "Blueprint compilation, dependency graph, doc-gen4",
  "lean-build.yml": "Lean build and proof status updates",
  "deploy-folio.yml": "Deploy Folio Assistant to remote server",
  "build-lean-mcp.yml": "Build Lean MCP Docker image",
  "build-latex-image.yml": "Build LaTeX CI Docker image",
  "docker-ci-image.yml": "Build general CI Docker image",
  "agent-review.yml": "AI-assisted code review",
  "release-folio-assistant.yml": "Release Folio Assistant package",
  "snappea_wasm.yml": "SnapPea WASM build and test",
  "sync-skills.yml": "Sync external skill packages",
};

async function getWorkflows(): Promise<WorkflowInfo[]> {
  const wfDir = join(root, ".github/workflows");
  const workflows: WorkflowInfo[] = [];
  try {
    const entries = await readdir(wfDir);
    for (const f of entries.filter(f => f.endsWith(".yml")).sort()) {
      let desc = WORKFLOW_DESCRIPTIONS[f];
      if (!desc) {
        // Extract name: from YAML
        try {
          const src = await readFile(join(wfDir, f), "utf-8");
          const m = src.match(/^name:\s*(.+)$/m);
          desc = m?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
        } catch { desc = ""; }
      }
      workflows.push({ file: f, description: desc });
    }
  } catch {}
  return workflows;
}

// ── Lean coverage stats ─────────────────────────────────────────────────────

import { computeStats } from "./lean-coverage";
import { findContentRepoRoot, findPapers, soleFolioPaper } from "../content/pipeline/repo-root";
import { chaptersOf, discoverPapers } from "../content/pipeline/readme-toc";
import { LEAN_PACKAGES } from "../schemas/lean-packages";

/**
 * The paper to report on, and the folio's `content/` root.
 *
 * Both were wrong: `computeStats(paperDir, contentRoot)` takes two arguments
 * and was called with one — so `contentRoot` was `undefined` at runtime — and
 * the paper was hardcoded to `quantum-observable-universe`, one folio's paper
 * name living in the platform. `--paper` wins; otherwise take the folio's sole
 * paper and refuse to guess when there are several.
 */
function statsTarget(): { paper: string; contentRoot: string } {
  const repoRoot = findContentRepoRoot();
  const contentRoot = join(repoRoot, "content");
  const argIdx = process.argv.indexOf("--paper");
  const paper = argIdx >= 0 && process.argv[argIdx + 1]
    ? process.argv[argIdx + 1]
    : soleFolioPaper(repoRoot);
  if (!paper) {
    // Exit cleanly rather than throwing: this is a CLI entry point, and a raw
    // stack trace buries the one line that tells the operator what to do.
    // Matches `export-json.ts` and `validate.ts`.
    const found = findPapers(repoRoot);
    console.error(
      found.length === 0
        ? `no paper found under ${contentRoot} — run from a folio checkout, or pass --paper`
        : `this folio has ${found.length} papers (${found.join(", ")}) — pass --paper to choose one`,
    );
    process.exit(2);
  }
  return { paper, contentRoot };
}


interface LeanCoverage {
  provable_total: number;
  provable_with_lean: number;
  provable_sorry_free: number;
  provable_percent: number;
  conjectures_total: number;
  conjectures_with_lean: number;
  conjectures_class_axiomatized: number;
  conjectures_percent: number;
  definitions_total: number;
  definitions_with_lean: number;
}

async function getLeanCoverage(): Promise<LeanCoverage | null> {
  try {
    const target = statsTarget();
    const s = computeStats(target.paper, target.contentRoot);
    return {
      provable_total: s.provable.total,
      provable_with_lean: s.provable.with_lean_file,
      provable_sorry_free: s.provable.sorry_free,
      provable_percent: s.provable.percent_sorry_free,
      conjectures_total: s.conjectures.total,
      conjectures_with_lean: s.conjectures.with_lean_file,
      conjectures_class_axiomatized: s.conjectures.class_axiomatized,
      conjectures_percent: s.conjectures.percent_class_axiomatized,
      definitions_total: s.definitions.total,
      definitions_with_lean: s.definitions.with_lean_file,
    };
  } catch {
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

const [papers, chapters, leanModules, simulators, workflows, leanCoverage] = await Promise.all([
  getPapers(),
  getChapters(),
  getLeanModules(),
  getSimulators(),
  getWorkflows(),
  getLeanCoverage(),
]);

console.log(JSON.stringify({ papers, chapters, leanModules, simulators, workflows, leanCoverage }, null, 2));
