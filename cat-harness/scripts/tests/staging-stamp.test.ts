/**
 * The staging stamp: absent outside a build, declared inside one.
 *
 * Two properties, and the second is the one that was broken. A stamp that is
 * *written* but not *declared* looks correct in every plain-JSON reading and
 * vanishes the moment a JSON-LD processor touches the document — the `ovkk`
 * defect, which is why `context-declares-staging` below asserts against the
 * exported `@context` rather than against the writer.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { stagingStamp, stagingFields, STAGING_KEY } from "../staging-stamp.js";
import { buildDeclarationSchema, buildToolSchema, buildToolTypes } from "../harness-schema-export.js";
import { repoRootFor } from "../../schemas/cat-harness.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("stagingStamp", () => {
  it("is absent, not fabricated, when there is no build", () => {
    expect(stagingStamp({})).toBeUndefined();
    // A branch with no commit is not half a stamp, it is no stamp: the
    // question a reader has is which commit, and the rest cannot answer it.
    expect(stagingStamp({ KG_BRANCH: "feat/x", GITHUB_RUN_ID: "42" })).toBeUndefined();
    expect(stagingFields({})).toEqual({});
    // Not merely undefined — the KEY must be absent, or a structural
    // comparison would read a local export as a build artefact with a hole.
    expect(Object.keys(stagingFields({}))).toHaveLength(0);
  });

  it("prefers the workflow's branch name over the ref it ran on", () => {
    // They differ on a `pull_request` event, where GITHUB_REF_NAME is the merge
    // ref — not something a reviewer can check out.
    const s = stagingStamp({
      GITHUB_SHA: "abc123",
      KG_BRANCH: "feat/x",
      GITHUB_REF_NAME: "338/merge",
      GITHUB_RUN_ID: "77",
    });
    expect(s).toEqual({ branch: "feat/x", sha: "abc123", pr: "338/merge", run: "77" });
  });

  it("falls back to the ref when the workflow set no branch", () => {
    const s = stagingStamp({ GITHUB_SHA: "abc123", GITHUB_REF_NAME: "main" });
    expect(s).toEqual({ branch: "main", sha: "abc123", pr: "main", run: "" });
  });
});

describe("the JSON-LD export declares the stamp it carries", () => {
  it("context-declares-staging: `staging` is a term, with its four fields scoped under it", async () => {
    const { buildExport } = await import("../kg-export.js");
    const ctx = (await buildExport({})) as unknown as { "@context": Record<string, unknown> };
    const term = ctx["@context"][STAGING_KEY] as { "@id"?: string; "@context"?: Record<string, unknown> };
    expect(term).toBeDefined();
    expect(typeof term["@id"]).toBe("string");
    // Scoped, not global: `branch`/`sha`/`pr`/`run` are words a graph node
    // could use for something else, and a global term would give that other
    // use this meaning.
    for (const f of ["branch", "sha", "pr", "run"]) {
      expect(term["@context"]?.[f]).toBeTypeOf("string");
      expect(ctx["@context"][f]).toBeUndefined();
    }
  });
});

describe("the workflow no longer stamps out of band", () => {
  it("feature-staging.yml does not rewrite the export after writing it", () => {
    const wf = readFileSync(join(repoRootFor(ROOT), ".github", "workflows", "feature-staging.yml"), "utf-8");
    // The inline rewrite reached the JSON-LD and nothing else. If it comes
    // back, the schema documents go unstamped again and the two stamps can
    // disagree.
    expect(wf).not.toMatch(/d\.staging\s*=/);
  });
});

describe("the schema documents are stamped at write time, not in the builders", () => {
  it("a builder's output is the same in a build and outside one", () => {
    // `build*` says what a declaration IS — the same answer in every run. A run
    // id folded in there would make two calls in one process return documents
    // that differ.
    for (const build of [buildDeclarationSchema, buildToolSchema, buildToolTypes]) {
      expect(build({ baseUrl: "https://example.test" })[STAGING_KEY]).toBeUndefined();
    }
  });
});
