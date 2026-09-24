/**
 * The no-upward-reference rule, exercised on SYNTHETIC trees.
 *
 * **Never the real corpus, and that is a measured constraint rather than a
 * preference.** A prior session's tests walked the real tree five times and
 * pushed a sibling test past its 5 s timeout. Every tree here is three or
 * four tiny files in a temp directory, built to make exactly one distinction
 * and thrown away — so a failure names a rule rather than a file somebody
 * edited, and the suite costs milliseconds.
 *
 * The pure half (`schemas/reference-direction.ts`) needs no tree at all,
 * which is why it is a separate module.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ancestorsOf, flattenDependencies } from "../../schemas/dependency-order.ts";
import { allowedFromNeeds, type LayerRule } from "../../schemas/layer-direction.ts";
import {
  classifyReference,
  occurrencesOf,
  type Occurrence,
  type ReferenceExemption,
} from "../../schemas/reference-direction.ts";
import { analyse } from "../check-reference-direction.ts";

// ── The rule, with no filesystem ────────────────────────────────

/** `low` <- `mid` <- `high`: each needs the one before, so references may only point DOWN. */
const NEEDS = new Map<string, readonly string[] | undefined>([
  ["low", []],
  ["mid", ["low"]],
  ["high", ["mid"]],
  ["floating", undefined],
]);
const RULE: LayerRule = {
  allowed: allowedFromNeeds(
    NEEDS,
    ancestorsOf(
      flattenDependencies(
        [...NEEDS].map(([id, needs]) => ({ id, needs: [...(needs ?? [])], fatal: false })),
      ).order,
    ),
  ),
};
const occ = (from: string, to: string, text = "some prose", file = "a.md"): Occurrence => ({
  file,
  line: 1,
  text,
  from,
  to,
});
const never = () => false;

describe("occurrencesOf is bounded, because one instance name may prefix another", () => {
  test("a name inside a longer name is NOT an occurrence of it", () => {
    // The whole 6,778-vs-3,651 discrepancy in the opening measurement.
    expect(occurrencesOf("see folio-assistant-core for this", "folio-assistant")).toEqual([]);
  });

  test("the longer name IS found on that same line", () => {
    expect(occurrencesOf("see folio-assistant-core for this", "folio-assistant-core")).toHaveLength(1);
  });

  test("ordinary punctuation and path separators still bound a name", () => {
    for (const line of ["`smart-base`", "smart-base/schemas/x.ts", "(smart-base)", "smart-base."]) {
      expect(`${line}: ${occurrencesOf(line, "smart-base").length}`).toBe(`${line}: 1`);
    }
  });

  test("one occurrence per LINE, so a line is never counted twice for one name", () => {
    expect(occurrencesOf("smart-base and smart-base again", "smart-base")).toHaveLength(1);
  });

  test("line numbers are 1-based and point at the right line", () => {
    expect(occurrencesOf("a\nb\nsmart-base\n", "smart-base")[0]!.line).toBe(3);
  });
});

describe("classifyReference follows the dependency arrow", () => {
  test("naming what you depend on is allowed", () => {
    expect(classifyReference(occ("high", "mid"), RULE, never).verdict).toBe("allowed");
  });

  test("naming it TRANSITIVELY is allowed too — the rule is the closure, not the direct edge", () => {
    expect(classifyReference(occ("high", "low"), RULE, never).verdict).toBe("allowed");
  });

  test("naming an instance that depends on you is wrong-direction", () => {
    const v = classifyReference(occ("low", "high"), RULE, never);
    expect(v.verdict).toBe("wrong-direction");
    expect(v.basis).toContain("may not name it");
  });

  test("an instance that declares no `needs` is undetermined, never clean and never a finding", () => {
    // `[]` is the floor; absent is nobody-has-said. Collapsing the two would
    // make every undeclared instance look either tangled or spotless.
    expect(classifyReference(occ("floating", "high"), RULE, never).verdict).toBe("undetermined");
  });
});

