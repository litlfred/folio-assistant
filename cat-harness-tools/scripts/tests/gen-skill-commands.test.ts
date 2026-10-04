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

import { commandText, isGenerated, reconcile, write } from "../../../cat-harness/scripts/gen-skill-commands.ts";
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

describe("over this repository", () => {
  test("every user_invocable skill has a command and every command has a declared skill", () => {
    const root = join(import.meta.dir, "..", "..", "..");
    const r = reconcile(root);
    expect(r.findings).toEqual([]);
    expect(r.duplicates).toEqual([]);
  });
});
