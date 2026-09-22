/**
 * Materialized content is read-only, and fixity is what says so.
 *
 * Owner, 2026-09-21: *"if we have a mateiralized `<stub>/<sub-graph>`, the
 * contents of it should be immutable … you would need to copy/mateiralize it
 * to your own `folio/` in order to mess around with it."* And 2026-09-22,
 * choosing between advising and enforcing: **enforce from the start.**
 *
 * ## The four verdicts are four different facts
 *
 * Every assertion here is about keeping them apart, because each collapse has
 * already happened once:
 *
 * - **verified** vs **unverifiable** — `materialization.ts` says an archival
 *   copy with no fixity *"is not an archive, it is a file somebody kept"*.
 *   Reporting one as the other turns "nobody can check this" into "this is
 *   unchanged".
 * - **absent** vs **unverifiable** — the first version of `verify()` asked
 *   about the digest before asking whether the bytes existed, so two
 *   smart-immunizations artefacts that are declared materialized **with no
 *   file at all** were filed as "no fixity digest recorded", beside 217 that
 *   are merely unverified. A broken claim hid inside a softer category.
 * - **covered-by-parts** vs **unverifiable** — who-iris's items point at a
 *   DIRECTORY (`library/<id>`) while their bitstreams point at
 *   `uploads/<id>/<file>`. A file digest cannot apply to a directory, so the
 *   item read as a gap while every byte under it was verified by its parts.
 *   The same defect as `harness-tiles` reporting a viewer nobody had built,
 *   one layer along.
 *
 * @module cat-harness/scripts/tests/materialized-fixity.test
 */
import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { collect, materializationsIn, run, verify } from "../check-materialized-fixity.js";
import { applyTo, backfillable } from "../backfill-materialized-fixity.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");

/** sha256 of the string "hello", used as a known-good digest in fixtures. */
const HELLO = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

function fixture(): { dir: string; file: string } {
  const dir = mkdtempSync(join(tmpdir(), "fixity-"));
  mkdirSync(join(dir, "sub"), { recursive: true });
  const file = join(dir, "sub", "a.txt");
  writeFileSync(file, "hello");
  return { dir, file };
}

describe("the corpus verifies", () => {
  const verdicts = run(REPO);

  it("finds materialized artefacts at all", () => {
    // Vacuity guard. A checker that swept nothing would report a clean corpus,
    // which is the `dh4f` shape this repository names.
    expect(verdicts.length).toBeGreaterThan(0);
  });

  it("nothing has been edited in place", () => {
    // THE RULE ITSELF. A mismatch means a copy of somebody else's artefact was
    // changed here without saying so.
    const edited = verdicts
      .filter((v) => v.kind === "mismatch")
      .map((v) => `${v.record.localPath} (${v.record.source})`);
    expect(edited).toEqual([]);
  });

  it("every verdict is exactly one of the five kinds", () => {
    for (const v of verdicts) {
      expect(["verified", "mismatch", "absent", "unverifiable", "covered-by-parts"]).toContain(v.kind);
    }
  });

  it("an unverifiable artefact is never counted as verified", () => {
    for (const v of verdicts) {
      if (v.kind !== "verified") continue;
      // A verified verdict must have had something to verify against.
      expect(v.record.digest, `${v.record.localPath} verified with no digest`).toBeDefined();
    }
  });
});

