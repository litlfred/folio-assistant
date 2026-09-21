/**
 * A stray backtick inside a viewer's page template, named as what it is.
 *
 * @module scripts/check-viewer-backticks
 * @graphNode none — a gate, not a schema
 *
 * ## Why a check rather than a fifth warning
 *
 * Four generators build a whole HTML page as ONE template literal, and each
 * carries a comment saying NO BACKTICKS BELOW THIS LINE. A backtick anywhere
 * inside terminates the string, and the rest of the page becomes TypeScript.
 *
 * The comments have not worked. It has happened four times in
 * `gen-schema-viz.ts` alone — twice in prose quoting a field, once quoting an
 * intake's files[], once quoting a bean id — and every time in a COMMENT,
 * which is the one place the author is not thinking about string syntax.
 *
 * The parser already catches it, so this is not about letting a defect
 * through. It is about the MESSAGE. Measured by planting one in the real file
 * and running both:
 *
 *     compiler:  error: Expected ";" but found "whbf"
 *     this gate: gen-schema-viz.ts:833 - a backtick here closes the page
 *                template early, so everything after it is parsed as
 *                TypeScript.
 *
 * Note what is NOT wrong with the compiler's answer: the line number is
 * right. The file's own warning says the failure lands far from the mistake,
 * and on this evidence it does not. So the case for a gate is narrower than
 * the warning implies, and it is only this — the compiler names a token and
 * says nothing about backticks, template literals, or the warning three
 * hundred lines above. An author who does not already know the trap reads it
 * as a syntax error in the code they just wrote.
 *
 * ## How it decides, without parsing
 *
 * It cannot parse: the file does not parse, which is the whole situation. So
 * it reads text. The template opens at `return <backtick><!doctype html>` and
 * is meant to close immediately after the page's final `</html>`. The first
 * unescaped backtick after the opening is therefore the close — and if the
 * text just before it is not that closing tag, the literal ended early, and
 * where it ended is exactly where the stray backtick is.
 *
 * That is a check on the ONE thing that matters rather than a backtick
 * census: a backtick before the opening (a doc comment, an import) is fine
 * and must stay fine, or the gate becomes something to work around.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.js";

/** Generators whose page is one template literal. Each carries the warning. */
export const VIEWER_SOURCES = [
  "cat-harness/scripts/gen-schema-viz.ts",
  "cat-harness/scripts/gen-library-viz.ts",
  "cat-harness/scripts/kg-viewer.ts",
  "cat-harness/scripts/state-visualizer.ts",
];

export interface StrayBacktick {
  /** 1-based line of the backtick that closed the literal too early. */
  line: number;
  /** The line's text, so the report shows the culprit rather than a number. */
  text: string;
}

/**
 * Where the page template ends, and whether that is where it should.
 *
 * Returns `null` when the file is fine or holds no page template — a file
 * without one is not a finding, because this list is a list of the generators
 * that have the trap, not of the files that must have it.
 */
export function strayBacktick(src: string): StrayBacktick | null {
  const open = /return\s+`<!doctype html>/i.exec(src);
  if (!open) return null;
  let i = open.index + open[0].length;

  // The first UNESCAPED backtick closes it. `\`` inside would be an escape;
  // none of these files uses one, but skipping it costs a line and removing
  // the need to think about it costs more.
  for (; i < src.length; i++) {
    if (src[i] === "\\") { i++; continue; }
    if (src[i] === "`") break;
  }
  if (i >= src.length) return null;

  const before = src.slice(Math.max(0, i - 40), i);
  if (/<\/html>\s*$/i.test(before)) return null;

  const line = src.slice(0, i).split("\n").length;
  return { line, text: (src.split("\n")[line - 1] || "").trim() };
}

function main(): void {
  const root = repoRootFor(join(import.meta.dir, ".."));
  const bad: string[] = [];
  let checked = 0;

  for (const rel of VIEWER_SOURCES) {
    let src: string;
    try {
      src = readFileSync(join(root, rel), "utf-8");
    } catch {
      // A generator that moved is a finding about THIS list, not a pass.
      bad.push(`${rel}: not found — update VIEWER_SOURCES in check-viewer-backticks.ts`);
      continue;
    }
    checked++;
    const hit = strayBacktick(src);
    if (hit) {
      bad.push(
        `${rel}:${hit.line} — a backtick here closes the page template early, so ` +
          `everything after it is parsed as TypeScript. The error the compiler ` +
          `reports will name a token on this line and will not mention backticks.\n` +
          `    ${hit.text}`,
      );
    }
  }

  if (bad.length) {
    console.error("✗ stray backtick inside a viewer's page template:\n");
    for (const b of bad) console.error(`  ${b}\n`);
    process.exit(1);
  }
  console.log(`✓ ${checked} viewer page template(s) close where they should — no stray backtick.`);
}

if (import.meta.main) main();
