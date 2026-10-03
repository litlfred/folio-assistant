import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve } from "path";

/**
 * `special-branches.json` is the one declaration of the harness's special
 * branch names; the shell, Python and workflow files that run inside a folio
 * carry copies. This suite is what makes those copies CHECKED rather than
 * merely duplicated (bean folio-assistant-32f6).
 *
 * It also pins the resolution rule every copy implements — new name if it
 * exists, else legacy if it exists, else new — as a reference function, so
 * a future TypeScript reader (arc 3fva's `qa-store.ts`) has one to match.
 */

interface SpecialBranch {
  id: string;
  shape: "branch" | "family";
  name: string;
  legacy: string[];
  holds: string;
  writers: string[];
  repos: string;
  /** The `cat/<harness>/<name>` target of a rename still to come, and the bean that owns it. */
  pendingRename?: string;
}
interface Declaration {
  branches: SpecialBranch[];
  mirrors: { file: string; id: string }[];
}

const REPO = resolve(import.meta.dir, "..", "..", "..");
const DECL: Declaration = JSON.parse(
  readFileSync(resolve(import.meta.dir, "..", "special-branches.json"), "utf-8"),
);
const byId = (id: string) => {
  const b = DECL.branches.find((x) => x.id === id);
  if (!b) throw new Error(`no special branch '${id}'`);
  return b;
};

/** The reference rule: the first candidate that exists, else the new name. */
function resolveBranch(id: string, existing: ReadonlySet<string>, key = ""): string {
  const b = byId(id);
  if ((b.shape === "family") !== Boolean(key)) throw new Error(`'${id}' is a ${b.shape}; key ${key ? "not " : ""}expected`);
  const names = [b.name, ...b.legacy].map((n) => n + key);
  return names.find((n) => existing.has(n)) ?? names[0];
}

describe("special-branches — the declaration", () => {
  test("gh-pages is declared and is never renamed", () => {
    expect(byId("gh-pages").name).toBe("gh-pages");
    expect(byId("gh-pages").legacy).toEqual([]);
  });

  // Owner, 2026-10-02: `cat/<harness>/<name>` (note on fs43, "rename-script").
  // The harness segment is checked against the instance declarations, so a
  // branch cannot claim a harness that does not exist — the dh4f shape again.
  const HARNESS = /^cat\/([^/]+)\/[^/]/;
  const declaredHarness = (h: string) => existsSync(resolve(REPO, h, `${h}.json`));

  test("every other special branch is cat/<declared harness>/<name>, or names the bean that renames it", () => {
    for (const b of DECL.branches.filter((x) => x.id !== "gh-pages")) {
      const target = b.pendingRename ? b.pendingRename.split(" ")[0] : b.name;
      const m = HARNESS.exec(target);
      expect(m, `${b.id}: ${target}`).not.toBeNull();
      expect(declaredHarness(m![1]), `${b.id}: harness '${m![1]}' has no ${m![1]}/${m![1]}.json`).toBe(true);
      if (b.pendingRename) {
        const bean = /folio-assistant-[0-9a-z]{4}/.exec(b.pendingRename)?.[0];
        expect(bean, `${b.id}: pendingRename names no bean`).toBeDefined();
        const defs = resolve(REPO, "beans", "defs");
        const files = readdirSync(defs).filter((f) => f.startsWith(`${bean}--`));
        expect(files.length, `${b.id}: bean ${bean} is not in beans/defs`).toBe(1);
      }
    }
  });

  test("a family's names end in '/', a single branch's never do", () => {
    for (const b of DECL.branches) for (const n of [b.name, ...b.legacy]) expect(n.endsWith("/")).toBe(b.shape === "family");
  });

  test("ids are unique, and no name is claimed twice", () => {
    const ids = DECL.branches.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = DECL.branches.flatMap((b) => [b.name, ...b.legacy]);
    expect(new Set(names).size).toBe(names.length);
  });

  test("every mirror names a declared id", () => {
    for (const m of DECL.mirrors) expect(() => byId(m.id)).not.toThrow();
  });
});

