/**
 * Link every defined term in a piece of Markdown prose to its definition.
 *
 * Owner, 2026-09-29: *"terms in readme like Skills, Process, Role, etc should
 * be links in README.md s"*. A capitalized defined term is a link wherever it
 * appears in prose, not only at its first use, so a reader landing mid-page
 * can still reach the definition in one click.
 *
 * ## What is linked, and what is left alone
 *
 * - A term is matched by its spaced name (`Knowledge Graph`), singular or
 *   plural, as a whole, case-sensitive word; longer names first, so
 *   `Node Kind` is never also read as `Node`.
 * - Left alone: fenced code and inline code, headings, the text and target of
 *   an existing link, HTML tags, and **bold** spans — the bold names in a
 *   Role table (`**Knowledge Graph Data Store**`) are names of their own, and
 *   linking a word inside one would split it.
 *
 * Pure: text in, text out. Callers decide where each term's link goes,
 * because the right relative path depends on where the README is.
 *
 * @module content/pipeline/term-links
 */
import { existsSync } from "node:fs";
import { join, relative } from "node:path";

/** One term: its key (`KnowledgeGraph`) and the link to write for it. */
export interface TermTarget {
  key: string;
  href: string;
}

/** `KnowledgeGraph` → `Knowledge Graph`. */
export const spacedTerm = (key: string): string => key.replace(/([a-z])([A-Z])/g, "$1 $2");

/** `Knowledge Graph` → `knowledge-graph`: the anchor bootstrap's schema page gives each term. */
export const termAnchor = (key: string): string => spacedTerm(key).toLowerCase().replace(/ /g, "-");

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The regions of a line that are NOT prose: inline code, an existing link
 * (text and target), an HTML tag, a bold span, an autolink.
 */
const PROTECTED = /`[^`]*`|\[[^\]]*\]\([^)]*\)|<[^>]+>|\*\*[^*]+\*\*|https?:\/\/\S+/g;

/** Link every term occurrence in `markdown`, returning the text and how many links were added. */
export function linkTerms(markdown: string, targets: readonly TermTarget[]): { text: string; added: number } {
  // No terms, no links: an empty alternation would match the empty string at
  // every word boundary (measured: a fixture with no bootstrap got `[](undefined)`
  // around every word).
  if (targets.length === 0) return { text: markdown, added: 0 };
  const byLength = [...targets].sort((a, b) => spacedTerm(b.key).length - spacedTerm(a.key).length);
  const pattern = new RegExp(`\\b(${byLength.map((t) => esc(spacedTerm(t.key))).join("|")})(s|es)?\\b`, "g");
  const hrefOf = new Map(targets.map((t) => [spacedTerm(t.key), t.href]));
  let added = 0;
  let fenced = false;
  const lines = markdown.split("\n");
  // A table's header row is followed by its `|---|` separator: a column name,
  // not prose, and a link there would read as a sort control.
  const isHeader = (i: number) => /^\s*\|/.test(lines[i]!) && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? "");
  const out = lines.map((line, i) => {
    if (isHeader(i)) return line;
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return line;
    }
    if (fenced || /^\s{0,3}#/.test(line) || /^\s*<!--/.test(line)) return line;
    // Split into protected and prose pieces, and link only the prose.
    let result = "";
    let last = 0;
    const linkProse = (prose: string) =>
      prose.replace(pattern, (m, name: string) => {
        added++;
        return `[${m}](${hrefOf.get(name)!})`;
      });
    for (const m of line.matchAll(PROTECTED)) {
      result += linkProse(line.slice(last, m.index)) + m[0];
      last = m.index! + m[0].length;
    }
    return result + linkProse(line.slice(last));
  });
  return { text: out.join("\n"), added };
}

/** Occurrences of a term in prose that are NOT links — what a guard test fails on. */
export function unlinkedTerms(markdown: string, targets: readonly TermTarget[]): string[] {
  const found: string[] = [];
  const { text } = linkTerms(markdown, targets.map((t) => ({ key: t.key, href: "\u0000" })));
  for (const m of text.matchAll(/\[([^\]]+)\]\(\u0000\)/g)) found.push(m[1]!);
  return found;
}

/**
 * bootstrap's defined terms, each linked to its row in bootstrap's schema page
 * as seen from `fromDir` — or none when that page is not there, so a README
 * outside a repository that carries bootstrap links nothing rather than
 * pointing at a file that does not exist.
 */
export function bootstrapTermTargets(repoRoot: string, fromDir: string, keys: readonly string[]): TermTarget[] {
  const page = join(repoRoot, "bootstrap", "schemas", "README.md");
  if (!existsSync(page)) return [];
  const rel = relative(fromDir, page).split("\\").join("/");
  return keys.map((key) => ({ key, href: `${rel}#${termAnchor(key)}` }));
}
