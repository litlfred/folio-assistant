/**
 * Short slash commands from `user_invocable` — bean `j6t3`, option A.
 *
 * @module cat-harness/scripts/tests/gen-skill-commands.test
 *
 * The four findings are tested separately because they have different
 * remedies, and the one that must never be "fixed" by the generator —
 * a hand-written command with no declaration — is the one most worth pinning.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  REPO_ROOT,
  commandText,
  isGenerated,
  isMountedInstance,
  packagesFor,
  reconcile,
  runSkillCommands,
  write,
} from "../gen-skill-commands.ts";
import { userInvocableSkills } from "../../src/tools/skill-prompts.ts";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

const skill = (name: string, invocable: boolean) =>
  `---\nname: ${name}\ndescription: The ${name} skill.\n${invocable ? "user_invocable: true\n" : ""}---\n\n# ${name}\n`;

/** A repo root with one skills package and a `.claude/commands/` dir. */
function repo(skills: Record<string, string>, commands: Record<string, string> = {}): { root: string; pkgs: Record<string, string> } {
  const root = mkdtempSync(join(tmpdir(), "skill-cmds-"));
  made.push(root);
  const dir = join(root, "skills");
  mkdirSync(dir, { recursive: true });
  for (const [f, t] of Object.entries(skills)) writeFileSync(join(dir, f), t);
  mkdirSync(join(root, ".claude", "commands"), { recursive: true });
  for (const [f, t] of Object.entries(commands)) writeFileSync(join(root, ".claude", "commands", f), t);
  return { root, pkgs: { core: dir } };
}

const kinds = (root: string, pkgs: Record<string, string>) => reconcile(root, pkgs).findings.map((f) => [f.kind, f.name]);

describe("both directions", () => {
  test("a declared skill with no command is MISSING, and writing fixes it", () => {
    const { root, pkgs } = repo({ "a.md": skill("a", true), "b.md": skill("b", false) });
    expect(kinds(root, pkgs)).toEqual([["missing", "a"]]);
    expect(write(root, pkgs)).toEqual([join(".claude", "commands", "a.md")]);
    expect(kinds(root, pkgs)).toEqual([]);
    const text = readFileSync(join(root, ".claude", "commands", "a.md"), "utf8");
    expect(isGenerated(text)).toBe(true);
    expect(text).toContain("skills/a.md");
  });

  test("a HAND-WRITTEN command with no declared skill is UNDECLARED — reported, never touched", () => {
    const hand = "---\ndescription: mine\n---\n\n# /prepare-merge\n";
    const { root, pkgs } = repo({}, { "prepare-merge.md": hand });
    expect(kinds(root, pkgs)).toEqual([["undeclared", "prepare-merge"]]);
    write(root, pkgs);
    expect(readFileSync(join(root, ".claude", "commands", "prepare-merge.md"), "utf8")).toBe(hand);
  });

  test("a GENERATED command whose skill stopped declaring itself is ORPHANED, and removed", () => {
    const { root, pkgs } = repo({ "a.md": skill("a", true) });
    write(root, pkgs);
    writeFileSync(join(pkgs.core, "a.md"), skill("a", false));
    expect(kinds(root, pkgs)).toEqual([["orphaned", "a"]]);
    write(root, pkgs);
    expect(existsSync(join(root, ".claude", "commands", "a.md"))).toBe(false);
  });

  test("a generated command that no longer matches is STALE; a hand-written one for a declared skill is left alone", () => {
    const hand = "---\ndescription: bespoke\n---\n\n# /b\n";
    const { root, pkgs } = repo({ "a.md": skill("a", true), "b.md": skill("b", true) }, { "b.md": hand });
    write(root, pkgs);
    const a = join(root, ".claude", "commands", "a.md");
    writeFileSync(a, readFileSync(a, "utf8").replace("follow it", "ignore it"));
    expect(kinds(root, pkgs)).toEqual([["stale", "a"]]);
    write(root, pkgs);
    expect(kinds(root, pkgs)).toEqual([]);
    expect(readFileSync(join(root, ".claude", "commands", "b.md"), "utf8")).toBe(hand);
  });

  test("a command written before the generator moved (bean 70lx) is still generated: STALE, and refreshed", () => {
    const { root, pkgs } = repo({ "a.md": skill("a", true) });
    write(root, pkgs);
    const a = join(root, ".claude", "commands", "a.md");
    const old = readFileSync(a, "utf8")
      .replace("generated: cat-harness-tools/scripts/gen-skill-commands.ts", "generated: cat-harness/scripts/gen-skill-commands.ts")
      .replaceAll("skills/a.md", "skills/moved-away/a.md");
    writeFileSync(a, old);
    expect(isGenerated(old)).toBe(true);
    expect(kinds(root, pkgs)).toEqual([["stale", "a"]]);
    write(root, pkgs);
    expect(kinds(root, pkgs)).toEqual([]);
    expect(readFileSync(a, "utf8")).not.toContain("moved-away");
  });
});

describe("a command is a pointer, never a copy", () => {
  test("the generated text names the skill's path and does not inline its body", () => {
    const { root, pkgs } = repo({ "a.md": skill("a", true) + "\nSECRET BODY LINE\n" });
    const [a] = userInvocableSkills(pkgs).skills;
    const text = commandText(a, root);
    expect(text).toContain("skills/a.md");
    expect(text).not.toContain("SECRET BODY LINE");
  });
});

