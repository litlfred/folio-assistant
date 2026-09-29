/**
 * A gate that examined NOTHING must refuse, not pass.
 *
 * Bean `iym1`, class `6tkl`: an empty corpus makes every count zero, and zero
 * reads as a clean run. This repository has paid for it at least four times —
 * `6tkl` itself (a gate hardcoding two instances of eight), `pzdv` (two HARD
 * gates green over zero titles), `a6kl` (an L1 gate reporting "nothing to check"
 * over 1,402 files), and `check:skills` (measured 2026-09-27: with
 * `cat-harness/skills/` moved aside it printed `Validated: 0, Errors: 0` and
 * exited 0).
 *
 * ## Why this is a module rather than a few lines in each gate
 *
 * Because the guard was a per-check TEST CONVENTION applied at roughly fourteen
 * sites, each written by hand by whoever happened to hold the bean, and nothing
 * read across them. `iym1`'s measurement: revert `a6kl`'s fix and re-run the
 * gates, and six of them return rc=0 — only the gate itself refused. A new gate
 * written with the defect from day one is caught by nothing, because the
 * convention is only ever applied by an author who already knows about it.
 *
 * A shared function does not fix that on its own. What it does is make the
 * correct behaviour cheaper to reach than the incorrect one, and give the
 * cross-gate reader a single shape to consume.
 *
 * ## Why the message names every source and its state
 *
 * "0 files validated" does not say whether a directory is missing,
 * present-and-empty, or present with nothing matching the filter, and those are
 * three different repairs: a wrong path, an empty instance, a filter that has
 * stopped matching what the corpus is named. Reporting the state per source is
 * what turns a refusal into an action — and on `check:skills` it immediately
 * surfaced four sources resolving under the wrong root.
 *
 * ## Why exit 2 rather than 1
 *
 * 1 is "determined, and it is wrong". 2 is "could not determine". A run that
 * examined nothing has not established that there are no errors, so reporting a
 * clean verdict would answer a question it never asked. Same split
 * `check:bun-pin` and `check:red-gate-is-last` use for a scan that matched no
 * site.
 *
 * @covers none — a shared helper, not an audit of any declared graph kind
 * @graphNode tool
 */

/** One place a gate looked, and what it found there. */
export interface Source {
  /** Short name the reader will recognise from the gate's own output. */
  label: string;
  /** The resolved path, printed so a wrong root is visible rather than inferred. */
  dir: string;
  /** The directory exists. */
  present: boolean;
  /** Members found under it — files, entries, whatever the gate counts. */
  found: number;
}

/** What the refusing gate is, for a message a reader can act on. */
export interface Gate {
  /** The `bun run` target, so the reader can re-run exactly this. */
  script: string;
  /**
   * The declared graph kind this gate claims to audit, or `undefined`.
   *
   * Present because a vacuous pass is worse when a kind is credited to it:
   * `audit:coverage` reads `@covers` as coverage, so a gate that examined
   * nothing while declaring a kind makes that kind read as audited. Bean `3srh`
   * is the reason the declaration is trusted; this is what makes trusting it
   * safe.
   */
  covers?: string;
}

/**
 * Is this run's population empty, and if so what should the reader be told?
 *
 * Returns `undefined` when at least one source yielded something — the gate may
 * then pass or fail on its own findings. Returns the message to print before
 * exiting 2 when every source was empty.
 *
 * Pure and exported so the decision can be tested over a CONSTRUCTED empty
 * corpus. A gate cannot be pointed at one without moving directories, and a test
 * that moves directories during `bun test` repairs the tree other gates are
 * being judged on — bean `ymsu`, which is this defect's own shape one layer up.
 */
export function vacuityRefusal(gate: Gate, looked: readonly Source[]): string | undefined {
  if (looked.some((s) => s.found > 0)) return undefined;

  const width = Math.max(0, ...looked.map((s) => s.label.length));
  const rows = looked.map((s) => {
    const state = !s.present ? "ABSENT" : "present, nothing matched";
    return `  · ${s.label.padEnd(width)}  ${state}  (${s.dir})`;
  });

  const credited =
    gate.covers === undefined || gate.covers === "none"
      ? ""
      : `\n\nThis gate declares \`@covers ${gate.covers}\`, which \`audit:coverage\` reads as ` +
        `coverage of\nthat kind — so passing vacuously would credit \`${gate.covers}\` to a gate ` +
        `that examined\nnothing at all.`;

  const sourceList =
    looked.length === 0
      ? "  · (this gate recorded NO sources, which is its own defect — it cannot say\n" +
        "    where it looked)"
      : rows.join("\n");

  return (
    `\`${gate.script}\` examined 0 members — refusing to call that a clean run.\n\n` +
    `Every source it reads, and what was found:\n${sourceList}` +
    credited +
    `\n\nA filter over nothing passes, so a green verdict here would mean only that ` +
    `nothing was\nlooked at. Bean \`iym1\`; the class is \`6tkl\`.\n\n` +
    `If an empty population is legitimate for this instance, that is a decision to ` +
    `record\nwith its reason — the way \`check-bean-front-matter\` baselines its ` +
    `outstanding\nduplicates — not a run to let pass in silence.`
  );
}
