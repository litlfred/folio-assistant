/**
 * The baseline split for `check-catalogue.ts`, in its own module so it can be
 * tested.
 *
 * Bean `yl5w`. `check-catalogue.ts` does its work at module top level and ends
 * in `process.exit`, so importing it to test anything runs the whole check
 * against `who-iris/` and cannot be pointed at a fixture. The decisions live
 * here; what surrounds them is `existsSync`.
 *
 * The same shape as `cat-harness/scripts/bean-store-read.ts`: the shared
 * reader is a module, and the checks that use it are scripts.
 *
 * @module who-iris/scripts/catalogue-baseline
 */

/** Where the known-dead `localPath`s are recorded, instance-relative. */
export const BASELINE_FILE = "catalogue/localpath-baseline.json";

export interface Finding {
  /** Stable identity: node id plus, for a bitstream, its index. */
  key: string;
  /** What a reader is shown. */
  line: string;
}

export interface Partitioned {
  /** Not in the baseline. These FAIL. */
  problems: string[];
  /** Already recorded. Listed, never failed. */
  outstanding: string[];
  /** Baseline entries nothing matched — repaired, so the file can shrink. */
  stale: string[];
}

/**
 * Split findings into what fails, what is already known, and which baseline
 * entries nothing matched.
 *
 * **A baseline entry nothing matched is reported rather than dropped**, which
 * is the property that keeps the file from fossilising: `bean-bodies` has it
 * for the same reason, and without it a baseline only ever grows and nobody
 * can tell a repaired defect from one the reader stopped seeing.
 */
export function partitionAgainstBaseline(found: Finding[], known: Set<string>): Partitioned {
  const matched = new Set<string>();
  const problems: string[] = [];
  const outstanding: string[] = [];
  for (const f of found) {
    if (known.has(f.key)) {
      matched.add(f.key);
      outstanding.push(f.line);
    } else {
      problems.push(f.line);
    }
  }
  return { problems, outstanding, stale: [...known].filter((k) => !matched.has(k)).sort() };
}

/**
 * Read the baseline, treating every failure as an EMPTY baseline.
 *
 * Missing, unreadable or unparseable must never read as "everything is
 * known" — that would turn a typo in this file into a silent pass over the
 * whole backlog. Empty means every finding fails, which is the safe
 * direction and the one a person notices.
 */
export function readBaseline(read: () => string): Set<string> {
  try {
    const raw = JSON.parse(read()) as { known?: unknown };
    return new Set(Array.isArray(raw.known) ? raw.known.filter((k): k is string => typeof k === "string") : []);
  } catch {
    return new Set<string>();
  }
}
