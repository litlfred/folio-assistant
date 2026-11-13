/**
 * A paper's math-progress heat map: one row per chapter, one column per
 * measure of how far its mathematics has got.
 *
 * @module scripts/math-heat
 * @graphNode none — a read-only report over a paper's content, Lean, beans and QA
 * @covers none — it measures progress; the verdicts on the content live in the QA writers
 *
 * Bean `cat-tools-tk99` (the live record is `folio-assistant-hf2q`), second
 * slice: the heat map. Slice 1 is `epic-burndown.ts`. The board feed is a
 * later slice, and nothing here draws on the board.
 *
 * ## What each column MEANS, and what it must not be read as
 *
 * | column | counts | source | is NOT |
 * |---|---|---|---|
 * | proved | provable blocks (theorem, lemma, proposition, corollary) whose resolved Lean file has no `sorry`, of all provable blocks | `lean-coverage` | a check that the Lean statement matches the prose |
 * | sorry | `sorry` occurrences in the distinct Lean files the chapter's blocks resolve to | `lean-coverage`'s resolution, `lean-audit`'s counter | a count of unproved blocks; one file may hold several, and a library file two chapters both use counts in both |
 * | axiom | `axiom` declarations in those same files | as for sorry | wrong; a cited axiom is a declared assumption |
 * | open conj. | the chapter's own conjectures (not `tier:famous`) whose register status is `open` or `attempted` | conjecture register (`folio-conjecture-register/v1`) | a count of all conjecture blocks: a proved or superseded one is not open |
 * | active beans | distinct `in-progress` beans that target a block in the chapter | `trace-work` | all the work going on; a bean with no resolved target is in no chapter |
 * | verdict | the chapter's blocks by latest QA state: failing, stale, unaudited, passing | `block-qa.json` | a pass when nothing fails: stale and unaudited blocks are said |
 *
 * ## No data is not zero
 *
 * Each source can be missing (no Lean tree, no register, no QA file). Then its
 * column is `null` on every row and the report says why in `sources`, never 0:
 * zero would read as "measured, and nothing there". Likewise a chapter that one
 * source does not know is `null` in that column. A conjecture with no register
 * node is counted apart, as `unregistered`, not as open or as closed.
 *
 * ## The pure part
 *
 * {@link computeMathHeat} takes the sources as plain data and is what the tests
 * cover. {@link gatherMathHeat} reads them from disk with the existing Tools
 * (`lean-coverage`'s block walk and Lean resolution, `lean-audit`'s sorry and
 * axiom scanners, `trace-work`'s bean targets), so "proved" is the number
 * `lean-coverage` prints, split by chapter.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

/** One content block, reduced to what the heat map needs. */
export interface HeatBlock {
  label?: string;
  /** The chapter directory the block sits in, or {@link ROOT_CHAPTER}. */
  chapter: string;
  kind: string;
  /** true: a Lean file resolved and has no sorry. false: it has one. null: no Lean file. */
  sorryFree: boolean | null;
  /** A `tier:famous` conjecture from the literature, not the paper's own. */
  external: boolean;
}

export interface MathHeatInput {
  /** The paper's blocks, or null when they could not be read (then every row is unknown). */
  blocks: HeatBlock[] | null;
  /** Sorry and axiom counts per chapter, or null when no block resolved a Lean file. */
  lean: Array<{ chapter: string; totalSorries: number; axiomCount: number }> | null;
  /** Conjecture register nodes, or null when the paper has no register. */
  register: Array<{ sourceBlock: string; status: string }> | null;
  /** `in-progress` bean ids per block label, from `trace-work`, or null. */
  activeBeans: Record<string, string[]> | null;
  /** `block-qa.json`'s `blocks`, or null when no QA file was given. */
  qa: Record<string, { state: string }> | null;
}

export interface Verdicts {
  failing: number;
  stale: number;
  unaudited: number;
  passing: number;
  /** Blocks the QA file has no entry for. */
  noRecord: number;
}

export interface MathHeatRow {
  chapter: string;
  provable: number;
  proved: number;
  sorries: number | null;
  axioms: number | null;
  /** The chapter's own conjectures (not `tier:famous`). */
  conjectures: number;
  conjecturesOpen: number | null;
  /** Own conjectures with no register node; null when there is no register. */
  conjecturesUnregistered: number | null;
  activeBeans: string[] | null;
  verdicts: Verdicts | null;
}

