/**
 * Reading a directory's `withheld.json` — what must not be published from it.
 *
 * @module scripts/lib/withheld
 *
 * Bean `cw35`. The format is `folio-withheld/v1` (`schemas/withheld.ts`); an
 * instance's generator writes it from its own licence data, and EVERY surface
 * that publishes from that directory reads it here — the site mount
 * (`mount-instance-docs.ts`) and the library viewer (`library-graph.ts`,
 * `gen-library-viz.ts`). One reader, so the two cannot disagree about what is
 * withheld. The second consumer exists because the first was not the only
 * channel: the 2026-09-24 audit found the viewer publishing ~124k characters
 * of a refused work after the mount had stopped serving it.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";

import { WithheldSchema } from "../../schemas/withheld.js";

export const WITHHELD_FILE = "withheld.json";

/** A withheld entry: its path relative to the directory, and why. */
export interface WithheldEntry {
  path: string;
  reason: string;
}

/**
 * Every entry `dir/withheld.json` names — `[]` when there is no file.
 *
 * A file that is present but unreadable or malformed THROWS: "could not tell
 * what to withhold" must never become "publish everything".
 */
export function withheldEntries(dir: string): WithheldEntry[] {
  const f = join(dir, WITHHELD_FILE);
  if (!existsSync(f)) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(f, "utf-8"));
  } catch (e) {
    throw new Error(`${f} is not valid JSON (${(e as Error).message}) — refusing to publish rather than publish what it withholds`);
  }
  const parsed = WithheldSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `${f} is not a valid folio-withheld/v1 list (${parsed.error.issues[0]?.message ?? "invalid"}) — ` +
        `refusing to publish rather than publish what it withholds`,
    );
  }
  return parsed.data.paths.map((p) => ({ path: p.path.replace(/^\.?\/+/, "").replace(/\/+$/, ""), reason: p.reason }));
}

/** The withheld paths alone. */
export function withheldPaths(dir: string): string[] {
  return withheldEntries(dir).map((e) => e.path);
}

/** A `cpSync` filter that drops every withheld path, and everything beneath it. */
export function withheldFilter(dir: string, withheld: readonly string[]): (src: string) => boolean {
  return (src) => {
    const rel = relative(dir, src).split(sep).join("/");
    return !withheld.some((w) => rel === w || rel.startsWith(`${w}/`));
  };
}

/**
 * Why a library ENTRY directory is withheld by its parent's list, or
 * `undefined` when it is not. The parent is the library root that carries
 * `withheld.json`; the entry is named there as `<slug>/`.
 */
export function withheldReason(entryDir: string): string | undefined {
  const slug = basename(entryDir);
  return withheldEntries(dirname(entryDir)).find((e) => e.path === slug)?.reason;
}
