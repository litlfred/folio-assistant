/**
 * `check-usage-paths.ts` — a script's usage string must name the script.
 *
 * The tests that matter here are the two that would have let a defect through:
 * the SUFFIX rule (a basename rule mis-rewrites
 * `cat-harness/tools/index.ts`'s reference to `src/index.ts`) and the mutation
 * check (a gate that cannot fail is not a gate).
 *
 * @module scripts/tests/usage-paths-self-reference
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  SELF_REF_EXEMPTIONS,
  Verdict,
  applyFix,
  auditAll,
  namesSelf,
  report,
  rootScripts,
  scriptFor,
  selfReferences,
  subjectFiles,
  unmatchedExemptions,
} from "../check-usage-paths.js";

const REPO = join(import.meta.dir, "..", "..", "..");

function fixture(): string {
  return mkdtempSync(join(tmpdir(), "usage-paths-"));
}

describe("namesSelf — the suffix rule, not a basename rule", () => {
  test("a pre-split root is a suffix and so names the file", () => {
    expect(namesSelf("cat-harness/content/pipeline/build.ts", "pipeline/build.ts")).toBe(true);
    expect(
      namesSelf("cat-harness/content/pipeline/qa-sweep.ts", "content/pipeline/qa-sweep.ts"),
    ).toBe(true);
    expect(namesSelf("cat-harness/scripts/render-log.ts", "render-log.ts")).toBe(true);
  });

  test("the file's own full path names it", () => {
    expect(namesSelf("cat-harness/scripts/a.ts", "cat-harness/scripts/a.ts")).toBe(true);
  });

  /**
   * The regression this rule exists for. `cat-harness/tools/index.ts`
   * documents `bun run src/index.ts --check-deps`, which is
   * `cat-harness/src/index.ts` — a different file. A basename rule calls that
   * a self-reference and `--fix` rewrites it to point at the wrong program.
   */
  test("a basename collision on a DIFFERENT file is not a self-reference", () => {
    expect(namesSelf("cat-harness/tools/index.ts", "src/index.ts")).toBe(false);
    expect(namesSelf("cat-harness/src/index.ts", "src/index.ts")).toBe(true);
  });

  test("a spelling longer than the file's own path cannot be a suffix", () => {
    expect(namesSelf("scripts/a.ts", "cat-harness/scripts/a.ts")).toBe(false);
  });

  test("the match is segment-wise, so a shared tail of one segment does not count", () => {
    expect(namesSelf("cat-harness/scripts/prefix-build.ts", "build.ts")).toBe(false);
  });
});

describe("subjectFiles", () => {
  test("skips vendored and generated directories", () => {
    const root = fixture();
    mkdirSync(join(root, "node_modules"), { recursive: true });
    mkdirSync(join(root, "build"), { recursive: true });
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "node_modules", "a.ts"), "");
    writeFileSync(join(root, "build", "b.ts"), "");
    writeFileSync(join(root, "src", "c.ts"), "");
    expect(subjectFiles(root)).toEqual(["src/c.ts"]);
  });

  /**
   * `scripts/tests/workflow-paths-resolve.test.ts` names
   * `scripts/does-not-exist.ts` as a FIXTURE. Reporting a deliberate one
   * trains a reader to skim the output, which is worse than no check.
   */
  test("drops tests, both by suffix and by directory", () => {
    const root = fixture();
    mkdirSync(join(root, "scripts", "tests"), { recursive: true });
    writeFileSync(join(root, "scripts", "a.test.ts"), "");
    writeFileSync(join(root, "scripts", "tests", "b.ts"), "");
    writeFileSync(join(root, "scripts", "c.ts"), "");
    expect(subjectFiles(root)).toEqual(["scripts/c.ts"]);
  });

  test("takes .sh and .py as well as .ts", () => {
    const root = fixture();
    writeFileSync(join(root, "a.sh"), "");
    writeFileSync(join(root, "b.py"), "");
    writeFileSync(join(root, "c.md"), "");
    expect(subjectFiles(root)).toEqual(["a.sh", "b.py"]);
  });
});

