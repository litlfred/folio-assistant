#!/usr/bin/env bun
/**
 * A bean's stated PATH must not route through work that is already finished.
 *
 * ```sh
 * bun run check:stale-paths
 * bun run check:stale-paths --json
 * ```
 *
 * Bean `k59d`. `check:bean-bodies` already reports a prose ``blocked on `id` ``
 * whose target is closed, and it is right about what it does — but it reads a
 * SENTENCE. A milestone does not write sentences about its blockers. It writes
 * a **route**:
 *
 * ```
 * `b5f0` → `603s` → `hfkl` → `2krx` → (`6lb8` ‖ `ivfw` + `5y4b`) → `pb04` → `supn`
 * ```
 *
 * Measured on `main` the day this shipped: `p5wm` routes through **four**
 * `completed` beans and `yg29`'s numbered "Shortest path" names four more. Both
 * are GOAL milestones — the first thing any *what is next* reader opens — and
 * both were wrong. Two delegated agents sent to read them this morning each had
 * to correct the milestone before they could start.
 *
 * `bean-blocking` says a block whose blocker is gone reads to the next agent as
 * abandoned work. On a leaf bean that costs one agent one read. On a milestone
 * it costs every agent that asks what the goal needs next.
 *
 * ## Two rules, both narrow on purpose
 *
 * | rule | shape |
 * |---|---|
 * | **chain** | an id **adjacent to an arrow** (`→` or `->`), in an open bean, whose status is closed |
 * | **numbered step** | a numbered list item under a heading naming a path/order/sequence |
 *
 * ## The two false-positive classes, measured and closed
 *
 * Both were found by running the first draft over the whole store — three
 * findings, of which **two were wrong**, which is the ratio that makes a rule
 * worth narrowing rather than shipping.
 *
 * **An arrow is not always a dependency.** `x3bd` contains *"README is 97 → 66
 * lines"* in a paragraph that also mentions `lv3j` some hundreds of characters
 * away. The first draft asked only "does this line have an arrow and a closed
 * id", and reported it. So the closed id must be **an operand of the arrow** —
 * immediately beside one — not merely present on the same line. See
 * {@link chainRefs}.
 *
 * **A bean describing another bean's stale path is not stale.** `k59d` — this
 * check's own bean — quotes `p5wm`'s chain verbatim as its evidence, and the
 * first draft reported it as `k59d`'s own defect. That is exactly the shape
 * `check-bean-bodies` closed with a quotation guard, and exactly the shape that
 * flagged `jijc` a few hours earlier. Here the tell is **attribution**: a known
 * bean id appearing before the chain, outside it, names whose path it is. See
 * {@link attributedTo}.
 *
 * ## What it does NOT claim
 *
 * It does **not** distinguish *"this waits on `x`"* from *"this unblocks `x`"*.
 * A chain position is directional by construction, so the distinction does not
 * arise for the chain rule; for anything looser it would, and that is why
 * nothing looser is implemented. `k59d`'s own second Done-when asks for exactly
 * this: draw the line where it can be drawn, and report the rest as
 * **could not determine** rather than guess. Prose that merely mentions a
 * closed bean is neither reported nor counted as clean — it is not examined,
 * and this paragraph is how a reader knows.
 *
 * @module folio-assistant/scripts/check-stale-paths
 * @covers bean-defs, beans
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { CLOSED_STATUSES, OPEN_STATUSES, readBeanFiles, type BeanFile } from "./bean-store-read.ts";

const REPO_ROOT = resolve(import.meta.dir, "../..");

/** Either arrow spelling the corpus uses. */
const ARROW = /→|->/;
/** A bean id as it is written in a body: four lowercase alphanumerics, in a code span. */
const REF = /`([a-z0-9]{4})`/g;

/**
 * A bean, as the shared store reader returns it.
 *
 * `readBeanFiles` resolves `beans/defs/` FROM THE DECLARATION rather than from
 * a literal, which is why this file no longer carries one — `check:declared-paths`
 * refused the first draft's `join(root, "beans", "defs")` and was right to.
 */
export type Bean = BeanFile;

export interface StalePath {
  /** The open bean whose path is stale. */
  id: string;
  /** The closed beans its path routes through. */
  through: { id: string; status: string }[];
  rule: "chain" | "numbered-step";
  line: string;
}

export interface StalePathReport {
  examined: number;
  /** Not in the baseline. These FAIL. */
  findings: StalePath[];
  /** Already recorded, repaired by the milestone's owner. Listed, never failed. */
  outstanding: StalePath[];
  /** Baseline entries nothing matched — repaired, so the file can shrink. */
  stale: string[];
}

