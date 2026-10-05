#!/usr/bin/env bun
/**
 * Do the declared directories' subgraphs have any edge between them?
 *
 * Bean `x4v4`. The owner, 2026-09-20: *"`cat-harness/methodologies/` is a
 * subgraph. should be disconnected. convention folder corresponds to subgraph
 * (but may be in process of being disentangled). use schema
 * declaration/definition."*
 *
 * ## Vocabulary, because the headline here said it backwards until 2026-09-27
 *
 * It read *"a folder corresponds to a subgraph"*, which inverts the two. The
 * owner's own sentence carries the correction and this file dropped the load-
 * bearing word: **convention** folder corresponds to subgraph.
 *
 * - A **subgraph** is the mathematical object — a set of nodes together with
 *   the edges of the graph between them. Every set of files induces one.
 *   Nothing has to be cohesive, large, or disconnected to *be* a subgraph, and
 *   an edgeless set of nodes is a perfectly good one.
 * - A **directory** is a CONVENIENCE: where a subgraph somebody chose to name
 *   gets written down so tooling can find it. Bookkeeping, not the object.
 *   `subgraphTree` and `owningDirectory` in `schemas/cat-harness.ts` are pure
 *   path containment for exactly this reason.
 *
 * The inversion is not pedantry, because it is what makes the property this
 * script measures sayable at all. "A folder is a subgraph" is unfalsifiable —
 * any set of files induces a subgraph, so there is nothing to check. What is
 * checkable is a relation BETWEEN the declared subgraphs:
 *
 * > **The partition by declared directory should have no edge crossing it** —
 * > equivalently, it should COARSEN the graph's partition into connected
 * > components. Each declared subgraph is then a union of components, and
 * > "should be disconnected" means mutually disconnected.
 *
 * That is one comparison of two partitions, and it is what `byPair` below
 * computes. Note "disconnected" is a claim about PAIRS: a single subgraph is
 * not disconnected from anything, and a connected component is by definition
 * connected, so the verdict has to name the pairwise property or it says
 * something false. It did — *"every declared directory is a disconnected
 * component"* — and that is corrected below too.
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
 *
 * @covers cat-harness
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { Glob } from "bun";

import { gitCorpus } from "../schemas/git-corpus.ts";

import {
  isDerivedGraph,
  isPublishedGraphTypology,
  isRenderable,
  owningDirectory,
  resolveDirectories,
  subgraphTree,
} from "../schemas/cat-harness.js";
import { checkoutDirectories } from "../schemas/harness-config.js";
import { corpusScopeFor } from "./known-skills.js";
import { mayLeaveMain } from "./qa-results.js";

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
   * `skills/sdlc/crdm/`, and this sentence is kept in the past tense on purpose:
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
   * Links into a declared directory that is ABSENT from this checkout and may
   * be (`mayLeaveMain`: every kind it holds is one the qa-reports arc moves
   * off `main`). Whether such a link resolves cannot be determined here, so it
   * is neither dangling nor resolved — the third state, reported by count.
   * Bean `cxcn`: with the derived corpus absent, `test/README.md`'s generated
   * link to `results/README.md` read as a broken link.
   */
  unverifiable: Array<{ from: string; fromDir: string; target: string }>;
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
   * Keyed on the declared graph typology rather than a new field, because
   * `isPublishedGraphTypology` already answers exactly this question and the
   * directory already declares `graphTypologies: ["fsh-guts"]`. Same shape as the
   * `published: false` a skill now carries: the thing says what it is.
   */
  exempt: string[];
  /**
   * Links inside a RENDERABLE graph that do not resolve in the source tree.
   *
   * DIFFERENT from `exempt`, which drops a retired directory wholesale. This
   * keeps the directory in scope and routes one class of link out of
   * `dangling`: a renderable graph addresses the PUBLISHED tree, so
   * `docs/concepts/architecture.md -> api/` names a directory the docs build
   * generates and `docs/concepts/skills.md -> ...migration.html` names a page Jekyll
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
  /**
   * Links inside a DERIVED graph that do not resolve — the source document's
   * own, not ours.
   *
   * Third bucket for the same reason `siteResolved` is the second: the
   * directory stays in scope and one class of link is routed out of
   * `dangling`. A derived graph is machine-produced FROM a source, so a
   * markdown link inside it is whatever the derivation carried across. An
   * ingested page of the Claude Platform Docs prints `./REFERENCE.md` and
   * `./FORMS.md` inside an EXAMPLE of a skill directory; those were never
   * edges in this graph, and there is nothing to repoint.
   *
   * **The rule already existed one layer down, and this check was simply not
   * applying it.** `schemas/cat-harness.ts` says of the `derived` layer that
   * *"a QA finding against a derived section is a finding against its
   * GENERATOR, not against the corpus, and it sends a reviewer to fix the
   * wrong file"*. That is exactly what happened on 2026-09-23: five ingested
   * documents produced 12 findings, every one asking somebody to edit a
   * transcription of a document this project did not write.
   *
   * **Repointing them would be worse than a waste.** Editing an extracted
   * section to satisfy a checker breaks the one promise a library entry
   * makes — that it says what the source said. Same reason `uses[]` is never
   * populated from Lean and a narrative is never invented.
   *
   * Counted and printed, never asserted, exactly as `siteResolved` is.
   */
  derivedLinks: Array<{ from: string; fromDir: string; target: string }>;
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
   * word. `bootstrap/skills/` and `uploads/` are skipped the
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