describe("verify() keeps the four facts apart", () => {
  it("bytes that match their digest are verified", () => {
    const { dir, file } = fixture();
    try {
      expect(verify({ source: "x", localPath: "sub/a.txt", abs: file, digest: HELLO }).kind).toBe("verified");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("bytes that do NOT match are a mismatch, not an error about fixity", () => {
    const { dir, file } = fixture();
    try {
      const v = verify({ source: "x", localPath: "sub/a.txt", abs: file, digest: "0".repeat(64) });
      expect(v.kind).toBe("mismatch");
      if (v.kind === "mismatch") expect(v.actual).toBe(HELLO);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ABSENT BYTES ARE ABSENT, even when no digest was recorded", () => {
    // The ordering defect, pinned. Both fields are missing here; the verdict
    // must be the one about the bytes, because a materialized record with no
    // file is a broken claim whatever its fixity says.
    const v = verify({ source: "x", localPath: "gone.txt", abs: "/nonexistent/gone.txt" });
    expect(v.kind).toBe("absent");
  });

  it("a file with no digest is unverifiable, not verified", () => {
    const { dir, file } = fixture();
    try {
      const v = verify({ source: "x", localPath: "sub/a.txt", abs: file });
      expect(v.kind).toBe("unverifiable");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("an unsupported algorithm is unverifiable rather than a pass", () => {
    const { dir, file } = fixture();
    try {
      const v = verify({ source: "x", localPath: "sub/a.txt", abs: file, algorithm: "md5", digest: "x" });
      expect(v.kind).toBe("unverifiable");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("a directory is covered by its node's verified parts, not called a gap", () => {
    const { dir } = fixture();
    try {
      const item = { source: "n.json", localPath: "sub", abs: join(dir, "sub") };
      const part = { source: "n.json", localPath: "elsewhere/a.txt", digest: HELLO };
      // Deliberately NOT beneath the directory: who-iris's parts live in a
      // different tree, which is why the relation is by node.
      expect(verify(item, [item, part]).kind).toBe("covered-by-parts");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("a directory whose node declares no verified part is unverifiable", () => {
    const { dir } = fixture();
    try {
      const item = { source: "n.json", localPath: "sub", abs: join(dir, "sub") };
      expect(verify(item, [item]).kind).toBe("unverifiable");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("materializationsIn walks rather than reading a fixed shape", () => {
  it("finds a record nested at any depth", () => {
    const doc = { a: { b: [{ id: "x", materialization: { state: "materialized", localPath: "p" } }] } };
    const found = materializationsIn(doc, "s.json");
    expect(found.length).toBe(1);
    expect(found[0]!.id).toBe("x");
  });

  it("ignores states that are not materialized", () => {
    const doc = { materialization: { state: "referenced", localPath: "p" } };
    expect(materializationsIn(doc, "s.json")).toEqual([]);
  });

  it("finds BOTH a node's own record and its children's", () => {
    // who-iris's shape: an item and the bitstreams beneath it.
    const doc = {
      id: "item/1",
      materialization: { state: "materialized", localPath: "library/1" },
      bitstreams: [{ name: "a.pdf", materialization: { state: "materialized", localPath: "uploads/1/a.pdf" } }],
    };
    expect(materializationsIn(doc, "s.json").length).toBe(2);
  });
});

describe("the backfill records a baseline, and says so", () => {
  it("only offers to fill FILES that have no digest", () => {
    const recs = collect(REPO);
    for (const r of backfillable(recs)) {
      expect(r.digest).toBeUndefined();
      expect(r.localPath).toBeDefined();
    }
  });

  it("writes a digest and a note that does not overclaim", () => {
    const doc: Record<string, unknown> = {
      materialization: { state: "materialized", localPath: "sub/a.txt" },
    };
    const n = applyTo(doc, new Map([["sub/a.txt", HELLO]]));
    expect(n).toBe(1);
    const fx = (doc.materialization as Record<string, unknown>).fixity as Record<string, string>;
    expect(fx.digest).toBe(HELLO);
    expect(fx.algorithm).toBe("sha256");
    // THE CAVEAT IS PART OF THE DATA. A digest observed at backfill proves the
    // bytes are unchanged from now on; it cannot prove they were ever pristine.
    // Recording that only in a commit message would put it where it is read
    // once, rather than where it is read every time somebody asks what the
    // digest means.
    expect(fx.note).toContain("baseline");
    expect(fx.note).toContain("does NOT");
  });

  it("never overwrites a digest that is already there", () => {
    // A backfill that clobbered an ingestion-time digest would replace a
    // stronger claim with a weaker one, silently.
    const doc: Record<string, unknown> = {
      materialization: { state: "materialized", localPath: "sub/a.txt", fixity: { digest: "original" } },
    };
    expect(applyTo(doc, new Map([["sub/a.txt", HELLO]]))).toBe(0);
    const fx = (doc.materialization as Record<string, unknown>).fixity as Record<string, string>;
    expect(fx.digest).toBe("original");
  });
});
