/**
 * The SMART Guidelines KG classes smart-base names, read from its own code
 * lists: `code-lists/sgkg-l1-classes.json` and `code-lists/sgkg-l2-classes.json`.
 *
 * Document kinds name a section's class as `sgkg-l1#<code>` or
 * `sgkg-l2#<code>` (`modelledBy`), and the L1 extraction and the L1
 * recommendation scenarios emit those classes. Each checks against this set.
 *
 * The lists were taken from litlfred/smart-kg on 2026-10-23, where they had
 * been pinned by commit since 2026-10-02 (bean pebe). smart-kg is deprecated
 * (owner, 2026-10-16), so smart-base owns them now and there is no pin to
 * keep in step.
 *
 * @module smart-base/scripts/kg-classes
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const HERE = resolve(import.meta.dir, "..");

/** The code list behind each class system. */
export const KG_CLASS_LISTS = {
  "sgkg-l1": join(HERE, "code-lists", "sgkg-l1-classes.json"),
  "sgkg-l2": join(HERE, "code-lists", "sgkg-l2-classes.json"),
} as const;

/** Every class, as `<system>#<code>`. */
export function kgClasses(lists: Record<string, string> = KG_CLASS_LISTS): Set<string> {
  const out = new Set<string>();
  for (const [system, file] of Object.entries(lists)) {
    const list = JSON.parse(readFileSync(file, "utf-8")) as { codes: { code: string }[] };
    for (const c of list.codes) out.add(`${system}#${c.code}`);
  }
  return out;
}
