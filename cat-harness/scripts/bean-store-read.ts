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
import { resolveBeanDefs } from "./beans.ts";

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
 *
 * Kept at this signature deliberately. It is the convenient shape for a reader
 * that wants the beans and has no verdict to reach about the store itself, and
 * three of the four callers are exactly that. Anything that must DISTINGUISH
 * the absences, or see the files this drops, wants {@link readBeanStore} —
 * this one flattens both back into `null` and silence.
 */
export function readBeanFiles(root: string): BeanFile[] | null {
  const store = readBeanStore(root);
  return store.state === "read" ? store.beans : null;
}

/**
 * Names in the bean directory that are deliberately not beans.
 *
 * An explicit list rather than a pattern, and the distinction is the point: a
 * pattern would quietly absorb the next malformed file that happened to match
 * it, which is the whole failure {@link readBeanStore} exists to stop. Empty
 * of everything but `README.md` on purpose — the live store carries no such
 * file today (measured 2026-09-21, 630 `.md` files, none unfenced), so this is
 * a guard against a predictable future addition rather than an amnesty for
 * anything present.
 */
export const NOT_BEANS = new Set(["README.md"]);

/** A `.md` in the bean directory that carries no parseable front matter. */
export interface SkippedFile {
  /** The file name, as it sits in `defs/` or `defs/archive/`. */
  file: string;
  archived: boolean;
  /** True when {@link NOT_BEANS} names it, so it is expected rather than a defect. */
  expected: boolean;
}

/**
 * The bean store, with the two answers {@link readBeanFiles} cannot give.
 *
 * `readBeanFiles` returns `BeanFile[] | null`, and that `null` carries two
 * different questions while every skipped file is dropped silently. Bean
 * `t6s7` measured both:
 *
 * - **A mangled FENCE makes a bean invisible.** One planted file whose closing
 *   fence was `--` left `check:bean-front-matter` reporting the same count as
 *   a clean store — 629 either way, `✓ no NEW defect`, exit 0 — while
 *   `beans list` went 626 → 627 and showed a ghost row with no title, its id
 *   taken from the FILENAME. The two readers disagreed about whether the bean
 *   existed and the gate whose job is *"every bean's front matter is readable"*
 *   said clean.
 * - **Declared-but-absent read as "no store".** One `null` for *"this instance
 *   has none"* and *"this instance says its store is HERE and it is not"* —
 *   `dh4f`, reported as `nothing to check`, exit 0.
 *
 * So: three states, `skipped` alongside the beans, and {@link resolveBeanDefs}
 * for the provenance that separates the two absences. `readBeanFiles` keeps
 * its signature and delegates, so `check-bean-bodies`, `check-stale-paths` and
 * `check-ready-to-close` are untouched; `check-bean-front-matter` is the one
 * whose job this actually is, and it reads the richer shape.
 *
 * `filesSeen` is carried so a caller can RECONCILE — `beans + skipped` must
 * account for every `.md` in the directory. A count that is merely printed is
 * a count nothing checks, which is the same defect one level out.
 */
export type BeanStore =
  /** No bean store here, and nothing claims otherwise. Legitimate. */
  | { state: "absent"; dir: string | null }
  /** A declaration names this directory and it is not there. `dh4f`. */
  | { state: "declared-but-absent"; dir: string }
  | { state: "read"; dir: string; beans: BeanFile[]; skipped: SkippedFile[]; filesSeen: number };

export function readBeanStore(root: string): BeanStore {
  const { dir, declared } = resolveBeanDefs(root);
  // The graph declares no `bean-defs` node at all.
  if (dir === null) return { state: "absent", dir: null };
  if (!existsSync(dir)) {
    // THE DISCRIMINATOR. Without `declared` these are one branch, and the
    // fallback hands back a plausible `beans/defs` for a repository that never
    // mentioned one — so a folio whose store was moved or deleted reports
    // exactly like a folio that never had one.
    return declared ? { state: "declared-but-absent", dir } : { state: "absent", dir };
  }

  const beans: BeanFile[] = [];
  const skipped: SkippedFile[] = [];
  const sources: { dir: string; archived: boolean }[] = [{ dir, archived: false }];
  const archive = join(dir, "archive");
  if (existsSync(archive)) sources.push({ dir: archive, archived: true });

  // COUNTED INDEPENDENTLY of the loop below, and that is the whole point.
  // Derived as `beans.length + skipped.length` it is a restatement of the two
  // lists, so `beans + skipped === filesSeen` holds by construction and the
  // reconciliation is a tautology — a check that cannot fail, which is `xom7`
  // and is the very defect this module was reopened for. Caught by mutating
  // it: every test here still passed with `filesSeen` computed from the lists.
  //
  // As a separate traversal it is a real guard. Any future `continue` added to
  // the loop that forgets to record what it dropped makes the two disagree,
  // and the gate exits 2 instead of undercounting in silence — which is
  // exactly how `t6s7` got here.
  const filesSeen = sources.reduce(
    (n, src) => n + readdirSync(src.dir).filter((name) => name.endsWith(".md")).length,
    0,
  );

  for (const src of sources)
  for (const name of readdirSync(src.dir).sort()) {
    if (!name.endsWith(".md")) continue;
    const text = readFileSync(join(src.dir, name), "utf-8");
    const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
    // REPORTED, not dropped. This read *"a file with no front matter is not a
    // bean; `beans check` owns that"* until `t6s7` — true of a stray README
    // and false of a bean whose fence was mangled, which `beans check` does
    // not own either: it loads such a file as a titleless ghost.
    if (!m) {
      skipped.push({ file: name, archived: src.archived, expected: NOT_BEANS.has(name) });
      continue;
    }
    const fm = m[1]!;
    beans.push({
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
  return { state: "read", dir, beans, skipped, filesSeen };
}

/** Statuses that mean the item is still live. */
export const OPEN_STATUSES = new Set(["draft", "todo", "in-progress"]);
/** Statuses that mean it is finished, one way or the other. */
export const CLOSED_STATUSES = new Set(["completed", "scrapped"]);
