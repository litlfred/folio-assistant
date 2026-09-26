/**
 * `register-skills` — the command that makes adding a skill a one-command
 * change, and the gate that refuses one that arrived without it.
 *
 * ## The assertion shape that matters here
 *
 * The real-corpus test is `✓ every skill declared`, and on its own that is
 * worth nothing: it passes identically whether the checker works or returns
 * empty lists. So every finder is falsified against a synthetic package where
 * the defect is present BY CONSTRUCTION, and the real corpus carries an
 * anti-vacuity floor — a rename of `skills/` must not turn the suite green over
 * nothing, which is the zero-subject trap this repository has paid for more than
 * once.
 *
 * Two of the cases below exist because they were found by breaking the tool
 * rather than by designing it: deleting a registered probe left an orphaned
 * `kg-qa` sidecar that no regeneration can settle, and left the manifest entry
 * the tool had just written pointing at nothing — `manifest-skill-exists` at
 * severity **critical**. Both directions are asserted now.
 *
 * @module cat-harness/scripts/tests/register-skills
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  CHAIN,
  CHECKS,
  audit,
  dangling,
  frontMatterKeys,
  missingScripts,
  skillPackages,
  unlisted,
  retiredKeys,
  withSkills,
  withoutKey,
} from "../register-skills.js";

/** A throwaway instance with one skill package, shaped as the real tree is. */
function fixture(
  pkg: string,
  listed: string[],
  files: Record<string, string>,
): { instance: string; cleanup: () => void } {
  const instance = mkdtempSync(join(tmpdir(), "register-skills-"));
  const dir = join(instance, "skills", pkg);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "package-manifest.json"),
    `${JSON.stringify({ name: pkg, version: "0.1.0", skills: listed }, null, 2)}\n`,
  );
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, `${name}.md`), body);
  }
  return { instance, cleanup: () => rmSync(instance, { recursive: true, force: true }) };
}

const WITH_ROLES = "---\nname: a\nroles: [reader, collaborator, owner]\n---\n\n# A\n";
const PLAIN = "---\nname: b\n---\n\n# B\n";

describe("front matter is read, not grepped", () => {
  test("top-level keys only", () => {
    expect(frontMatterKeys(WITH_ROLES)).toEqual(["name", "roles"]);
  });

  test("a file with no front matter has no keys, and does not throw", () => {
    expect(frontMatterKeys("# Just a heading\n")).toEqual([]);
    expect(frontMatterKeys("")).toEqual([]);
  });

  /**
   * The distinction a grep cannot make. `roles:` is retired as a SKILL field
   * and live as an axis inside a `folio-memory/v1` entry — the same seven
   * letters, a different field, which is why
   * `check-retired-front-matter.ts` carries `exceptSchemas`.
   */
  test("an indented `roles:` under another key is not a top-level roles", () => {
    expect(frontMatterKeys("---\nname: a\ntags:\n  roles: [x]\n---\n")).toEqual(["name", "tags"]);
  });
});

describe("withoutKey", () => {
  test("removes the key and leaves the rest intact", () => {
    const out = withoutKey(WITH_ROLES, "roles");
    expect(frontMatterKeys(out)).toEqual(["name"]);
    expect(out).toContain("# A");
    expect(out).not.toContain("roles");
  });

  test("removes a block value's continuation lines too", () => {
    const src = "---\nname: a\nroles:\n  - reader\n  - owner\ndescription: keep me\n---\n\nbody\n";
    const out = withoutKey(src, "roles");
    expect(frontMatterKeys(out)).toEqual(["name", "description"]);
    expect(out).toContain("description: keep me");
    expect(out).not.toContain("reader");
  });

  test("a file without the key is returned unchanged", () => {
    expect(withoutKey(PLAIN, "roles")).toBe(PLAIN);
  });
});

describe("withSkills", () => {
  test("adds sorted, and reports no change when already correct", () => {
    const m = `${JSON.stringify({ skills: ["b", "c"] }, null, 2)}\n`;
    const next = withSkills(m, ["a"]);
    expect(JSON.parse(next!).skills).toEqual(["a", "b", "c"]);
    expect(withSkills(next!, ["a"])).toBeUndefined();
  });

  /**
   * Idempotence is the point, not a nicety. Bean `kfkh` records the ordering
   * convention as unenforced, and that is exactly what let two sessions insert
   * the same name at different indices, merge with no conflict, and keep BOTH.
   * Always sorting makes the second write a no-op instead of a duplicate.
   */
  test("a second run over an unsorted manifest normalises it once and then stops", () => {
    const m = `${JSON.stringify({ skills: ["c", "a"] }, null, 2)}\n`;
    const once = withSkills(m, ["b"]);
    expect(JSON.parse(once!).skills).toEqual(["a", "b", "c"]);
    expect(withSkills(once!, ["b"])).toBeUndefined();
  });

  test("other manifest fields survive the rewrite", () => {
    const m = `${JSON.stringify({ name: "p", docker: { baseImage: "x" }, skills: ["a"] }, null, 2)}\n`;
    const out = JSON.parse(withSkills(m, ["z"])!);
    expect(out.name).toBe("p");
    expect(out.docker).toEqual({ baseImage: "x" });
  });
});

