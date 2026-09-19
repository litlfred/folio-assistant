/**
 * Declared assets exist, and their links resolve.
 *
 * @module scripts/tests/declared-assets.test
 *
 * The property `v8gh` needed and nobody had: not "somebody wrote an AGENTS.md
 * checker" but "the file is declared, so a checker has a reason to look".
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { declaredAssets, AGENT_INSTRUCTIONS_ROLE } from "../../schemas/cat-harness.js";
import { auditInstance, isCheckable, markdownLinks } from "../check-declared-assets.js";

const ROOT = resolve(import.meta.dir, "../..");

function instance(assets: unknown[], files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), "assets-"));
  writeFileSync(join(root, "harness.json"), JSON.stringify({ name: "t", assets }));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(join(root, rel), body);
  }
  return root;
}

describe("this repository's own declarations", () => {
  test("both instances declare their agent instructions", () => {
    // The gap that started this: `AGENTS.md` was the only root artefact in
    // neither `directories[]` nor `images[]`.
    for (const inst of [ROOT, join(ROOT, "bootstrap")]) {
      const agents = declaredAssets(inst).filter((a) => a.role === AGENT_INSTRUCTIONS_ROLE);
      expect(agents).toHaveLength(1);
      expect(agents[0]!.exists).toBe(true);
    }
  });

  test("no declared asset is missing and no link is dead", () => {
    for (const inst of [ROOT, join(ROOT, "bootstrap")]) {
      expect(auditInstance(inst).findings).toEqual([]);
    }
  });

  test("bootstrap's AGENTS.md is its own origin; the root's names a source", () => {
    // Absent `source` is a THIRD STATE — authored here — and is a different
    // fact from an upstream that cannot be reached.
    const boot = declaredAssets(join(ROOT, "bootstrap")).find((a) => a.id === "agent-instructions");
    const root = declaredAssets(ROOT).find((a) => a.id === "agent-instructions");
    expect(boot!.source).toBeUndefined();
    expect(root!.source?.path).toBe("bootstrap/AGENTS.md");
  });
});

describe("the gate catches what v8gh measured", () => {
  test("a link broken by a directory move is a finding", () => {
    // `docs/guides/agent-onboarding.md` is the REAL path from v8gh: it moved
    // under `docs/folio-assistant/`, and it is the one AGENTS.md's own banner
    // calls the place to start, so a cold agent following it hit a 404.
    const root = instance(
      [{ id: "a", src: "AGENTS.md", role: AGENT_INSTRUCTIONS_ROLE }],
      { "AGENTS.md": "[start here](docs/guides/agent-onboarding.md)\n" },
    );
    const { findings } = auditInstance(root);
    rmSync(root, { recursive: true, force: true });
    expect(findings.map((f) => f.kind)).toEqual(["dead-link"]);
  });

  test("a declared asset that is not on disk is a finding, never a skip", () => {
    // Unlike a conventional DIRECTORY, which may simply be one this instance
    // did not take up, a declared asset is an assertion.
    const root = instance([{ id: "gone", src: "NOPE.md" }]);
    const { findings } = auditInstance(root);
    rmSync(root, { recursive: true, force: true });
    expect(findings[0]!.kind).toBe("missing");
  });

  test("a resolving link is not a finding", () => {
    const root = instance(
      [{ id: "a", src: "AGENTS.md" }],
      { "AGENTS.md": "[there](README.md)\n", "README.md": "hi\n" },
    );
    const { findings } = auditInstance(root);
    rmSync(root, { recursive: true, force: true });
    expect(findings).toEqual([]);
  });

  test("an instance declaring no assets is clean, not an error", () => {
    const root = instance([]);
    expect(auditInstance(root).findings).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("what it will not pretend to have checked", () => {
  test("external links and anchors are NOT checkable", () => {
    // Counted as "not checked" rather than clean: could-not-determine
    // rendered as a pass is how a sweep blind on one check clears the others.
    expect(isCheckable("https://example.org")).toBe(false);
    expect(isCheckable("mailto:a@b.c")).toBe(false);
    expect(isCheckable("#section")).toBe(false);
    expect(isCheckable("docs/x.md")).toBe(true);
    expect(isCheckable("../up.md")).toBe(true);
  });

  test("links inside fenced code are not links", () => {
    // A README's shell examples are full of brackets; same reasoning as
    // `readme-links.ts`'s own fence stripping.
    const src = "real [a](a.md)\n```\nfake [b](b.md)\n```\n";
    expect(markdownLinks(src)).toEqual(["a.md"]);
  });
});
