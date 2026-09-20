#!/usr/bin/env bun
/**
 * A folder corresponds to a subgraph, and subgraphs should be disconnected.
 *
 * Bean `x4v4`. The owner, 2026-09-20: *"`cat-harness/methodologies/` is a
 * subgraph. should be disconnected. convention folder corresponds to subgraph
 * (but may be in process of being disentangled). use schema
 * declaration/definition."*
 *
 * The declaration half lives in `schemas/cat-harness.ts` — `subgraphTree` and
 * `owningDirectory`, both DERIVED from the paths already declared rather than
 * restated, with the reasoning on those functions. This is the other half:
 * measuring how far the corpus is from the intent.
 *
 * ## Why this REPORTS and does not gate
 *
 * Because the intent is not met and the owner said so in the same sentence.
 * Measured 2026-09-20, CRDM's skills reference seven skills in `folio-core`.
 * A gate failing on seven edges nobody has decided about is the *"a check that
 * cries wolf is a check somebody switches off"* failure `known-skills.ts`
 * names — and this session already arrived there once by another route,
 * counting test literals in `check-declared-paths` (bean `dhol`). Twice in one
 * day is a pattern, not bad luck.
 *
 * `--check` exits non-zero ONLY on the third state: a subgraph whose edges
 * could not be read at all. Could-not-determine is never rendered as clean,
 * which is the rule `ci-health` and `health` both keep.
 *
 * Usage:
 *   bun run subgraphs            # the tree and the entanglement report
 *   bun run check:subgraphs      # same, non-zero only if something is unreadable
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { Glob } from "bun";

import { owningDirectory, resolveDirectories, subgraphTree } from "../schemas/cat-harness.js";
import "../schemas/folio-graph-kind.js";

const ROOT = resolve(import.meta.dir, "..");

export interface CrossEdge {
  from: string;
  fromDir: string;
  to: string;
  toDir: string;
}

export interface SubgraphReport {
  /** id → directories nested immediately inside it. */
  tree: ReturnType<typeof subgraphTree>;
  edges: CrossEdge[];
  /**
   * A link out of a subgraph whose target does not exist.
   *
   * **The first draft of this file skipped these**, with the comment *"a
   * dangling link is `blv9`, not this"*. That was wrong, and it hid the
   * largest finding in the corpus: relocating CRDM into `methodologies/crdm/`
   * (bean `g43o`, hours earlier) broke **13 sibling links** in
   * `crdm-requirements-workflow.md` — `interaction-modality.md`,
   * `staging-review.md`, `todo-manager.md` and the rest were siblings when
   * CRDM lived in `skills/folio-core/`, and nothing caught it.
   *
   * In a check about disentangling subgraphs, a dead link OUT of one is not
   * a neighbouring concern — it is the strongest available evidence of an
   * INCOMPLETE MOVE. Skipping it made a half-finished relocation read as a
   * clean disconnection, which is the precise inversion the report exists to
   * prevent.
   */
  dangling: Array<{ from: string; fromDir: string; target: string }>;
  /** Files that could not be read — the third state. */
  unreadable: string[];
  scanned: number;
}

/**
 * Blank out code — a link inside an EXAMPLE is not a link.
 *
 * Added 2026-09-20 after the first real triage of this check's findings
 * (bean `rl3h`): of 18 targets it reported as naming nothing, most were
 * illustrations rather than references —
 *
 *  - ``[`prop:Y`](Y.md)`` inside an inline code span in
 *    `proposition-consolidation-audit.md`, showing what a cross-reference
 *    LOOKS like;
 *  - `` `[audit](../../../docs/audits/...)` `` in a `one-voice-audit.md`
 *    table cell, quoting a pattern the audit tells you to search FOR and
 *    remove;
 *  - two invented bean ids in a blockquoted specimen turn report.
 *
 * Counting them is the wolf-crying this file's header already refuses once,
 * and it is worse here than a plain false positive: the remedy a reader
 * infers is to "fix" prose that is correct, and in the third case to invent
 * two beans to satisfy a link in an example.
 *
 * Same rule and same reason as `check-declared-paths`'s `stripComments`,
 * which exists because its scanner matched its own documentation. Replaces
 * with spaces rather than deleting, so offsets survive.
 */
function stripCode(text: string): string {
  let out = text.replace(/^(\s*)(```|~~~)[\s\S]*?^\s*\2\s*$/gm, (m) => " ".repeat(m.length));
  // Inline spans, longest fence first so ``a `b` c`` is one span.
  out = out.replace(/(`+)(?:(?!\1)[\s\S])*?\1/g, (m) => " ".repeat(m.length));
  return out;
}

