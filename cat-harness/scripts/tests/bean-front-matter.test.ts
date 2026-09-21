/**
 * The front-matter gate fails on the defect it was built for.
 *
 * @module scripts/tests/bean-front-matter.test
 *
 * Bean `t7ao`'s own Done-when asks for this in as many words: *"a test that
 * FEEDS IT A BROKEN BEAN and asserts it fails. A gate for this defect that has
 * never seen the defect is the defect."*
 *
 * The fixture is the REAL failure, not an invented one. `224e0beac8` committed
 * a bean whose line 8 was a literal `\1` — an unsubstituted sed backreference
 * where `updated_at:` belonged — and `bun run gates --all` passed 92 gates over
 * it before `beans list` failed for every reader in the next shell. That exact
 * byte sequence is what `BROKEN_FRONT_MATTER` below reproduces.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkBeanFrontMatter } from "../check-bean-front-matter.ts";

/** `sqtq` as committed in `224e0beac8`, line for line. */
const BROKEN_FRONT_MATTER = [
  "---",
  "# folio-assistant-sqtq",
  "title: 'SWIMLANES HAVE NO DEFINITION'",
  "status: todo",
  "type: bug",
  "priority: normal",
  "created_at: 2026-09-21T18:32:14Z",
  "\\1",
  "parent: folio-assistant-1xhc",
  "---",
  "",
  "A body, so this is not also an empty-body finding.",
  "",
].join("\n");

const GOOD_FRONT_MATTER = [
  "---",
  "# folio-assistant-aaaa",
  "title: A well-formed bean",
  "status: todo",
  "type: task",
  "created_at: 2026-09-21T00:00:00Z",
  "---",
  "",
  "A body.",
  "",
].join("\n");

/** Two `title:` lines — what `1hvo` carries, and what `beans` itself accepts. */
const DUPLICATE_KEY = [
  "---",
  "# folio-assistant-bbbb",
  "title: 'One title'",
  "title: 'A different title'",
  "status: todo",
  "type: task",
  "created_at: 2026-09-21T00:00:00Z",
  "---",
  "",
  "A body.",
  "",
].join("\n");

function storeWith(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "bean-fm-"));
  const defs = join(root, "beans", "defs");
  mkdirSync(defs, { recursive: true });
  for (const [name, text] of Object.entries(files)) writeFileSync(join(defs, name), text);
  return root;
}

describe("check-bean-front-matter", () => {
  test("a clean store reports no defect", () => {
    const root = storeWith({ "folio-assistant-aaaa--ok.md": GOOD_FRONT_MATTER });
    try {
      const r = checkBeanFrontMatter(root);
      expect(r.beans).toBe(1);
      expect(r.defects).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("THE REAL BROKEN BEAN is caught, as unparseable", () => {
    const root = storeWith({
      "folio-assistant-aaaa--ok.md": GOOD_FRONT_MATTER,
      "folio-assistant-sqtq--broken.md": BROKEN_FRONT_MATTER,
    });
    try {
      const r = checkBeanFrontMatter(root);
      const bad = r.defects.filter((d) => d.kind === "unparseable");
      expect(bad).toHaveLength(1);
      expect(bad[0]!.id).toBe("folio-assistant-sqtq");
      // The line a person opens the file to, not the parser's block-relative
      // one. `beans` itself said line 8, and line 8 is where the `\1` sits.
      expect(bad[0]!.line).toBe(8);
      expect(bad[0]!.baselined).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("one broken bean does not hide the others — the good one still counts", () => {
    const root = storeWith({
      "folio-assistant-aaaa--ok.md": GOOD_FRONT_MATTER,
      "folio-assistant-sqtq--broken.md": BROKEN_FRONT_MATTER,
    });
    try {
      // The whole point of the bean: `beans` loads the store as a unit and
      // returns NOTHING. This check must read past the bad file, or it would
      // reproduce the failure it exists to report.
      expect(checkBeanFrontMatter(root).beans).toBe(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a duplicate key is its own kind, not 'unparseable'", () => {
    const root = storeWith({ "folio-assistant-bbbb--dup.md": DUPLICATE_KEY });
    try {
      const r = checkBeanFrontMatter(root);
      expect(r.defects).toHaveLength(1);
      // Conflating the two would gate the repository on a store that loads
      // perfectly well under the loader `beans` actually uses.
      expect(r.defects[0]!.kind).toBe("duplicate-key");
      expect(r.defects[0]!.baselined).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("no store is null, never an empty one", () => {
    const root = mkdtempSync(join(tmpdir(), "bean-fm-none-"));
    try {
      // `null` and `0` are different answers, and a caller that renders them
      // the same reports a clean run over a repository it never looked at.
      expect(checkBeanFrontMatter(root).beans).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("the baseline is reported stale when its bean is absent", () => {
    const root = storeWith({ "folio-assistant-aaaa--ok.md": GOOD_FRONT_MATTER });
    try {
      // Both baselined ids are absent from this fixture, so both are stale —
      // which is how a repaired bean gets its entry removed rather than
      // silently excusing a fresh defect under the same id.
      expect(checkBeanFrontMatter(root).staleBaseline).toEqual([
        "folio-assistant-1hvo",
        "folio-assistant-7u3g",
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("the repository's own store loads — no unparseable bean on this branch", () => {
    const repo = join(import.meta.dir, "..", "..", "..");
    const r = checkBeanFrontMatter(repo);
    expect(r.beans).not.toBeNull();
    expect(r.beans).toBeGreaterThan(0);
    expect(r.defects.filter((d) => d.kind === "unparseable")).toEqual([]);
  });
});
