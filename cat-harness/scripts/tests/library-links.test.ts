/**
 * `library-links` — where a library reference links (bean `qgjh`, owner
 * 2026-09-30: the viewer, the item's page, and its source).
 *
 * The tests of this file that read the whole checkout (reads the library
 * entries of the content instances) live in
 * `test/library-links-checkout.test.ts` (bean `7zz1`): standing alone,
 * cat-harness has none of it.
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor } from "../../schemas/cat-harness.ts";
import { libraryResolver } from "../lib/library-links.ts";
import { itemFacts } from "../library-readmes.ts";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const REPO = resolve(INSTANCE, "..");
const r = libraryResolver(REPO, INSTANCE);
const entries = (
  JSON.parse(readFileSync(join(INSTANCE, siteDirFor(INSTANCE), "assets", "library", "index.json"), "utf-8")) as {
    entries: { id: string; instance: string; dir: string }[];
  }
).entries;

describe("a library reference resolves only where its target exists", () => {

  it("gives an arXiv item its arXiv record, and invents none for the rest", () => {
    // An item whose metadata RECORDS its arXiv id: `arxiv-0909.4061v2` is
    // named like one and records none, and it became the first `arxiv-` entry
    // when the agent-skills corpus joined cat-harness's library (bean `j7ql`).
    // Its missing record is a data gap for the test below, not this one.
    const arxiv = entries.find((e) => e.id.startsWith("arxiv-") && itemFacts(join(REPO, e.dir))?.arxiv)!;
    expect(arxiv, "no library item records an arXiv id").toBeDefined();
    expect(r.links(arxiv.id, arxiv.instance)?.source).toMatch(/^https:\/\/arxiv\.org\/abs\/\d{4}\.\d{4,5}v\d+$/);
    const who = entries.find((e) => /^\d{13}-eng$/.test(e.id));
    if (who) expect(r.links(who.id, who.instance)?.source).toBeUndefined();
  });

  it("does not link a reference it cannot place", () => {
    expect(r.links("no-such-item")).toBeUndefined();
    expect(r.links(entries[0]!.id, "no-such-instance")).toBeUndefined();
  });
});

describe("the library projection carries what a reader opens (qgjh)", () => {
  const full = (
    JSON.parse(readFileSync(join(INSTANCE, siteDirFor(INSTANCE), "assets", "library", "index.json"), "utf-8")) as {
      entries: { id: string; dir: string; arxiv: string; readme?: string }[];
    }
  ).entries;

  it("gives every entry with a README its page link", () => {
    for (const e of full) {
      if (existsSync(join(REPO, e.dir, "README.md"))) expect(e.readme, e.id).toContain(`/${e.dir}/README.md`);
    }
  });

  it("carries the arXiv id its manifest records, not the empty string the flattened record gave", () => {
    const recorded = full.filter((e) => itemFacts(join(REPO, e.dir))?.arxiv);
    // The premise: some item records one, or the loop proves nothing.
    expect(recorded.length).toBeGreaterThan(0);
    for (const e of recorded) expect(e.arxiv, e.id).toBe(itemFacts(join(REPO, e.dir))!.arxiv);
  });
});