export interface MathHeat {
  rows: MathHeatRow[];
  hasLean: boolean;
  hasRegister: boolean;
  hasBeans: boolean;
  hasQa: boolean;
}

/** The row for blocks that sit directly in the paper directory, in no chapter. */
export const ROOT_CHAPTER = "(paper root)";

const PROVABLE = new Set(["theorem", "lemma", "proposition", "corollary"]);
const OPEN_STATUSES = new Set(["open", "attempted"]);

/**
 * The chapter a block file sits in: the first directory under the paper
 * directory. `file` and `paperRoot` are paths on the same base.
 */
export function chapterOf(file: string, paperRoot: string): string {
  const rel = relative(paperRoot, file);
  const parts = rel.split(sep).filter(Boolean);
  if (parts.length < 2 || parts[0] === "..") return ROOT_CHAPTER;
  return parts[0]!;
}

export function computeMathHeat(input: MathHeatInput): MathHeat {
  const hasLean = input.lean !== null;
  const hasRegister = input.register !== null;
  const hasBeans = input.activeBeans !== null;
  const hasQa = input.qa !== null;
  if (input.blocks === null) return { rows: [], hasLean, hasRegister, hasBeans, hasQa };

  const leanBy = new Map((input.lean ?? []).map((c) => [c.chapter, c]));
  const statusBy = new Map((input.register ?? []).map((n) => [n.sourceBlock, n.status]));
  const rows = new Map<string, MathHeatRow>();
  const beanSets = new Map<string, Set<string>>();
  const row = (chapter: string): MathHeatRow => {
    let r = rows.get(chapter);
    if (!r) {
      const l = leanBy.get(chapter);
      r = {
        chapter,
        provable: 0,
        proved: 0,
        sorries: l ? l.totalSorries : null,
        axioms: l ? l.axiomCount : null,
        conjectures: 0,
        conjecturesOpen: hasRegister ? 0 : null,
        conjecturesUnregistered: hasRegister ? 0 : null,
        activeBeans: null,
        verdicts: hasQa ? { failing: 0, stale: 0, unaudited: 0, passing: 0, noRecord: 0 } : null,
      };
      rows.set(chapter, r);
    }
    return r;
  };

  for (const b of input.blocks) {
    const r = row(b.chapter);
    if (PROVABLE.has(b.kind)) {
      r.provable++;
      if (b.sorryFree === true) r.proved++;
    }
    if (b.kind === "conjecture" && !b.external) {
      r.conjectures++;
      if (hasRegister) {
        const s = b.label ? statusBy.get(b.label) : undefined;
        if (s === undefined) r.conjecturesUnregistered!++;
        else if (OPEN_STATUSES.has(s)) r.conjecturesOpen!++;
      }
    }
    if (hasBeans && b.label) {
      const ids = input.activeBeans![b.label];
      if (ids && ids.length) {
        let set = beanSets.get(b.chapter);
        if (!set) beanSets.set(b.chapter, (set = new Set()));
        for (const id of ids) set.add(id);
      }
    }
    if (hasQa) {
      const q = b.label ? input.qa![b.label] : undefined;
      const v = r.verdicts!;
      if (!q) v.noRecord++;
      else if (q.state === "failing") v.failing++;
      else if (q.state === "stale") v.stale++;
      else if (q.state === "passing") v.passing++;
      else v.unaudited++;
    }
  }
  if (hasBeans) for (const r of rows.values()) r.activeBeans = [...(beanSets.get(r.chapter) ?? [])].sort();

  // Chapters by name, the paper root last.
  const order = [...rows.keys()].filter((k) => k !== ROOT_CHAPTER).sort();
  if (rows.has(ROOT_CHAPTER)) order.push(ROOT_CHAPTER);
  return { rows: order.map((k) => rows.get(k)!), hasLean, hasRegister, hasBeans, hasQa };
}

