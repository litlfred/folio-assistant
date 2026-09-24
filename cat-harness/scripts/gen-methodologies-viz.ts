#!/usr/bin/env bun
/**
 * Render the `methodology` graph — what each adopted method is FOR, where it
 * came from, and whether this checkout holds the source it rests on.
 *
 * @module cat-harness/scripts/gen-methodologies-viz
 * @covers methodology
 *
 * ## The gap this closes
 *
 * `methodology` was one of seven graph kinds this instance declares with no
 * published viewer — the build says so itself, in `_data/harness.json`:
 * *"cat-harness: declares 7 graph(s) with no published viewer — code,
 * external-schema, interaction, memory, methodology, scenarios, waiver."* So
 * the navbar listed it disabled, and nine typed nodes carrying an `origin`, an
 * `applies-when` and an evidence base reached no reader at all.
 *
 * That is the worst kind for it to happen to. `methodology-adoption` makes a
 * methodology's whole justification its being somebody else's named external
 * work, and `applies-when` is what a selection question matches against. A
 * corpus of adoptions nobody can browse is a corpus an agent picks from by
 * resemblance, which is the failure the skill exists to prevent.
 *
 * ## It does not walk the graph, and that is the point
 *
 * Both the node list and the evidence join come from
 * `check-methodology-evidence.ts` — `methodologyNodes` for the fields a reader
 * needs, `checkMethodologyEvidence` for which citations resolve. Nothing here
 * opens a `methodologies/` directory or parses front matter.
 *
 * Bean `zw4a` states the rule for the adjacent case: *"a second traversal is a
 * second answer … free to disagree with the first."* A generator with its own
 * reader would be free to render a node the gate never checked, or to miss one
 * the gate fails on — and a page saying "9 methodologies" beside a sidecar
 * saying 10 is worse than either alone, because it makes the reader arbitrate.
 *
 * ## Three evidence states, kept visibly apart
 *
 * | state | means | how it reads |
 * |---|---|---|
 * | **ingested** | `evidence:` resolves in a declared library | the source is named and openable |
 * | **cited only** | an `origin`, no `evidence:` field | an open question, reported and not gated |
 * | **dangling** | `evidence:` names a bib-slug no library holds | a citation that CLAIMS to resolve — worse than none |
 *
 * `dh4f` is why these are three and not two: a node whose source nobody has
 * ingested and a node whose citation is broken both render as "no source you
 * can open", and collapsing them would put the more reassuring answer on the
 * record for the broken one.
 *
 * And a fourth state above all of them: if no directory declares a
 * `methodology` graph, this REFUSES rather than writing an empty page. An
 * empty sweep and a clean sweep must not share a spelling.
 *
 * Usage:
 *   bun run cat-harness/scripts/gen-methodologies-viz.ts
 *   bun run cat-harness/scripts/gen-methodologies-viz.ts --check
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { declarationPathIn } from "../schemas/cat-harness.js";
import { docsLayers } from "./compose-docs.js";
import {
  checkMethodologyEvidence,
  methodologyNodes,
  type EvidenceReport,
  type MethodologyNode,
} from "./check-methodology-evidence.js";

const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(INSTANCE_ROOT, "..");

/** The graph kind this renders. A KIND, never a path. */
const KIND = "methodology";

/** One methodology, reduced to what the page shows. */
export interface MethodologyRow {
  readonly name: string;
  readonly title: string;
  readonly origin: string;
  readonly appliesWhen: string;
  /**
   * WHICH instance declared it — `cat-harness`, `smart-base`, `smart-kg`.
   *
   * The graph spans all three, and a page that did not say which would make
   * `grade` read as this instance's own adoption when it is the WHO material's.
   * See {@link instanceOf} for why this is resolved rather than split.
   */
  readonly instance: string;
  readonly evidence: readonly string[];
  readonly state: "ingested" | "cited-only" | "dangling";
}

