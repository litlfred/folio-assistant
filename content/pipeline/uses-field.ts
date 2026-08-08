/**
 * One parser for the `uses:` field of a block's `.ts` source.
 *
 * `uses[]` is the **editorial** relation — what a reader must have read
 * to follow a block — and AGENTS.md makes it the signal every ordering
 * metric is computed from. It was being extracted from source text by
 * four independent hand-rolled parsers, two of which could return a
 * *different field's* array as the block's dependencies:
 *
 * - `conditional-class-banner-audit` (a CI gate) and
 *   `conjectural-propagation-audit` shared a verbatim copy built on
 *   `text.indexOf("uses:")` with no word boundary, so a field named
 *   `causes:` matched — and the following `indexOf("[")` then walked to
 *   whatever array came next.
 * - `prune-transitive-deps` matched `/uses:\s*\[[\s\S]*?\]/`, also
 *   without a boundary, on its **write** path.
 * - `qa-checkers-extended` had the boundary but still stopped at the
 *   first `]`.
 *
 * Two failure shapes, both silent. Stopping at the first `]` drops an
 * entry containing one and yields `[]` — a block with no dependencies.
 * Matching the wrong field yields a plausible-looking list of labels
 * that were never dependencies at all.
 *
 * Parsing TypeScript source with a scanner is not ideal; the blocks are
 * modules and could be imported. That is a larger change than the bug
 * warrants, and every existing caller already works on text — so this
 * consolidates the scanning rather than replacing it. See bean `jwd9`.
 *
 * @module content/pipeline/uses-field
 */

/** Identifier characters, for deciding what is a whole field name. */
const IDENT = /[A-Za-z0-9_$]/;

export interface UsesField {
  /** Offset of the `u` in `uses:`. */
  fieldStart: number;
  /** Offset of the opening `[`. */
  arrayStart: number;
  /** Offset just past the matching `]`. */
  arrayEnd: number;
  /** String entries, in source order. */
  entries: string[];
}

/**
 * Offset of the `uses` **field** — a `uses` not preceded by an
 * identifier character, followed by optional space and a `:`.
 *
 * The boundary is what keeps `causes:`, `misuses:` and `reuses:` out.
 * JS `\b` is not enough on its own here because the old code used a
 * bare `indexOf`, and `\b` would also accept `$uses`.
 */
function findFieldStart(text: string, name: string, from = 0): number {
  let i = from;
  for (;;) {
    i = text.indexOf(name, i);
    if (i < 0) return -1;
    const before = i > 0 ? text[i - 1] : " ";
    if (!IDENT.test(before)) {
      // Allow whitespace between the name and its colon.
      let j = i + name.length;
      while (j < text.length && (text[j] === " " || text[j] === "\t")) j++;
      if (text[j] === ":") return i;
    }
    i += name.length;
  }
}

/**
 * Offset just past the `]` matching the `[` at `open`, or -1.
 *
 * Depth-counting and string-aware: an entry may legitimately contain a
 * bracket (`"def:family[0]"`), and stopping at the first `]` turns that
 * block into one with no dependencies.
 */
function matchingBracket(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      i++;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === "\\") i++;
        i++;
      }
      continue;
    }
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

/**
 * Locate the `uses: [...]` field, or `undefined` when there is none.
 *
 * Returns `undefined` rather than an empty result when the field is
 * absent, so a caller can tell "no `uses` field" from "`uses: []`".
 * Writers depend on that: rewriting a field that is not there would
 * append one.
 */
export function findArrayField(text: string, name: string): UsesField | undefined {
  let from = 0;
  for (;;) {
    const fieldStart = findFieldStart(text, name, from);
    if (fieldStart < 0) return undefined;
    // Skip past the name + optional spaces + `:` to the value.
    let i = fieldStart + name.length;
    while (i < text.length && text[i] !== ":") i++;
    i++;
    while (i < text.length && /\s/.test(text[i])) i++;
    if (text[i] !== "[") {
      // A field that is not an array literal — a spread, a variable.
      // Not something this scanner can read; keep looking rather than
      // silently reporting the next array along.
      from = fieldStart + name.length;
      continue;
    }
    const arrayEnd = matchingBracket(text, i);
    if (arrayEnd < 0) return undefined;
    const inner = text.slice(i + 1, arrayEnd - 1);
    const entries = [...inner.matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => m[1] ?? m[2]);
    return { fieldStart, arrayStart: i, arrayEnd, entries };
  }
}

/** Locate the `uses: [...]` field specifically. */
export function findUsesField(text: string): UsesField | undefined {
  return findArrayField(text, "uses");
}

/**
 * Remove an array field's `name: [...]` text entirely, leaving the rest
 * intact. Used to blank downstream-reference fields before scanning the
 * remaining source for evidence about the block itself.
 */
export function stripArrayField(text: string, name: string): string {
  for (;;) {
    const f = findArrayField(text, name);
    if (!f) return text;
    text = text.slice(0, f.fieldStart) + text.slice(f.arrayEnd);
  }
}

/** The block's `uses[]` entries; `[]` when the field is absent. */
export function parseUsesField(text: string): string[] {
  return findUsesField(text)?.entries ?? [];
}

/**
 * Replace the `uses: [...]` field's array literal with `replacement`.
 *
 * Returns the text unchanged when there is no `uses` field — callers
 * that must know use `findUsesField` first.
 */
export function replaceUsesArray(text: string, replacement: string): string {
  const f = findUsesField(text);
  if (!f) return text;
  return text.slice(0, f.arrayStart) + replacement + text.slice(f.arrayEnd);
}

/**
 * Remove the whole `uses: [...]` field, plus a trailing comma and the
 * whitespace that would otherwise be left behind.
 */
export function removeUsesField(text: string): string {
  const f = findUsesField(text);
  if (!f) return text;
  let end = f.arrayEnd;
  if (text[end] === ",") end++;
  // Take the preceding indentation with it, so the field's line does
  // not survive as a blank one.
  let start = f.fieldStart;
  while (start > 0 && (text[start - 1] === " " || text[start - 1] === "\t")) start--;
  if (text[end] === "\n") end++;
  else if (start > 0 && text[start - 1] === "\n") start--;
  return text.slice(0, start) + text.slice(end);
}
