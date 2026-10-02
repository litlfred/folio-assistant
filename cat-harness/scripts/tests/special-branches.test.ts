import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  MIRRORS,
  SPECIAL_BRANCHES,
  candidateNames,
  isSpecialBranch,
  resolveBranch,
  specialBranch,
} from "../special-branches";

/**
 * `special-branches.ts` is the one declaration of the harness's special
 * branch names; the shell, Python and workflow files that cannot import it
 * carry copies. This suite is what makes those copies checked rather than
 * merely duplicated (bean folio-assistant-32f6).
 */

const REPO = resolve(import.meta.dir, "..", "..", "..");

describe("special-branches — the declaration", () => {
  test("gh-pages is declared and is never renamed", () => {
    const g = specialBranch("gh-pages");
    expect(g.name).toBe("gh-pages");
    expect(g.legacy).toEqual([]);
  });

  test("every other special branch carries the cat- prefix", () => {
    for (const b of SPECIAL_BRANCHES.filter((x) => x.id !== "gh-pages")) {
      expect(b.name.startsWith("cat-")).toBe(true);
    }
  });

  test("a family's names end in '/', a single branch's never do", () => {
    for (const b of SPECIAL_BRANCHES) {
      for (const n of [b.name, ...b.legacy]) expect(n.endsWith("/")).toBe(b.shape === "family");
    }
  });

  test("ids are unique, and no name is claimed twice", () => {
    const ids = SPECIAL_BRANCHES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = SPECIAL_BRANCHES.flatMap((b) => [b.name, ...b.legacy]);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("special-branches — resolution (new name first, then legacy)", () => {
  test("neither exists: the new name", () => {
    expect(resolveBranch("qa-reports", new Set())).toBe("cat-qa-reports");
    expect(resolveBranch("lake-cache", new Set(), "qou-v4-24-0")).toBe("cat-lake-cache/qou-v4-24-0");
  });

  test("only the legacy name exists: the legacy name, for writers too", () => {
    expect(resolveBranch("qa-reports", new Set(["qa-reports"]))).toBe("qa-reports");
    expect(resolveBranch("lake-cache", new Set(["lake-cache/qou-v4-24-0"]), "qou-v4-24-0")).toBe("lake-cache/qou-v4-24-0");
  });

  test("both exist: the new name", () => {
    expect(resolveBranch("state", new Set(["state", "cat-state"]))).toBe("cat-state");
  });

  test("a family needs a key and a single branch refuses one", () => {
    expect(() => candidateNames("lake-cache")).toThrow();
    expect(() => candidateNames("qa-reports", "x")).toThrow();
  });

  test("isSpecialBranch knows every name, old and new, and not a feature branch", () => {
    expect(isSpecialBranch("qa-reports")?.id).toBe("qa-reports");
    expect(isSpecialBranch("cat-lake-cache/qou-v4-24-0")?.id).toBe("lake-cache");
    expect(isSpecialBranch("fhir-ast/smart.who.int.trust")?.id).toBe("fhir-ast");
    expect(isSpecialBranch("gh-pages")?.id).toBe("gh-pages");
    expect(isSpecialBranch("claude/cat-prefix-special-branches")).toBeUndefined();
    expect(isSpecialBranch("qa-reports-spike")).toBeUndefined();
  });
});

describe("special-branches — every copy agrees with the declaration", () => {
  for (const m of MIRRORS) {
    test(`${m.file} carries the ${m.id} names`, () => {
      const b = specialBranch(m.id);
      const text = readFileSync(resolve(REPO, m.file), "utf-8");
      for (const s of m.mustContain(b)) expect(text).toContain(s);
      // A legacy name is a substring of the new one (`lake-cache/` is inside
      // `cat-lake-cache/`), so `toContain` alone would pass a file that never
      // reads the legacy name. Strip every new-name occurrence first.
      const withoutNew = text.split(b.name.replace(/\/$/, "")).join("");
      for (const l of b.legacy) expect(withoutNew).toContain(l.replace(/\/$/, ""));
    });
  }

  test("every file that resolves a lake-cache branch is listed as a mirror", () => {
    // The writers and readers named in the declaration, minus prose.
    const listed = new Set(MIRRORS.map((m) => m.file));
    for (const f of [
      "cat-harness/scripts/lake-cache.sh",
      "cat-harness/scripts/lake-cache-fetch.sh",
      "cat-harness/scripts/lake-cache-fetch-multi.py",
      "cat-harness/scripts/lake-cache-produce.py",
      "cat-harness/scripts/reseed-lean-cache.sh",
      ".github/actions/lake-cache-restore/action.yml",
      ".github/workflows/lake-cache-refresh.yml",
    ]) expect(listed.has(f)).toBe(true);
  });
});
