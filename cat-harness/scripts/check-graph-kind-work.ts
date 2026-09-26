#!/usr/bin/env bun
/**
 * check-graph-kind-work.ts — every `state` graph kind has said whether it
 * records WORK.
 *
 * `recordsWork` answers the question an arriving agent asks first: is there
 * something here somebody is partway through, that I could pick up? The
 * root README's cold-start section computes its ACTIVE/STATIC verdict from
 * it, so a kind that has not decided makes that verdict quietly wrong rather
 * than loudly absent.
 *
 * ## Why a gate rather than a required field
 *
 * `renderable` and `holds` are required on {@link GraphKindDef}, so a kind
 * cannot compile without deciding them. `recordsWork` is **optional in the
 * type on purpose**: it is meaningless for `content`, `context` and
 * `derived` — a record of what the instance IS records no position — and
 * requiring it would force three layers to answer a question that does not
 * apply to them, which is how a field gets a meaningless default nobody
 * reads.
 *
 * So the "cannot ship undecided" property lives here, narrowed to the layer
 * where the question means something.
 *
 * ## What it would have caught
 *
 * The first cut of the ACTIVE/STATIC rule read "declares any `state` graph",
 * which made the repository root and `who-iris` ACTIVE on `uploads` alone.
 * An ingestion queue is live state and is not work anybody is partway
 * through, so an agent told the graph was active would have arrived looking
 * for something to prioritise and found a directory of unprocessed files.
 * Deciding per kind is what separates the two; this makes the decision
 * mandatory.
 *
 * @module scripts/check-graph-kind-work
 * @covers cat-harness
 */

import { defaultGraphKinds, undecidedWorkKinds } from "../schemas/cat-harness.js";

export function formatReport(undecided: readonly string[], stateKinds: number): string {
  const out: string[] = ["Graph kinds — every `state` kind says whether it records work", ""];
  // The count is printed even at zero findings: a gate that says nothing when
  // it passes cannot be told from a gate that examined nothing.
  out.push(`  ${stateKinds} kind(s) hold \`state\`; ${undecided.length} have not decided \`recordsWork\`.`);
  for (const k of undecided) {
    out.push(`      ✗ \`${k}\` — is this work somebody is partway through, or live state that is not?`);
  }
  if (stateKinds === 0) {
    out.push("NOTHING WAS EXAMINED — no kind holds `state`. That is not a pass.");
  }
  return out.join("\n");
}

if (import.meta.main) {
  const stateKinds = defaultGraphKinds
    .names()
    .filter((n) => defaultGraphKinds.get(n)?.holds === "state").length;
  const undecided = undecidedWorkKinds();
  const text = formatReport(undecided, stateKinds);
  (undecided.length === 0 && stateKinds > 0 ? console.log : console.error)(text);
  process.exit(undecided.length === 0 && stateKinds > 0 ? 0 : 1);
}