describe("selfReferences", () => {
  test("a stale root is Misnames and carries the file's own path as expected", () => {
    const root = fixture();
    mkdirSync(join(root, "cat-harness", "scripts"), { recursive: true });
    const rel = "cat-harness/scripts/thing.ts";
    writeFileSync(join(root, rel), "// usage: bun run scripts/thing.ts --flag\n");
    const [r] = selfReferences(root, rel, {});
    expect(r.verdict).toBe(Verdict.Misnames);
    expect(r.spelled).toBe("scripts/thing.ts");
    expect(r.expected).toBe(rel);
    expect(r.line).toBe(1);
  });

  test("the correct spelling is Names", () => {
    const root = fixture();
    mkdirSync(join(root, "cat-harness", "scripts"), { recursive: true });
    const rel = "cat-harness/scripts/thing.ts";
    writeFileSync(join(root, rel), `// usage: bun run ${rel}\n`);
    expect(selfReferences(root, rel, {})[0].verdict).toBe(Verdict.Names);
  });

  test("a reference to another file is not reported at all", () => {
    const root = fixture();
    mkdirSync(join(root, "cat-harness", "tools"), { recursive: true });
    const rel = "cat-harness/tools/index.ts";
    writeFileSync(join(root, rel), "// bun run src/index.ts --check-deps\n");
    expect(selfReferences(root, rel, {})).toEqual([]);
  });

  test("an unreadable file is Undetermined, never a pass", () => {
    const root = fixture();
    const refs = selfReferences(root, "gone.ts", {});
    expect(refs).toHaveLength(1);
    expect(refs[0].verdict).toBe(Verdict.Undetermined);
    expect(refs[0].note).toContain("unreadable");
  });
});

describe("the package.json advice", () => {
  test("scriptFor finds the named script that runs the path", () => {
    const scripts = { "qa:sweep": "bun run cat-harness/content/pipeline/qa-sweep.ts" };
    expect(scriptFor("cat-harness/content/pipeline/qa-sweep.ts", scripts)).toBe("qa:sweep");
    expect(scriptFor("cat-harness/scripts/other.ts", scripts)).toBeUndefined();
  });

  test("rootScripts is {} rather than a throw when package.json is absent", () => {
    expect(rootScripts(fixture())).toEqual({});
  });

  /** Advice only: a named script may bake in flags the usage line varies. */
  test("--fix writes the path, never the script name", () => {
    const root = fixture();
    mkdirSync(join(root, "cat-harness", "scripts"), { recursive: true });
    const rel = "cat-harness/scripts/thing.ts";
    writeFileSync(join(root, rel), "// bun run scripts/thing.ts\n");
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ scripts: { "do:thing": `bun run ${rel}` } }),
    );
    const refs = selfReferences(root, rel, rootScripts(root));
    expect(refs[0].script).toBe("do:thing");
    applyFix(root, refs);
    expect(readFileSync(join(root, rel), "utf8")).toBe(`// bun run ${rel}\n`);
  });
});

describe("applyFix", () => {
  test("rewrites only the spelled occurrence, on the line it was found on", () => {
    const root = fixture();
    mkdirSync(join(root, "cat-harness", "scripts"), { recursive: true });
    const rel = "cat-harness/scripts/thing.ts";
    writeFileSync(
      join(root, rel),
      [
        "// bun run scripts/thing.ts --a",
        "// bun run other/elsewhere.ts   <- untouched, different file",
        "const s = 'scripts/thing.ts';  // untouched: no bun run on this line",
        "",
      ].join("\n"),
    );
    const touched = applyFix(root, selfReferences(root, rel, {}));
    expect(touched).toEqual([rel]);
    const after = readFileSync(join(root, rel), "utf8").split("\n");
    expect(after[0]).toBe(`// bun run ${rel} --a`);
    expect(after[1]).toContain("other/elsewhere.ts");
    expect(after[2]).toBe("const s = 'scripts/thing.ts';  // untouched: no bun run on this line");
  });

  test("leaves a file alone when nothing in it misnames itself", () => {
    const root = fixture();
    mkdirSync(join(root, "cat-harness", "scripts"), { recursive: true });
    const rel = "cat-harness/scripts/thing.ts";
    writeFileSync(join(root, rel), `// bun run ${rel}\n`);
    expect(applyFix(root, selfReferences(root, rel, {}))).toEqual([]);
  });

  test("is idempotent — a second pass finds nothing to do", () => {
    const root = fixture();
    mkdirSync(join(root, "cat-harness", "scripts"), { recursive: true });
    const rel = "cat-harness/scripts/thing.ts";
    writeFileSync(join(root, rel), "// bun run scripts/thing.ts\n");
    applyFix(root, selfReferences(root, rel, {}));
    expect(applyFix(root, selfReferences(root, rel, {}))).toEqual([]);
  });
});