describe("instance vs index scope (bean t5zb)", () => {
  test("packagesFor scopes an instance checkout to its own declared skills graph", () => {
    const parent = mkdtempSync(join(tmpdir(), "skill-scope-"));
    made.push(parent);
    const base = join(parent, "base-inst");
    const child = join(parent, "child-inst");
    mkdirSync(join(base, "skills", "base-pkg"), { recursive: true });
    writeFileSync(
      join(base, "base-inst.json"),
      JSON.stringify({
        $schema: "cat-harness-declaration/1.0.0",
        name: "base-inst",
        directories: [{ id: "skills", path: "skills", graphTypologies: ["skills"] }],
      }),
    );
    writeFileSync(join(base, "skills", "base-pkg", "b.md"), skill("b", true));

    mkdirSync(join(child, "skills", "child-pkg"), { recursive: true });
    writeFileSync(
      join(child, "child-inst.json"),
      JSON.stringify({
        $schema: "cat-harness-declaration/1.0.0",
        name: "child-inst",
        needs: ["base-inst"],
        directories: [{ id: "skills", path: "skills", graphTypologies: ["skills"] }],
      }),
    );
    writeFileSync(join(child, "skills", "child-pkg", "c.md"), skill("c", true));

    const pkgs = packagesFor(child);
    expect(Object.keys(pkgs)).toEqual(["child-pkg"]);
    expect(write(child)).toEqual([join(".claude", "commands", "c.md")]);
    expect(reconcile(child).findings).toEqual([]);
  });

  test("mounted layers are never written into; stale committed commands are reported naming the layer (bean bx4c)", () => {
    const indexRoot = mkdtempSync(join(tmpdir(), "skill-mounted-"));
    made.push(indexRoot);
    const mountedDir = join(indexRoot, "mounted-layer");
    mkdirSync(join(mountedDir, "skills", "mounted-pkg"), { recursive: true });
    mkdirSync(join(mountedDir, ".claude", "commands"), { recursive: true });
    writeFileSync(
      join(mountedDir, "mounted-layer.json"),
      JSON.stringify({
        $schema: "cat-harness-declaration/1.0.0",
        name: "mounted-layer",
        directories: [{ id: "skills", path: "skills", graphTypologies: ["skills"] }],
      }),
    );
    writeFileSync(join(mountedDir, "skills", "mounted-pkg", "m.md"), skill("m", true));
    const staleCmd = [
      "---",
      'description: "outdated description"',
      'argument-hint: "[what to run it on]"',
      "generated: cat-harness-tools/scripts/gen-skill-commands.ts",
      "---",
      "",
      "# /m",
      "",
      "stale body",
      "",
    ].join("\n");
    const mountedCmdPath = join(mountedDir, ".claude", "commands", "m.md");
    writeFileSync(mountedCmdPath, staleCmd);

    writeFileSync(
      join(indexRoot, "index.config.json"),
      JSON.stringify({
        $schema: "folio-index-config/v1",
        instances: [
          {
            name: "mounted-layer",
            source: { remote: { repository: "o/mounted-layer", ref: "a".repeat(40) } },
          },
        ],
      }),
    );
    writeFileSync(
      join(indexRoot, "index.lock.json"),
      JSON.stringify({
        $schema: "cat-harness-mount-lock/v1",
        mounts: [{ harness: "mounted-layer", repository: "o/mounted-layer", ref: "a".repeat(40) }],
        instances: [
          {
            instance: "mounted-layer",
            repository: "o/mounted-layer",
            sha: "a".repeat(40),
            upstreamRoot: "",
            path: "mounted-layer",
            via: "mounted-layer",
            pinnedBy: "declared",
            declaration: { file: "mounted-layer.json", sha256: "0".repeat(64) },
            directories: [{ id: "*", path: "mounted-layer", upstreamPath: ".", treeDigest: "0".repeat(64), files: 2 }],
            trust: { basis: "consent", by: "test", on: "2026-11-05", ref: "a".repeat(40), approver: "declared" },
          },
        ],
      }),
    );

    expect(isMountedInstance(mountedDir, indexRoot)).toBe(true);
    expect(isMountedInstance(indexRoot, indexRoot)).toBe(false);

    // Direct write() on a mounted layer is a no-op.
    expect(write(mountedDir)).toEqual([]);
    expect(readFileSync(mountedCmdPath, "utf8")).toBe(staleCmd);

    // Running over the index checkout writes the index's own command surface,
    // leaves the mounted layer untouched, and reports the stale committed
    // surface naming the mounted layer.
    const r = runSkillCommands({ baseRoot: indexRoot, check: false });
    expect(existsSync(join(indexRoot, ".claude", "commands", "m.md"))).toBe(true);
    expect(readFileSync(mountedCmdPath, "utf8")).toBe(staleCmd);
    expect(r.ok).toBe(false);
    expect(r.mountedBad).toBe(1);
    expect(r.mountedFindings).toHaveLength(1);
    expect(r.mountedFindings[0]).toContain("mounted-layer");
    expect(r.mountedFindings[0]).toContain(".claude/commands/m.md");
    expect(r.mountedFindings[0]).toContain("not rewritten");
  });
});

describe("over this repository", () => {
  test("every user_invocable skill has a command and every command has a declared skill", () => {
    const r = reconcile(REPO_ROOT);
    expect(r.findings).toEqual([]);
    expect(r.duplicates).toEqual([]);
  });
});