/**
 * Which instance declared a node, from its path.
 *
 * RESOLVED, not split. `methodologyNodes` spells every path relative to the
 * INSTANCE root, so a sibling instance's node arrives as
 * `../smart-base/methodologies/diig.md` — and taking the first segment of that
 * gives `..`, which is what the first version of this page printed in the
 * "declared by" column for two of its nine rows, and what made its instance
 * count say 2 where the graph spans 3. Found by reading the rendered page, not
 * the code.
 *
 * So the path is resolved against the instance root and re-expressed against
 * the repository root, which is the only spelling in which the first segment
 * IS an instance. Pure path arithmetic — nothing here touches the filesystem,
 * so the join stays testable without one.
 */
export function instanceOf(node: string, instanceRoot: string, repoRoot: string): string {
  const rel = relative(repoRoot, resolve(instanceRoot, node));
  const seg = rel.split("/")[0] ?? "";
  // Still `..` means the node sits OUTSIDE the repository, which no declared
  // graph should. Reported as itself rather than guessed at: a wrong instance
  // name on a row is worse than a visibly impossible one.
  return seg === "" ? "?" : seg;
}

/**
 * The rows, joined from the two reports.
 *
 * Exported so the JOIN is testable without a filesystem — it is the part worth
 * pinning, and a test that went through the rendered markdown would be testing
 * the markdown.
 */
