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

import {
  isPublishedGraphKind,
  isRenderable,
  owningDirectory,
  resolveDirectories,
  subgraphTree,
} from "../schemas/cat-harness.js";

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
   * (bean `g43o`, hours earlier — CRDM has since moved again, to
   * `skills/crdm/`, and this sentence is kept in the past tense on purpose:
   * it records what the check caught, not where the files are today) broke
   * **13 sibling links** in
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
  /**
   * Directories skipped BY DECLARATION — they hold only unpublished graph
   * kinds, so their links are not held to resolution.
   *
   * `fsh-guts/` is the standing case, and the distinction matters: it was
   * already skipped before 2026-09-20, but by ACCIDENT — a repository-scoped
   * path fell out of attribution, and the right outcome arrived for the wrong
   * reason (bean `3ye4`). A thing in the trashcan is there because it was
   * superseded, and its links pointing at what moved is EXPECTED; that is a
   * decision, and a decision should be readable.
   *
   * Keyed on the declared graph kind rather than a new field, because
   * `isPublishedGraphKind` already answers exactly this question and the
   * directory already declares `graphKinds: ["fsh-guts"]`. Same shape as the
   * `published: false` a skill now carries: the thing says what it is.
   */
  exempt: string[];
  /**
   * Links inside a RENDERABLE graph that do not resolve in the source tree.
   *
   * DIFFERENT from `exempt`, which drops a retired directory wholesale. This
   * keeps the directory in scope and routes one class of link out of
   * `dangling`: a renderable graph addresses the PUBLISHED tree, so
   * `docs/architecture.md -> api/` names a directory the docs build
   * generates and `docs/skills.md -> ...migration.html` names a page Jekyll
   * renders. Neither is a file here and neither is broken.
   *
   * **Counted and printed, never asserted, and the number is why.** Declaring
   * `docs/` — 241 files, until 2026-09-20 invisible to every
   * declaration-driven consumer — put them in scope for the first time and
   * produced 171, of which 23 ARE source-tree links carrying one `../` too
   * many, rot left by the move of the instance under `cat-harness/`. That
   * audit is bean `mi97`.
   *
   * Without this the gate below could not be held at 0 once `docs/` was
   * declared, and the choice would have been 171 false findings or a silent
   * skip — which this module already refuses two paragraphs up.
   */
  siteResolved: Array<{ from: string; fromDir: string; target: string }>;
  /** Files that could not be read — the third state. */
  unreadable: string[];
  /**
   * Declared directories that exist and hold markdown, yet contributed no
   * attributed file — so nothing in them was examined.
   *
   * Added 2026-09-20 after this sweep reported **0 dangling links** over a
   * corpus in which a just-retired page still carried seven. The page had
   * moved to `fsh-guts/`, which is `scope: "repository"` and therefore sits
   * OUTSIDE this instance — and `owningDirectory` compares in the instance's
   * path space, so every repository-scoped directory was skipped without a
   * word. `bootstrap/skills/`, `smart-kg/` and `uploads/` are skipped the
   * same way.
   *
   * Skipping retired content is defensible; skipping it SILENTLY is not,
   * because "0 dangling" then reads as "everything resolves" when it means
   * "everything I looked at resolves". That is the could-not-determine state
   * rendered as clean, which this repository refuses everywhere else.
   */
  notExamined: string[];
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
  const notExamined: string[] = [];
  const exempt: string[] = [];
  const siteResolved: SubgraphReport["siteResolved"] = [];
  let scanned = 0;

  for (const dir of dirs) {
    const abs = dir.absPath ?? join(root, dir.path);
    if (!existsSync(abs) || !statSync(abs).isDirectory()) continue;
    // Retired content is not held to link resolution — see `exempt`.
    if (dir.graphKinds.length > 0 && dir.graphKinds.every((g) => !isPublishedGraphKind(g))) {
      exempt.push(`${dir.id} (${dir.path})`);
      continue;
    }
    let attributed = 0;
    for (const rel of new Glob("**/*.md").scanSync({ cwd: abs })) {
      const file = join(abs, rel);
      // ABSOLUTE, not instance-relative. A `scope: "repository"` directory
      // resolves OUTSIDE this instance, so `relative(root, …)` yields a
      // `../…` path that matches no declared prefix and the file is
      // attributed to nothing — silently. Six declared directories were
      // swept past that way (bean `3ye4`), and the symptom was a sweep
      // reporting ZERO dangling links over a corpus that had some.
      //
      // `owningDirectory` compares in the space of the path it is given, and
      // every resolved directory carries `absPath`, so absolute is the space
      // in which instance-relative and repository-scoped entries are
      // commensurable at all.
      const owner = owningDirectory(dirs, file);
      // Attribute the file to its DEEPEST owner, not to the directory whose
      // sweep happened to reach it — that attribution IS the `x4v4` defect.
      if (owner === undefined || owner.id !== dir.id) continue;
      scanned += 1;
      attributed += 1;
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
          // A renderable graph addresses the PUBLISHED tree, not this one.
          const renderable = owner.graphKinds.some((g) => isRenderable(g));
          (renderable ? siteResolved : dangling).push({
            from: relative(root, file),
            fromDir: owner.id,
            target,
          });
          continue;
        }
        const to = owningDirectory(dirs, resolved);
        if (to === undefined || to.id === owner.id) continue;
        edges.push({
          from: relative(root, file),
          fromDir: owner.id,
          to: relative(root, resolved),
          toDir: to.id,
        });
      }
    }
    if (attributed === 0 && [...new Glob("**/*.md").scanSync({ cwd: abs })].length > 0) {
      notExamined.push(`${dir.id} (${dir.path})`);
    }
  }
  return { tree, edges, dangling, exempt, siteResolved, unreadable, notExamined, scanned };
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const { tree, edges, dangling, exempt, siteResolved, unreadable, notExamined, scanned } =
    scanSubgraphs(ROOT);

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

  if (siteResolved.length > 0) {
    const byDir = new Map<string, number>();
    for (const l of siteResolved) byDir.set(l.fromDir, (byDir.get(l.fromDir) ?? 0) + 1);
    console.log(
      `\n· ${siteResolved.length} link(s) in RENDERABLE graph(s) do not resolve in the source tree:`,
    );
    for (const [id, n] of [...byDir].sort((a, b) => b[1] - a[1])) console.log(`    ${id}: ${n}`);
    console.log(
      "  Not a finding: a renderable graph addresses the PUBLISHED tree, where the\n" +
        "  site build resolves `api/`, `*.html` and generated pages. NOT a clean bill\n" +
        "  either — bean `mi97` audits them, and 23 carry one `../` too many.",
    );
  }

  if (exempt.length > 0) {
    console.log(`\nEXEMPT BY DECLARATION — ${exempt.length} directory(ies) hold only`);
    console.log("unpublished graph kinds, so their links are not held to resolution:\n");
    for (const d of exempt) console.log(`  · ${d}`);
    console.log(
      "\nRetired content is superseded by definition, so a link of its pointing at\n" +
        "what moved is expected. Stated here rather than inferred, because this WAS\n" +
        "skipped accidentally until 2026-09-20 and a right answer for the wrong\n" +
        "reason is one nobody can rely on.",
    );
  }

  if (notExamined.length > 0) {
    console.log(
      `\nNOT EXAMINED — ${notExamined.length} declared directory(ies) hold markdown but`,
    );
    console.log("contributed no attributed file, so nothing in them was checked. A clean");
    console.log("result above is a statement about what WAS looked at:\n");
    for (const d of notExamined) console.log(`  · ${d}`);
    console.log(
      "\nRepository-scoped entries resolve outside this instance, which is why they\n" +
        "fall out. Retired content under `fsh-guts/` is deliberately not held to\n" +
        "link resolution; the others are a gap, not a decision.",
    );
  }

  // GATED, as of 2026-09-20 — and only now, because only now is the number
  // trustworthy. It read 0 while six declared directories went unattributed
  // (bean `3ye4`), so gating it then would have enforced a statement about
  // what the sweep happened to look at. With attribution fixed the corpus
  // stands at 0 with every directory either examined or exempt by
  // declaration, and a new broken link is a regression somebody introduced.
  //
  // The ENTANGLEMENT report above stays ungated, deliberately: disentangling
  // is work the owner has said is in progress, and a gate on known-
  // outstanding work is one somebody switches off (bean `x4v4`).
  if (check && dangling.length > 0) {
    console.error(
      `\n✗ ${dangling.length} link(s) point at nothing. Repoint them, or remove the\n` +
        "link and keep the text — a reader cannot tell a stale link from a wrong one.",
    );
    process.exit(1);
  }

  if (unreadable.length > 0) {
    console.error(`\n✗ ${unreadable.length} file(s) could not be read, so their edges are UNKNOWN:`);
    for (const u of unreadable) console.error(`  · ${u}`);
    console.error("\nCould-not-determine is never a pass — it outranks the report above.");
    if (check) process.exit(1);
  }
}
