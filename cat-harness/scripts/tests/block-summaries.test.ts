/**
 * Agent summaries of prose blocks — the QA sidecar drained during ingestion.
 *
 * Owner, 2026-09-24: *"on library/ page, the extract of a node is shown, but
 * no agentic summary"*; *"Make as QA sidecar as part of general doc ingestion
 * to slowly drain."*
 *
 * What is proved here, each against a fixture built at test time:
 * the sidecar validates and refuses records that mean nothing; a changed
 * source reads as STALE; an agent cannot write `confirmed`; the queue leaves
 * out blocks with a current summary; the viewer carries the extract AND the
 * summary; and — against the real corpus — the backlog is not vacuous and
 * equals prose blocks minus summarised ones, counted by a walk that shares no
 * code with the queue.
 *
 * @module scripts/tests/block-summaries
 */
import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { directoriesForGraph, siteDirFor } from "../../schemas/cat-harness.ts";
import {
  BlockSummariesSidecarSchema,
  SUMMARIES_FILE,
  sourceHash,
  summaryStatus,
  type BlockSummary,
} from "../../schemas/block-summary.ts";
import { NarrativeSchema } from "../../schemas/narrative.ts";
import { backlog, entryDirs, entryItems, next, record, sidecarDefects, tally } from "../summaries.ts";
import { decide, queue } from "../narratives.ts";
import { checkEntry } from "../check-l1-complete.ts";
import { readEntryBlocks } from "../library-graph.ts";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

const ROOT = resolve(import.meta.dir, "../..");
const AGENT = { kind: "agent" as const, id: "claude-code", model: "test-model" };
const HUMAN = { kind: "human" as const, id: "litlfred" };
const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A library with one entry `doc` holding the given prose sections (name -> body). */
function fixture(sections: Record<string, string>): { root: string; entry: string } {
  const root = mkdtempSync(join(tmpdir(), "sum-"));
  made.push(root);
  writeDeclaration(root, {
    name: "fixture",
    directories: [{ id: "library", path: "library", dependents: "reproduce", graphKinds: ["library"] }],
  });
  const entry = join(root, "library", "doc");
  mkdirSync(join(entry, "blocks"), { recursive: true });
  mkdirSync(join(entry, "sections"), { recursive: true });
  let page = 1;
  for (const [name, body] of Object.entries(sections)) {
    writeFileSync(join(entry, "sections", `${name}.md`), `---\ntitle: ${name}\n---\n${body}\n`);
    writeFileSync(
      join(entry, "blocks", `prose-${name}.jsonld`),
      JSON.stringify({
        "@id": `library/doc/blocks/prose-${name}`,
        "@type": ["folio-assistant-core:Prose", "doco:Section"],
        kind: "prose",
        title: name,
        pageStart: page++,
        text: `../sections/${name}.md`,
        provenance: "ingested",
      }),
    );
  }
  return { root, entry };
}

const id = (name: string) => `library/doc/blocks/prose-${name}`;

function draftFor(root: string, names: string[], text = "A short summary.") {
  const items = new Map(backlog(root).map((i) => [i.block, i]));
  return {
    drafted_by: AGENT,
    drafted_at: "2026-09-24",
    drafts: names.map((n) => ({ block: id(n), source_hash: items.get(id(n))!.hash!, text })),
  };
}

describe("the sidecar validates, and refuses records that mean nothing", () => {
  const rec = (over: Partial<BlockSummary> = {}): BlockSummary => ({
    block: "library/doc/blocks/prose-a",
    source: "sections/a.md",
    source_hash: "a".repeat(64),
    narrative: { text: "x", state: "draft", drafted_by: AGENT },
    ...over,
  });
  const doc = (summaries: unknown[]) => ({ $schema: "folio-block-summaries/v1", entry: "doc", summaries });

  test("a draft by an agent naming its model validates", () => {
    expect(BlockSummariesSidecarSchema.safeParse(doc([rec()])).success).toBe(true);
  });

  test("an empty slot is refused — no record already means not summarised", () => {
    expect(BlockSummariesSidecarSchema.safeParse(doc([rec({ narrative: { text: null, state: "not-authored" } })])).success).toBe(false);
  });

  test("two records for one block are refused", () => {
    expect(BlockSummariesSidecarSchema.safeParse(doc([rec(), rec()])).success).toBe(false);
  });

  test("the hash is a full sha256", () => {
    expect(BlockSummariesSidecarSchema.safeParse(doc([rec({ source_hash: "abc" })])).success).toBe(false);
  });

  test("an agent draft with no model is refused — inherited from the attribution schema", () => {
    const n = { text: "x", state: "draft", drafted_by: { kind: "agent", id: "c" } };
    expect(BlockSummariesSidecarSchema.safeParse(doc([{ ...rec(), narrative: n }])).success).toBe(false);
  });

  test("every committed summaries.json validates", () => {
    const files = entryDirs(ROOT).map((d) => join(d, SUMMARIES_FILE)).filter((f) => existsSync(f));
    // Not vacuous: the first drain wrote one.
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const r = BlockSummariesSidecarSchema.safeParse(JSON.parse(readFileSync(f, "utf-8")));
      expect(r.success, f).toBe(true);
    }
  });
});

