/**
 * Derive an e2e fixture from a real QA sidecar, without inheriting its verdict.
 *
 * @module tests/support/qa-fixture
 *
 * ## The failure this exists to stop
 *
 * `tests/qa-panel.e2e.ts` read
 * `docs/assets/qa/crdm-methodology/what-is-not-built-yet.block.json` straight
 * off disk and asserted the panel's first row was a **failing**
 * `voice-status-leak`. Its header argued for exactly that — read the corpus,
 * so "nothing here can drift from what the generator produces".
 *
 * Then PR #302 adjudicated all 26 `voice-*` findings to zero. Correctly: the
 * block is titled "What is not built yet" and `**Not yet implemented:**` is
 * the heading over its inventory of gaps. The sidecar became 48 criteria with
 * no failure, the first row became the first alphabetical *passing* one, and
 * **`main` went red** — on a content change that was right.
 *
 * ## Shape is worth reading from disk. A verdict is not.
 *
 * The header's argument is sound about **shape**: a hand-made fixture can
 * agree with the code while the code disagrees with what the generator really
 * writes. It does not hold for **verdicts**. A verdict is content, content is
 * supposed to change, and a clean sweep is the QA system working. A gate that
 * goes red when the corpus gets cleaner punishes the thing it exists to
 * encourage.
 *
 * So: take the shape off disk, set the verdict under test, and **throw** if
 * the criterion named has left the file. Defaulting the other way is the
 * failure mode — every assertion downstream would silently test whichever row
 * sorted first instead, which is exactly what happened.
 *
 * `qa-panel.e2e.ts` had already reached this conclusion once, one fixture
 * down: `STALE_JSON` carries a comment recording that it *was* served from the
 * corpus, that re-running the sweep cleared it, and that rendering that state
 * "must not depend on the corpus happening to hold an out-of-date verdict on
 * the day the suite runs". Bean `folio-assistant-iumj`.
 */

import { readFileSync } from "node:fs";

/** The shape this helper needs. Deliberately partial — a sidecar has more. */
interface SidecarDoc {
  counts: Record<string, number>;
  criteria: Array<{
    id: string;
    result: string;
    severity?: string;
    evidence?: string[];
    witnesses?: Array<{ kind: string }>;
  }>;
}

export interface VerdictOverride {
  /** The criterion id to put a verdict on. Must be in the sidecar. */
  id: string;
  /** `fail`, `warn`, … The panel folds anything not "loud". */
  result: string;
  severity?: string;
  /** `file:line: <quote>`, the form the checkers document. */
  evidence?: string[];
  /**
   * Keep only witnesses of these kinds.
   *
   * The case that needs it: an adjudicated criterion carries the agent
   * witness that cleared it AHEAD of the script witness that found it, so a
   * spec asserting "the script that ruled on this" gets the adjudicator.
   * Restoring the pre-adjudication state means dropping the agent entry.
   */
  witnessKinds?: string[];
}

/**
 * Read a sidecar and return it as JSON with the given verdicts applied.
 *
 * Throws when an override names a criterion the sidecar no longer has. That is
 * the whole point: a fixture whose subject has gone must fail loudly, naming
 * the criterion, rather than quietly testing a different row.
 */
export function sidecarWithVerdicts(path: string, overrides: VerdictOverride[]): string {
  const doc = JSON.parse(readFileSync(path, "utf8")) as SidecarDoc;

  for (const o of overrides) {
    const c = doc.criteria.find((x) => x.id === o.id);
    if (!c) {
      throw new Error(
        `fixture: \`${o.id}\` is no longer a criterion in ${path}. ` +
          `Every assertion keyed to it would silently test whichever row sorts ` +
          `first instead — so this throws rather than defaulting. Either the ` +
          `criterion was renamed (update the spec) or it was removed (the spec ` +
          `needs a different subject).`,
      );
    }
    const was = c.result;
    c.result = o.result;
    if (o.severity !== undefined) c.severity = o.severity;
    if (o.evidence !== undefined) c.evidence = o.evidence;
    if (o.witnessKinds !== undefined && c.witnesses) {
      c.witnesses = c.witnesses.filter((w) => o.witnessKinds!.includes(w.kind));
    }
    // Keep `counts` consistent with `criteria`. A panel header that disagrees
    // with the rows below it is a defect a spec should be able to catch, so
    // the fixture must not be the thing introducing one.
    if (was !== o.result) {
      if (doc.counts[was] !== undefined) doc.counts[was] -= 1;
      doc.counts[o.result] = (doc.counts[o.result] ?? 0) + 1;
    }
  }
  return JSON.stringify(doc);
}

/** Read a sidecar unchanged — when the spec really is about shape only. */
export function sidecar(path: string): string {
  return readFileSync(path, "utf8");
}
