/**
 * `structure.json` is named in code only by its accessor — bean `rkqp`, owner
 * 2026-09-30 (round 4: "literal allowlist gate").
 *
 * @module scripts/check-structure-accessor
 * @covers library
 *
 * ## Why this exists
 *
 * `structure.json` has two variants since A+B: `pdf-structure/v1` and
 * `notebook-structure/v1`, read through one accessor
 * (`schemas/document-structure.ts`: `readStructure`, `structureOf`). A reader
 * that builds the path itself and parses the file learns ONE variant and
 * misreads the next — a notebook's cell range taken for pages, or an
 * undeclared variant half-rendered. So the quoted token `"structure.json"` on
 * a CODE line is refused outside the accessor and a short allowlist, each
 * entry carrying its reason. Use `STRUCTURE_FILENAME` and `readStructure`.
 *
 * ## What it matches, and what it deliberately does not
 *
 * The exact quoted token — `"structure.json"` or `'structure.json'` — on a
 * line that is not a comment. That is how a path is built. The name inside a
 * longer message (`no structure.json under …`) or a doc comment is prose, not
 * a path, and is not matched: judging prose would make the gate a spelling
 * rule. Test files are exempt, because a fixture has to write the file.
 *
 * ## Both directions
 *
 * An unlisted file is a failure, and so is a STALE entry — an allowlisted file
 * that no longer contains the token — because an allowlist that only grows
 * stops saying anything.
 *
 * Exit: 0 clean, 1 a finding, 2 could not list the corpus (never a pass).
 */
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { gitCorpus } from "../../cat-harness/schemas/git-corpus.ts";

const REPO = resolve(import.meta.dir, "..", "..");

/** Files that may spell the token, and why. Repo-relative. */
// declared-path-literal: these are the allowlist's KEYS — named source files
// this gate exempts, compared against git's corpus listing, not directories
// any declaration resolves.
export const ALLOWED: Readonly<Record<string, string>> = {
  "cat-harness/schemas/document-structure.ts": "the accessor itself: it defines STRUCTURE_FILENAME",
  "folio-assistant-core/schemas/library-ref.ts":
    "EXISTENCE only — whether an entry was ingested at all — and it never parses the file",
  "folio-assistant-core/scripts/check-catalogue.ts":
    "EXISTENCE only — whether a catalogue item's libraryId was ingested — and it never parses the file",
};

const TOKEN = /["']structure\.json["']/;
const COMMENT = /^\s*(\*|\/\/|\/\*)/;

export interface Finding {
  file: string;
  line: number;
  text: string;
}

/** The code lines that spell the token, per file. */
export function scan(files: readonly string[], read: (f: string) => string): Map<string, Finding[]> {
  const out = new Map<string, Finding[]>();
  for (const f of files) {
    const lines = read(f).split("\n");
    const hits: Finding[] = [];
    lines.forEach((text, i) => {
      if (!COMMENT.test(text) && TOKEN.test(text)) hits.push({ file: f, line: i + 1, text: text.trim() });
    });
    if (hits.length) out.set(f, hits);
  }
  return out;
}

if (import.meta.main) {
  const all = gitCorpus(REPO, ["*.ts"]);
  if (all === undefined) {
    console.error("could not determine: git would not list the corpus, so nothing was checked — that is not a pass.");
    process.exit(2);
  }
  const files = all
    .map((p) => relative(REPO, p))
    .filter((p) => !p.endsWith(".test.ts") && !p.endsWith(".d.ts") && !p.includes("node_modules/"));
  const hits = scan(files, (f) => readFileSync(resolve(REPO, f), "utf-8"));
  const unlisted = [...hits.keys()].filter((f) => !(f in ALLOWED));
  const stale = Object.keys(ALLOWED).filter((f) => !hits.has(f));
  for (const f of unlisted) {
    for (const h of hits.get(f)!) console.error(`✗ ${f}:${h.line}  ${h.text}`);
  }
  for (const f of stale) console.error(`✗ stale allowlist entry: ${f} no longer names structure.json — remove it`);
  if (unlisted.length || stale.length) {
    console.error(
      "\nRead a library entry's structure through schemas/document-structure.ts (readStructure / structureOf) " +
        "and name the file as STRUCTURE_FILENAME. A reader that builds the path and parses it itself learns one " +
        "variant and misreads the next (bean rkqp).",
    );
    process.exit(1);
  }
  console.log(`✓ structure.json is named only by its accessor and ${Object.keys(ALLOWED).length - 1} reasoned exception(s).`);
}