describe("a changed source reads as STALE, not as right", () => {
  test("editing the section's text marks its summary stale and puts it back in the queue", () => {
    const { root, entry } = fixture({ a: "Alpha text.", b: "Beta text." });
    record(draftFor(root, ["a", "b"]), root);
    expect(backlog(root)).toHaveLength(0);

    writeFileSync(join(entry, "sections", "a.md"), "---\ntitle: a\n---\nAlpha text, revised.\n");
    const status = new Map(entryItems(entry).map((i) => [i.block, i.status]));
    expect(status.get(id("a"))).toBe("stale");
    expect(status.get(id("b"))).toBe("draft");
    expect(backlog(root).map((i) => i.block)).toEqual([id("a")]);
  });

  test("a front-matter-only edit is NOT a change of text", () => {
    const { root, entry } = fixture({ a: "Alpha text." });
    record(draftFor(root, ["a"]), root);
    writeFileSync(join(entry, "sections", "a.md"), "---\ntitle: a renamed\n---\nAlpha text.\n");
    expect(entryItems(entry)[0]!.status).toBe("draft");
  });

  test("summaryStatus compares the hash — the mutation target", () => {
    // Mutation-checked by hand: removing the `source_hash !== bodyHash(body)`
    // line in summaryStatus turns this `stale` into `draft` and fails here.
    const narrative = { text: "x", state: "draft" as const, drafted_by: AGENT };
    const rec = { block: "b", source: "s", source_hash: sourceHash("old"), narrative };
    expect(summaryStatus(rec, "old")).toBe("draft");
    expect(summaryStatus(rec, "new")).toBe("stale");
    expect(summaryStatus({ ...rec, narrative: { ...narrative, state: "confirmed", confirmed_by: HUMAN } }, "new")).toBe("stale");
    expect(summaryStatus(undefined, "x")).toBe("not-summarised");
    expect(summaryStatus(undefined, null)).toBe("unreadable");
    expect(summaryStatus(undefined, "")).toBe("empty");
  });

  test("the review queue shows a stale draft as stale, and refuses to confirm it", () => {
    const { root, entry } = fixture({ a: "Alpha text." });
    record(draftFor(root, ["a"]), root);
    writeFileSync(join(entry, "sections", "a.md"), "---\n---\nChanged.\n");
    const items = queue(root).filter((q) => q.file.endsWith(SUMMARIES_FILE));
    expect(items).toHaveLength(1);
    expect(items[0]!.stale).toBe(true);
    expect(() => decide(items[0]!, "confirm", { by: HUMAN, root })).toThrow(/STALE/);
  });

  test("decide re-checks freshness even when the listing said fresh", () => {
    const { root, entry } = fixture({ a: "Alpha text." });
    record(draftFor(root, ["a"]), root);
    const [item] = queue(root).filter((q) => q.file.endsWith(SUMMARIES_FILE));
    expect(item!.stale).toBeUndefined();
    writeFileSync(join(entry, "sections", "a.md"), "---\n---\nChanged after listing.\n");
    expect(() => decide(item!, "confirm", { by: HUMAN, root })).toThrow(/STALE/);
  });

  test("a fresh draft IS confirmable by a person, and then leaves the backlog as confirmed", () => {
    const { root, entry } = fixture({ a: "Alpha text." });
    record(draftFor(root, ["a"]), root);
    const [item] = queue(root).filter((q) => q.file.endsWith(SUMMARIES_FILE));
    expect(decide(item!, "confirm", { by: HUMAN, root }).state).toBe("confirmed");
    expect(entryItems(entry)[0]!.status).toBe("confirmed");
  });
});

