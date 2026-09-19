/**
 * An HTML comment cannot nest, and its closing delimiter has no escape.
 *
 * Measured 2026-09-19 on `main`: `docs/_includes/head_custom.html` carried a
 * comment that SPELLED both halves of the comment wrapper as an example of
 * what Liquid ignores. The closing half ended that comment eighteen lines
 * early, so the remaining prose rendered as visible body text at the top of
 * EVERY page of the docs site — `head_custom.html` is included site-wide.
 * Nothing caught it: it is well-formed HTML, Jekyll builds it happily, and
 * the CI gates check links, schemas and the knowledge graph, not whether a
 * comment ends where its author meant it to.
 *
 * The defect is undetectable in general — a comment that closes early looks
 * exactly like a comment that closes on purpose. What IS detectable is the
 * only way to author one by accident: an OPENING delimiter appearing while a
 * comment is already open. Comments do not nest, so that sequence is never
 * meaningful. It is either prose about comment syntax (the case that bit us)
 * or a botched edit, and both want a human to look.
 *
 * @module scripts/tests/html-comment-delimiters.test
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { Glob } from "bun";

const OPEN = "<!" + "--";
const CLOSE = "--" + ">";

type Finding = { file: string; line: number; context: string };

/** Walk one document's comments, reporting every OPEN found inside an open comment. */
function findNestedOpeners(source: string, file: string): Finding[] {
  const found: Finding[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const start = source.indexOf(OPEN, cursor);
    if (start < 0) break;

    const end = source.indexOf(CLOSE, start + OPEN.length);
    // An unterminated comment is a different defect and is not this test's
    // business; stop rather than report the rest of the file as one comment.
    if (end < 0) break;

    const body = source.slice(start + OPEN.length, end);
    const nested = body.indexOf(OPEN);
    if (nested >= 0) {
      const absolute = start + OPEN.length + nested;
      found.push({
        file,
        line: source.slice(0, absolute).split("\n").length,
        context: body.slice(Math.max(0, nested - 50), nested + 50).replace(/\s+/g, " ").trim(),
      });
    }
    cursor = end + CLOSE.length;
  }
  return found;
}

describe("HTML comments in the docs site", () => {
  it("never open a comment inside an open comment", () => {
    const findings: Finding[] = [];
    for (const rel of new Glob("**/*.html").scanSync({ cwd: "docs" })) {
      const path = `docs/${rel}`;
      findings.push(...findNestedOpeners(readFileSync(path, "utf8"), path));
    }

    const report = findings
      .map(
        (f) =>
          `${f.file}:${f.line} — an opening comment delimiter inside an open comment.\n` +
          `    …${f.context}…\n` +
          `    A closing delimiter here would end the comment early and render the rest\n` +
          `    of it as body text. There is no escape for it: do not write it, describe it.`,
      )
      .join("\n\n");

    expect(report).toBe("");
  });

  it("detects the exact shape of the 2026-09-19 defect", () => {
    // The real line from head_custom.html, reassembled so this fixture does not
    // trip the test that reads this very file's directory.
    const broken = `${OPEN}\n  LIQUID PARSES TAGS INSIDE HTML COMMENTS -- \`${OPEN} ${CLOSE}\` means\n  nothing to it.\n${CLOSE}`;
    const found = findNestedOpeners(broken, "fixture.html");

    expect(found).toHaveLength(1);
    expect(found[0]!.line).toBe(2);
  });

  it("passes a comment that merely talks about comments without spelling one", () => {
    const fine = `${OPEN} the comment wrapper means nothing to Liquid ${CLOSE}`;
    expect(findNestedOpeners(fine, "fixture.html")).toHaveLength(0);
  });
});
