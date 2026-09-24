/**
 * Issue #556 — materializing a remote package's skills, pinned and read-only.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { RemotePackageRefSchema } from "../../schemas/skill-package.ts";
import { buildRecord, checkMaterialized, pinnedRef, RECORD_FILE, upstreamSkillDir, type Wrapper } from "../sync-remote-packages.ts";

const SHA = "49c6e97775eaa18ba791bebe23162a70ae601c18";

const wrapper = (over: Partial<Wrapper> = {}): Wrapper => ({
  file: "w.json",
  name: "pkg",
  description: "a package",
  repo: "https://github.com/example/pkg",
  ref: SHA,
  path: "skills",
  maintainer: "x",
  sync: { strategy: "shallow-clone", frequency: "manual", autoUpdate: false },
  wrapper: { description: "d", skills: ["alpha"] },
  ...over,
});

function fixture(w: Wrapper, materialize: { ref?: string; pkg?: string } | null): string {
  const skills = mkdtempSync(join(tmpdir(), "sync-test-"));
  mkdirSync(join(skills, "remote-packages"));
  const { file, ...body } = w;
  writeFileSync(join(skills, "remote-packages", file), JSON.stringify({ ...body, wrapper: { ...body.wrapper, docker: { baseImage: "u", aptPackages: [] } } }));
  if (materialize) {
    mkdirSync(join(skills, "alpha"));
    writeFileSync(join(skills, "alpha", "alpha.md"), "---\nname: alpha\n---\n# A\n");
    writeFileSync(join(skills, "alpha", RECORD_FILE), JSON.stringify({ ref: materialize.ref ?? w.ref, package: materialize.pkg ?? w.name }));
  }
  return skills;
}

describe("a synced skill is pinned to a commit", () => {
  test("a full SHA is a pin; a branch or a short SHA is not", () => {
    expect(pinnedRef(SHA).ok).toBe(true);
    expect(pinnedRef("main").ok).toBe(false);
    expect(pinnedRef(SHA.slice(0, 12)).ok).toBe(false);
  });

  test("the schema refuses a syncing wrapper on a branch, or one that auto-updates", () => {
    const { file: _file, ...w } = wrapper();
    const base = { ...w, wrapper: { ...w.wrapper, docker: { baseImage: "u", aptPackages: [] } } };
    expect(RemotePackageRefSchema.safeParse(base).error?.issues ?? []).toEqual([]);
    expect(RemotePackageRefSchema.safeParse({ ...base, ref: "main" }).success).toBe(false);
    expect(RemotePackageRefSchema.safeParse({ ...base, sync: { ...base.sync, autoUpdate: true } }).success).toBe(false);
    // A wrapper that only declares a library (no sync) may name a branch.
    const { sync: _sync, ...noSync } = base;
    expect(RemotePackageRefSchema.safeParse({ ...noSync, ref: "main" }).success).toBe(true);
  });
});

describe("check:remote-skills, offline", () => {
  test("materialized at the pin is clean", () => {
    expect(checkMaterialized(fixture(wrapper(), {}))).toEqual([]);
  });
  test("declared and not materialized is a finding", () => {
    expect(checkMaterialized(fixture(wrapper(), null)).join()).toContain("not materialized");
  });
  test("materialized at a different commit than the pin is a finding", () => {
    expect(checkMaterialized(fixture(wrapper(), { ref: "0".repeat(40) })).join()).toContain("re-sync");
  });
  test("materialized from another package is a finding", () => {
    expect(checkMaterialized(fixture(wrapper(), { pkg: "other" })).join()).toContain("declared by");
  });
  test("an unpinned syncing wrapper is a finding", () => {
    expect(checkMaterialized(fixture(wrapper({ ref: "main" }), {})).join()).toContain("not a full commit SHA");
  });
});

describe("the record check:materialized-fixity reads", () => {
  test("one sha256 record per file, instance-relative, pointing at the pinned upstream blob", () => {
    const inst = mkdtempSync(join(tmpdir(), "sync-inst-"));
    const pkg = join(inst, "skills", "alpha");
    mkdirSync(join(pkg, "references"), { recursive: true });
    writeFileSync(join(pkg, "alpha.md"), "body");
    writeFileSync(join(pkg, "references", "r.md"), "ref");
    const rec = buildRecord(wrapper(), "alpha", pkg, inst, (l) => `skills/alpha/${l === "alpha.md" ? "SKILL.md" : l}`, "2026-09-24T00:00:00Z");
    const files = rec.files as { name: string; materialization: Record<string, unknown> }[];
    expect(files.map((f) => f.name)).toEqual(["alpha.md", "references/r.md"]);
    const m = files[0].materialization as { localPath: string; provenance: { upstream: string }; fixity: { digest: string } };
    expect(m.localPath).toBe("skills/alpha/alpha.md");
    expect(m.provenance.upstream).toBe(`https://github.com/example/pkg/blob/${SHA}/skills/alpha/SKILL.md`);
    expect(m.fixity.digest).toMatch(/^[0-9a-f]{64}$/);
  });

  test("the upstream directory follows the wrapper's path", () => {
    expect(upstreamSkillDir("/c", { path: "skills" }, "a")).toBe("/c/skills/a");
    expect(upstreamSkillDir("/c", { path: "/" }, "a")).toBe("/c/a");
  });
});