/**
 * Stale paths already known, repaired BY THEIR OWNER.
 *
 * A milestone is a statement of what its owner believes the goal needs next,
 * and rewriting somebody else's belief is not a checker's to do. Same shape and
 * the same reasons as `bean-bodies-baseline.json`, including the property that
 * makes it shrink: an entry nothing matched is REPORTED, so a repaired
 * milestone takes its line out instead of leaving the file to grow forever.
 *
 * Keyed `<bean>:<rule>` rather than by line, because the line is the thing that
 * gets edited: keying on it would make every rewording look like a new defect.
 */
export const BASELINE_FILE = "cat-harness/scripts/stale-paths-baseline.json";

/** Missing or unparseable is an EMPTY baseline — every finding fails, which is the safe direction. */
export function readBaseline(root: string): Set<string> {
  try {
    const raw = JSON.parse(readFileSync(join(root, BASELINE_FILE), "utf8")) as { known?: unknown };
    return new Set(Array.isArray(raw.known) ? raw.known.filter((k): k is string => typeof k === "string") : []);
  } catch {
    return new Set<string>();
  }
}

/**
 * Ids that are OPERANDS of an arrow on this line.
 *
 * "Adjacent to an arrow" rather than "present on a line containing an arrow",
 * because the second reported `x3bd`, whose arrow is a line count. Only a
 * token that sits immediately either side of an arrow is a step in a route.
 */
export function chainRefs(line: string): string[] {
  const parts = line.split(ARROW);
  if (parts.length < 2) return [];
  const out = new Set<string>();
  for (const part of parts) {
    // A STEP is a segment between arrows that is JUST ids -- optionally with a
    // route's own punctuation, `(`a` ‖ `b` + `c`)` being the shape `p5wm`
    // uses for parallel work. Anything with prose in it is a sentence that
    // happens to contain an arrow.
    //
    // The first draft took "the first id after the arrow", and its doc comment
    // claimed adjacency it did not implement: it accepted
    // "97 -> 66 lines, and bean `2krx` carries the reason", where the id is a
    // whole clause away. Its own guard test caught that.
    const refs = [...part.matchAll(REF)].map((m) => m[1]!);
    if (refs.length === 0) continue;
    const residue = part.replace(REF, "").replace(/[()[\]{}‖|+,&*\s]/g, "");
    if (residue !== "") continue;
    for (const r of refs) out.add(r);
  }
  return [...out];
}

/**
 * The bean this line's path belongs to, when it is not the bean we are reading.
 *
 * A known id appearing BEFORE the route, and not part of it, is an
 * attribution: `` | `p5wm` (GOAL 2) | critical path `b5f0` → … `` is `p5wm`'s
 * path quoted inside another bean. Returns that id, or `undefined` when the
 * line states the reading bean's own path.
 */
export function attributedTo(line: string, chain: string[], known: Set<string>): string | undefined {
  // A TABLE ROW is attributed by its first cell. This is the stronger signal
  // and it is checked first, because a quoted chain often sits inside ONE code
  // span -- `` `a -> b -> c` `` rather than `` `a` `` -> `` `b` `` -- which
  // leaves the backticks unpaired for the scan below and lets the subject be
  // mistaken for a step. `k59d` quotes `p5wm` exactly that way, and that is how
  // this check first reported its own bean.
  if (line.trimStart().startsWith("|")) {
    const firstCell = line.trimStart().slice(1).split("|")[0] ?? "";
    for (const m of firstCell.matchAll(REF)) if (known.has(m[1]!)) return m[1]!;
  }
  const first = line.search(ARROW);
  if (first < 0) return undefined;
  const chainSet = new Set(chain);
  for (const m of line.slice(0, first).matchAll(REF)) {
    const id = m[1]!;
    if (known.has(id) && !chainSet.has(id)) return id;
  }
  return undefined;
}

/** Is this line a numbered step under a heading that names a path? */
export function underPathHeading(lines: string[], i: number): boolean {
  if (!/^\s*\d+\.\s/.test(lines[i]!)) return false;
  for (let j = i; j >= 0; j--) {
    const l = lines[j]!;
    if (l.startsWith("#")) return /path|order|sequence/i.test(l);
  }
  return false;
}

/** Open beans whose stated path routes through finished work. */
/**
 * The four-character suffix a bean body actually cites.
 *
 * The store reader returns a FULL id (`folio-assistant-p5wm`); a body writes
 * `` `p5wm` ``. Indexing on both is what makes the two meet, and getting this
 * wrong is silent: every lookup misses, no finding is produced, and the check
 * reports a clean run over a store it read perfectly well.
 */
