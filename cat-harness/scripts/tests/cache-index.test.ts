/**
 * The cache index keeps its three states apart, and eviction never acts — bean `54rk`.
 *
 * @module cat-harness/scripts/tests/cache-index.test
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { cacheRows, evictionCandidates, summarise } from "../cache-index.js";
import type { MaterializedRecord } from "../check-materialized-fixity.js";

function fixtures(): MaterializedRecord[] {
  const dir = mkdtempSync(join(tmpdir(), "cache-index-"));
  mkdirSync(join(dir, "item"));
  writeFileSync(join(dir, "measured.bin"), "12345"); // 5 bytes
  writeFileSync(join(dir, "old.bin"), "1234567890"); // 10 bytes
  const base = { source: "fixture.json" };
  return [
    { ...base, id: "rec", localPath: "recorded.bin", abs: join(dir, "nope"), record: { state: "materialized", purpose: "working", bytes: 999, materializedAt: "2026-01-01T00:00:00Z" } },
    { ...base, id: "meas", localPath: "measured.bin", abs: join(dir, "measured.bin"), record: { state: "materialized", purpose: "working" } },
    { ...base, id: "dir", localPath: "item", abs: join(dir, "item"), record: { state: "materialized", purpose: "working" } },
    { ...base, id: "gone", record: { state: "materialized", purpose: "working" } },
    { ...base, id: "arch", localPath: "old.bin", abs: join(dir, "old.bin"), record: { state: "materialized", purpose: "archival" } },
    { ...base, id: "exp", localPath: "old.bin", abs: join(dir, "old.bin"), record: { state: "materialized", purpose: "working", expiresAt: "2000-01-01T00:00:00Z" } },
    { ...base, id: "fresh", localPath: "old.bin", abs: join(dir, "old.bin"), record: { state: "materialized", purpose: "working", expiresAt: "2999-01-01T00:00:00Z" } },
    { ...base, id: "olean", localPath: "old.bin", abs: join(dir, "old.bin"), record: { state: "materialized", purpose: "compiled", inputs: { toolchain: "lean4:v4.24.0", sourceRevision: "abc" } } },
  ];
}

describe("size: recorded, measured, directory, absent", () => {
  const rows = cacheRows(fixtures());
  const by = Object.fromEntries(rows.map((r) => [r.id, r]));

  test("a recorded size wins, and is labelled recorded, even when the file is not there", () => {
    expect(by.rec.bytes).toBe(999);
    expect(by.rec.sizeBasis).toBe("recorded");
  });
  test("an unrecorded size is measured from the file and labelled measured", () => {
    expect(by.meas.bytes).toBe(5);
    expect(by.meas.sizeBasis).toBe("measured");
  });
  test("a directory has no size of its own: its parts are counted, so it is not", () => {
    expect(by.dir.bytes).toBeUndefined();
    expect(by.dir.sizeBasis).toBe("directory");
  });
  test("no path means absent, never zero", () => {
    expect(by.gone.bytes).toBeUndefined();
    expect(by.gone.sizeBasis).toBe("absent");
  });
  test("the total counts known sizes only, and says how many it could not", () => {
    const s = summarise(rows);
    expect(s.knownBytes).toBe(999 + 5 + 10 + 10 + 10 + 10);
    expect(s.bySizeBasis).toEqual({ recorded: 1, measured: 5, directory: 1, absent: 1 });
  });
});

describe("dates: recorded or not, never invented", () => {
  const rows = cacheRows(fixtures());
  test("fetchedAt only where the record says; the rest stay undefined", () => {
    expect(rows.filter((r) => r.fetchedAt).map((r) => r.id)).toEqual(["rec"]);
  });
  test("last read is not recorded for ANY row — the owner's ruling, not a gap filled in", () => {
    expect(rows.every((r) => r.lastReadAt === undefined)).toBe(true);
  });
});

describe("eviction reports, and never names what must stay", () => {
  const evict = evictionCandidates(cacheRows(fixtures()));
  const ids = evict.map((e) => e.row.id);
  test("expired comes first, then working copies with no lifetime, largest first", () => {
    expect(ids[0]).toBe("exp");
    expect(ids.slice(1)).toEqual(["rec", "meas", "dir", "gone"]);
  });
  test("an archival copy is never a candidate — it exists to outlive its source", () => {
    expect(ids).not.toContain("arch");
  });
  test("a fresh copy is never a candidate", () => {
    expect(ids).not.toContain("fresh");
  });
  test("a compiled copy is not a no-expiry candidate: its lifetime is its inputs (bean gpdo)", () => {
    expect(ids).not.toContain("olean");
  });
  test("every candidate carries its reason", () => {
    expect(evict.every((e) => e.reason.length > 0)).toBe(true);
  });
});

describe("the real corpus", () => {
  test("the index finds materialized copies at all, so the checks above are not over nothing", () => {
    expect(cacheRows().length).toBeGreaterThan(0);
  });
});
