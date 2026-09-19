/**
 * The one YAML front-matter reader for this repository's self-declaring files.
 *
 * Several node kinds here declare themselves in front matter — memory entries
 * (`folio-memory/v1`), fsh-guts nodes (`folio-fsh-guts/v1`), beans, skills.
 * This is the reader they share.
 *
 * ## Why it is extracted rather than copied
 *
 * It was private to `scripts/agent-memory.ts`, whose own comment says it is
 * "a small hand-rolled one with no block-scalar support". That is a fine
 * thing for one caller to say about its own parser and a bad thing for a
 * second caller to discover: `fsh-guts/proposals/*.md` carry
 * `summary: >-` with the text on following lines, which that parser reads as
 * the literal string `>-` and then silently drops the prose. A second
 * hand-rolled parser beside the first is the two-answers-to-one-question
 * drift this repository keeps paying for, so the parser moved and grew the
 * one feature the new caller needs.
 *
 * ## What it deliberately does NOT do
 *
 * It is not a YAML implementation and must not become one. It reads scalars,
 * `- ` lists, and folded/literal block scalars, because that is what the
 * corpus uses. Anything richer — anchors, flow mappings, nested maps — should
 * make a caller reach for a real parser rather than make this grow, because a
 * half-YAML that handles most documents is worse than an obvious limit: it
 * fails on the document nobody tested and looks like data loss rather than
 * like an unsupported feature.
 *
 * @module schemas/front-matter
 * @graphNode schema
 */

/** A front matter block: scalars and lists of scalars. */
export type FrontMatter = Record<string, string | string[]>;

function stripQuotes(v: string): string {
  return /^"(.*)"$/.test(v) ? v.slice(1, -1).replace(/\\"/g, '"') : v;
}

/**
 * Split a document into its front matter and the body after it.
 *
 * A document with no front matter yields an empty map and the whole text as
 * body — NOT an error. A file that does not declare itself is a fact for the
 * caller to act on (`isSkillMd` and the log sweep both do), and throwing here
 * would make "undeclared" indistinguishable from "malformed".
 */
export function parseFrontMatter(text: string): { fm: FrontMatter; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) return { fm: {}, body: text };

  const fm: FrontMatter = {};
  const lines = m[1]!.split("\n");
  let key = "";

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;

    const kv = /^([A-Za-z$][\w$-]*):\s*(.*)$/.exec(line);
    if (kv) {
      key = kv[1]!;
      const v = kv[2]!.trim();

      // A block scalar: `>` and `>-` fold newlines to spaces, `|` and `|-`
      // keep them. The chomping indicator only governs the TRAILING newline,
      // which is stripped here either way — nothing in this corpus depends on
      // a trailing blank line surviving, and pretending to honour a
      // distinction that is never exercised is how a parser acquires
      // behaviour nobody has tested.
      const block = /^([|>])([-+]?)$/.exec(v);
      if (block) {
        const fold = block[1] === ">";
        const collected: string[] = [];
        let j = i + 1;
        for (; j < lines.length; j += 1) {
          const next = lines[j]!;
          // A blank line belongs to the block; a non-indented, non-blank line
          // ends it. Indentation is "more than zero" rather than a measured
          // indent, because every block in this corpus is at one level and
          // guessing the parent indent is where a small parser goes wrong.
          if (next.trim() === "") {
            collected.push("");
            continue;
          }
          if (!/^\s/.test(next)) break;
          collected.push(next.replace(/^\s+/, ""));
        }
        i = j - 1;
        while (collected.length && collected[collected.length - 1] === "") collected.pop();
        fm[key] = fold ? collected.join(" ").replace(/\s+/g, " ").trim() : collected.join("\n");
        continue;
      }

      fm[key] = v === "" ? [] : stripQuotes(v);
      continue;
    }

    const item = /^\s*-\s+(.*)$/.exec(line);
    if (item && key) {
      const list = Array.isArray(fm[key]) ? (fm[key] as string[]) : [];
      list.push(stripQuotes(item[1]!.trim()));
      fm[key] = list;
    }
  }

  return { fm, body: text.slice(m[0].length) };
}

/** A scalar field, or undefined when absent or a list. */
export function scalar(fm: FrontMatter, key: string): string | undefined {
  const v = fm[key];
  return typeof v === "string" && v !== "" ? v : undefined;
}

/** A list field. A single scalar counts as a one-element list. */
export function list(fm: FrontMatter, key: string): string[] {
  const v = fm[key];
  if (Array.isArray(v)) return v;
  return typeof v === "string" && v !== "" ? [v] : [];
}