/** Read a register directory's `folio-conjecture-register/v1` nodes. */
export function readRegister(dir: string): Array<{ sourceBlock: string; status: string }> {
  const out: Array<{ sourceBlock: string; status: string }> = [];
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".json")) continue;
    const node = JSON.parse(readFileSync(join(dir, name), "utf-8"));
    if (node?.$schema !== "folio-conjecture-register/v1") continue;
    if (typeof node.sourceBlock === "string" && typeof node.status === "string") {
      out.push({ sourceBlock: node.sourceBlock, status: node.status });
    }
  }
  return out;
}

/** `trace-work`'s report reduced to in-progress bean ids per block label. */
export function activeBeansByLabel(report: {
  beans: Array<{ id: string; status: string; targets: Array<{ blockLabel?: string }> }>;
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const b of report.beans) {
    if (b.status !== "in-progress") continue;
    for (const t of b.targets) {
      if (!t.blockLabel) continue;
      const ids = (out[t.blockLabel] ??= []);
      if (!ids.includes(b.id)) ids.push(b.id);
    }
  }
  return out;
}

export interface GatherOptions {
  paper: string;
  /** The folio's content root, as `lean-coverage --content-root` takes it. */
  contentRoot: string;
  /** A register directory; default `<contentRoot>/<paper>/conjectures` when it exists. */
  registerDir?: string;
  /** A `block-qa.json`; no default, since the build publishes it elsewhere. */
  qaFile?: string;
  /** A bean defs directory for `trace-work`; default its own. */
  beanDefsDir?: string;
}

/** Each source's state: `ok`, or why its column is unknown. */
export type Sources = Record<"blocks" | "lean" | "register" | "beans" | "qa", string>;

/** Read every source from disk with the existing Tools. A failing source leaves its column null. */
export async function gatherMathHeat(o: GatherOptions): Promise<{ input: MathHeatInput; sources: Sources }> {
  const sources: Sources = { blocks: "ok", lean: "ok", register: "ok", beans: "ok", qa: "ok" };
  const why = (e: unknown) => (e instanceof Error ? e.message : String(e)).split("\n")[0]!;
  const paperRoot = join(o.contentRoot, o.paper);
  const repoRoot = resolve(o.contentRoot, "..");

  let blocks: HeatBlock[] | null = null;
  const leanFiles = new Map<string, Set<string>>();
  try {
    const { collectCoverageBlocks } = await import("./lean-coverage.ts");
    blocks = collectCoverageBlocks(o.paper, o.contentRoot).map((b) => {
      const chapter = chapterOf(join(repoRoot, b.ts), paperRoot);
      if (b.leanFile) {
        let set = leanFiles.get(chapter);
        if (!set) leanFiles.set(chapter, (set = new Set()));
        set.add(join(repoRoot, b.leanFile));
      }
      return { label: b.label, chapter, kind: b.kind, sorryFree: b.leanFile ? !b.leanHasSorry : null, external: b.external };
    });
  } catch (e) {
    sources.blocks = why(e);
  }

  // Per chapter, the distinct Lean files its blocks resolve to (the resolution
  // `lean-coverage` counts "proved" by), counted with `lean-audit`'s scanners.
  // Not `runAudit`'s chapters: those are `ch*` directories plus a module map a
  // folio must configure, and a folio with neither gets no chapter at all.
  let lean: MathHeatInput["lean"] = null;
  if (leanFiles.size === 0) sources.lean = blocks === null ? "no blocks read" : "no block resolved a Lean file";
  else {
    try {
      const { extractSorries, extractAxioms } = await import("./lean-audit.ts");
      const counted = new Map<string, { sorries: number; axioms: number }>();
      lean = [];
      for (const [chapter, files] of leanFiles) {
        let totalSorries = 0;
        let axiomCount = 0;
        for (const f of files) {
          let c = counted.get(f);
          if (!c) {
            const text = readFileSync(f, "utf-8");
            c = { sorries: extractSorries(f, text).length, axioms: extractAxioms(f, text).length };
            counted.set(f, c);
          }
          totalSorries += c.sorries;
          axiomCount += c.axioms;
        }
        lean.push({ chapter, totalSorries, axiomCount });
      }
    } catch (e) {
      lean = null;
      sources.lean = why(e);
    }
  }

  let register: MathHeatInput["register"] = null;
  const registerDir = o.registerDir ?? join(paperRoot, "conjectures");
  if (!existsSync(registerDir)) sources.register = `no register at ${registerDir}`;
  else {
    try {
      register = readRegister(registerDir);
    } catch (e) {
      sources.register = why(e);
    }
  }

  let activeBeans: MathHeatInput["activeBeans"] = null;
  try {
    const { buildTraceability } = await import("@litlfred/cat-harness-tools/scripts/trace-work.ts");
    activeBeans = activeBeansByLabel(buildTraceability({ root: repoRoot, contentDir: o.contentRoot, beanDefsDir: o.beanDefsDir }));
  } catch (e) {
    sources.beans = why(e);
  }

  let qa: MathHeatInput["qa"] = null;
  if (!o.qaFile) sources.qa = "no --qa file given";
  else {
    try {
      qa = JSON.parse(readFileSync(o.qaFile, "utf-8")).blocks ?? null;
      if (qa === null) sources.qa = `${o.qaFile} has no blocks`;
    } catch (e) {
      sources.qa = why(e);
    }
  }

  return { input: { blocks, lean, register, activeBeans, qa }, sources };
}