/**
 * Resolve a link target in the SOURCE tree, or `undefined`.
 *
 * A `.html` target is a RENDERED PAGE, not a file here: jekyll builds
 * `docs/skills.html` from `docs/concepts/skills.md`. Testing the `.html` on disk
 * reports every correct site link as broken, and the first triage (bean
 * `rl3h`) hit exactly that. Resolving to the source tells a page with a
 * source apart from one that genuinely does not exist; skipping `.html`
 * outright would hide the second.
 *
 * It is a FUNCTION rather than two inline blocks because `overDeepLinks`
 * has to test a candidate repair under the SAME rule that put the link in
 * the unresolved bucket. Two copies of that rule is two answers to "does
 * this resolve", free to disagree — and the count below would then be
 * measuring something other than what the scan measured.
 */
/** A link destination as a path: percent-decoded, or unchanged if the escapes are malformed. */
export function decodeLinkTarget(target: string): string {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

function resolveInTree(abs: string): string | undefined {
  if (existsSync(abs)) return abs;
  if (abs.endsWith(".html")) {
    const asSource = `${abs.slice(0, -".html".length)}.md`;
    if (existsSync(asSource)) return asSource;
  }
  return undefined;
}

/**
 * Of the links that do not resolve, the ones carrying ONE `../` too many —
 * the signature a directory move leaves behind, and the only kind of
 * unresolved link in a renderable graph that is rot rather than a published
 * address.
 *
 * **Computed, never remembered.** This number was a STRING LITERAL in the
 * report for five days (bean `syrl`): measured once on 2026-09-20, written
 * into the message, and printed unchanged beside a total that re-measured
 * every run. A reader could not tell whether any of them had been repaired.
 * That is the repository's own rule — `kg-audit`'s *never quote a count from
 * prose*, `turn-reporting`'s *a count without its measurement is a claim* —
 * broken by its own tooling, and with a longer half-life than the prose case
 * because it arrives wearing the authority of a measurement.
 *
 * The repair is tested against disk, not inferred from the shape: a target
 * that merely starts with `../` proves nothing, and a `../` dropped from a
 * path that still does not resolve is a different defect.
 */
export function overDeepLinks(
  root: string,
  links: ReadonlyArray<{ from: string; fromDir: string; target: string }>,
): Array<{ from: string; fromDir: string; target: string; repaired: string }> {
  const out: Array<{ from: string; fromDir: string; target: string; repaired: string }> = [];
  for (const link of links) {
    if (!link.target.startsWith("../")) continue;
    const repaired = link.target.slice("../".length);
    if (repaired.length === 0) continue;
    const abs = resolve(root, dirname(link.from), decodeLinkTarget(repaired));
    if (resolveInTree(abs) !== undefined) out.push({ ...link, repaired });
  }
  return out;
}

/**
 * The markdown nodes in {@link abs}, as paths relative to it.
 *
 * **Asked of git, not of the disk** (`gitCorpus`). A bare glob here was
 * correct for as long as no declared directory happened to contain an
 * untracked subtree — and stopped being correct the moment a gate installed a
 * publishable package's devDependencies, at which point this sweep descended
 * into `node_modules/` and reported **31 broken links**, every one inside a
 * third-party README linking to its own repository's files. Bean `rsi6`; the
 * same shape as `ramz` one directory over.
 *
 * Falls back to the glob when git cannot answer — a temp fixture is not a
 * work tree, and refusing there would trade a false finding for an unrunnable
 * check. The fallback is the LOOSER set, so it can only over-report.
 */
function markdownIn(abs: string): string[] {
  const listed = gitCorpus(abs, ["*.md"]);
  if (listed !== undefined) return listed.map((f) => relative(abs, f));
  return [...new Glob("**/*.md").scanSync({ cwd: abs })];
}

export function scanSubgraphs(root: string = ROOT): SubgraphReport {
  // The CORPUS on the platform's own run (placement PR0, bean `ejye`): what
  // the platform's `scope: "repository"` mirrors used to bring into this sweep
  // is asked of the checkout now. Ids repeat across instances there (several
  // `library`), so ownership is compared by ABSOLUTE PATH below and a foreign
  // directory is labelled `<member>/<id>`; the containment TREE is still this
  // instance's own declaration, the question it always answered.
  const own = resolveDirectories([{ name: "(local)", root, own: true }]);
  const dirs = corpusScopeFor(root) === "checkout" ? checkoutDirectories(root, { stackedOn: root }) : own;
  const tree = subgraphTree(own);
  // `own` on a checkout entry means "its own instance's", not this one's, so
  // the test is membership of THIS instance's resolution.
  const ownPaths = new Set(own.map((o) => o.absPath));
  const label = (d: (typeof dirs)[number]): string =>
    ownPaths.has(d.absPath) || d.member === undefined ? d.id : `${d.member}/${d.id}`;
  const edges: CrossEdge[] = [];
  const dangling: SubgraphReport["dangling"] = [];
  const unverifiable: SubgraphReport["unverifiable"] = [];
  // Declared directories that are absent and allowed to be: a link into one
  // cannot be judged from this checkout.
  const absentOffMain = dirs
    .filter((d) => mayLeaveMain(d as { graphTypologies?: string[]; storage?: unknown }))
    .map((d) => resolve(d.absPath ?? join(root, d.path)))
    .filter((a) => !existsSync(a));
  const derivedLinks: SubgraphReport["derivedLinks"] = [];
  const unreadable: string[] = [];
  const notExamined: string[] = [];
  const exempt: string[] = [];
  const siteResolved: SubgraphReport["siteResolved"] = [];
  let scanned = 0;

  for (const dir of dirs) {
    const abs = dir.absPath ?? join(root, dir.path);
    if (!existsSync(abs) || !statSync(abs).isDirectory()) continue;
    // Retired content is not held to link resolution — see `exempt`.
    if (dir.graphTypologies.length > 0 && dir.graphTypologies.every((g) => !isPublishedGraphTypology(g))) {
      exempt.push(`${label(dir)} (${dir.path})`);
      continue;
    }
    let attributed = 0;
    let unowned = 0;
    for (const rel of markdownIn(abs)) {
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
      if (owner === undefined) unowned += 1;
      // Attribute the file to its DEEPEST owner, not to the directory whose
      // sweep happened to reach it — that attribution IS the `x4v4` defect.
      if (owner === undefined || owner.absPath !== dir.absPath) continue;
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
        // `resolveInTree` carries the `.html` → `.md` rule and its reasoning.
        // A link destination is a URL: `%20`, `%28`, `%40` name the file's own
        // characters (`linkTarget` in subgraph-readmes writes them), so decode
        // before asking the filesystem. Malformed escapes stay as written.
        const wanted = resolve(dirname(file), decodeLinkTarget(target));
        const resolved = resolveInTree(wanted);
        if (resolved === undefined && absentOffMain.some((a) => wanted === a || wanted.startsWith(a + "/"))) {
          unverifiable.push({ from: relative(root, file), fromDir: label(owner), target });
          continue;
        }
        if (resolved === undefined) {
          // A renderable graph addresses the PUBLISHED tree, not this one.
          const renderable = owner.graphTypologies.some((g) => isRenderable(g));
          // A DERIVED graph's links came from the SOURCE document rather than
          // from an author here — see `derivedLinks`. Tested after
          // `renderable` only because no kind is currently both; if one ever
          // is, addressing the published tree is the more specific claim and
          // should win.
          const derived = owner.graphTypologies.some((g) => isDerivedGraph(g));
          const bucket = renderable ? siteResolved : derived ? derivedLinks : dangling;
          bucket.push({
            from: relative(root, file),
            fromDir: label(owner),
            target,
          });
          continue;
        }
        const to = owningDirectory(dirs, resolved);
        if (to === undefined || to.absPath === owner.absPath) continue;
        edges.push({
          from: relative(root, file),
          fromDir: label(owner),
          to: relative(root, resolved),
          toDir: label(to),
        });
      }
    }
    // NOT EXAMINED means a file this sweep could attribute to NOTHING — the
    // `3ye4` path-space defect. A directory whose every file belongs to a
    // DEEPER declared one (a member's `test/` holding only `test/results/`)
    // was examined, under that deeper owner; over the checkout (placement
    // PR0) that is the common case for an inherited member.
    if (attributed === 0 && unowned > 0) {
      notExamined.push(`${label(dir)} (${dir.path})`);
    }
  }
  return { tree, edges, dangling, unverifiable, derivedLinks, exempt, siteResolved, unreadable, notExamined, scanned };
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const { tree, edges, dangling, unverifiable, derivedLinks, exempt, siteResolved, unreadable, notExamined, scanned } =
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
    // Pairwise, and about the PARTITION rather than about any one directory:
    // a lone subgraph is not disconnected from anything, and a component is
    // connected by definition. See §"Vocabulary" for why the old wording —
    // "every declared directory is a disconnected component" — was false.
    console.log("\n✓ no edge crosses a declared directory: the declared partition coarsens the components.");
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

  if (unverifiable.length > 0) {
    console.log(
      `\n? ${unverifiable.length} link(s) point into a declared directory absent from this checkout ` +
        `(derived QA, kept off main): COULD NOT DETERMINE whether they resolve — not counted as broken, not as clean.`,
    );
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
    // MEASURED here, not remembered: bean `syrl`. The sentence below used to
    // carry the count as a string literal, so it could not move when the
    // links did.
    const overDeep = overDeepLinks(ROOT, siteResolved);
    console.log(
      "  Not a finding: a renderable graph addresses the PUBLISHED tree, where the\n" +
        "  site build resolves `api/`, `*.html` and generated pages. NOT a clean bill\n" +
        "  either — bean `mi97` audits them.",
    );
    if (overDeep.length > 0) {
      console.log(
        `  Of those, ${overDeep.length} carry one \`../\` too many — dropping one resolves\n` +
          "  on disk, which is the signature of a relocation that did not finish.",
      );
      for (const l of overDeep.slice(0, 5)) console.log(`         ${l.from}  →  ${l.target}`);
      if (overDeep.length > 5) console.log(`         … and ${overDeep.length - 5} more`);
    } else {
      console.log("  None of them carries one `../` too many; the rest address the site.");
    }
  }

  if (derivedLinks.length > 0) {
    const byDir = new Map<string, number>();
    for (const l of derivedLinks) byDir.set(l.fromDir, (byDir.get(l.fromDir) ?? 0) + 1);
    console.log(
      `\n· ${derivedLinks.length} link(s) in DERIVED graph(s) do not resolve in the source tree:`,
    );
    for (const [id, n] of [...byDir].sort((a, b) => b[1] - a[1])) console.log(`    ${id}: ${n}`);
    console.log(
      "  Not a finding: a derived graph is machine-produced FROM a source, so a link\n" +
        "  inside it is the SOURCE document's — an ingested page printing `./FORMS.md`\n" +
        "  inside an example was never an edge here. Repointing one would edit a\n" +
        "  transcription to satisfy a checker, which breaks the only promise a library\n" +
        "  entry makes. NOT a clean bill either: a link a GENERATOR mangled would land\n" +
        "  here too, and telling those apart needs the generator, not this sweep.",
    );
  }

  if (exempt.length > 0) {
    console.log(`\nEXEMPT BY DECLARATION — ${exempt.length} directory(ies) hold only`);
    console.log("unpublished graph typologies, so their links are not held to resolution:\n");
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
