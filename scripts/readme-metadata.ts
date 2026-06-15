#!/usr/bin/env bun
/**
 * readme-metadata.ts — Extracts project metadata for README generation.
 *
 * Outputs JSON with papers, chapters, lean modules, simulators, and workflows.
 * Used by scripts/generate-readme.sh to avoid GNU-specific shell tools.
 */

import { readdir, stat, readFile } from "fs/promises";
import { join, basename } from "path";

const root = join(import.meta.dir, "..");

// ── Papers ──────────────────────────────────────────────────────────────────

interface PaperInfo { title: string; dir: string; abstract?: string }

async function getPapers(): Promise<PaperInfo[]> {
  // Authoritative paper order comes from content/folio.ts (paperRef calls
  // in source order). Falling back to readdir was non-deterministic — the
  // OS returns directory entries in arbitrary order, so README.md churned
  // on every regenerate. The folio manifest is the canonical source.
  const contentDir = join(root, "content");
  const folioPath = join(contentDir, "folio.ts");
  const folioSrc = await readFile(folioPath, "utf-8");
  // Match `paperRef({ dir: "..." })` in source order.
  const orderedDirs = [
    ...folioSrc.matchAll(/paperRef\(\s*\{[^}]*?dir:\s*["']([^"']+)["']/gs),
  ].map(m => m[1]);

  const papers: PaperInfo[] = [];
  for (const dir of orderedDirs) {
    const manifest = join(contentDir, dir, `${dir}.ts`);
    try {
      await stat(manifest);
    } catch { continue; }
    const src = await readFile(manifest, "utf-8");
    // Backreferenced quote: an apostrophe inside a double-quoted title
    // (e.g. `title: "Bring's Surface"`) must not terminate the match.
    const titleMatch = src.match(/title:\s*("|')((?:\\.|(?!\1).)*)\1/);
    const abstractMatch = src.match(/abstract:\s*\n?\s*("|')((?:\\.|(?!\1).)*)\1/);
    papers.push({
      title: titleMatch?.[2] ?? dir,
      dir,
      abstract: abstractMatch?.[2],
    });
  }
  return papers;
}

// ── Chapters (from paper manifest, preserving authored order) ───────────────

interface ChapterInfo { dir: string; title: string; kind: "chapter" | "appendix" | "index" }

async function getChapters(): Promise<ChapterInfo[]> {
  const manifest = join(root, "content/quantum-observable-universe/quantum-observable-universe.ts");
  const src = await readFile(manifest, "utf-8");
  // Extract dir values from chapterRef({ dir: "..." }) in order
  const dirs = [...src.matchAll(/chapterRef\(\{\s*dir:\s*["']([^"']+)["']/g)].map(m => m[1]);

  const chapters: ChapterInfo[] = [];
  for (const dir of dirs) {
    const chapterTs = join(root, "content/quantum-observable-universe", dir, `${dir}.ts`);
    let title = dir;
    try {
      const chSrc = await readFile(chapterTs, "utf-8");
      const m = chSrc.match(/title:\s*("|')((?:\\.|(?!\1).)*)\1/);
      if (m) title = m[2];
    } catch {}

    const kind = dir.startsWith("appendix-") ? "appendix"
               : dir.startsWith("index-") ? "index"
               : "chapter";
    chapters.push({ dir, title, kind });
  }
  return chapters;
}

// ── Lean modules ────────────────────────────────────────────────────────────

interface LeanModule { name: string; source: string; fileCount?: number }

async function getLeanModules(): Promise<LeanModule[]> {
  const qouDir = join(root, "content/quantum-observable-universe/lean/QOU");
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
    const s = computeStats("quantum-observable-universe");
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