describe("the exemption table cannot outlive what it exempts", () => {
  test("an entry matching nothing is itself reported", () => {
    const stale = { file: "nowhere.ts", match: "gone.ts", reason: "test" };
    SELF_REF_EXEMPTIONS.push(stale);
    try {
      expect(unmatchedExemptions([])).toContain(stale);
      expect(report([], false).join("\n")).toContain("exemption matches nothing");
    } finally {
      SELF_REF_EXEMPTIONS.length = SELF_REF_EXEMPTIONS.indexOf(stale);
    }
  });

  test("the shipped table is empty, so nothing is exempt today", () => {
    expect(SELF_REF_EXEMPTIONS).toEqual([]);
  });
});

describe("report — could-not-determine is never rendered as clean", () => {
  test("an Undetermined verdict says so and names exit 2", () => {
    const lines = report(
      [
        {
          file: "a.ts",
          line: 0,
          spelled: "",
          expected: "a.ts",
          verdict: Verdict.Undetermined,
          note: "unreadable: EACCES",
        },
      ],
      false,
    ).join("\n");
    expect(lines).toContain("NOT a pass");
    expect(lines).toContain("Exit 2");
    expect(lines).not.toContain("✓");
  });

  test("a clean set says so, with the count it checked", () => {
    const lines = report(
      [{ file: "a.ts", line: 1, spelled: "a.ts", expected: "a.ts", verdict: Verdict.Names }],
      false,
    ).join("\n");
    expect(lines).toContain("✓");
    expect(lines).toContain("1 self-referencing usage string");
  });
});

describe("the corpus invariant", () => {
  test("no file in this repository misnames itself", () => {
    const bad = auditAll(REPO).filter((r) => r.verdict === Verdict.Misnames);
    expect(bad.map((r) => `${r.file}:${r.line} says ${r.spelled}`)).toEqual([]);
  });

  test("nothing is Undetermined, so the clean verdict above covers everything", () => {
    expect(auditAll(REPO).filter((r) => r.verdict === Verdict.Undetermined)).toEqual([]);
  });

  /**
   * The mutation check. A gate that cannot fail is not a gate — this proves
   * the corpus invariant above would have caught the 287 occurrences it was
   * written for, rather than passing because the audit found nothing to look
   * at.
   */
  test("MUTATION: reintroducing a pre-split spelling is caught", () => {
    const root = fixture();
    mkdirSync(join(root, "cat-harness", "content", "pipeline"), { recursive: true });
    const rel = "cat-harness/content/pipeline/build.ts";
    writeFileSync(join(root, rel), " * bun run pipeline/build.ts <paper>\n");
    const bad = auditAll(root).filter((r) => r.verdict === Verdict.Misnames);
    expect(bad).toHaveLength(1);
    expect(bad[0].spelled).toBe("pipeline/build.ts");
    expect(bad[0].expected).toBe(rel);
  });

  test("MUTATION: the audit is not vacuous — it does find correct references too", () => {
    expect(auditAll(REPO).filter((r) => r.verdict === Verdict.Names).length).toBeGreaterThan(0);
  });
});
