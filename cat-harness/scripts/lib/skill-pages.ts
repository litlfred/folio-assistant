/**
 * Which skills have a published instruction page, and the link to one.
 *
 * Bean `qgjh`: "emit links wherever the target resolves". Visualisers printed
 * skill ids as code although the page existed. The page set is READ from the
 * directory `gen-skill-docs.ts` writes, never composed from an id, so a link
 * is emitted only where a page is and a skill without one stays code rather
 * than becoming a link that 404s.
 *
 * ONE answer for every visualiser. Two generators deriving it separately is
 * how one page links a skill another shows as code.
 */
import { existsSync, readdirSync } from "node:fs";
import { basename, join, posix } from "node:path";
import { baseDocsDir } from "../compose-docs.js";

/** Where the instruction pages sit, relative to the base docs layer. */
export const SKILL_PAGES_DIR = "reference/skill-instructions";

/** The base docs layer, the same answer `compose-docs.ts` uses. */

/** The skills with a generated instruction page. */
export function skillPagesOf(repo: string): ReadonlySet<string> {
  const dir = join(baseDocsDir(repo), SKILL_PAGES_DIR);
  return new Set(existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => basename(f, ".md")) : []);
}

/**
 * The href from a page at `fromPage` (relative to the base docs layer, e.g.
 * `tools/index.md`) to `skill`'s instruction page, or `undefined` when the
 * skill has none.
 */
export function skillPageHref(skill: string, fromPage: string, pages: ReadonlySet<string>): string | undefined {
  if (!pages.has(skill)) return undefined;
  return posix.relative(posix.dirname(fromPage.split("\\").join("/")), `${SKILL_PAGES_DIR}/${skill}.html`);
}

