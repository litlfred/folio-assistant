import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseUses, pinWorkflows, resolveRef, stagingExempt } from "../scripts/pin-actions.ts";

const A = "a".repeat(40), B = "b".repeat(40), C = "c".repeat(40);
const refs = (repo: string) =>
  repo === "owner/annotated"
    ? `${A}\trefs/tags/v5\n${B}\trefs/tags/v5^{}\n`
    : repo === "owner/branchy"
      ? `${C}\trefs/heads/release/v1\n`
      : "";

describe("pin-actions", () => {
  test("an annotated tag pins to its PEELED commit, never the tag object", () => {
    expect(resolveRef("owner/annotated", "v5", (r) => refs(r))).toEqual({ sha: B });
  });

  test("a branch ref resolves to its head", () => {
    expect(resolveRef("owner/branchy", "release/v1", (r) => refs(r))).toEqual({ sha: C });
  });

  test("an unknown ref is REFUSED, not guessed", () => {
    expect("refused" in resolveRef("owner/none", "v9", (r) => refs(r))).toBe(true);
  });

  test("rewrites to @<sha> # <ref>, skips staging-only workflows, and is idempotent", () => {
    const root = mkdtempSync(join(tmpdir(), "pin-actions-"));
    const wf = join(root, ".github", "workflows");
    mkdirSync(wf, { recursive: true });
    writeFileSync(join(wf, "ci.yml"), "    steps:\n      - uses: owner/annotated@v5\n      - uses: ./.github/actions/local\n");
    writeFileSync(join(wf, "feature-staging.yml"), "      - uses: owner/annotated@v5\n");
    const ls = (r: string) => refs(r);
    pinWorkflows(root, { lsRemote: ls });
    expect(readFileSync(join(wf, "ci.yml"), "utf-8")).toContain(`uses: owner/annotated@${B} # v5`);
    expect(readFileSync(join(wf, "feature-staging.yml"), "utf-8")).toContain("owner/annotated@v5");
    expect(pinWorkflows(root, { lsRemote: ls })).toEqual([]);
    expect(parseUses(`      - uses: owner/annotated@${B} # v5`)!.pinned).toBe(true);
  });
});

describe("stagingExempt: decided from what a workflow can do (owner 2026-10-07, roast 1ygp L4.1)", () => {
  test("a listed staging workflow with no write token and no pull_request_target is exempt", () => {
    expect(stagingExempt("feature-staging.yml", "on:\n  pull_request:\npermissions:\n  contents: read\n")).toBe(true);
  });
  test("a write permission anywhere removes the exemption", () => {
    expect(stagingExempt("feature-staging.yml", "permissions:\n  contents: write\n")).toBe(false);
    expect(stagingExempt("feature-staging.yml", "jobs:\n  a:\n    permissions:\n      pages: write\n")).toBe(false);
    expect(stagingExempt("feature-staging.yml", "permissions: write-all\n")).toBe(false);
  });
  test("a pull_request_target trigger removes it; a comment that mentions it does not", () => {
    expect(stagingExempt("folio-staging.yml", "on:\n  pull_request_target:\n    types: [opened]\n")).toBe(false);
    expect(stagingExempt("folio-staging.yml", "on:\n  pull_request:\n# unlike `pull_request_target:` this is safe\n")).toBe(true);
  });
  test("an unlisted file is never exempt, whatever its name says", () => {
    expect(stagingExempt("my-staging.yml", "on:\n  pull_request:\n")).toBe(false);
  });
});
