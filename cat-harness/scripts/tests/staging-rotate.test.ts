/**
 * `staging-rotate` — the preview cap. Owner ruling 2026-10-02, issue #1868.
 *
 * @module scripts/tests/staging-rotate.test
 *
 * Five properties the ruling and `deletion-requires-confirmation` between them
 * require: under the cap nothing goes; over it the OLDEST go; the preview
 * being staged never goes; `_retired/` and anything that is not a preview are
 * never touched; and a preview with no stamp still gets an age from the
 * fallbacks rather than being treated as new.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.js";
import { createStagingPreview, readStagingPreview, serializeStagingPreview } from "../../schemas/staging-preview.ts";
import {
  MAX_PREVIEWS,
  STAGED_AT_FILE,
  isPreviewName,
  planRotation,
  readPreviews,
  rotate,
  type GitTime,
  type Preview,
} from "../staging-rotate.ts";

const NOW = "2026-10-02T12:00:00.000Z";
const NOW_MS = Date.parse(NOW);
const HOUR = 3_600_000;
const noGit: GitTime = () => undefined;

function p(slug: string, hoursAgo: number | undefined): Preview {
  return {
    slug,
    updatedMs: hoursAgo === undefined ? undefined : NOW_MS - hoursAgo * HOUR,
    source: hoursAgo === undefined ? "unknown" : "stamp",
    bytes: 0,
  };
}

/** A scratch `gh-pages` checkout with one directory per `[slug, hoursAgo]`. */
function pages(previews: [string, number | undefined][]): string {
  const dir = mkdtempSync(join(tmpdir(), "staging-rotate-"));
  for (const [slug, h] of previews) {
    const d = join(dir, "STAGING", slug);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, "index.html"), `<p>${slug}</p>`);
    if (h !== undefined) writeFileSync(join(d, STAGED_AT_FILE), new Date(NOW_MS - h * HOUR).toISOString());
  }
  return dir;
}

const remaining = (dir: string) => readdirSync(join(dir, "STAGING")).sort();

describe("the cap is the owner's number", () => {
  test("ten, defined once", () => {
    expect(MAX_PREVIEWS).toBe(10);
  });
});

describe("planRotation — pure", () => {
  test("under the cap, nothing is removed", () => {
    const plan = planRotation([p("a", 1), p("b", 50), p("c", 500)], "a", 10);
    expect(plan.remove).toEqual([]);
    expect(plan.keep.map((x) => x.slug).sort()).toEqual(["a", "b", "c"]);
  });

  test("exactly at the cap, nothing is removed — the cap counts the current preview", () => {
    const all = Array.from({ length: 10 }, (_, i) => p(`s${i}`, i));
    expect(planRotation(all, "s0", 10).remove).toEqual([]);
  });

  test("over the cap, the OLDEST are removed", () => {
    const all = Array.from({ length: 13 }, (_, i) => p(`s${String(i).padStart(2, "0")}`, i));
    const plan = planRotation(all, "s00", 10);
    expect(plan.remove.map((x) => x.slug)).toEqual(["s10", "s11", "s12"]);
    expect(plan.keep).toHaveLength(10);
  });

  test("the current preview is never removed, even when it is the oldest", () => {
    const all = [p("cur", 9999), ...Array.from({ length: 12 }, (_, i) => p(`o${i}`, i))];
    const plan = planRotation(all, "cur", 10);
    expect(plan.keep.map((x) => x.slug)).toContain("cur");
    expect(plan.remove.map((x) => x.slug)).not.toContain("cur");
    expect(plan.keep).toHaveLength(10);
  });

  test("the current preview keeps its slot even if not yet on the tree", () => {
    const all = Array.from({ length: 10 }, (_, i) => p(`o${i}`, i));
    const plan = planRotation(all, "new", 10);
    expect(plan.remove.map((x) => x.slug)).toEqual(["o9"]);
  });

  test("unknown ages sort oldest; ties break by slug", () => {
    const plan = planRotation([p("cur", 0), p("b", 5), p("z", 5), p("u", undefined)], "cur", 2);
    expect(plan.keep.map((x) => x.slug)).toEqual(["cur", "b"]);
    expect(plan.remove.map((x) => x.slug)).toEqual(["z", "u"]);
  });

  test("a cap below one is refused", () => {
    expect(() => planRotation([], "x", 0)).toThrow();
  });
});

describe("what counts as a preview", () => {
  test("_retired, dot- and underscore-entries and non-slugs are not previews", () => {
    expect(isPreviewName("_retired")).toBe(false);
    expect(isPreviewName(".git")).toBe(false);
    expect(isPreviewName("_reserved")).toBe(false);
    expect(isPreviewName("has space")).toBe(false);
    expect(isPreviewName("claude-foo-bar")).toBe(true);
  });
});

