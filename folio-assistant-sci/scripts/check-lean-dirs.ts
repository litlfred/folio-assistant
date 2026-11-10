#!/usr/bin/env bun
/**
 * check-lean-dirs.ts — every declared `lean` directory holds what its kind
 * says it holds, and nothing in it is an orphan.
 *
 * The `lean` kind (typologies/lean.json) arrived with this instance's `lean/`
 * directory (owner, 2026-10-10) and read `unaudited` in `audit:coverage` the
 * day it reached an index (folio-assistant#2529): files, and nothing judging
 * them. The kind holds one of two things, and each is judged by what makes it
 * usable:
 *
 * - **templates** (`*.tmpl`, what this harness's Lean tooling fills): each is
 *   READ by a module of the instance that declares it, found by its file name
 *   in that instance's code. A template nothing reads is dead weight that
 *   still looks like the source of a formal check.
 * - **a Lake package** (a folio's formalisation): it has its `lakefile.lean`
 *   or `lakefile.toml` and its `lean-toolchain`, without which `lake` cannot
 *   build it and doc-gen4 cannot render it. Whether the package BUILDS is the
 *   Lean build's question, not this gate's.
 *
 * Every `lean` directory also carries a README.md saying which of the two it
 * is — the kind is declared for both, and a reader cannot tell them apart from
 * the path.
 *
 *   bun run folio-assistant-sci/scripts/check-lean-dirs.ts
 *
 * Exit: 0 consistent, 1 a finding, 2 a declared directory is absent.
 *
 * @module folio-assistant-sci/scripts/check-lean-dirs
 * @covers lean
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { directoriesForGraph } from "@litlfred/cat-harness-tools/schemas/kg/cat-harness.ts";
import { instanceRootsIn, repoRootFor } from "@litlfred/cat-harness-tools/schemas/kg/instance-roots.ts";

const CODE = /\.(?:m?[jt]s)$/;
const SKIP = new Set(["node_modules", ".git", ".lake", "docs", "test", "translations"]);

/** Every code file under `root`, outside generated and vendored trees. */
function codeFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const n of readdirSync(d)) {
      if (SKIP.has(n)) continue;
      const p = join(d, n);
      const s = statSync(p);
      if (s.isDirectory()) walk(p);
      else if (CODE.test(n)) out.push(p);
    }
  };
  walk(root);
  return out;
}

/**
 * Findings about one `lean` directory of the instance at `inst`. `sources`
 * yields the TEXT of that instance's code, read only when a template needs it.
 */
export function judgeLeanDir(dir: string, inst: string, sources: () => string[]): string[] {
  const out: string[] = [];
  const names = readdirSync(dir);
  if (!names.includes("README.md")) out.push("no README.md saying whether it holds templates or a Lake package");
  const isPackage = names.includes("lakefile.lean") || names.includes("lakefile.toml");
  if (isPackage && !names.includes("lean-toolchain")) out.push("a Lake package with no lean-toolchain");
  const templates = names.filter((n) => n.endsWith(".tmpl"));
  if (!isPackage && templates.length === 0) out.push("neither a Lake package (no lakefile) nor any template (*.tmpl)");
  if (templates.length > 0) {
    const texts = sources();
    for (const t of templates) {
      if (!texts.some((s) => s.includes(t))) out.push(`template ${t} is read by no module of ${basename(inst)}`);
    }
  }
  return out;
}

function main(): number {
  const repo = repoRootFor(resolve(import.meta.dir, ".."));
  let judged = 0;
  let findings = 0;
  for (const inst of instanceRootsIn(repo)) {
    let cache: string[] | undefined;
    const code = () => (cache ??= codeFiles(inst).map((f) => readFileSync(f, "utf-8")));
    for (const dir of directoriesForGraph(inst, "lean")) {
      const rel = relative(repo, dir) || ".";
      if (!existsSync(dir)) {
        console.error(`✗ ${rel}: declared, and absent from this checkout`);
        return 2;
      }
      judged++;
      const f = judgeLeanDir(dir, inst, code);
      if (f.length === 0) console.log(`✓ ${rel}`);
      for (const x of f) console.error(`✗ ${rel}: ${x}`);
      findings += f.length;
    }
  }
  if (judged === 0) {
    console.log("check:lean-dirs — no instance here declares a lean directory; nothing to judge.");
    return 0;
  }
  console.log(`check:lean-dirs — ${judged} lean director(y/ies) judged, ${findings} finding(s).`);
  return findings > 0 ? 1 : 0;
}

if (import.meta.main) process.exit(main());