/** A terminal table. An unknown cell is `?`, never 0; the legend says why. */
export function formatMathHeat(heat: MathHeat, sources?: Sources): string {
  const q = (v: number | null) => (v === null ? "?" : String(v));
  const head = ["chapter", "proved", "sorry", "axiom", "open conj.", "active beans", "verdict (fail/stale/unaud./pass/none)"];
  const body = heat.rows.map((r) => [
    r.chapter,
    `${r.proved}/${r.provable}`,
    q(r.sorries),
    q(r.axioms),
    r.conjecturesOpen === null
      ? `? of ${r.conjectures}`
      : `${r.conjecturesOpen} of ${r.conjectures}${r.conjecturesUnregistered ? ` (+${r.conjecturesUnregistered} unregistered)` : ""}`,
    r.activeBeans === null ? "?" : String(r.activeBeans.length),
    r.verdicts === null
      ? "?"
      : [r.verdicts.failing, r.verdicts.stale, r.verdicts.unaudited, r.verdicts.passing, r.verdicts.noRecord].join("/"),
  ]);
  const widths = head.map((h, i) => Math.max(h.length, ...body.map((b) => b[i]!.length)));
  const line = (cells: string[]) => cells.map((c, i) => c.padEnd(widths[i]!)).join("  ").trimEnd();
  const out = [line(head), line(widths.map((w) => "-".repeat(w))), ...body.map(line)];
  if (heat.rows.length === 0) out.push("(no blocks read)");
  if (sources) {
    const unknown = Object.entries(sources).filter(([, v]) => v !== "ok");
    if (unknown.length) {
      out.push("", "? = no data (not zero):");
      for (const [k, v] of unknown) out.push(`  ${k}: ${v}`);
    }
  }
  return out.join("\n");
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  if (v === undefined || v.startsWith("--")) {
    console.error(`math-heat: ${name} needs a value`);
    process.exit(2);
  }
  return v;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(
      "usage: math-heat [--paper <name>] [--content-root <dir>] [--register <dir>] [--qa <block-qa.json>] [--beans <defs dir>] [--json]",
    );
    process.exit(0);
  }
  const { requirePaper } = await import("@litlfred/cat-harness-tools/pipeline/repo-root.ts");
  const { folioDir } = await import("@litlfred/cat-harness-tools/schemas/kg/cat-harness.js");
  const paper = requirePaper(flag(args, "--paper"));
  const contentRoot = resolve(flag(args, "--content-root") ?? folioDir(process.cwd()));
  const { input, sources } = await gatherMathHeat({
    paper,
    contentRoot,
    registerDir: flag(args, "--register"),
    qaFile: flag(args, "--qa"),
    beanDefsDir: flag(args, "--beans"),
  });
  const heat = computeMathHeat(input);
  if (args.includes("--json")) console.log(JSON.stringify({ paper, sources, ...heat }, null, 2));
  else console.log(`Math progress — paper: ${paper}\n\n${formatMathHeat(heat, sources)}`);
  if (input.blocks === null) process.exit(1);
}
