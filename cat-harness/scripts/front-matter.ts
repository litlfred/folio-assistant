/**
 * The one reader for a knowledge-graph node's YAML front matter.
 *
 * @module scripts/front-matter
 *
 * A skill states what it is in two places and only two: a `description:` in its
 * front matter, or — for the minority that carry no front matter at all — its
 * first `#` heading. Every consumer that wants to say what a node IS, rather
 * than merely that it exists, needs the same answer, so it is written here once
 * instead of in each of them.
 *
 * It lived privately inside `scripts/kg-export.ts` until 2026-09-19. That was
 * fine while the exporter was the only caller and stopped being fine the moment
 * `skill_list` needed the same field: this repository has paid for a duplicated
 * parser three times that are written down (three `todo-manager.md`, four
 * doc-id spellings, two `-o` meanings), and the cost is never the second copy —
 * it is the day the two disagree and nothing says which is right.
 *
 * **Deliberately not a YAML library.** Front matter here is a handful of scalar
 * keys and one folded block; `js-yaml` would be a dependency on the MCP
 * server's load path for a regex's worth of work. What it therefore does NOT
 * support is stated rather than assumed: no nested maps, no anchors, no `|`
 * literal blocks, no multi-document streams. A file needing those is a file
 * this reader should not be asked about.
 */

/** The scalar keys a knowledge-graph node is read for. */
export interface FrontMatter {
  name?: string;
  description?: string;
  /**
   * The skill's input contract: an instance-relative path to a JSON Schema
   * (`schemas/skills/<skill>/input.schema.json`) or an external `https://`
   * IRI. The skill points at its contract (#1168, B3b) — nothing infers it
   * from a directory name.
   */
  input?: string;
  /** The skill's output contract, as {@link FrontMatter.input}. */
  output?: string;
}

/**
 * Parse the `name:` and `description:` out of a node's YAML front matter.
 *
 * Returns `{}` for a file with no front matter, which is a real and common
 * state here — 5 of `skills/folio-core`'s 77 skills open on a heading — and is
 * NOT an error. The caller decides what absence means.
 */
export function frontMatter(text: string): FrontMatter {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = text.slice(3, end);
  const out: FrontMatter = {};
  const name = block.match(/^name:\s*(.+)$/m);
  if (name) out.name = name[1].trim();
  // `description: >` folds onto following indented lines.
  const desc = block.match(/^description:\s*(?:>[-+]?\s*\n((?:[ \t]+.*\n?)+)|(.+))$/m);
  if (desc) out.description = (desc[1] ?? desc[2] ?? "").split("\n").map((l) => l.trim()).join(" ").trim();
  for (const key of ["input", "output"] as const) {
    const m = block.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    if (m) out[key] = m[1].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

/** First `# heading` — the fallback title when there is no front matter. */
export function firstHeading(text: string): string | undefined {
  return text.match(/^#\s+(.+)$/m)?.[1].trim();
}

/**
 * What a node says it is, in one line, or `undefined` when it says nothing.
 *
 * **`undefined` is a third state and callers must render it as one.** A skill
 * with no `description:` and no heading is not a skill with an empty summary;
 * printing `""` for it makes a node that never declared itself look identical
 * to one that declared itself as nothing. Measured 2026-09-19 across the seven
 * servable packages: 150 skills, 106 carrying a `description:`.
 *
 * The heading fallback is not a consolation prize. `directory-conventions.md`
 * carries no front matter and opens on *"Directory conventions — what an
 * instance declares it scans"*, which is a better one-line summary than most
 * hand-written `description:` fields.
 */
export function nodeSummary(text: string): string | undefined {
  return frontMatter(text).description ?? firstHeading(text);
}
