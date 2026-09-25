#!/usr/bin/env bun
/**
 * Beans a session judged finished but could not re-derive — the owner's batch.
 *
 * Bean `bbbl`. [`bean-coordination`](../skills/folio-core/bean-coordination.md)
 * §"Closing a bean whose work has already landed" says a bean closes on
 * **evidence, not authorship**, and its first obligation is *re-derive, never
 * quote*. That obligation is the expensive one, and where it cannot be met the
 * rule had no exit: four beans read as finished in their own bodies and sat
 * `in-progress` — `7uff`, `t0i3`, `y8as`, `d1r6` — because every session that
 * met one discharged the collision the same way, by leaving it open.
 *
 * The third state is the `ready-to-close` **tag**. This lists every bean
 * carrying it, with the evidence its session did find, so the owner's
 * confirmation is one read rather than four.
 *
 * ## A tag, not a status, and the reason is mechanical
 *
 * ```
 * $ beans update <id> --status ready-to-close
 * Error: invalid status: ready-to-close (must be in-progress, todo, draft, completed, scrapped)
 * ```
 *
 * The status vocabulary belongs to the third-party CLI, and `BeanStatusSchema`
 * in `schemas/tool-types.ts` is defined as *"exactly what `beans update
 * --status` accepts"*. A sixth value here would desync the schema from the
 * tool it documents on the next `beans` release.
 *
 * ## It reports and never acts
 *
 * Closing is the owner's, per
 * [`deletion-requires-confirmation`](../skills/folio-core/deletion-requires-confirmation.md)
 * applied to the work plan — **unless** a `bean-close` waiver is in force, in
 * which case the session closing the batch names the waiver in its turn report:
 * [`confirmation-waiver`](../skills/folio-core/confirmation-waiver.md).
 * This script does not read waivers and does not close anything; a waiver
 * changes who may act on the list, never what the list says.
 *
 * Exit: 0 always for the listing itself; **1** when a tagged bean carries no
 * `## Evidence` section, because an unevidenced `ready-to-close` is the parking
 * space the skill forbids.
 *
 * @module folio-assistant/scripts/check-ready-to-close
 * @covers bean-defs, beans
 */

import { resolve } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.js";

import { CLOSED_STATUSES, readBeanFiles } from "./bean-store-read.ts";

/** The tag. One spelling, named once. */
export const READY_TAG = "ready-to-close";

export interface ReadyToCloseReport {
  store: boolean;
  ready: { id: string; title: string; status: string; evidence: string }[];
  /** Tagged, but with no `## Evidence` section — the parking-space case. */
  unevidenced: { id: string; title: string }[];
  /** Tagged and already closed; the tag is spent and should come off. */
  spent: string[];
}

/**
 * The body of the `## Evidence` section, or `""` when there is none.
 *
 * Scanned line by line rather than with one regex, because the obvious
 * expression is wrong in JavaScript in a way that reads as correct: `\\Z` is
 * not an anchor here — it matches a literal `Z` — so a section that runs to the
 * end of the file never terminates and the whole match fails. The first draft
 * of this function reported all four `bbbl` beans as unevidenced seconds after
 * their evidence was written.
 */
export function evidenceSection(body: string): string {
  const lines = body.split("\n");
  const start = lines.findIndex((l) => /^#{2,6}[ \t]+Evidence[ \t]*$/.test(l));
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^#{1,6}[ \t]/.test(l));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
}

export function checkReadyToClose(root: string): ReadyToCloseReport {
  const all = readBeanFiles(root);
  if (all === null) return { store: false, ready: [], unevidenced: [], spent: [] };
  const out: ReadyToCloseReport = { store: true, ready: [], unevidenced: [], spent: [] };
  for (const b of all.filter((x) => x.tags.includes(READY_TAG))) {
    if (CLOSED_STATUSES.has(b.status)) {
      out.spent.push(b.id);
      continue;
    }
    const evidence = evidenceSection(b.body);
    if (evidence === "") out.unevidenced.push({ id: b.id, title: b.title });
    else out.ready.push({ id: b.id, title: b.title, status: b.status, evidence });
  }
  return out;
}

function formatReport(r: ReadyToCloseReport): string {
  if (!r.store) return "Ready to close\n  · no bean store — nothing to check";
  if (r.ready.length === 0 && r.unevidenced.length === 0 && r.spent.length === 0) {
    return "Ready to close\n  · nothing awaiting confirmation. (A determined empty, not an unknown.)";
  }
  const out = [`Ready to close (${r.ready.length} awaiting the owner's confirmation)`];
  for (const b of r.ready) {
    out.push("");
    out.push(`  ${b.id} — ${b.title}`);
    for (const line of b.evidence.split("\n")) out.push(`      ${line}`);
  }
  for (const b of r.unevidenced) out.push(`  ✗ ${b.id}: tagged \`${READY_TAG}\` with no \`## Evidence\` section — the tag says "re-derivation is beyond this session", never "I would rather not"`);
  for (const id of r.spent) out.push(`  · ${id} is closed; remove the \`${READY_TAG}\` tag`);
  if (r.ready.length) {
    out.push("");
    out.push("  Closing these is the owner's — or a session acting under a `bean-close` waiver,");
    out.push("  which it names in its turn report. See skills/folio-core/confirmation-waiver.md.");
  }
  return out.join("\n");
}

if (import.meta.main) {
  let report: ReadyToCloseReport;
  try {
    // The REPOSITORY root, not the cwd: `beans/` is repository-scoped, and a
    // run from anywhere else reads "no store" — a clean-looking answer to a
    // question asked in the wrong place.
    report = checkReadyToClose(repoRootFor(resolve(import.meta.dir, "..")));
  } catch (e) {
    console.error(`Could not read the ready-to-close queue: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT an empty queue. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.unevidenced.length ? 1 : 0);
}
