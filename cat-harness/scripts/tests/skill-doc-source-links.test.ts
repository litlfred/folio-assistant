/**
 * Every generated skill page's "Generated from" and "Edit this page's source"
 * links RESOLVE to a file in this repository.
 *
 * Bean `folio-assistant-oe98`. 240 of 244 pages linked a path that did not
 * exist — 231 by the pre-split `skills/...` prefix, 9 by a `../bootstrap/...`
 * parent segment no GitHub URL can carry — while `gen-skill-docs --check` and
 * `docs:auto:check` were green throughout. Both compare bytes against what the
 * generator would write; a wrong generator agrees with its own output. This
 * test resolves the link instead, which is the only check that can see the
 * class.
 *
 * @module scripts/tests/skill-doc-source-links.test
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { repoRootFor, siteDirFor } from "../../schemas/cat-harness.ts";
import { repoRelative } from "../gen-skill-docs.ts";

const INSTANCE_ROOT = resolve(import.meta.dir, "../..");
const REPO_ROOT = repoRootFor(INSTANCE_ROOT);
const OUT_DIR = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT), "reference", "skill-instructions");
const LINK = /https:\/\/github\.com\/litlfred\/folio-assistant\/(?:blob|edit)\/main\/([^)\s]+)/g;

/** The pages the generator PUBLISHES — the ones its index links. */
function publishedPages(): Set<string> {
  const index = readFileSync(join(OUT_DIR, "index.md"), "utf8");
  return new Set([...index.matchAll(/\]\(([^)/]+)\.html\)/g)].map((m) => `${m[1]}.md`));
}

describe("generated skill pages link a source that exists", () => {
  const published = publishedPages();
  const pages = readdirSync(OUT_DIR).filter((f) => f.endsWith(".md") && f !== "index.md");

  test("the corpus is not empty — the guard every assertion below needs", () => {
    expect(published.size).toBeGreaterThan(100);
  });

  test("every source and edit link on a published page resolves", () => {
    const dead: string[] = [];
    let checked = 0;
    for (const page of pages) {
      if (!published.has(page)) continue;
      const body = readFileSync(join(OUT_DIR, page), "utf8");
      for (const m of body.matchAll(LINK)) {
        checked++;
        const path = decodeURIComponent(m[1]);
        if (path.split("/").includes("..") || !existsSync(join(REPO_ROOT, path))) dead.push(`${page} -> ${path}`);
      }
    }
    // Named, not counted: a count says the class exists, a name says where.
    expect(dead).toEqual([]);
    expect(checked).toBeGreaterThan(100);
  });

  // Pages in the directory that the index does NOT link are orphans — output
  // the generator no longer writes. They are outside this test on purpose:
  // removing one is a deletion, and a deletion is asked for
  // (`deletion-requires-confirmation`), not made green by a test.
});

describe("repoRelative", () => {
  test("a directory inside the checkout is named repository-relative", () => {
    expect(repoRelative("/repo/cat-harness/skills/folio-core", "/repo")).toBe("cat-harness/skills/folio-core");
  });

  test("a directory outside the checkout has no path, rather than a `..` one", () => {
    expect(repoRelative("/elsewhere/bootstrap/skills", "/repo")).toBeUndefined();
    expect(repoRelative("/repo", "/repo")).toBeUndefined();
  });

  test("a name that merely starts with two dots is still inside", () => {
    expect(repoRelative("/repo/..hidden/x", "/repo")).toBe("..hidden/x");
  });
});