describe("a target whose name is the repository's is undetermined, not a guess", () => {
  const sharesName = (n: string) => n === "high";

  test("undecidable by name — so it is declined, not called a violation", () => {
    const v = classifyReference(occ("low", "high"), RULE, sharesName);
    expect(v.verdict).toBe("undetermined");
    expect(v.basis).toContain("repository's name");
  });

  test("and not called clean either: it does NOT become `allowed`", () => {
    expect(classifyReference(occ("low", "high"), RULE, sharesName).verdict).not.toBe("allowed");
  });

  test("it outranks every exemption, so no exemption can silently claim the credit", () => {
    const always: ReferenceExemption[] = [{ pattern: /.*/, reason: "would swallow everything" }];
    expect(classifyReference(occ("low", "high"), RULE, sharesName, always).verdict).toBe("undetermined");
  });
});

describe("exemptions are consulted only for a reference the rule would refuse", () => {
  const url: ReferenceExemption[] = [{ pattern: /https?:\/\//, reason: "an address, not a reference" }];

  test("a refused reference on an exempt line is exempt, carrying its reason", () => {
    const v = classifyReference(occ("low", "high", "see https://x/high"), RULE, never, url);
    expect(v.verdict).toBe("exempt");
    expect(v.basis).toContain("an address, not a reference");
  });

  test("an ALLOWED reference is never reported as exempt — which is what lets a caller find a stale exemption", () => {
    expect(classifyReference(occ("high", "low", "see https://x/low"), RULE, never, url).verdict).toBe("allowed");
  });

  test("a file-scoped exemption matches on the file, not the line", () => {
    const tests: ReferenceExemption[] = [{ file: /\.test\.ts$/, reason: "a test may reach anywhere" }];
    expect(classifyReference(occ("low", "high", "x", "a/b.test.ts"), RULE, never, tests).verdict).toBe("exempt");
    expect(classifyReference(occ("low", "high", "x", "a/b.ts"), RULE, never, tests).verdict).toBe("wrong-direction");
  });

  test("an exemption scoped to another target does not fire", () => {
    const other: ReferenceExemption[] = [{ pattern: /.*/, to: "mid", reason: "only mid" }];
    expect(classifyReference(occ("low", "high"), RULE, never, other).verdict).toBe("wrong-direction");
  });
});

// ── The scan, over a tree built for the purpose ─────────────────

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A repository holding `low` <- `high`, plus whatever files the caller wants. */
function tree(files: Record<string, string>, lowDirs: unknown[] = []): string {
  const root = mkdtempSync(join(tmpdir(), "refdir-"));
  made.push(root);
  const decl = (name: string, needs: string[] | undefined, dirs: unknown[] = []) => {
    mkdirSync(join(root, name), { recursive: true });
    writeFileSync(
      join(root, name, `${name}.json`),
      JSON.stringify({ name, ...(needs === undefined ? {} : { needs }), directories: dirs }),
    );
  };
  decl("low", [], lowDirs);
  decl("high", ["low"]);
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
  }
  return root;
}
const verdicts = (root: string) =>
  analyse(root).classified.map((c) => `${c.occurrence.file} ${c.verdict.verdict}`);

describe("analyse over a synthetic tree", () => {
  test("a lower instance naming a higher one is a finding", () => {
    expect(verdicts(tree({ "low/notes.md": "this is about high\n" }))).toEqual(["low/notes.md wrong-direction"]);
  });

  test("a higher instance naming a lower one is not", () => {
    expect(analyse(tree({ "high/notes.md": "this is about low\n" })).classified).toEqual([]);
  });

  test("a file belongs to the INNERMOST declaring root that contains it", () => {
    // `high/` sits inside the repository root but is its own instance, so its
    // files are high's — not the root's, and not counted for both.
    const r = tree({ "high/deep/nested/notes.md": "about low\n" });
    expect(analyse(r).classified).toEqual([]);
  });

  test("a directory DECLARED to hold a machine-written graph is not read", () => {
    const files = { "low/out/index.json": '{"x":"high"}\n', "low/notes.md": "about high\n" };
    // `qa` holds "state" — written by a process as it runs.
    const r = tree(files, [{ id: "out", path: "out/", graphKinds: ["qa"] }]);
    expect(verdicts(r)).toEqual(["low/notes.md wrong-direction"]);
    expect(analyse(r).skippedMachineWritten).toBe(1);
  });

  test("a directory holding an AUTHORED graph is read — the exclusion is the declaration, not the shape", () => {
    const files = { "low/out/index.json": '{"x":"high"}\n' };
    // `docs` holds "content". Same file, same name, different declaration.
    const r = tree(files, [{ id: "out", path: "out/", graphKinds: ["docs"] }]);
    expect(verdicts(r)).toEqual(["low/out/index.json wrong-direction"]);
  });

  test("an instance with no declared `needs` is reported as undeclared rather than assumed", () => {
    const root = mkdtempSync(join(tmpdir(), "refdir-"));
    made.push(root);
    for (const [n, body] of [["low", { name: "low", needs: [] }], ["adrift", { name: "adrift" }]] as const) {
      mkdirSync(join(root, n), { recursive: true });
      writeFileSync(join(root, n, `${n}.json`), JSON.stringify(body));
    }
    expect(analyse(root).undeclared).toEqual(["adrift"]);
  });

  test("a broken needs graph is REFUSED, not walked — a partial closure reports allowed references as findings", () => {
    const root = mkdtempSync(join(tmpdir(), "refdir-"));
    made.push(root);
    for (const [a, b] of [["x", "y"], ["y", "x"]]) {
      mkdirSync(join(root, a), { recursive: true });
      writeFileSync(join(root, a, `${a}.json`), JSON.stringify({ name: a, needs: [b] }));
    }
    expect(() => analyse(root)).toThrow(/needs graph is broken/);
  });
});

describe("a file whose own `$schema` is declared `writtenBy` a generator is not read", () => {
  /** `folio-schema-graph/v1` is declared `writtenBy: scripts/gen-schema-viz.ts` in the graph-kind registry. */
  const GENERATED = "folio-schema-graph/v1";

  test("it is skipped even though its DIRECTORY holds authored content", () => {
    // The 429-false-finding case: a generator's output sitting in a `docs`
    // graph, which is `content` because the directory holds documentation.
    const r = tree({ "low/index.json": JSON.stringify({ $schema: GENERATED, x: "high" }) }, [
      { id: "d", path: "", graphKinds: ["docs"] },
    ]);
    expect(analyse(r).classified).toEqual([]);
    expect(analyse(r).skippedGeneratorWritten).toBe(1);
  });

  test("the same file with an UNDECLARED $schema is read", () => {
    const r = tree({ "low/index.json": JSON.stringify({ $schema: "something-nobody-declared/v1", x: "high" }) });
    expect(verdicts(r)).toEqual(["low/index.json wrong-direction"]);
  });

  test("only a TOP-LEVEL $schema counts — a file that MENTIONS one is still read", () => {
    // `docs/assets/schemas/index.json` carries `generatedAt` four times as a
    // field NAME inside a schema projection. What a file is, not what it names.
    const r = tree({ "low/notes.json": JSON.stringify({ describes: { $schema: GENERATED }, x: "high" }) });
    expect(verdicts(r)).toEqual(["low/notes.json wrong-direction"]);
  });

  test("an unparseable JSON file is read rather than skipped — a broken file is not a licence", () => {
    const r = tree({ "low/broken.json": "{ this is not json, and it mentions high" });
    expect(verdicts(r)).toEqual(["low/broken.json wrong-direction"]);
  });
});