describe("an agent cannot write `confirmed`", () => {
  test("record refuses a draft that claims any state but draft", () => {
    const { root } = fixture({ a: "Alpha." });
    const f = draftFor(root, ["a"]);
    for (const state of ["confirmed", "rejected"]) {
      expect(() => record({ ...f, drafts: f.drafts.map((d) => ({ ...d, state })) }, root)).toThrow(/only a person/);
    }
    expect(existsSync(join(root, "library", "doc", SUMMARIES_FILE))).toBe(false);
  });

  test("the schema refuses a confirmation by an agent", () => {
    const n = { text: "x", state: "confirmed", drafted_by: AGENT, confirmed_by: AGENT };
    expect(NarrativeSchema.safeParse(n).success).toBe(false);
  });

  test("record writes drafts only, and only for an agent naming its model", () => {
    const { root } = fixture({ a: "Alpha." });
    const f = draftFor(root, ["a"]);
    expect(() => record({ ...f, drafted_by: HUMAN }, root)).toThrow(/AGENT/);
    expect(() => record({ ...f, drafted_by: { kind: "agent", id: "x" } as never }, root)).toThrow(/model/);
    record(f, root);
    const doc = JSON.parse(readFileSync(join(root, "library", "doc", SUMMARIES_FILE), "utf-8"));
    expect(doc.summaries[0].narrative.state).toBe("draft");
    expect(doc.summaries[0].narrative.drafted_by.model).toBe("test-model");
  });

  test("record refuses a hash that no longer matches — it summarised something else", () => {
    const { root, entry } = fixture({ a: "Alpha." });
    const f = draftFor(root, ["a"]);
    writeFileSync(join(entry, "sections", "a.md"), "---\n---\nMoved on.\n");
    expect(() => record(f, root)).toThrow(/source_hash/);
  });

  test("record is all-or-nothing", () => {
    const { root } = fixture({ a: "Alpha.", b: "Beta." });
    const f = draftFor(root, ["a", "b"]);
    f.drafts[1]!.source_hash = "0".repeat(64);
    expect(() => record(f, root)).toThrow();
    expect(existsSync(join(root, "library", "doc", SUMMARIES_FILE))).toBe(false);
  });
});

describe("the queue leaves out blocks that already have a current summary", () => {
  test("drafted and confirmed are out; not-summarised, stale and rejected are in", () => {
    const { root } = fixture({ a: "A.", b: "B.", c: "C." });
    expect(backlog(root)).toHaveLength(3);
    record(draftFor(root, ["a", "b"]), root);
    expect(backlog(root).map((i) => i.block)).toEqual([id("c")]);

    const item = queue(root).find((q) => q.subject === "prose-b")!;
    decide(item, "reject", { by: HUMAN, reason: "too vague to be useful", root });
    expect(backlog(root).map((i) => i.block).sort()).toEqual([id("b"), id("c")]);
    // The rejection reason travels to the next drafter.
    expect(next(root, { n: 5 }).find((n) => n.block === id("b"))?.rejected?.reason).toBe("too vague to be useful");
  });

  test("redrafting a rejected block keeps the rejection under `superseded`", () => {
    const { root, entry } = fixture({ a: "A." });
    record(draftFor(root, ["a"]), root);
    decide(queue(root)[0]!, "reject", { by: HUMAN, reason: "wrong", root });
    record(draftFor(root, ["a"], "A better summary."), root);
    const [rec] = JSON.parse(readFileSync(join(entry, SUMMARIES_FILE), "utf-8")).summaries;
    expect(rec.narrative.state).toBe("draft");
    expect(rec.superseded[0].rejection_reason).toBe("wrong");
  });

  test("a current draft is never overwritten by another", () => {
    const { root } = fixture({ a: "A." });
    const f = draftFor(root, ["a"]);
    record(f, root);
    expect(() => record(f, root)).toThrow(/already has a current draft/);
  });

  test("an empty section is not prose to summarise, and not backlog", () => {
    const { root, entry } = fixture({ a: "A.", e: "" });
    expect(entryItems(entry).find((i) => i.block === id("e"))?.status).toBe("empty");
    expect(backlog(root).map((i) => i.block)).toEqual([id("a")]);
    expect(tally(entryItems(entry))).toMatchObject({ prose: 1, empty: 1, backlog: 1 });
  });
});