export function methodologyRows(
  nodes: readonly MethodologyNode[],
  report: EvidenceReport,
  instanceRoot = INSTANCE_ROOT,
  repoRoot = REPO,
): MethodologyRow[] {
  // Indexed by NODE PATH, not by name. Two instances may adopt methods with
  // the same name — `raci` and `rasci` already differ by one letter — and a
  // name-keyed join would silently attribute one instance's evidence to
  // another's node.
  const dangling = new Set(report.unresolved.map((f) => f.node));
  const none = new Set(report.noEvidence.map((f) => f.node));

  return nodes
    .filter((n) => n.state === "ok" && n.front !== undefined)
    .map((n) => {
      const f = n.front!;
      const state: MethodologyRow["state"] = dangling.has(n.node)
        ? "dangling"
        : none.has(n.node)
          ? "cited-only"
          : "ingested";
      return {
        name: f.name,
        title: f.title,
        origin: f.origin,
        appliesWhen: f["applies-when"],
        instance: instanceOf(n.node, instanceRoot, repoRoot),
        evidence: f.evidence ?? [],
        state,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/** Where the page goes, read from the declaration that renders it. */
export function pageRelPath(repo = REPO): string | undefined {
  const declPath = declarationPathIn(join(repo, "cat-harness"));
  if (!declPath || !existsSync(declPath)) return undefined;
  const d = JSON.parse(readFileSync(declPath, "utf-8")) as {
    directories?: { graphKinds?: string[]; coverage?: { visualiser?: unknown } }[];
  };
  for (const e of d.directories ?? []) {
    if (!(e.graphKinds ?? []).includes(KIND)) continue;
    const v = e.coverage?.visualiser;
    for (const one of Array.isArray(v) ? v : [v]) {
      const ref = typeof one === "string" ? one : (one as { ref?: string } | undefined)?.ref;
      if (!ref) continue;
      const rel = relative(baseDocs(repo), resolve(repo, ref));
      if (rel.startsWith("..") || rel === "") return undefined;
      return rel;
    }
  }
  return undefined;
}

/** The base docs layer — the same answer `compose-docs.ts` uses. */
function baseDocs(repo: string): string {
  const base = docsLayers(repo).layers.find((l) => !l.repositoryScoped);
  if (base === undefined) throw new Error("no instance-scoped docs layer is declared");
  return base.dir;
}

const CSS = `
.mv-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.72rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
.mv-ingested{color:#0d6e5e}
.mv-cited{color:#8a6100}
.mv-dangling{color:#a8200f}
.mv-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}
.mv-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}
.mv-stat b{display:block;font-size:1.25rem;line-height:1.2}
.mv-stat span{font-size:.75rem;opacity:.75}
`;

/**
 * The badge for an evidence state.
 *
 * WORDS, not only colour. The three states are the whole point of the page and
 * a reader who cannot distinguish the hues would be left with one state —
 * which is the same failure as collapsing them in the data.
 */
const BADGE: Record<MethodologyRow["state"], string> = {
  ingested: '<span class="mv-tag mv-ingested">source held</span>',
  "cited-only": '<span class="mv-tag mv-cited">cited, not ingested</span>',
  dangling: '<span class="mv-tag mv-dangling">citation does not resolve</span>',
};

/** Escape a cell so a pipe in prose cannot break the table. */
function cell(v: string): string {
  return v.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

/** A long prose field, trimmed for a table cell with the full text below it. */
function short(v: string, n = 150): string {
  const one = cell(v);
  return one.length <= n ? one : one.slice(0, n - 1).trimEnd() + "…";
}

export function page(rows: readonly MethodologyRow[], report: EvidenceReport): string {
  const byState = (s: MethodologyRow["state"]): number => rows.filter((r) => r.state === s).length;
  const instances = [...new Set(rows.map((r) => r.instance))].sort();

  const b: string[] = [
    "---",
    'title: "Methodologies"',
    'description: "The methodologies this repository has adopted — what each is for, where it came from, and whether the source it rests on is held here."',
    "---",
    `<style>${CSS}</style>`,
    "",
    "A **methodology** here is somebody else's named, external work that this",
    "repository has adopted — a decision method, a responsibility matrix, an",
    "evidence framework. That is the line `methodology-adoption` draws: a method",
    "with no external origin is a *house process*, and belongs in `skills/`",
    "written as one rather than dressed as an adoption.",
    "",
    "So every node below carries an **origin**. Whether this checkout also holds",
    "the source that origin names is a separate question, and the one the third",
    "column answers.",
    "",
    '<div class="mv-grid">',
    `<div class="mv-stat"><b>${rows.length}</b><span>adopted methodologies</span></div>`,
    `<div class="mv-stat"><b>${byState("ingested")}</b><span>with the source held here</span></div>`,
    `<div class="mv-stat"><b>${byState("cited-only")}</b><span>cited, not ingested</span></div>`,
    `<div class="mv-stat"><b>${instances.length}</b><span>instance(s) declaring the graph</span></div>`,
    "</div>",
    "",
    "## Choosing one",
    "",
    "`applies-when` is what a selection question matches against, so it is the",
    "column to read first. A methodology whose applicability is unstated is one an",
    "agent picks by resemblance, which is why the schema requires the field.",
    "",
    "| methodology | applies when | origin held? | declared by |",
    "|---|---|---|---|",
  ];

  for (const r of rows) {
    b.push(
      `| **[${cell(r.title)}](#${r.name})**<br>\`${cell(r.name)}\` | ${short(r.appliesWhen)} | ` +
        `${BADGE[r.state]} | \`${cell(r.instance)}\` |`,
    );
  }

  b.push(
    "",
    "## Where each one came from",
    "",
    "The three states are different facts and are kept apart deliberately.",
    "**Source held** means an `evidence:` reference resolves to a document in a",
    "declared library — you can open it from this checkout. **Cited, not",
    "ingested** means the node names an origin and nobody has fetched it; that is",
    "an open question, reported by `check:methodology-evidence` and gated by",
    "nothing. **Citation does not resolve** is neither: the node claims a source",
    "and the slug names nothing, which reads as evidence in every listing and is",
    "strictly worse than declaring none.",
    "",
  );

  for (const r of rows) {
    b.push(
      `### ${cell(r.title)}`,
      "",
      `<a id="${r.name}"></a>`,
      "",
      `\`${cell(r.name)}\` — declared by \`${cell(r.instance)}\` — ${BADGE[r.state]}`,
      "",
      `**Applies when.** ${cell(r.appliesWhen)}`,
      "",
      `**Origin.** ${cell(r.origin)}`,
      "",
    );
    if (r.evidence.length > 0) {
      b.push(
        r.state === "dangling"
          ? "**Cited sources — at least one does not resolve:**"
          : "**Ingested sources:**",
        "",
        ...r.evidence.map((e) => `- \`${cell(e)}\``),
        "",
      );
    } else {
      b.push(
        "**No ingested source.** The origin above names one; nothing in this",
        "checkout holds it. `literature-search` is the skill that closes one of",
        "these.",
        "",
      );
    }
  }

  // Reported either way. "Nothing untagged" and "the check did not look" are
  // different facts, and a section that appeared only on failure could not
  // tell them apart.
  b.push("## Files in the graph that are not methodology nodes", "");
  if (report.untagged.length === 0) {
    // NO BACKTICK INSIDE A TEMPLATE LITERAL. `check:viewer-backticks` exists
    // because one of these ends the string and the file stops parsing — as
    // "No tests found" rather than as a syntax error. Plain strings here.
    b.push("None — every `.md` in the declared directories carries", "`$schema: folio-methodology/v1`.", "");
  } else {
    b.push(
      `**${report.untagged.length}.** A README or an index sitting in the graph`,
      "directory is untagged and correct; a node nobody tagged is one no consumer",
      "of the graph can see. Both look like this, which is why they are listed",
      "rather than counted.",
      "",
      ...report.untagged.map((f) => `- \`${cell(f.node)}\` — ${cell(f.detail)}`),
      "",
    );
  }

  if (report.invalid.length > 0) {
    b.push(
      "## Nodes that do not validate",
      "",
      `**${report.invalid.length}.** Tagged \`folio-methodology/v1\` and refused by`,
      "`schemas/methodology.ts`. The schema is `strict()`, so a misspelled key is a",
      "finding rather than a silent omission.",
      "",
      ...report.invalid.map((f) => `- \`${cell(f.node)}\` — ${cell(f.detail)}`),
      "",
    );
  }

  return b.join("\n").trimEnd() + "\n";
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const report = checkMethodologyEvidence(INSTANCE_ROOT);

  if (report.undetermined) {
    // The fourth state, above the three the page renders. Refuse rather than
    // write a page saying "0 methodologies", which is what a corpus that was
    // never found looks like from the outside.
    console.error("::error::gen-methodologies-viz: no directory declares a `methodology` graph — nothing was rendered");
    process.exit(2);
  }

  const rows = methodologyRows(methodologyNodes(INSTANCE_ROOT), report);
  if (rows.length === 0) {
    console.error("::error::gen-methodologies-viz: the methodology graph yielded no valid nodes");
    process.exit(1);
  }

  const PAGE = pageRelPath(REPO);
  if (PAGE === undefined) {
    console.error(`::error::gen-methodologies-viz: no visualiser declared for graph kind '${KIND}'`);
    process.exit(1);
  }

  const rendered = page(rows, report);
  const out = join(baseDocs(REPO), PAGE);

  if (check) {
    const current = existsSync(out) ? readFileSync(out, "utf-8") : "";
    if (current !== rendered) {
      console.error(`::error::gen-methodologies-viz: ${PAGE} is stale — run \`bun run methodologies:viz\``);
      process.exit(1);
    }
    console.log(`✓ methodologies viewer is current — ${rows.length} methodolog(ies)`);
  } else {
    mkdirSync(join(out, ".."), { recursive: true });
    writeFileSync(out, rendered);
    console.log(`methodologies viewer: ${rows.length} node(s) → ${PAGE}`);
    console.log(
      `  ${rows.filter((r) => r.state === "ingested").length} with the source held, ` +
        `${rows.filter((r) => r.state === "cited-only").length} cited only, ` +
        `${rows.filter((r) => r.state === "dangling").length} dangling`,
    );
  }
}
