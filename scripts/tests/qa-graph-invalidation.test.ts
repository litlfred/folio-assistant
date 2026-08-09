import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { entryIsFresh, freshnessKeys } from "../../content/pipeline/qa-utils";
import { usesGraphHash } from "../../content/pipeline/uses-graph-hash";
import { QA_CRITERIA_BY_ID } from "../../content/pipeline/qa-criteria-registry";
import type { QaCriterionEntry } from "../../schemas/block-qa";

const DETANGLER = [
  "detangler-no-forward-ref",
  "detangler-section-band",
  "detangler-no-xchapter-fwd",
  "detangler-archimedean-wall",
  "detangler-block-tanglement",
  "detangler-graph-energy",
  "detangler-topic-coherence",
  "detangler-no-dependency-cycle",
];

/** A chapter of blocks, each `<name>.ts` + `<name>.md`. */
function chapter(blocks: Record<string, string[]>): string {
  const root = mkdtempSync(join(tmpdir(), "graphhash-"));
  mkdirSync(root, { recursive: true });
  for (const [name, uses] of Object.entries(blocks)) {
    const list = uses.map((u) => `"${u}"`).join(", ");
    writeFileSync(
      join(root, `${name}.ts`),
      `export default prose({ label: "rem:${name}", uses: [${list}] });\n`,
    );
    writeFileSync(join(root, `${name}.md`), `Body of ${name}.\n`);
  }
  return root;
}

describe("usesGraphHash", () => {
  test("changes when an edge is added or removed", () => {
    const a = chapter({ one: ["rem:two"], two: [] });
    const b = chapter({ one: ["rem:two", "rem:three"], two: [] });
    expect(usesGraphHash(a)).not.toBe(usesGraphHash(b));
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  });

  test("is stable when a manifest changes but uses[] does not", () => {
    // The whole point of hashing edges rather than files: an unrelated .ts
    // edit must not invalidate the detangler axis, or the churn that
    // per-criterion script_hash removed comes straight back.
    const root = chapter({ one: ["rem:two"], two: [] });
    const before = usesGraphHash(root);
    writeFileSync(
      join(root, "one.ts"),
      `// a comment that changes the file but not the edges\n` +
        `export default prose({ label: "rem:one", uses: ["rem:two"] });\n`,
    );
    expect(usesGraphHash(root)).toBe(before);
    rmSync(root, { recursive: true, force: true });
  });

  test("is independent of block ordering", () => {
    const a = chapter({ alpha: ["rem:beta"], beta: [] });
    const b = chapter({ beta: [], alpha: ["rem:beta"] });
    expect(usesGraphHash(a)).toBe(usesGraphHash(b));
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  });
});

describe("graph-scoped criteria", () => {
  test("every detangler criterion is graph-scoped", () => {
    for (const id of DETANGLER) {
      const def = QA_CRITERIA_BY_ID[id];
      expect(def, `${id} missing from registry`).toBeTruthy();
      expect(freshnessKeys(def), id).toContain("graph");
    }
  });

  test("a non-detangler criterion is NOT graph-scoped", () => {
    expect(freshnessKeys(QA_CRITERIA_BY_ID["voice-ai-slop"])).not.toContain("graph");
  });
});

describe("entryIsFresh with a graph key", () => {
  const entry = (graph?: string): QaCriterionEntry =>
    ({
      field_hash: { md: "aaaaaaaaaaaa", ts: "bbbbbbbbbbbb", ...(graph ? { graph } : {}) },
      result: "fail",
      reviewer: { kind: "script", id: "x", version: "v1" },
      reviewed_at: "2026-01-01T00:00:00.000Z",
      reviewed_sha: "1".repeat(40),
    }) as QaCriterionEntry;

  const keys = ["md", "ts", "graph"] as Array<"md" | "ts" | "graph">;

  test("a changed graph makes the entry stale", () => {
    // The regression this exists for: breaking a cycle in block A left 15
    // OTHER blocks recording a cycle that no longer existed, because their
    // own md/ts were untouched.
    const current = { md: "aaaaaaaaaaaa", ts: "bbbbbbbbbbbb", graph: "999999999999" };
    expect(entryIsFresh(entry("111111111111"), current, keys)).toBe(false);
  });

  test("an unchanged graph leaves it fresh", () => {
    const current = { md: "aaaaaaaaaaaa", ts: "bbbbbbbbbbbb", graph: "111111111111" };
    expect(entryIsFresh(entry("111111111111"), current, keys)).toBe(true);
  });

  test("an entry predating the graph key is stale once a graph hash exists", () => {
    // Over-invalidate rather than present a stale verdict as current.
    const current = { md: "aaaaaaaaaaaa", ts: "bbbbbbbbbbbb", graph: "111111111111" };
    expect(entryIsFresh(entry(undefined), current, keys)).toBe(false);
  });
});
