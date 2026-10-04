import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "fs";
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

  // Bean folio-assistant-9io2 moved the last interim `cat-<name>` row
  // (lake-cache) onto this scheme, so there is no deferred-rename escape
  // hatch any more: every row's `name` IS its `cat/<harness>/<name>`.
  test("every other special branch is cat/<declared harness>/<name>", () => {
    for (const b of DECL.branches.filter((x) => x.id !== "gh-pages")) {
      const m = HARNESS.exec(b.name);
      expect(m, `${b.id}: ${b.name}`).not.toBeNull();
      expect(declaredHarness(m![1]), `${b.id}: harness '${m![1]}' has no ${m![1]}/${m![1]}.json`).toBe(true);
      expect(Object.keys(b), `${b.id}: a pending rename is done by renaming, not by annotating`).not.toContain("pendingRename");
    }
  });

  test("lake-cache is the folio-assistant-sci harness's family, with both earlier names as legacy, newest first", () => {
    expect(byId("lake-cache").name).toBe("cat/folio-assistant-sci/lake-cache/");
    expect(byId("lake-cache").legacy).toEqual(["cat-lake-cache/", "lake-cache/"]);
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
    expect(resolveBranch("lake-cache", new Set(), "qou-v4-24-0")).toBe("cat/folio-assistant-sci/lake-cache/qou-v4-24-0");
  });

  test("only the legacy name exists: the legacy name, for writers too", () => {
    expect(resolveBranch("qa-reports", new Set(["qa-reports"]))).toBe("qa-reports");
    expect(resolveBranch("lake-cache", new Set(["lake-cache/qou-v4-24-0"]), "qou-v4-24-0")).toBe("lake-cache/qou-v4-24-0");
  });

  test("only the interim cat-<name> exists: that one, ahead of the older legacy name", () => {
    expect(resolveBranch("qa-reports", new Set(["cat-qa-reports"]))).toBe("cat-qa-reports");
    expect(resolveBranch("state", new Set(["state", "cat-state"]))).toBe("cat-state");
    // `lake-cache/` is a substring of `cat-lake-cache/`: whole names, in order.
    expect(resolveBranch("lake-cache", new Set(["lake-cache/qou-v4-24-0", "cat-lake-cache/qou-v4-24-0"]), "qou-v4-24-0")).toBe(
      "cat-lake-cache/qou-v4-24-0",
    );
  });

  test("the new name exists: the new name, whatever else does", () => {
    expect(resolveBranch("state", new Set(["state", "cat-state", "cat/cat-harness/state"]))).toBe("cat/cat-harness/state");
    expect(
      resolveBranch(
        "lake-cache",
        new Set(["lake-cache/qou-v4-24-0", "cat-lake-cache/qou-v4-24-0", "cat/folio-assistant-sci/lake-cache/qou-v4-24-0"]),
        "qou-v4-24-0",
      ),
    ).toBe("cat/folio-assistant-sci/lake-cache/qou-v4-24-0");
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
      // A name can be a substring of another (`lake-cache` is inside both
      // `cat-lake-cache` and `cat/folio-assistant-sci/lake-cache`, and inside
      // `lake-cache.sh`), so `toContain` alone would pass a file that never
      // reads the name. Each name must occur as a whole TOKEN: not preceded
      // by a word character, `-` or `/`, and not followed by one or by `.`.
      const esc = (n: string) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      for (const n of [b.name, ...b.legacy]) {
        expect(new RegExp(`(?<![\\w/-])${esc(bare(n))}(?![\\w.-])`).test(text), `${m.file}: ${bare(n)}`).toBe(true);
      }
    });
  }

  test("lake-cache.sh declares the prefixes by name, where the top of the file says", () => {
    const b = byId("lake-cache");
    const text = readFileSync(resolve(REPO, "cat-harness/scripts/lake-cache.sh"), "utf-8");
    const bare = (n: string) => n.replace(/\/$/, "");
    expect(text).toContain(`CACHE_PREFIX="${bare(b.name)}"`);
    // One space-separated list, in the declared (newest-first) order, so
    // the resolution order is the declaration's and not the script's.
    expect(text).toContain(`LEGACY_CACHE_PREFIXES="${b.legacy.map(bare).join(" ")}"`);
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

/**
 * The declaration must agree with the world in BOTH directions, and until
 * 2026-10-04 nothing checked either.
 *
 * `gh-pages` declared **4** writers; parsing all 35 workflows found **5** —
 * `publish.yml` defaults `publish_branch: gh-pages` and was unlisted. That is
 * the direction a grep over this file cannot find, because it is looking in the
 * wrong file. Bean `xp5j`.
 *
 * ## What this covers, stated rather than implied
 *
 * `audit-coverage`: a check that cannot tell an empty walk from a clean one is
 * not a check. So:
 *
 * - **Covered:** a writer declared as a bare workflow path
 *   (`.github/workflows/x.yml`), in both directions.
 * - **NOT covered, and REPORTED:** a writer written as a sentence. Those are
 *   prose, and several are deliberately about the FUTURE — `qa-reports` names
 *   *"code-quality-gates.yml publish job via scripts/qa-store.ts — on PR
 *   #1764/#1801, not on main yet"*. Reading that as a stale declaration would
 *   fail CI for a correct entry, so a sentence is never parsed for a path.
 * - **NOT covered, and REPORTED: every `shape: "family"` entry.** A family's
 *   member branch name is COMPOSED at runtime —
 *   `cat/folio-assistant-sci/lake-cache/<pkg>-<slug>` — so the name this check
 *   would look for does not appear in the file at all.
 *   `lake-cache-refresh.yml` mentions the family prefix only in comments, and
 *   matching a comment is the very error that made the first gh-pages count 6.
 *   The question is not answerable by text, so it is not answered: a vacuous
 *   `[]` in both directions would read as a clean audit of three writers
 *   nobody checked. Those workflows are covered instead by this suite's
 *   `mirrors` checks, which is where a family's prefix IS a literal.
 *
 * ## Why the match is per-line with a window, not per-file
 *
 * A whole-file `text.includes(name)` is how the first count of gh-pages
 * producers came out as **6**: it matched a COMMENT in `merge-main.yml`. And a
 * bare legacy name like `state` is a substring of ordinary English, so an
 * unanchored match named every workflow in the repository. The matcher requires
 * the name on a line, delimited so it is not part of a longer word, with a push
 * or branch marker within three lines above it — which reproduces the
 * independently measured set of five exactly.
 */
describe("the writers list agrees with the workflows, both directions", () => {
  const WF_DIR = resolve(import.meta.dir, "..", "..", "..", ".github", "workflows");
  const workflows = readdirSync(WF_DIR).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml")).sort();

  const MARKER = /publish-gh-pages\.sh|peaceiris\/actions-gh-pages|publish_branch|git\s+push|branch\s*:|ref\s*:/;

  /** A workflow WRITES a ref when the ref is named near a push or branch marker. */
  function writesRef(text: string, names: string[]): boolean {
    if (names.length === 0) return false;
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const named = names.some((n) =>
        new RegExp(`(?<![\\w/-])${n.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&")}(?![\\w-])`).test(lines[i]!),
      );
      if (!named) continue;
      if (MARKER.test(lines.slice(Math.max(0, i - 3), i + 2).join("\n"))) return true;
    }
    return false;
  }

  test("every workflow file is parsed, and the denominator is printed", () => {
    // `generalise-the-fix` §1.2a: a sweep that under-matches silently reads as
    // a clean corpus, so the count of subjects found goes beside the verdict.
    expect(workflows.length).toBeGreaterThan(0);
    console.log(`special-branches: parsed ${workflows.length} of ${workflows.length} workflow files`);
  });

  for (const entry of (DECL.branches as SpecialBranch[])) {
    // A bare `state` or `beans` cannot be told from an English word, so only
    // names carrying a `/` or a `-` are usable as a match target.
    const names = [entry.name, ...(entry.legacy ?? [])].filter((n) => n && (n.includes("/") || n.includes("-")));
    const declaredWorkflows = entry.writers
      .filter((w) => /^\.github\/workflows\/[\w.-]+\.ya?ml$/.test(w))
      .map((w) => w.replace(/^.*\//, ""));
    const prose = entry.writers.filter((w) => !/^\.github\/workflows\/[\w.-]+\.ya?ml$/.test(w));
    const measured = workflows.filter((f) => writesRef(readFileSync(resolve(WF_DIR, f), "utf-8"), names));

    describe(`${entry.id}`, () => {
      const determinable = entry.shape === "branch";

      test.skipIf(!determinable)("no workflow writes it while being UNDECLARED (the incompleteness direction)", () => {
        expect(measured.filter((f) => !declaredWorkflows.includes(f))).toEqual([]);
      });

      test.skipIf(!determinable)("no DECLARED workflow path has stopped writing it (the staleness direction)", () => {
        expect(declaredWorkflows.filter((f) => !measured.includes(f))).toEqual([]);
      });

      test.skipIf(determinable)("is a FAMILY, so neither direction is determinable — reported, not assumed", () => {
        // A skip would be silent. This states the gap as a passing test with a
        // message, so a reader of the output can see which entries were not
        // audited rather than inferring it from their absence.
        console.log(`special-branches: ${entry.id} is shape:"family" — writer directions NOT determinable by text (member names are composed at runtime); ${entry.writers.length} writer(s) unchecked here`);
        expect(entry.shape).toBe("family");
      });

      test("prose writers are REPORTED as uncovered, never counted clean", () => {
        // Not an assertion about the count — a report. What this guards is a
        // future reader taking a green run here for "every writer of every
        // special branch is accounted for".
        if (prose.length) {
          console.log(`special-branches: ${entry.id} — ${prose.length} writer(s) NOT covered by this check: ${prose.join("; ")}`);
        }
        expect(Array.isArray(prose)).toBe(true);
      });
    });
  }

  test("gh-pages measures the five producers bean xp5j counted independently", () => {
    // The pin. This suite's value is that the number came from parsing rather
    // than from a commit-message sample, which said 2, or a whole-file grep,
    // which said 6.
    const gh = (DECL.branches as SpecialBranch[]).find((b) => b.id === "gh-pages")!;
    const measured = workflows.filter((f) =>
      writesRef(readFileSync(resolve(WF_DIR, f), "utf-8"), [gh.name, ...(gh.legacy ?? [])].filter(Boolean)),
    );
    expect(measured).toEqual([
      "discoverability-docs.yml",
      "docs-site.yml",
      "feature-staging.yml",
      "folio-staging.yml",
      "publish.yml",
    ]);
  });
});

describe("every branch-shaped entry declares how it is keyed", () => {
  for (const entry of (DECL.branches as SpecialBranch[])) {
    if (entry.shape !== "branch") continue;
    test(`${entry.id} declares keyedBy and says why`, () => {
      // `gh-pages` was the one entry stating no keying, while beans, todos and
      // fsh-guts each said `keyedBy: tip` in prose. It is route-keyed, and
      // nothing said so (bean `xp5j`).
      expect(["commit", "tip", "route"]).toContain((entry as unknown as { keyedBy?: string }).keyedBy);
      expect(((entry as unknown as { keyedByWhy?: string }).keyedByWhy ?? "").length).toBeGreaterThan(20);
    });
  }

  test("the two FAMILY entries are out of scope, and that is deliberate", () => {
    // A family is keyed by BRANCH NAME across its members, a different question
    // from how one branch is keyed within itself. Inventing an answer would be
    // worse than the gap, so the absence is asserted rather than tolerated.
    const families = (DECL.branches as SpecialBranch[]).filter((b) => b.shape === "family");
    expect(families.length).toBeGreaterThan(0);
    for (const f of families) {
      expect((f as unknown as { keyedBy?: string }).keyedBy).toBeUndefined();
    }
  });
});