export function shortId(id: string): string {
  return id.slice(id.lastIndexOf("-") + 1);
}

export function stalePaths(beans: Bean[]): StalePath[] {
  const byId = new Map<string, Bean>();
  for (const b of beans) {
    byId.set(b.id, b);
    byId.set(shortId(b.id), b);
  }
  const known = new Set(byId.keys());
  const closed = (id: string) => {
    const b = byId.get(id);
    return b && CLOSED_STATUSES.has(b.status) ? b : undefined;
  };

  const out: StalePath[] = [];
  for (const b of beans) {
    if (!OPEN_STATUSES.has(b.status)) continue;
    const lines = b.body.split("\n");
    for (const [i, line] of lines.entries()) {
      const chain = chainRefs(line);
      if (chain.length > 0) {
        // Whose path is this? A quoted one belongs to its owner, not to us.
        if (attributedTo(line, chain, known) === undefined) {
          const through = chain
            .map(closed)
            .filter((x): x is Bean => x !== undefined)
            .map((x) => ({ id: shortId(x.id), status: x.status }));
          if (through.length > 0) out.push({ id: shortId(b.id), through, rule: "chain", line: line.trim() });
        }
        continue;
      }
      if (!underPathHeading(lines, i)) continue;
      const through = [...line.matchAll(REF)]
        .map((m) => closed(m[1]!))
        .filter((x): x is Bean => x !== undefined)
        .map((x) => ({ id: shortId(x.id), status: x.status }));
      if (through.length > 0) out.push({ id: shortId(b.id), through, rule: "numbered-step", line: line.trim() });
    }
  }
  return out;
}

export function checkStalePaths(root = REPO_ROOT): StalePathReport {
  const beans = readBeanFiles(root);
  // `null` means the declaration did not resolve. That is UNKNOWN, not clean,
  // so it throws rather than reporting zero findings over a store it never read.
  if (beans === null) throw new Error("could not resolve the bean store from the declaration");
  const all = stalePaths(beans);
  const baseline = readBaseline(root);
  const key = (f: StalePath) => `${f.id}:${f.rule}`;
  const matched = new Set(all.map(key).filter((k) => baseline.has(k)));
  return {
    examined: beans.filter((b) => OPEN_STATUSES.has(b.status)).length,
    findings: all.filter((f) => !baseline.has(key(f))),
    outstanding: all.filter((f) => baseline.has(key(f))),
    stale: [...baseline].filter((k) => !matched.has(k)).sort(),
  };
}

function formatReport(r: StalePathReport): string {
  if (r.examined === 0) {
    return "Stale paths\n  ? EXAMINED NOTHING — no open beans were read. Not a pass.";
  }
  const out = [`Stale paths (${r.examined} open bean(s), ${r.outstanding.length} baselined)`];
  const show = (f: StalePath, mark: string) => {
    const via = f.through.map((t) => `\`${t.id}\` (${t.status})`).join(", ");
    out.push(`  ${mark} ${f.id} [${f.rule}]: its path routes through ${via}`);
    out.push(`      ${f.line.length > 130 ? `${f.line.slice(0, 130)}…` : f.line}`);
  };
  if (r.findings.length === 0 && r.stale.length === 0) {
    out.push("  ✓ no NEW stale path — no open bean routes its stated path through finished work");
  }
  for (const f of r.findings) show(f, "✗");
  for (const f of r.outstanding) show(f, "·");
  for (const k of r.stale) {
    out.push(`  · baseline entry "${k}" no longer matches — repaired; remove it from ${BASELINE_FILE}`);
  }
  if (r.findings.length === 0 && r.stale.length === 0 && r.outstanding.length === 0) return out.join("\n");
  if (r.findings.length === 0) return out.join("\n");
  out.push("");
  out.push("  A path through finished work reads to the next agent as work still to do.");
  out.push("  Repaired by the bean's OWNER — see skills/folio-core/bean-blocking.md.");
  out.push("  Prose that merely MENTIONS a closed bean is not examined and is not a pass;");
  out.push("  only an arrow chain and a numbered step under a path heading are read.");
  return out.join("\n");
}

if (import.meta.main) {
  let report: StalePathReport;
  try {
    report = checkStalePaths();
  } catch (e) {
    console.error(`Could not check stale paths: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.findings.length > 0 || report.examined === 0 ? 1 : 0);
}