describe("the finders discriminate — falsified on a synthetic package", () => {
  test("an unlisted skill is found, and a listed one is not", () => {
    const f = fixture("p", ["listed"], { listed: PLAIN, missing: PLAIN });
    try {
      const got = unlisted(skillPackages(f.instance)).map((u) => u.skill);
      expect(got).toEqual(["missing"]);
    } finally {
      f.cleanup();
    }
  });

  test("a retired key is found, and a clean file is not", () => {
    const f = fixture("p", ["a", "b"], { a: WITH_ROLES, b: PLAIN });
    try {
      const got = retiredKeys(skillPackages(f.instance)).map((r) => `${r.skill}:${r.key}`);
      expect(got).toEqual(["a:roles"]);
    } finally {
      f.cleanup();
    }
  });

  test("a manifest entry with no file is found — the direction breaking the tool revealed", () => {
    const f = fixture("p", ["real", "ghost"], { real: PLAIN });
    try {
      const got = dangling(skillPackages(f.instance)).map((d) => d.skill);
      expect(got).toEqual(["ghost"]);
      // And it is NOT confused with the opposite defect.
      expect(unlisted(skillPackages(f.instance))).toEqual([]);
    } finally {
      f.cleanup();
    }
  });

  test("a correct package yields nothing from any finder", () => {
    const f = fixture("p", ["a"], { a: PLAIN });
    try {
      const pkgs = skillPackages(f.instance);
      expect(unlisted(pkgs)).toEqual([]);
      expect(retiredKeys(pkgs)).toEqual([]);
      expect(dangling(pkgs)).toEqual([]);
    } finally {
      f.cleanup();
    }
  });

  test("a directory with no manifest is not a package", () => {
    const instance = mkdtempSync(join(tmpdir(), "register-skills-"));
    try {
      mkdirSync(join(instance, "skills", "nope"), { recursive: true });
      writeFileSync(join(instance, "skills", "nope", "x.md"), PLAIN);
      expect(skillPackages(instance)).toEqual([]);
    } finally {
      rmSync(instance, { recursive: true, force: true });
    }
  });

  test("no skills/ directory yields no packages rather than throwing", () => {
    const instance = mkdtempSync(join(tmpdir(), "register-skills-"));
    try {
      expect(skillPackages(instance)).toEqual([]);
    } finally {
      rmSync(instance, { recursive: true, force: true });
    }
  });
});

describe("the chain names real scripts", () => {
  /**
   * A renamed script would otherwise make the chain skip a step in silence,
   * which is the whole defect class this command exists to end — so the command
   * exits 2 rather than 0 when a step is not declared.
   */
  test("every CHAIN and CHECKS entry is a package.json script", () => {
    expect(missingScripts()).toEqual([]);
  });

  test("the chain and its checks are non-empty, and the checks are a subset in spirit", () => {
    expect(CHAIN.length).toBeGreaterThan(5);
    expect(CHECKS.length).toBeGreaterThan(4);
    // Every check is the `:check` form of something, so a step cannot be
    // verified by an unrelated command.
    for (const c of CHECKS) expect(c.endsWith(":check")).toBe(true);
  });
});

describe("the real corpus", () => {
  test("every skill is declared, none carries a retired key, nothing dangles", () => {
    const f = audit();
    expect(f.unlisted.map((u) => `${u.pkg}/${u.skill}`)).toEqual([]);
    expect(f.retired.map((r) => `${r.pkg}/${r.skill}:${r.key}`)).toEqual([]);
    expect(f.dangling.map((d) => `${d.pkg}/${d.skill}`)).toEqual([]);
  });

  /**
   * The vacuity guard. Without it the assertion above passes over an empty
   * corpus — a rename of `skills/` or a broken reader would read as clean,
   * which is the `dh4f` shape this repository keeps paying for. A floor rather
   * than an exact count, because a count in a test goes stale exactly as a count
   * in prose does.
   */
  test("it found packages and skills — otherwise the check above proves nothing", () => {
    const f = audit();
    expect(f.packages).toBeGreaterThan(3);
    expect(f.skills).toBeGreaterThan(50);
  });
});
