/**
 * Reading the bean store as **files**, front matter and body kept apart.
 *
 * `beans list` and `beans check` both read the store, and between them they
 * still missed three beans that no tool and no person could use — bean `sfhr`,
 * measured 2026-09-20 with `beans check` reporting *"No link issues found"*:
 *
 * | bean | defect |
 * |---|---|
 * | `70c7` | `in-progress` with an **empty body** — front matter only |
 * | `52dz` | a `title: \|-` block that **swallowed the first ~10 lines of its body**, including a `## Done when` with three unchecked boxes |
 * | `nvbr` | *"blocked on bean `fsch`"* in prose; `fsch` is `scrapped` in the archive |
 *
 * None is a link defect, which is the whole of what the CLI's check covers. So
 * the readers that catch them need the **raw** front matter (a folded title is
 * invisible once a YAML loader has finished with it) and the body separately
 * from it. That is what this module hands out, and nothing more — the verdicts
 * live in the checks that import it.
 *
 * @module folio-assistant/scripts/bean-store-read
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export { beanDefsDir } from "./check-bean-parents.ts";
import { beanDefsDir } from "./check-bean-parents.ts";

/** One bean, as it sits on disk. */
export interface BeanFile {
  id: string;
  file: string;
  /** True when it was read from `defs/archive/` rather than `defs/`. */
  archived: boolean;
  /** The front-matter block, VERBATIM — folded scalars intact. */
  frontMatter: string;
  /** Everything after the closing `---`. */
  body: string;
  title: string;
  status: string;
  type: string;
  parent: string;
  tags: string[];
}

/** One scalar out of raw front matter. Quotes stripped; folds NOT resolved. */
export function scalar(fm: string, key: string): string {
  const m = new RegExp(`^${key}:[ \\t]*(.*)$`, "m").exec(fm);
  return m ? m[1]!.trim().replace(/^['"]|['"]$/g, "") : "";
}

/**
 * A block list (`tags:` followed by indented `- ` items).
 *
 * Read with a regex rather than a YAML dependency, for the same reason
 * `readStoreConfig` gives: the file is written by the CLI in one shape, and a
 * loader would resolve the very folds {@link isFoldedTitle} needs to see.
 */
export function blockList(fm: string, key: string): string[] {
  const m = new RegExp(`^${key}:[ \\t]*\\n((?:[ \\t]+-[ \\t]*.*\\n?)+)`, "m").exec(fm);
  if (!m) {
    const inline = scalar(fm, key);
    if (!inline || inline.startsWith("[") === false) return inline ? [inline] : [];
    return inline.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim()).filter(Boolean);
  }
  return m[1]!.split("\n").map((l) => l.replace(/^[ \t]*-[ \t]*/, "").trim()).filter(Boolean);
}

/**
 * Did this bean's `title:` swallow body lines?
 *
 * A YAML block scalar (`|`, `|-`, `>`, `>-`) continues for as long as the
 * indentation holds, so a title written that way takes whatever followed it.
 * `52dz` lost three unchecked Done-when boxes this way and read as complete.
 */
export function isFoldedTitle(fm: string): boolean {
  return /^title:[ \t]*[|>][-+]?[ \t]*$/m.test(fm);
}

/**
 * Every bean in this instance's store, or `null` when there is no store.
 *
 * **The archive is read too**, and that is not a convenience. `nvbr` is
 * *"blocked on bean `fsch`"*, and `fsch` is `scrapped` **in the archive** — a
 * reader that stopped at `defs/` would report its target as *missing* rather
 * than as *closed*, which is a different finding with a different remedy.
 */
export function readBeanFiles(root: string): BeanFile[] | null {
  const dir = beanDefsDir(root);
  if (dir === null || !existsSync(dir)) return null;
  const out: BeanFile[] = [];
  const sources: { dir: string; archived: boolean }[] = [{ dir, archived: false }];
  const archive = join(dir, "archive");
  if (existsSync(archive)) sources.push({ dir: archive, archived: true });
  for (const src of sources)
  for (const name of readdirSync(src.dir).sort()) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(join(src.dir, name), "utf-8");
    const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
    // A file with no front matter is not a bean; `beans check` owns that.
    if (!m) continue;
    const fm = m[1]!;
    out.push({
      id: (/^#\s*(\S+)/m.exec(fm) ?? [, name.replace(/\.md$/, "")])[1]!,
      file: name,
      archived: src.archived,
      frontMatter: fm,
      body: m[2] ?? "",
      title: scalar(fm, "title"),
      status: scalar(fm, "status"),
      type: scalar(fm, "type"),
      parent: scalar(fm, "parent"),
      tags: blockList(fm, "tags"),
    });
  }
  return out;
}

/** Statuses that mean the item is still live. */
export const OPEN_STATUSES = new Set(["draft", "todo", "in-progress"]);
/** Statuses that mean it is finished, one way or the other. */
export const CLOSED_STATUSES = new Set(["completed", "scrapped"]);
