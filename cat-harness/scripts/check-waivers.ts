#!/usr/bin/env bun
/**
 * Every recorded waiver is well formed, in a gate class that exists, and dated.
 *
 * Skill: `skills/folio-core/confirmation-waiver.md`. Owner, 2026-09-20:
 * *"human can waive confirmation rights (e.g. for session, for process run)"*.
 *
 * ## Why a waiver is checked rather than trusted
 *
 * A waiver moves a decision from the agent to the person. Every field on
 * {@link WaiverNodeSchema} is a way that move can be faked, and a malformed
 * waiver is the most dangerous artefact in this repository: it reads as
 * permission and carries none. So a node that does not parse is not a lenient
 * waiver — it is **no waiver**, reported loudly, and the gate it named stands.
 *
 * The other half is the vocabulary. `gate` is a closed enum, so a waiver over
 * something that is not a waivable gate — a rule whose text is *never*, bean
 * deletion — fails to parse at the schema, before any judgement is involved.
 *
 * ## Three states, and the middle one is the point
 *
 * | | |
 * |---|---|
 * | **in force** | parses, unexpired — listed, because a waived action is an announced one |
 * | **inert** | parses, expired — history, kept and never deleted, never a finding |
 * | **malformed** | does not parse, or the clock cannot be read — a defect, and loud |
 *
 * An expired waiver is NOT a finding. It is the record of what was permitted,
 * to whom and when, which is what makes the next grant reviewable — the same
 * argument `AGENTS.md` makes for a `scrapped` bean over a deleted one.
 *
 * A declared directory holding no waiver node is a **determined empty**: no
 * waiver has been granted, which is a real answer and the commonest one. A
 * directory that cannot be READ is not — that exits 2, unknown.
 *
 * ## Where it looks
 *
 * At the directories declaring the `waiver` graph — **asked, never composed**.
 * That graph is declared over the same directory as `memory`, so a file is a
 * waiver by its `$schema` tag and by nothing else.
 *
 * @module folio-assistant/scripts/check-waivers
 * @covers waiver
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { directoriesForGraph } from "../schemas/cat-harness.js";
import { WaiverNodeSchema, waiverState, type WaiverNode } from "../schemas/waiver.js";

/** The INSTANCE root — this file lives at `<instance>/scripts/`. */
export const INSTANCE_ROOT = resolve(import.meta.dir, "..");

/**
 * The tag that makes a file in the directory a waiver.
 *
 * The `waiver` graph is declared over the SAME directory as `memory`, so the
 * two are told apart by what each file says it is — which is the rule the
 * directory conventions already state: *"Extension is a coincidence; a
 * declaration inside the file is the contract."* The first draft of this
 * module instead hardcoded `memory/waivers/` and `check:declared-paths`
 * refused it, correctly: a literal naming a declared directory is exactly what
 * that gate exists to catch, and the subdirectory would have been a second
 * answer to a question `harness.json` already answers.
 */
export const WAIVER_SCHEMA_TAG = "folio-waiver/v1";

export interface WaiverReport {
  /** The directory examined, or `null` when the graph is declared nowhere. */
  store: string | null;
  inForce: { file: string; node: WaiverNode }[];
  inert: { file: string; node: WaiverNode }[];
  malformed: { file: string; reason: string }[];
}

/** Read every waiver in the declared `waiver` graph. */
export function checkWaivers(root: string = INSTANCE_ROOT, now: Date = new Date()): WaiverReport {
  const out: WaiverReport = { store: null, inForce: [], inert: [], malformed: [] };
  const dirs = directoriesForGraph(root, "waiver");
  if (dirs.length === 0) return out;
  out.store = dirs.join(", ");
  const files: { dir: string; name: string }[] = [];
  for (const dir of dirs) {
    for (const name of readdirSync(dir).sort()) if (name.endsWith(".json")) files.push({ dir, name });
  }
  for (const { dir, name } of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(join(dir, name), "utf8"));
    } catch (e) {
      out.malformed.push({ file: name, reason: `not readable JSON: ${e instanceof Error ? e.message : e}` });
      continue;
    }
    // Another graph's node sharing the directory is not this check's business.
    if ((parsed as { $schema?: unknown })?.$schema !== WAIVER_SCHEMA_TAG) continue;
    const r = WaiverNodeSchema.safeParse(parsed);
    if (!r.success) {
      out.malformed.push({ file: name, reason: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ") });
      continue;
    }
    const state = waiverState(r.data, now);
    if (state === "unknown") {
      out.malformed.push({ file: name, reason: `expires ${JSON.stringify(r.data.expires)} is not a readable timestamp` });
    } else if (state === "in-force") {
      out.inForce.push({ file: name, node: r.data });
    } else {
      out.inert.push({ file: name, node: r.data });
    }
  }
  return out;
}

function formatReport(r: WaiverReport): string {
  if (r.store === null) {
    return "Confirmation waivers\n  · no `waiver` graph is declared here — every gate asks.";
  }
  if (r.inForce.length + r.inert.length + r.malformed.length === 0) {
    return "Confirmation waivers\n  · none recorded — every gate asks. (A determined empty, not an unknown.)";
  }
  const out = [`Confirmation waivers (${r.inForce.length} in force, ${r.inert.length} inert)`];
  for (const { node } of r.inForce) {
    out.push(`  • ${node.gate} — ${node.scope}, expires ${node.expires}, granted by ${node.grantedBy}`);
    out.push(`      "${node.quote}"`);
    if (node.bounds) out.push(`      bounded to: ${node.bounds}`);
  }
  for (const { file } of r.inert) out.push(`  · inert (expired): ${file} — kept as history, never deleted`);
  for (const m of r.malformed) out.push(`  ✗ ${m.file}: ${m.reason}`);
  if (r.malformed.length) {
    out.push("");
    out.push("  A malformed waiver is NOT a lenient one. The gate it named still stands.");
    out.push("  Fields and their reasons: skills/folio-core/confirmation-waiver.md");
  }
  return out.join("\n");
}

if (import.meta.main) {
  let report: WaiverReport;
  try {
    report = checkWaivers();
  } catch (e) {
    console.error(`Could not check waivers: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass, and it is NOT a waiver. Treat it as unknown and ask.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.malformed.length ? 1 : 0);
}