describe("semantic QA: what the schema cannot see", () => {
  test("a record for a block that is not there is a broken reference, and the L1 gate says so", () => {
    const { root, entry } = fixture({ a: "A." });
    record(draftFor(root, ["a"]), root);
    const doc = JSON.parse(readFileSync(join(entry, SUMMARIES_FILE), "utf-8"));
    doc.summaries[0].block = id("gone");
    writeFileSync(join(entry, SUMMARIES_FILE), JSON.stringify(doc));
    expect(sidecarDefects(entry)[0]).toMatch(/no such prose block/);
    expect(checkEntry(entry).requirements.find((r) => r.name === "block-summaries")?.state).toBe("unmet");
  });

  test("a sidecar naming another entry is a defect", () => {
    const { root, entry } = fixture({ a: "A." });
    record(draftFor(root, ["a"]), root);
    const doc = JSON.parse(readFileSync(join(entry, SUMMARIES_FILE), "utf-8"));
    writeFileSync(join(entry, SUMMARIES_FILE), JSON.stringify({ ...doc, entry: "other" }));
    expect(sidecarDefects(entry)[0]).toMatch(/names entry "other"/);
  });

  test("a backlog is advisory: met, with the count in the detail", () => {
    const { entry } = fixture({ a: "A.", b: "B." });
    const r = checkEntry(entry).requirements.find((q) => q.name === "block-summaries")!;
    expect(r.state).toBe("met");
    expect(r.detail).toMatch(/backlog 2/);
  });
});

describe("the viewer carries the extract AND the summary", () => {
  test("a summarised prose block projects both, and an unsummarised one says so", () => {
    const { root, entry } = fixture({ a: "Alpha text in full.", b: "Beta." });
    record(draftFor(root, ["a"], "Alpha, summarised."), root);
    const blocks = readEntryBlocks(entry);
    const a = blocks.find((b) => b.id === id("a"))!;
    expect(a.content).toBe("Alpha text in full.");
    expect(a.summary?.text).toBe("Alpha, summarised.");
    expect(a.summary?.status).toBe("draft");
    expect(a.summary?.draftedBy).toEqual({ kind: "agent", id: "claude-code", model: "test-model" });
    const b = blocks.find((x) => x.id === id("b"))!;
    expect(b.content).toBe("Beta.");
    expect(b.summary).toEqual({ status: "not-summarised" });
  });

  test("the committed projection of the drained entry carries both", () => {
    const f = join(ROOT, siteDirFor(ROOT), "assets", "library", "entries", "arxiv-2312.07755v1.json");
    const blocks = JSON.parse(readFileSync(f, "utf-8")).blocks as { kind: string; content: string | null; summary: { text?: string } | null }[];
    const both = blocks.filter((b) => b.kind === "prose" && b.content && b.summary?.text);
    expect(both.length).toBeGreaterThan(0);
  });
});

describe("the real backlog — not vacuous, and it adds up", () => {
  /**
   * Prose blocks and current summaries counted by WALKING THE FILES, sharing
   * no code with `summaries.ts`: two derivations that agree is evidence.
   */
  function walk(): { prose: number; summarised: number } {
    let prose = 0;
    let summarised = 0;
    for (const lib of directoriesForGraph(ROOT, "library").filter((d) => existsSync(d))) {
      for (const slug of readdirSync(lib)) {
        const blocksDir = join(lib, slug, "blocks");
        if (!existsSync(blocksDir)) continue;
        const sc = join(lib, slug, SUMMARIES_FILE);
        const recs = new Map<string, { source_hash: string; narrative: { state: string } }>(
          existsSync(sc) ? JSON.parse(readFileSync(sc, "utf-8")).summaries.map((r: { block: string }) => [r.block, r]) : [],
        );
        for (const f of readdirSync(blocksDir)) {
          const b = JSON.parse(readFileSync(join(blocksDir, f), "utf-8"));
          if (b.kind !== "prose" || typeof b.text !== "string") continue;
          const md = readFileSync(join(blocksDir, b.text), "utf-8");
          const body = md.replace(/^---[\s\S]*?---\n/, "").trim();
          if (body === "") continue;
          prose++;
          const r = recs.get(b["@id"]);
          const h = createHash("sha256").update(body).digest("hex");
          if (r && r.source_hash === h && (r.narrative.state === "draft" || r.narrative.state === "confirmed")) summarised++;
        }
      }
    }
    return { prose, summarised };
  }

  test("backlog > 0 and backlog === prose - summarised", () => {
    const t = tally(entryDirs(ROOT).flatMap((d) => entryItems(d)));
    const w = walk();
    expect(t.backlog).toBeGreaterThan(0);
    expect(t.prose).toBe(w.prose);
    expect(t.summarised).toBe(w.summarised);
    expect(t.backlog).toBe(w.prose - w.summarised);
    expect(backlog(ROOT)).toHaveLength(t.backlog);
    // The first drain is on disk.
    expect(w.summarised).toBeGreaterThan(0);
  });
});