describe("rotate — on a checkout", () => {
  test("under the cap, nothing is removed and the current preview is stamped", () => {
    const dir = pages([["cur", undefined], ["a", 3], ["b", 30]]);
    const { plan } = rotate({ dir, current: "cur", now: NOW, git: noGit });
    expect(plan.remove).toEqual([]);
    expect(remaining(dir)).toEqual(["a", "b", "cur"]);
    expect(readFileSync(join(dir, "STAGING", "cur", STAGED_AT_FILE), "utf8").trim()).toBe(NOW);
  });

  test("over the cap, the oldest go, each with a render-log entry and a retired record", () => {
    const list: [string, number][] = Array.from({ length: 11 }, (_, i) => [`p${String(i).padStart(2, "0")}`, i + 1]);
    const dir = pages([["cur", undefined], ...list]);
    // Give the oldest a record, so its retirement can be checked.
    const rec = createStagingPreview({
      slug: "p10",
      branch: "claude/p10",
      commit: "abc1234",
      builtAt: "2026-09-01T00:00:00Z",
    });
    writeFileSync(join(dir, "STAGING", "p10", "staging-preview.json"), serializeStagingPreview(rec));

    const { plan, lines } = rotate({ dir, current: "cur", now: NOW, git: noGit, max: 10 });
    expect(plan.remove.map((x) => x.slug)).toEqual(["p09", "p10"]);
    expect(existsSync(join(dir, "STAGING", "p09"))).toBe(false);
    expect(existsSync(join(dir, "STAGING", "p10"))).toBe(false);
    expect(existsSync(join(dir, "STAGING", "cur"))).toBe(true);
    expect(lines[0]).toMatch(/rotated off STAGING\/p09: 10\.0h old/);

    const retired = readStagingPreview(readFileSync(join(dir, "STAGING", "_retired", "p10.json"), "utf8")).node;
    expect(retired?.staging.retiredOn).toBe(NOW);
    expect(retired?.staging.retiredReason).toContain("#1868");

    const log = readFileSync(join(dir, "_render-log", "2026-10-02.jsonl"), "utf8").trim().split("\n");
    expect(log.map((l) => JSON.parse(l).subject.path).sort()).toEqual(["STAGING/p09", "STAGING/p10"]);
    expect(log.every((l) => JSON.parse(l).event === "removed")).toBe(true);
  });

  test("_retired and non-preview entries are untouched, and do not count toward the cap", () => {
    const dir = pages([["cur", undefined], ["a", 1], ["b", 2]]);
    mkdirSync(join(dir, "STAGING", "_retired"), { recursive: true });
    writeFileSync(join(dir, "STAGING", "_retired", "old.json"), "{}");
    writeFileSync(join(dir, "STAGING", "README.txt"), "not a preview");
    mkdirSync(join(dir, "STAGING", ".hidden"));
    const { plan } = rotate({ dir, current: "cur", now: NOW, git: noGit, max: 2 });
    expect(plan.remove.map((x) => x.slug)).toEqual(["b"]);
    expect(remaining(dir)).toEqual([".hidden", "README.txt", "_retired", "a", "cur"]);
    expect(readFileSync(join(dir, "STAGING", "_retired", "old.json"), "utf8")).toBe("{}");
  });

  test("a missing stamp falls back: render log, then record, then git", () => {
    const dir = pages([["cur", undefined], ["logged", undefined], ["recorded", undefined], ["gitonly", undefined]]);
    mkdirSync(join(dir, "_render-log"));
    writeFileSync(
      join(dir, "_render-log", "2026-10-01.jsonl"),
      JSON.stringify({
        $schema: "folio-render-log/v1",
        id: "x",
        at: "2026-10-01T12:00:00.000Z",
        event: "rendered",
        subject: { kind: "staging-preview", path: "STAGING/logged", slug: "logged" },
        summary: "staging preview published",
        process: "Process_RenderLog",
        capture: "on",
      }) + "\n",
    );
    writeFileSync(
      join(dir, "STAGING", "recorded", "staging-preview.json"),
      serializeStagingPreview(
        createStagingPreview({ slug: "recorded", branch: "b", commit: "c", builtAt: "2026-09-25T00:00:00Z" }),
      ),
    );
    const git: GitTime = (_d, path) => (path === "STAGING/gitonly" ? Date.parse("2026-09-01T00:00:00Z") : undefined);

    const byslug = Object.fromEntries(readPreviews(dir, git).map((x) => [x.slug, x]));
    expect(byslug.logged.source).toBe("render-log");
    expect(byslug.recorded.source).toBe("record");
    expect(byslug.gitonly.source).toBe("git");
    expect(byslug.cur.source).toBe("unknown");

    // Cap 2: `cur` plus the newest of the rest, which is the render-logged one.
    const { plan } = rotate({ dir, current: "cur", now: NOW, git, max: 2 });
    expect(plan.keep.map((x) => x.slug)).toEqual(["cur", "logged"]);
    expect(plan.remove.map((x) => x.slug)).toEqual(["recorded", "gitonly"]);
  });

  test("refuses a current slug that is not a preview name", () => {
    const dir = pages([]);
    expect(() => rotate({ dir, current: "_retired", now: NOW, git: noGit })).toThrow();
    expect(() => rotate({ dir, current: "..", now: NOW, git: noGit })).toThrow();
  });
});

describe("the stage job runs the rotation where a lost race re-applies it", () => {
  // The workflow lives at the REPOSITORY root, one level above this instance.
  const YML = readFileSync(
    join(repoRootFor(resolve(import.meta.dir, "..", "..")), ".github", "workflows", "feature-staging.yml"),
    "utf-8",
  );
  const step = YML.slice(YML.indexOf("- name: Deploy the preview and log the render, in one commit"));
  const body = step.slice(0, step.indexOf("\n      - name:", 10));

  test("inside the attempt loop, after the re-read and before the push", () => {
    const loop = body.indexOf("for attempt in 1 2 3; do");
    const reset = body.indexOf("git -C pages reset --hard FETCH_HEAD");
    const rot = body.indexOf("staging-rotate.ts --dir pages");
    const push = body.indexOf("git -C pages push origin gh-pages");
    expect([loop, reset, rot, push].every((i) => i > -1)).toBe(true);
    expect(reset).toBeGreaterThan(loop);
    expect(rot).toBeGreaterThan(reset);
    expect(push).toBeGreaterThan(rot);
  });

  test("passes no cap of its own — the number lives once, in the script", () => {
    expect(body).not.toMatch(/staging-rotate\.ts[^\n]*--max/);
    expect(YML).not.toMatch(/MAX_PREVIEWS:/);
  });
});
