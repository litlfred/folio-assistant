/**
 * `staging-preview` — the node type's own behaviour.
 *
 * @module scripts/tests/staging-preview.test
 *
 * Two groups, and the second is the point. The first exercises creation,
 * enrichment and retirement. The second PINS the two measured facts about the
 * trashcan that forced this module's shape — a flat front-matter parser and a
 * key-stripping base schema — so that if either is ever fixed, a test says so
 * out loud rather than leaving a workaround in place that nobody can date.
 */

import { describe, expect, test } from "bun:test";

import { FshGutsNodeSchema, readFshGutsNode, FSH_GUTS_SCHEMA_ID } from "../../schemas/fsh-guts";
import { parseFrontMatter } from "../../schemas/front-matter";
import {
  STAGING_PREVIEW_KIND,
  createStagingPreview,
  enrichStagingPreview,
  isRetired,
  readStagingPreview,
  retireStagingPreview,
  serializeStagingPreview,
  type StagingDeployFacts,
} from "../../schemas/staging-preview";

const DEPLOY: StagingDeployFacts = {
  slug: "claude-sleepy-babbage-ls90iz",
  branch: "claude/sleepy-babbage-ls90iz",
  commit: "20c45eb9cd2e92f7f59f2be4c6edec5e406d5fcb",
  pr: 435,
  issue: 223,
  builtAt: "2026-09-19T15:52:48Z",
  host: "https://litlfred.github.io/folio-assistant",
};

describe("createStagingPreview", () => {
  test("is a valid fsh-guts node, so generic trashcan readers keep working", () => {
    const node = createStagingPreview(DEPLOY);
    expect(FshGutsNodeSchema.safeParse(node).success).toBe(true);
    expect(node.$schema).toBe(FSH_GUTS_SCHEMA_ID);
    expect(node.kind).toBe(STAGING_PREVIEW_KIND);
  });

  test("carries the facts only the deploy knows", () => {
    const node = createStagingPreview(DEPLOY);
    expect(node.staging.pr).toBe(435);
    expect(node.staging.issue).toBe(223);
    expect(node.staging.branch).toBe("claude/sleepy-babbage-ls90iz");
  });

  test("movedFrom is the URL it was served from, when the host is known", () => {
    const node = createStagingPreview(DEPLOY);
    expect(node.movedFrom).toBe(
      "https://litlfred.github.io/folio-assistant/STAGING/claude-sleepy-babbage-ls90iz/",
    );
  });

  test("a deploy that cannot determine its host says nothing rather than guessing gh-pages", () => {
    const { host: _host, ...noHost } = DEPLOY;
    const node = createStagingPreview(noHost);
    expect(node.movedFrom).toBeUndefined();
  });

  test("no observation until a sweep has looked", () => {
    expect(createStagingPreview(DEPLOY).staging.observed).toBeUndefined();
  });
});

describe("enrichStagingPreview", () => {
  const observed = {
    bytes: 39_845_112,
    files: 612,
    liveness: "live" as const,
    signals: ["open-pr"],
    observedAt: "2026-09-19T16:00:00Z",
  };

  test("adds what only the sweep can measure, keeping the deploy facts", () => {
    const node = enrichStagingPreview(createStagingPreview(DEPLOY), observed);
    expect(node.staging.observed?.bytes).toBe(39_845_112);
    expect(node.staging.pr).toBe(435);
  });

  test("does not mutate its input", () => {
    const before = createStagingPreview(DEPLOY);
    enrichStagingPreview(before, observed);
    expect(before.staging.observed).toBeUndefined();
  });

  test("a later sweep replaces the earlier observation — a stale size is not evidence", () => {
    const first = enrichStagingPreview(createStagingPreview(DEPLOY), observed);
    const second = enrichStagingPreview(first, { ...observed, bytes: 1, observedAt: "2026-09-20T16:00:00Z" });
    expect(second.staging.observed?.bytes).toBe(1);
    expect(second.staging.observed?.observedAt).toBe("2026-09-20T16:00:00Z");
  });

  test("liveness keeps its third state — `unknown` is not collapsed into dead", () => {
    const node = enrichStagingPreview(createStagingPreview(DEPLOY), { ...observed, liveness: "unknown" });
    expect(node.staging.observed?.liveness).toBe("unknown");
  });
});