describe("special-branches — resolution (new name first, then legacy)", () => {
  test("neither exists: the new name", () => {
    expect(resolveBranch("qa-reports", new Set())).toBe("cat/cat-harness/qa-reports");
    expect(resolveBranch("lake-cache", new Set(), "qou-v4-24-0")).toBe("cat-lake-cache/qou-v4-24-0");
  });

  test("only the legacy name exists: the legacy name, for writers too", () => {
    expect(resolveBranch("qa-reports", new Set(["qa-reports"]))).toBe("qa-reports");
    expect(resolveBranch("lake-cache", new Set(["lake-cache/qou-v4-24-0"]), "qou-v4-24-0")).toBe("lake-cache/qou-v4-24-0");
  });

  test("only the interim cat-<name> exists: that one, ahead of the older legacy name", () => {
    expect(resolveBranch("qa-reports", new Set(["cat-qa-reports"]))).toBe("cat-qa-reports");
    expect(resolveBranch("state", new Set(["state", "cat-state"]))).toBe("cat-state");
  });

  test("the new name exists: the new name, whatever else does", () => {
    expect(resolveBranch("state", new Set(["state", "cat-state", "cat/cat-harness/state"]))).toBe("cat/cat-harness/state");
    expect(resolveBranch("fhir-ast", new Set(["cat/fhir-harness/fhir-ast/smart.who.int.trust"]), "smart.who.int.trust")).toBe(
      "cat/fhir-harness/fhir-ast/smart.who.int.trust",
    );
  });

  test("a family needs a key and a single branch refuses one", () => {
    expect(() => resolveBranch("lake-cache", new Set())).toThrow();
    expect(() => resolveBranch("qa-reports", new Set(), "x")).toThrow();
  });
});

describe("special-branches — every copy agrees with the declaration", () => {
  for (const m of DECL.mirrors) {
    test(`${m.file} carries the ${m.id} names`, () => {
      const b = byId(m.id);
      const text = readFileSync(resolve(REPO, m.file), "utf-8");
      const bare = (n: string) => n.replace(/\/$/, "");
      expect(text).toContain(bare(b.name));
      // A legacy name can be a substring of the new one (`lake-cache` is
      // inside `cat-lake-cache`), so `toContain` alone would pass a file that
      // never reads the legacy name. Strip every new-name occurrence first.
      const withoutNew = text.split(bare(b.name)).join("");
      for (const l of b.legacy) expect(withoutNew).toContain(bare(l));
    });
  }

  test("lake-cache.sh declares the prefixes by name, where the top of the file says", () => {
    const b = byId("lake-cache");
    const text = readFileSync(resolve(REPO, "cat-harness/scripts/lake-cache.sh"), "utf-8");
    expect(text).toContain(`CACHE_PREFIX="${b.name.replace(/\/$/, "")}"`);
    for (const l of b.legacy) expect(text).toContain(`LEGACY_CACHE_PREFIX="${l.replace(/\/$/, "")}"`);
  });

  test("every file that resolves a lake-cache branch is listed as a mirror", () => {
    const listed = new Set(DECL.mirrors.map((m) => m.file));
    for (const f of [
      "cat-harness/scripts/lake-cache.sh",
      "cat-harness/scripts/lake-cache-fetch.sh",
      "cat-harness/scripts/lake-cache-fetch-multi.py",
      "cat-harness/scripts/lake-cache-produce.py",
      "cat-harness/scripts/reseed-lean-cache.sh",
      ".github/actions/lake-cache-restore/action.yml",
      "cat-harness/templates/paper/github/actions/lake-cache-restore/action.yml",
      ".github/workflows/lake-cache-refresh.yml",
    ]) expect(listed.has(f)).toBe(true);
  });
});
