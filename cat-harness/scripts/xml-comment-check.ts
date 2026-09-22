/**
 * Refuse a `.bpmn` or `.dmn` whose comments are not well-formed XML.
 *
 * ## The defect this exists for
 *
 * XML 1.0 §2.5 defines a comment as
 *
 *     '<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'
 *
 * — so the body may not contain `--`, and may not end with `-`. Six diagrams
 * and one decision table here violated that for months, all by writing a
 * double hyphen where an em dash was meant (`render:bpmn` -- never hand-edit`)
 * or by quoting a CLI flag (`pages-bootstrap.ts --json`).
 *
 * **Nothing caught it, and every gate was green over them.** `bpmn-moddle` and
 * `dmn-moddle` parse them happily, so `kg:audit` reported `unknown 0` and
 * `render:bpmn` drew them. The audit was telling the truth about what THIS
 * instance can load, and was silent about what anyone else can — while each of
 * those files' own header invites the reader to "open it in bpmn.io, Camunda
 * Modeler, or any other BPMN 2.0 tool". A conformant parser cannot open them.
 * Python's expat rejects all seven. Bean `folio-assistant-qjog`.
 *
 * ## Why this is hand-written rather than delegated to a parser
 *
 * Measured 2026-09-18, and this is the reason the check looks naive: the two
 * XML parsers already in this repo's dependencies BOTH accept the invalid
 * comment. `fast-xml-parser`'s `XMLValidator.validate()` returns `true` for
 * `<root><!-- a -- b --></root>`, and the moddles are what shipped the bug.
 * Delegating to either would have produced a check that passes over exactly
 * the corpus that motivated it.
 *
 * So the rule is implemented directly, and the scope is stated honestly:
 * **this checks the comment production and nothing else.** It is not a
 * well-formedness check. A diagram can pass here and still be invalid XML for
 * some other reason — the moddles catch most of that by failing to load, and
 * `kg:audit` records such a file as `unknown` rather than as a pass.
 *
 * ## Scanning, not regexing
 *
 * `/<!--.*?-->/` finds the comment but mis-reports the trailing-hyphen case:
 * in `<!-- a --->` the lazy match ends at the FIRST `-->`, which starts one
 * character into the `---` run, so the body it yields is ` a -` — right by
 * accident here, and wrong as soon as the input is less convenient. The scan
 * below takes the same first-`-->` boundary a parser does, deliberately, and
 * then tests the body against the production.
 *
 * Usage:  bun run cat-harness/scripts/xml-comment-check.ts
 * Exits 1 and names every offending file, line and text.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";

import { workflowDirs } from "./known-skills.js";
import { join, relative, resolve } from "node:path";

export interface CommentFinding {
  file: string;
  line: number;
  detail: string;
}

/**
 * Every comment-production violation in one document.
 *
 * `label` is used only in the finding, so a caller can report a path of its
 * own choosing without this module knowing about the repository layout.
 */
export function checkXmlComments(xml: string, label: string): CommentFinding[] {
  const out: CommentFinding[] = [];
  const lineOf = (i: number) => xml.slice(0, i).split("\n").length;

  let i = 0;
  for (;;) {
    const open = xml.indexOf("<!--", i);
    if (open < 0) break;
    const close = xml.indexOf("-->", open + 4);
    if (close < 0) {
      out.push({ file: label, line: lineOf(open), detail: "comment is never closed." });
      break;
    }
    const body = xml.slice(open + 4, close);

    if (body.includes("--")) {
      // Name the offending line rather than the comment's first line: these
      // comments run to thirty lines and "line 2" sends the reader to a header.
      const rel = body.split("\n").findIndex((l) => l.includes("--"));
      const text = body.split("\n")[rel]!.trim();
      out.push({
        file: label,
        line: lineOf(open) + rel,
        detail: `comment body contains "--", which XML 1.0 §2.5 forbids: ${text}`,
      });
    } else if (body.endsWith("-")) {
      out.push({
        file: label,
        line: lineOf(close),
        detail: `comment body ends with "-", so it closes with "--->", which XML 1.0 §2.5 forbids.`,
      });
    }
    i = close + 3;
  }
  return out;
}

/** Every `.bpmn` and `.dmn` under `dir`, recursively. */
export function xmlSourcesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...xmlSourcesUnder(p));
    else if (p.endsWith(".bpmn") || p.endsWith(".dmn")) out.push(p);
  }
  return out;
}

if (import.meta.main) {
  const root = resolve(import.meta.dir, "..");
  // Every directory the instance DECLARES as holding processes, not the
  // literal `processes`. A topical layout puts them in several.
  const dirs = workflowDirs(root);
  const files = dirs.flatMap((d) => xmlSourcesUnder(d));

  // An empty corpus is not a pass. Renaming `processes/` would
  // otherwise turn this gate into a silent success over nothing, which is the
  // same "reported clean over what it never read" defect it exists to catch.
  if (files.length === 0) {
    const where = dirs.length > 0 ? dirs.join(", ") : "(no declared workflow directory)";
    console.error(`No .bpmn or .dmn sources found under ${where} — refusing to report a clean run.`);
    process.exit(2);
  }

  const findings = files.flatMap((f) =>
    checkXmlComments(readFileSync(f, "utf8"), relative(root, f)),
  );

  if (findings.length === 0) {
    console.log(`XML comments well-formed in ${files.length} diagram(s).`);
    process.exit(0);
  }
  console.error(`${findings.length} malformed XML comment(s):\n`);
  for (const f of findings) console.error(`  ${f.file}:${f.line}  ${f.detail}`);
  console.error(
    `\nA conformant XML parser rejects these files, though bpmn-moddle and\n` +
      `fast-xml-parser both accept them. Use an em dash for a dash, and reword\n` +
      `a quoted CLI flag rather than writing "--" inside a comment.`,
  );
  process.exit(1);
}