describe("retireStagingPreview", () => {
  test("retirement is a state, not a deletion — the record survives it", () => {
    const node = retireStagingPreview(createStagingPreview(DEPLOY), "PR #435 merged", "2026-09-20T09:00:00Z");
    expect(isRetired(node)).toBe(true);
    expect(node.staging.slug).toBe(DEPLOY.slug);
    expect(node.staging.pr).toBe(435);
  });

  test("a retired record still says what the preview was for", () => {
    const node = retireStagingPreview(createStagingPreview(DEPLOY), "PR #435 merged", "2026-09-20T09:00:00Z");
    expect(node.summary).toContain("claude/sleepy-babbage-ls90iz");
    expect(node.staging.retiredReason).toBe("PR #435 merged");
  });

  test("idempotent — a cleanup that runs twice cannot rewrite when the preview went", () => {
    const once = retireStagingPreview(createStagingPreview(DEPLOY), "PR merged", "2026-09-20T09:00:00Z");
    const twice = retireStagingPreview(once, "something else", "2026-09-21T09:00:00Z");
    expect(twice.staging.retiredOn).toBe("2026-09-20T09:00:00Z");
    expect(twice.staging.retiredReason).toBe("PR merged");
  });

  test("refuses a retirement with no reason, naming the slug", () => {
    expect(() => retireStagingPreview(createStagingPreview(DEPLOY), "   ", "2026-09-20T09:00:00Z")).toThrow(
      /claude-sleepy-babbage-ls90iz/,
    );
  });
});

describe("round trip", () => {
  test("serialize then read returns the same node", () => {
    const node = enrichStagingPreview(createStagingPreview(DEPLOY), {
      bytes: 10,
      files: 2,
      liveness: "dead",
      observedAt: "2026-09-19T16:00:00Z",
    });
    const back = readStagingPreview(serializeStagingPreview(node));
    expect(back.node).toEqual(node);
  });

  test("a node of another kind is refused with a reason naming that kind", () => {
    const other = JSON.stringify({ $schema: FSH_GUTS_SCHEMA_ID, title: "t", kind: "proposal" });
    const r = readStagingPreview(other);
    if (r.node !== undefined) throw new Error("expected a refusal, got a node");
    expect(r.reason).toContain("proposal");
  });

  test("a malformed staging block is a defect, not a clean skip", () => {
    const bad = JSON.stringify({
      $schema: FSH_GUTS_SCHEMA_ID,
      title: "t",
      kind: STAGING_PREVIEW_KIND,
      staging: { slug: "s" },
    });
    const r = readStagingPreview(bad);
    if (r.node !== undefined) throw new Error("expected a refusal, got a node");
    expect(r.reason).toContain("does not satisfy it");
  });

  test("non-JSON is refused rather than throwing", () => {
    expect(readStagingPreview("---\ntitle: hi\n---\n").node).toBeUndefined();
  });
});

describe("the trashcan constraints this module works around", () => {
  // If either of these ever starts failing, the workaround above can go. That
  // is the point of pinning them: a silent fix leaves a detour nobody can date.

  test("the base schema STRIPS a staging block — why this module has its own reader", () => {
    const parsed = FshGutsNodeSchema.parse({
      $schema: FSH_GUTS_SCHEMA_ID,
      title: "t",
      kind: STAGING_PREVIEW_KIND,
      staging: { slug: "s" },
    });
    expect((parsed as Record<string, unknown>)["staging"]).toBeUndefined();
  });

  test("front matter is FLAT — a nested block does not survive it", () => {
    const { fm } = parseFrontMatter(
      `---\n$schema: ${FSH_GUTS_SCHEMA_ID}\ntitle: "t"\nkind: ${STAGING_PREVIEW_KIND}\nstaging:\n  slug: s\n---\n\nbody\n`,
    );
    expect(fm["staging"]).toEqual([]);
    expect(fm["slug"]).toBeUndefined();
  });

  test("so the markdown carrier loses the staging facts entirely", () => {
    const md = `---\n$schema: ${FSH_GUTS_SCHEMA_ID}\ntitle: "t"\nkind: ${STAGING_PREVIEW_KIND}\nstaging:\n  slug: s\n---\n\nbody\n`;
    const r = readFshGutsNode(md);
    expect(r.node).toBeDefined();
    expect((r.node as Record<string, unknown> | undefined)?.["staging"]).toBeUndefined();
  });
});
