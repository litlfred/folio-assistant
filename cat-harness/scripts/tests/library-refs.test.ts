/**
 * `library-refs` — where a library reference links (bean `qgjh`, owner
 * 2026-09-30: the viewer, the item's page, and its source).
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { libraryResolver } from "../lib/library-refs.ts";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const REPO = resolve(INSTANCE, "..");
const r = libraryResolver(REPO, INSTANCE);
const entries = (
  JSON.parse(readFileSync(join(INSTANCE, "docs", "assets", "library", "index.json"), "utf-8")) as {
    entries: { id: string; instance: string; dir: string }[];
  }
).entries;

describe("a library reference resolves only where its target exists", () => {
  it("links every projected item to its viewer page and README", () => {
    // The premise: a resolver over no entries would pass the loop vacuously.
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      const l = r.links(e.id, e.instance);
      expect(l?.viewer, e.id).toBe(`cat-harness/library/${e.instance}/#${encodeURIComponent(e.id)}`);
      if (existsSync(join(REPO, e.dir, "README.md"))) expect(l?.readme, e.id).toContain(`/${e.dir}/README.md`);
    }
  });

  it("gives an arXiv item its arXiv record, and invents none for the rest", () => {
    const arxiv = entries.find((e) => e.id.startsWith("arxiv-"))!;
    expect(r.links(arxiv.id, arxiv.instance)?.source).toMatch(/^https:\/\/arxiv\.org\/abs\/\d{4}\.\d{4,5}v\d+$/);
    const who = entries.find((e) => /^\d{13}-eng$/.test(e.id));
    if (who) expect(r.links(who.id, who.instance)?.source).toBeUndefined();
  });

  it("does not link a reference it cannot place", () => {
    expect(r.links("no-such-item")).toBeUndefined();
    expect(r.links(entries[0]!.id, "no-such-instance")).toBeUndefined();
  });
});