/** Markdown link targets that look like a path into this repository. */
function linkTargets(raw: string): string[] {
  const text = stripCode(raw);
  const out: string[] = [];
  for (const m of text.matchAll(/\]\(([^)\s#]+)(?:#[^)]*)?\)/g)) {
    const t = m[1]!;
    if (/^(?:https?:|mailto:|#)/.test(t)) continue;
    // A PLACEHOLDER is not a target. `crdm-requirements-workflow.md` line 245
    // is an illustrative table — `| Landing | [main](…) | [staging](…) |` —
    // showing the shape of an output, and its ellipses never named a file.
    // Reporting them would be two standing false findings, which is the
    // wolf-crying this file's header already refuses once.
    //
    // Same rule and same reason as `check-declared-paths`, which skips
    // `${…}` and `<locale>`: a template is not a path a link could resolve.
    if (/^[…\.]+$/.test(t) || /[$<]/.test(t)) continue;
    out.push(t);
  }
  return out;
}

export function scanSubgraphs(root: string = ROOT): SubgraphReport {
  const dirs = resolveDirectories([{ name: "(local)", root, own: true }]);
  const tree = subgraphTree(dirs);
  const edges: CrossEdge[] = [];
  const dangling: SubgraphReport["dangling"] = [];
  const unreadable: string[] = [];
  let scanned = 0;

  for (const dir of dirs) {
    const abs = dir.absPath ?? join(root, dir.path);
    if (!existsSync(abs) || !statSync(abs).isDirectory()) continue;
    for (const rel of new Glob("**/*.md").scanSync({ cwd: abs })) {
      const file = join(abs, rel);
      const owner = owningDirectory(dirs, relative(root, file));
      // Attribute the file to its DEEPEST owner, not to the directory whose
      // sweep happened to reach it — that attribution IS the `x4v4` defect.
      if (owner === undefined || owner.id !== dir.id) continue;
      scanned += 1;
      let text: string;
      try {
        text = readFileSync(file, "utf-8");
      } catch {
        unreadable.push(relative(root, file));
        continue;
      }
      for (const target of linkTargets(text)) {
        let resolved = resolve(dirname(file), target);
        // A `.html` target is a RENDERED PAGE, not a file in the tree:
        // jekyll builds `docs/skills.html` from `docs/skills.md`. Testing the
        // `.html` on disk reports every correct site link as broken, and the
        // first triage (bean `rl3h`) hit exactly that — `../skills.html`
        // flagged beside `../proposals/llm-authoring-tool-integration.html`,
        // where the first has a source and the second genuinely does not.
        // Resolving to the source tells those two apart; skipping `.html`
        // outright would hide the second.
        if (!existsSync(resolved) && resolved.endsWith(".html")) {
          const asSource = `${resolved.slice(0, -".html".length)}.md`;
          if (existsSync(asSource)) resolved = asSource;
        }
        if (!existsSync(resolved)) {
          dangling.push({ from: relative(root, file), fromDir: owner.id, target });
          continue;
        }
        const to = owningDirectory(dirs, relative(root, resolved));
        if (to === undefined || to.id === owner.id) continue;
        edges.push({
          from: relative(root, file),
          fromDir: owner.id,
          to: relative(root, resolved),
          toDir: to.id,
        });
      }
    }
  }
  return { tree, edges, dangling, unreadable, scanned };
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const { tree, edges, dangling, unreadable, scanned } = scanSubgraphs(ROOT);

  console.log(`Subgraphs  (${scanned} markdown node(s) attributed to a declared directory)\n`);

  if (tree.length === 0) {
    console.log("  No directory contains another. Nothing nests, so nothing to disentangle.");
  } else {
    console.log("NESTING — derived from declared paths, never restated:");
    for (const r of tree) console.log(`  ${r.parent}  ⊃  ${r.children.join(", ")}`);
  }

  // Vacuity before the verdict. With nothing attributed, "no cross edges"
  // is a statement about the sweep and not about the corpus.
  if (scanned === 0) {
    console.error("\n✗ ATTRIBUTED NO FILES. This is not a pass: nothing was examined.");
    process.exit(1);
  }

  const byPair = new Map<string, CrossEdge[]>();
  for (const e of edges) {
    const k = `${e.fromDir} → ${e.toDir}`;
    byPair.set(k, [...(byPair.get(k) ?? []), e]);
  }

  if (byPair.size === 0) {
    console.log("\n✓ every declared directory is a disconnected component.");
  } else {
    console.log(`\nENTANGLEMENT — ${edges.length} edge(s) crossing ${byPair.size} pair(s).`);
    console.log("Reported, not refused: the owner's own framing is that these are");
    console.log("*in the process of being disentangled*, and a gate on work already");
    console.log("known to be outstanding is a gate somebody switches off.\n");
    for (const [pair, list] of [...byPair].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${String(list.length).padStart(3)}  ${pair}`);
      for (const e of list.slice(0, 4)) console.log(`         ${e.from}  →  ${e.to}`);
      if (list.length > 4) console.log(`         … and ${list.length - 4} more`);
    }
  }

  if (dangling.length > 0) {
    const byDir = new Map<string, typeof dangling>();
    for (const d of dangling) byDir.set(d.fromDir, [...(byDir.get(d.fromDir) ?? []), d]);
    console.log(`\nBROKEN LINKS OUT — ${dangling.length}, and each is an edge whose`);
    console.log("target cannot be attributed to any subgraph. A cluster of these in one");
    console.log("directory is the signature of a RELOCATION THAT DID NOT FINISH.\n");
    for (const [dir, list] of [...byDir].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${String(list.length).padStart(3)}  ${dir}`);
      for (const d of list) console.log(`         ${d.from}  →  ${d.target}`);
    }
  }

  if (unreadable.length > 0) {
    console.error(`\n✗ ${unreadable.length} file(s) could not be read, so their edges are UNKNOWN:`);
    for (const u of unreadable) console.error(`  · ${u}`);
    console.error("\nCould-not-determine is never a pass — it outranks the report above.");
    if (check) process.exit(1);
  }
}
