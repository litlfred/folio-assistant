/**
 * The files an agent reads first are checked, and a stub's pointer counts.
 *
 * @module scripts/tests/agent-entry-links
 *
 * Bean `v8gh`. Two distinct gaps, and the second was found while closing the
 * first:
 *
 *   1. Nothing checked the links OUT of `AGENTS.md`. Seven were dead,
 *      five broken by a single directory move.
 *   2. `CLAUDE.md` and `GEMINI.md` reference `AGENTS.md` with `@AGENTS.md` —
 *      a CLI IMPORT directive, not a markdown link. The auditor saw zero
 *      links and reported "0 dead": a clean result over a file it had not
 *      checked at all. Rename `AGENTS.md` and both stubs point at nothing
 *      while the gate stays green.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { ENTRY_NAMES, findEntryFiles } from "../check-agent-entry-links.js";
import { auditMarkdownFile, parseLinks } from "../../src/core/markdown-links.js";
import { publishTargets } from "../../src/core/git-refs.js";
import { repoRootFor } from "../../schemas/cat-harness.js";

const REPO = repoRootFor(resolve(import.meta.dir, "..", ".."));

describe("`@path` is a link — the stub's only reference", () => {
  test("a whole-line @import is parsed", () => {
    expect(parseLinks("# CLAUDE.md\n\n@AGENTS.md\n").map((l) => l.target)).toEqual(["AGENTS.md"]);
  });

  test("an email address is NOT a link", () => {
    // A checker that reported these would be switched off within a day.
    expect(parseLinks("mail me at foo@bar.com\n")).toEqual([]);
  });

  test("a mid-line @handle is NOT a link", () => {
    expect(parseLinks("thanks @someone for the fix\n")).toEqual([]);
  });

  test("an @word with no extension is NOT a link", () => {
    expect(parseLinks("@AGENTS\n")).toEqual([]);
  });

  test("leading whitespace is allowed — the directive is still whole-line", () => {
    expect(parseLinks("  @AGENTS.md\n").map((l) => l.target)).toEqual(["AGENTS.md"]);
  });

  test("a BROKEN @import is reported dead, with the path named", () => {
    const root = mkdtempSync(join(tmpdir(), "entry-"));
    writeFileSync(join(root, "stub.md"), "# X\n\n@MISSING.md\n");
    const r = auditMarkdownFile({ root, file: join(root, "stub.md"), publishRef: "gh-pages" });
    expect(r.exitCode).toBe(1);
    expect(r.text).toContain("MISSING.md");
  });

  test("a RESOLVING @import passes", () => {
    const root = mkdtempSync(join(tmpdir(), "entry-ok-"));
    writeFileSync(join(root, "AGENTS.md"), "# A\n");
    writeFileSync(join(root, "stub.md"), "# X\n\n@AGENTS.md\n");
    expect(auditMarkdownFile({ root, file: join(root, "stub.md"), publishRef: "gh-pages" }).exitCode).toBe(0);
  });
});

describe("discovery, not a hardcoded list", () => {
  test("entry files at the root and one level down are found", () => {
    const root = mkdtempSync(join(tmpdir(), "entry-find-"));
    writeFileSync(join(root, "AGENTS.md"), "# A\n");
    writeFileSync(join(root, "CLAUDE.md"), "# C\n");
    mkdirSync(join(root, "bootstrap"));
    writeFileSync(join(root, "bootstrap", "AGENTS.md"), "# B\n");
    const found = findEntryFiles(root).map((f) => f.slice(root.length + 1));
    expect(found).toEqual(["AGENTS.md", "CLAUDE.md", "bootstrap/AGENTS.md"]);
  });

  test("node_modules and dot-directories are not walked", () => {
    const root = mkdtempSync(join(tmpdir(), "entry-skip-"));
    writeFileSync(join(root, "AGENTS.md"), "# A\n");
    for (const d of ["node_modules", ".git"]) {
      mkdirSync(join(root, d));
      writeFileSync(join(root, d, "AGENTS.md"), "# vendored\n");
    }
    expect(findEntryFiles(root).map((f) => f.slice(root.length + 1))).toEqual(["AGENTS.md"]);
  });

  test("an empty tree finds nothing — which the CLI treats as exit 2, not a pass", () => {
    // The guard itself is in the CLI; this pins that the finder reports the
    // empty honestly rather than inventing a default.
    expect(findEntryFiles(mkdtempSync(join(tmpdir(), "entry-none-")))).toEqual([]);
  });
});

describe("this repository, right now", () => {
  test("the entry files are found, and there is more than one", () => {
    // A green run over zero files is not coverage. Asserting ">1" rather than
    // an exact count: the number changes when an instance is added, and the
    // check is where that number belongs.
    expect(findEntryFiles(REPO).length).toBeGreaterThan(1);
  });

  test("AGENTS.md is among them — it is the file the banner sends everyone to", () => {
    expect(findEntryFiles(REPO).some((f) => f.endsWith("/AGENTS.md"))).toBe(true);
  });

  test.each(ENTRY_NAMES.map((n) => [n]))("%s at the root has no dead links", (name) => {
    const file = join(REPO, name as string);
    const r = auditMarkdownFile({ root: REPO, file, ...publishTargets(REPO) });
    // exit 2 is "no such file", which is fine for a stub a folio may not have;
    // what must never happen is a dead link in one that exists.
    expect(r.exitCode === 0 || r.exitCode === 2).toBe(true);
    if (r.exitCode === 1) throw new Error(r.text);
  });

  test("AGENTS.md carries a NON-TRIVIAL number of links", () => {
    // The guard against the failure mode this whole bean is about: "0 links
    // checked, 0 dead" over the file every agent opens first reads exactly
    // like a pass. If the parser breaks or the file is emptied, this fails.
    const links = parseLinks(readFileSync(join(REPO, "AGENTS.md"), "utf-8"));
    expect(links.length).toBeGreaterThan(20);
  });
});
