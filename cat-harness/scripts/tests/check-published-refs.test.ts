/**
 * The rule under test: a SHA may stage; only a version may publish.
 *
 * The two properties worth more than the happy path are the ones a careless
 * implementation loses — that PROVENANCE is not a finding, and that examining
 * nothing is not a pass.
 */
import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  PROVENANCE_KEYS,
  assetSourceRefs,
  auditPublishedRefs,
  classifyRef,
  dependencyRefs,
  formatReport,
  publishedGraphRefs,
} from "../check-published-refs";
import {  } from "../../schemas/cat-harness.js";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

describe("classifyRef", () => {
  it("accepts a version, with or without the tag's leading v", () => {
    expect(classifyRef("1.2.3")).toBe("semver");
    expect(classifyRef("v1.2.3")).toBe("semver");
    expect(classifyRef("1.2.3-rc.1")).toBe("semver");
  });

  it("calls a SHA a SHA, at both git's lengths", () => {
    expect(classifyRef("50d2369")).toBe("sha");
    expect(classifyRef("50d23691d61f4ce6c1187d032477b4104dbaafa3")).toBe("sha");
  });

  it("names FHIR's pseudo-versions separately from a branch", () => {
    // Their remedies differ: a branch name is usually an accident, `current`
    // usually is not.
    expect(classifyRef("current")).toBe("prerelease");
    expect(classifyRef("dev")).toBe("prerelease");
    expect(classifyRef("main")).toBe("moving");
    expect(classifyRef("release-2026")).toBe("moving");
  });

  it("absent and empty are `unpinned` — `current` by omission", () => {
    expect(classifyRef(undefined)).toBe("unpinned");
    expect(classifyRef("   ")).toBe("unpinned");
  });
});

/** An instance tree with a declaration and an optional folio config. */
function instance(decl: unknown, config?: unknown): string {
  const root = mkdtempSync(join(tmpdir(), "pubrefs-"));
  mkdirSync(join(root, "inst"), { recursive: true });
  writeDeclaration(join(root, "inst"), JSON.stringify(decl));
  if (config !== undefined) writeFileSync(join(root, "inst", "harness.config.json"), JSON.stringify(config));
  return root;
}

describe("carrier 1 — instance dependencies", () => {
  it("a SHA-pinned dependency is a MAJOR finding", () => {
    const root = instance(
      { name: "t" },
      { dependencies: { folioAssistant: [{ name: "core", ref: "50d23691d61f4ce6c1187d032477b4104dbaafa3" }] } },
    );
    const r = dependencyRefs(root);
    expect(r.examined).toBe(1);
    expect(r.findings[0]!.kind).toBe("sha");
    expect(r.findings[0]!.severity).toBe("major");
    rmSync(root, { recursive: true, force: true });
  });

  it("a version passes, and `version` wins over a `ref` left behind", () => {
    // `ref` is demoted to "how to fetch while staging", so a config carrying
    // both is pinned, not floating.
    const root = instance({ name: "t" }, { dependencies: { folioAssistant: [{ name: "core", version: "1.2.3", ref: "main" }] } });
    expect(dependencyRefs(root).findings).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });

  it("a branch is a finding, and says WHY rather than just naming it", () => {
    const root = instance({ name: "t" }, { dependencies: { folioAssistant: [{ name: "core", ref: "main" }] } });
    const f = dependencyRefs(root).findings[0]!;
    expect(f.kind).toBe("moving");
    expect(f.detail).toContain("different content later");
    rmSync(root, { recursive: true, force: true });
  });

  it("an unreadable config is a finding, NOT an empty dependency set", () => {
    const root = mkdtempSync(join(tmpdir(), "pubrefs-bad-"));
    mkdirSync(join(root, "inst"), { recursive: true });
    writeDeclaration(join(root, "inst"), JSON.stringify({ name: "t" }));
    writeFileSync(join(root, "inst", "harness.config.json"), "{ not json");
    expect(dependencyRefs(root).findings).toHaveLength(1);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("carrier 2 — asset sources", () => {
  it("an asset with no `source` is not examined — authored here is a third state", () => {
    const root = instance({ name: "t", assets: [{ id: "a", src: "A.md", role: "agent-instructions" }] });
    expect(assetSourceRefs(root).examined).toBe(0);
    rmSync(root, { recursive: true, force: true });
  });

  it("a `source` with no ref is `unpinned`, at MINOR", () => {
    const root = instance({
      name: "t",
      assets: [{ id: "a", src: "A.md", source: { instance: "o/r", path: "A.md" } }],
    });
    const f = assetSourceRefs(root).findings[0]!;
    expect(f.kind).toBe("unpinned");
    expect(f.severity).toBe("minor");
    rmSync(root, { recursive: true, force: true });
  });

  it("this repository's own unpinned source is found", () => {
    // The real one, and the reason this gate is not a check over nothing: the
    // root's `agent-instructions` names bootstrap's file with no ref.
    const repo = resolve(import.meta.dir, "..", "..", "..");
    const wheres = assetSourceRefs(repo).findings.map((f) => f.where);
    expect(wheres.some((w) => w.includes("agent-instructions"))).toBe(true);
  });
});

describe("provenance is not a reference", () => {
  it("the keys are DECLARED, so adding one is a decision", () => {
    // A shape-based check (/[0-9a-f]{40}/ over the published JSON) would fail
    // on the build stamp — the exported graph's only 40-hex string.
    expect(PROVENANCE_KEYS).toContain("stagingSha");
    expect(PROVENANCE_KEYS).toContain("sourceCommitSha");
  });

  it("the published-graph carrier says the stamp is out of scope, and why", () => {
    expect(publishedGraphRefs(".").note).toContain("PROVENANCE");
  });
});

describe("examining nothing is never a pass", () => {
  it("an empty repository reports NOTHING WAS EXAMINED", () => {
    const empty = mkdtempSync(join(tmpdir(), "pubrefs-empty-"));
    const text = formatReport(auditPublishedRefs(empty));
    expect(text).toContain("NOTHING WAS EXAMINED");
    expect(text).toContain("not a pass");
    rmSync(empty, { recursive: true, force: true });
  });

  it("every carrier with nothing examined explains why", () => {
    const empty = mkdtempSync(join(tmpdir(), "pubrefs-empty2-"));
    for (const r of auditPublishedRefs(empty)) {
      if (r.examined === 0) expect(r.note).toBeDefined();
    }
    rmSync(empty, { recursive: true, force: true });
  });

  it("the report states that previews are out of scope BY DESIGN", () => {
    const repo = resolve(import.meta.dir, "..", "..", "..");
    expect(formatReport(auditPublishedRefs(repo))).toContain("STAGING");
  });
});
