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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ancestorsOf, flattenDependencies } from "../../../cat-harness/schemas/dependency-order.ts";
import { allowedFromNeeds, type LayerRule } from "../../../cat-harness/schemas/layer-direction.ts";
import {
  classifyReference,
  occurrencesOf,
  type NameCollision,
  type Occurrence,
  type ReferenceExemption,
} from "../../../cat-harness/schemas/reference-direction.ts";
import {
  analyse,
  buildDirectionResult,
  CENSUS_FAMILY,
  CHECK_FAIL_ON_NEW,
  declaresTranslationMirror,
  EXEMPTIONS_DECLARED,
  directionCensus,
  directionSidecarState,
  directionStates,
  SIDECAR_STEM,
  type PendingEntry,
} from "../check-reference-direction.ts";
import { judgeQaResult, qaResultPath, writeQaResult, type QaResult } from "../../../cat-harness/scripts/qa-results.ts";

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
/** No collision at all: the target's name is not the repository's, so the arrow decides. */
const never = (): NameCollision | undefined => undefined;

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

describe("a name colliding with the repository's is decided per OCCURRENCE, not per name", () => {
  // Until 2026-09-29 this was one blanket `undetermined` for the whole name,
  // which was 78 % of every occurrence in the real corpus. The resolver now
  // says which of three things THIS occurrence is, and each answer has a
  // different consequence — which is the whole point of having three.
  const collides = (answer: NameCollision) => (o: Occurrence) =>
    o.to === "high" ? answer : undefined;

  test('"unknown" is still `undetermined` — the honest residue survives', () => {
    // A bare prose mention: no path, no URL, nothing to tell the repository
    // from the instance. This test exists so the third state cannot be
    // optimised away as unreachable.
    const v = classifyReference(occ("low", "high"), RULE, collides("unknown"));
    expect(v.verdict).toBe("undetermined");
    expect(v.basis).toContain("repository's name");
  });

  test('"unknown" is not called clean either: it does NOT become `allowed`', () => {
    expect(classifyReference(occ("low", "high"), RULE, collides("unknown")).verdict).not.toBe("allowed");
  });

  test('"unknown" outranks every exemption, so no exemption can silently claim the credit', () => {
    const always: ReferenceExemption[] = [{ pattern: /.*/, reason: "would swallow everything" }];
    expect(classifyReference(occ("low", "high"), RULE, collides("unknown"), always).verdict).toBe("undetermined");
  });

  test('"repository" is `names-repository` — judged, and owing no direction', () => {
    const v = classifyReference(occ("low", "high"), RULE, collides("repository"));
    expect(v.verdict).toBe("names-repository");
    expect(v.basis).toContain("not a layer");
  });

  test('"repository" is NOT `allowed`, `exempt` or `undetermined` — it is its own statement', () => {
    const always: ReferenceExemption[] = [{ pattern: /.*/, reason: "would swallow everything" }];
    const v = classifyReference(occ("low", "high"), RULE, collides("repository"), always);
    expect(v.verdict).toBe("names-repository");
  });

  test('"instance" falls THROUGH to the arrow, so it can be wrong-direction', () => {
    // The case the blanket could not reach: a real reference to the instance
    // whose name happens to be the repository's.
    const v = classifyReference(occ("low", "high"), RULE, collides("instance"));
    expect(v.verdict).toBe("wrong-direction");
  });

  test('"instance" pointing DOWN the arrow is allowed, like any other reference', () => {
    const down = (o: Occurrence) => (o.to === "low" ? "instance" as const : undefined);
    expect(classifyReference(occ("high", "low"), RULE, down).verdict).toBe("allowed");
  });

  test('"instance" can be exempted, which the blanket verdict made impossible', () => {
    const url: ReferenceExemption[] = [{ pattern: /https?:\/\//, reason: "an address, not a reference" }];
    const v = classifyReference(occ("low", "high", "see https://x/high"), RULE, collides("instance"), url);
    expect(v.verdict).toBe("exempt");
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
function tree(files: Record<string, string>, lowDirs: unknown[] = [], highDirs: unknown[] = []): string {
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
  decl("high", ["low"], highDirs);
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

describe("a file whose own `$schema` is declared `generated` is not read", () => {
  /** `folio-schema-graph/v1` is declared `generated: true` in the graph-kind registry. */
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

  test("an AUTHORED family is read — `folio-intake/v1` is not declared generated", () => {
    // It was skipped while the checker read `writtenBy`, which for this family
    // named its CONSUMER (library-graph.ts reads intake files; nothing writes them).
    const r = tree({ "low/index.json": JSON.stringify({ $schema: "folio-intake/v1", x: "high" }) }, [
      { id: "d", path: "", graphKinds: ["docs"] },
    ]);
    expect(analyse(r).skippedGeneratorWritten).toBe(0);
    expect(verdicts(r)).toEqual(["low/index.json wrong-direction"]);
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

describe("a file that DECLARES itself generated is not read", () => {
  test('a top-level "_generated" key in JSON — the convention sync-docs-harness.ts already emits', () => {
    const r = tree({ "low/d.json": JSON.stringify({ _generated: "scripts/x.ts", v: "high" }) });
    expect(analyse(r).classified).toEqual([]);
  });

  test("`generated:` front matter in Markdown — what the docs/reference mirrors now carry", () => {
    const r = tree({ "low/p.md": "---\nlayout: default\ngenerated: scripts/x.ts — do not hand-edit\n---\n\nabout high\n" });
    expect(analyse(r).classified).toEqual([]);
  });

  test("front matter with NO generated key is read", () => {
    expect(verdicts(tree({ "low/p.md": "---\nlayout: default\n---\n\nabout high\n" }))).toEqual(["low/p.md wrong-direction"]);
  });

  test("a page that merely DISCUSSES generation cannot exempt itself", () => {
    // The marker is front matter, not a word anywhere in the text.
    const r = tree({ "low/p.md": "# On generators\n\ngenerated: is a front-matter key. This page is about high.\n" });
    expect(verdicts(r)).toEqual(["low/p.md wrong-direction"]);
  });

  test('"_generated" nested deeper in the JSON does not count', () => {
    const r = tree({ "low/d.json": JSON.stringify({ describes: { _generated: "x" }, v: "high" }) });
    expect(verdicts(r)).toEqual(["low/d.json wrong-direction"]);
  });
});

// NO TEST OVER THE REAL TREE, and PENDING is the case that most invites one.
//
// Staleness both ways -- a listed file that no longer leaks, and an unlisted
// file that does -- is enforced by the CHECK, which exits 1 on either and
// runs in CI on every push. A test asserting the same thing would add a
// second full walk of the corpus for no extra coverage. Measured when it was
// briefly written that way: 5.89s for this file, against 198ms without it,
// and a sibling test's budget is 5s.

describe("the repository-name collision, resolved from the occurrence and the declaration", () => {
  // The root instance's name IS the repository's name, so a name match alone
  // cannot tell the two apart. What the occurrence CARRIES can: a URL around
  // it, an owner in front of it, a declared directory after it. On main
  // 2026-09-29 the blanket version of this test returned `undetermined` for
  // 11,090 of 14,299 occurrences — 78 % — of which 14 pointed into a directory
  // the root instance actually declares.
  //
  // `repo` here is declared AT the temp root, which is what makes it collide:
  // an instance rooted at the repository root shares the repository's name.

  /** `low` <- `repo` (rooted at the repo root, declaring `uploads/` and `tools/`) and `low` <- `high`. */
  function collidingTree(files: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), "refdir-"));
    made.push(root);
    writeFileSync(
      join(root, "repo.json"),
      JSON.stringify({
        name: "repo",
        needs: ["low"],
        directories: [
          { id: "uploads", path: "uploads/", graphKinds: ["docs"] },
          { id: "root-tools", path: "tools/", graphKinds: ["code"] },
        ],
      }),
    );
    for (const [name, needs] of [["low", []], ["high", ["low"]]] as const) {
      mkdirSync(join(root, name), { recursive: true });
      writeFileSync(join(root, name, `${name}.json`), JSON.stringify({ name, needs, directories: [] }));
    }
    for (const [rel, body] of Object.entries(files)) {
      const abs = join(root, rel);
      mkdirSync(join(abs, ".."), { recursive: true });
      writeFileSync(abs, body);
    }
    return root;
  }
  const only = (root: string) => analyse(root).classified.map((c) => c.verdict.verdict);

  test("a URL naming the repository is `names-repository` — an address, not a layer", () => {
    expect(only(collidingTree({ "low/a.md": "see <https://litlfred.github.io/repo/guides/x.html>\n" }))).toEqual([
      "names-repository",
    ]);
  });

  test("`<owner>/<name>` is `names-repository` — a repository slug", () => {
    expect(only(collidingTree({ "low/a.md": "cloned from litlfred/repo last week\n" }))).toEqual(["names-repository"]);
  });

  test("`<name>/` before any OTHER path segment is `names-repository` — a path in the repository", () => {
    expect(only(collidingTree({ "low/a.md": "it lives at repo/docs/guides/x.md\n" }))).toEqual(["names-repository"]);
  });

  test("a path into a DECLARED directory is judged by the arrow, NOT `names-repository`", () => {
    // `uploads/` is one of the two directories `repo.json` declares, so this
    // names the INSTANCE. `low` is depended on by `repo`, so it may not.
    expect(only(collidingTree({ "low/a.md": "dropped in repo/uploads/x.pdf\n" }))).toEqual(["wrong-direction"]);
  });

  test("the OTHER declared directory too — it is read from the declaration, not from a literal", () => {
    expect(only(collidingTree({ "low/a.md": "the barrel is repo/tools/index.ts\n" }))).toEqual(["wrong-direction"]);
  });

  test("a URL that points INTO a declared directory is still the instance — order matters", () => {
    // Documented ordering: `instance` is tested before `repository`, so a URL
    // cannot decide this occurrence. Reversing the two would return
    // `names-repository`; instead it goes to the arrow, is refused, and is then
    // excused by the URL EXEMPTION — which carries a stated reason and is
    // counted in the summary, where the blanket verdict was neither.
    expect(only(collidingTree({ "low/a.md": "see https://x.test/repo/uploads/x.pdf\n" }))).toEqual(["exempt"]);
  });

  test("a bare prose mention is `undetermined` — the third state is still reachable", () => {
    // No path and no URL: genuinely undecidable, and this is the residue the
    // narrowing was NOT allowed to eliminate.
    const r = collidingTree({ "low/a.md": "this whole thing is about repo, in the end\n" });
    expect(only(r)).toEqual(["undetermined"]);
    expect(analyse(r).classified[0]!.verdict.basis).toContain("repository's name");
  });

  test("a NON-colliding target behaves exactly as before — the collision rule reaches nothing else", () => {
    // `high` is not rooted at the repository root, so none of the three
    // answers applies to it and every shape is judged by the arrow alone.
    for (const text of [
      "this is about high\n",
      "see https://litlfred.github.io/high/guides/x.html\n",
      "cloned from litlfred/high\n",
      "it lives at high/docs/guides/x.md\n",
    ]) {
      // The URL lines are `exempt` rather than `wrong-direction` by the URL
      // exemption, which is the pre-existing behaviour and not part of this
      // rule; what matters is that `names-repository` never appears.
      expect(only(collidingTree({ "low/a.md": text }))).not.toContain("names-repository");
    }
    expect(only(collidingTree({ "low/a.md": "this is about high\n" }))).toEqual(["wrong-direction"]);
  });
});

describe("a declared path resolves against the scope it declares, not against the declarer", () => {
  // `scope: "repository"` resolves against the REPO ROOT, via `rootForScope`.
  // 23 of the 45 entries in `cat-harness.json` carry it -- more than half,
  // including `beans/`, `todos/`, `issue-marks/` and six `*/library/` trees.
  // Composing `join(instanceRoot, path)` for those yields a directory that
  // does not exist, so nothing is excluded and every file in it is read as
  // authored prose: 923 files, measured 2026-09-24.

  test("a repository-scoped machine-written directory is excluded from ANOTHER instance's tree", () => {
    // `high` declares `low/out/` at repository scope. The files are low's by
    // tree, and they are skipped because high's declaration says a process
    // writes them.
    const r = tree({ "low/out/x.md": "about high\n", "low/keep.md": "about high\n" }, [], [
      { id: "out", path: "low/out/", scope: "repository", graphKinds: ["qa"] },
    ]);
    expect(verdicts(r)).toEqual(["low/keep.md wrong-direction"]);
    expect(analyse(r).skippedMachineWritten).toBe(1);
  });

  test("the SAME entry at instance scope resolves under the declarer and excludes nothing", () => {
    // `high/low/out/` does not exist, so the directory is not found and
    // `low/out/x.md` is read -- the exact shape of the bug.
    const r = tree({ "low/out/x.md": "about high\n", "low/keep.md": "about high\n" }, [], [
      { id: "out", path: "low/out/", graphKinds: ["qa"] },
    ]);
    expect(verdicts(r).sort()).toEqual(["low/keep.md wrong-direction", "low/out/x.md wrong-direction"]);
    expect(analyse(r).skippedMachineWritten).toBe(0);
  });
});

// ── The committed sidecar ───────────────────────────────────────
//
// Same constraint as everything above and for the same measured reason: every
// tree here is built for one distinction and thrown away. Nothing in this
// block reads the real corpus, and `scriptAbsPath` deliberately names a file
// that does not exist, so the producer hash is a stable `"unknown"` rather
// than a hash of whichever version of the script is on disk.

/** `low` <- `mid` <- `high`: `low` has TWO instances above it, which is what `names > 1` needs. */
function threeTier(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "refdir-"));
  made.push(root);
  for (const [name, needs] of [["low", []], ["mid", ["low"]], ["high", ["mid"]]] as const) {
    mkdirSync(join(root, name), { recursive: true });
    writeFileSync(join(root, name, `${name}.json`), JSON.stringify({ name, needs, directories: [] }));
  }
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, body);
  }
  return root;
}

const resultFor = (root: string, pending: PendingEntry[], now = new Date("2026-01-01T00:00:00.000Z")) =>
  buildDirectionResult({
    report: analyse(root),
    pending,
    exemptionsDeclared: 4,
    script: "scripts/producer.ts",
    scriptAbsPath: join(root, "does-not-exist.ts"),
    now,
  });

describe("directionStates records the determinations, and each one separately", () => {
  test("a file naming SEVERAL instances above it, unlisted, is the state that exits 1", () => {
    const s = directionStates(analyse(threeTier({ "low/a.md": "about mid and high\n" })), []);
    expect(s.multiDestinationUnlisted).toEqual([{ file: "low/a.md", names: 2 }]);
  });

  test("the same file LISTED is not in that set — membership is the ruling", () => {
    const r = analyse(threeTier({ "low/a.md": "about mid and high\n" }));
    expect(directionStates(r, [{ file: "low/a.md", names: 2 }]).multiDestinationUnlisted).toEqual([]);
  });

  test("a file naming ONE instance above it is not multi-destination — it has a destination", () => {
    const s = directionStates(analyse(threeTier({ "low/a.md": "about high\n" })), []);
    expect(s.multiDestinationUnlisted).toEqual([]);
  });

  test("a PENDING entry with no wrong-direction reference left is reported stale", () => {
    const s = directionStates(analyse(threeTier({ "low/a.md": "nothing to see\n" })), [
      { file: "low/a.md", names: 2 },
    ]);
    expect(s.pendingStale).toEqual([{ file: "low/a.md", why: "no wrong-direction reference left" }]);
  });

  test("a PENDING entry that now names ONE instance is reported stale too — the set is checked BOTH ways", () => {
    const s = directionStates(analyse(threeTier({ "low/a.md": "about high\n" })), [
      { file: "low/a.md", names: 2 },
    ]);
    expect(s.pendingStale.map((p) => p.why)).toEqual([
      "now names ONE instance, so it has a destination and is not pending",
    ]);
  });

  test("an instance declaring no `needs` is carried as its own state, never folded into a count", () => {
    const root = mkdtempSync(join(tmpdir(), "refdir-"));
    made.push(root);
    for (const [n, body] of [["low", { name: "low", needs: [] }], ["adrift", { name: "adrift" }]] as const) {
      mkdirSync(join(root, n), { recursive: true });
      writeFileSync(join(root, n, `${n}.json`), JSON.stringify(body));
    }
    expect(directionStates(analyse(root), []).undeclaredInstances).toEqual(["adrift"]);
  });
});

describe("the census records VERDICT counts and no FILE count", () => {
  test("the four verdicts are all recorded, `undetermined` among them", () => {
    const r = analyse(threeTier({ "low/a.md": "about mid and high\n" }));
    const c = directionCensus(r, directionStates(r, []));
    for (const k of ["wrongDirection", "exempt", "namesRepository", "undetermined"]) {
      expect(`${k} present: ${k in c}`).toBe(`${k} present: true`);
    }
    expect(c.wrongDirection).toBe(2);
  });

  test("a count of FILES is NOT recorded — it is a census and stays printed", () => {
    // `audit-coverage`'s rule, applied here rather than rediscovered: a census
    // moves on any commit that adds a page and says nothing about direction.
    const r = analyse(threeTier({ "low/a.md": "about high\n" }));
    const c = directionCensus(r, directionStates(r, []));
    expect(Object.keys(c).filter((k) => k.startsWith("skipped"))).toEqual([]);
  });

  test("`undetermined` is carried as its own number, never merged with a pass or a finding", () => {
    // `adrift` declares no `needs`, and `dep` needs it — so `dep` is above
    // `adrift` and a reference from `adrift` to `dep` is a reference whose
    // direction NOBODY has declared. It is neither clean nor a finding, and
    // the sidecar has to keep saying so: 969 occurrences land here on the real
    // corpus, all bare mentions with no path and no URL.
    const root = mkdtempSync(join(tmpdir(), "refdir-"));
    made.push(root);
    for (const [n, body] of [["adrift", { name: "adrift" }], ["dep", { name: "dep", needs: ["adrift"] }]] as const) {
      mkdirSync(join(root, n), { recursive: true });
      writeFileSync(join(root, n, `${n}.json`), JSON.stringify(body));
    }
    writeFileSync(join(root, "adrift", "a.md"), "about dep\n");
    const r = analyse(root);
    const c = directionCensus(r, directionStates(r, []));
    expect(`undet ${c.undetermined} wrong ${c.wrongDirection} allowed ${c.allowed}`).toBe("undet 1 wrong 0 allowed 0");
  });
});

describe("the sidecar is idempotent, and `--check` grades the states rather than the counts", () => {
  /** An instance root with a `test/results/` the writer can fill. */
  const instanceRoot = (): string => {
    const d = mkdtempSync(join(tmpdir(), "refdir-side-"));
    made.push(d);
    return d;
  };

  test("re-running the producer over the same tree yields the same bytes", () => {
    const corpus = threeTier({ "low/a.md": "about mid and high\n" });
    const out = instanceRoot();
    writeQaResult(out, SIDECAR_STEM, resultFor(corpus, []));
    const first = readFileSync(qaResultPath(out, SIDECAR_STEM), "utf-8");
    writeQaResult(out, SIDECAR_STEM, resultFor(corpus, [], new Date("2027-05-05T00:00:00.000Z")));
    expect(readFileSync(qaResultPath(out, SIDECAR_STEM), "utf-8")).toBe(first);
  });

  test("a fresh sidecar is `current`", () => {
    const corpus = threeTier({ "low/a.md": "about mid and high\n" });
    const out = instanceRoot();
    const fresh = resultFor(corpus, []);
    writeQaResult(out, SIDECAR_STEM, fresh);
    expect(directionSidecarState(out, fresh)).toBe("current");
  });

  test("no sidecar at all is `absent`, which is NOT `current`", () => {
    // `dh4f`: no record reading identically to a clean one is the whole defect.
    expect(directionSidecarState(instanceRoot(), resultFor(threeTier({}), []))).toBe("absent");
  });

  test("the state check does NOT write — bean `ymsu`, and this is what pins it", () => {
    const out = instanceRoot();
    directionSidecarState(out, resultFor(threeTier({ "low/a.md": "about mid and high\n" }), []));
    expect(existsSync(qaResultPath(out, SIDECAR_STEM))).toBe(false);
  });

  test("a hand-edited GRADED family is `stale`", () => {
    const corpus = threeTier({ "low/a.md": "about mid and high\n" });
    const out = instanceRoot();
    const fresh = resultFor(corpus, []);
    writeQaResult(out, SIDECAR_STEM, fresh);
    const p = qaResultPath(out, SIDECAR_STEM);
    const doc = JSON.parse(readFileSync(p, "utf-8")) as QaResult;
    doc.families["multi-destination-unlisted"]!.entries = [];
    doc.families["multi-destination-unlisted"]!.count = 0;
    writeFileSync(p, JSON.stringify(doc, null, 2) + "\n");
    expect(directionSidecarState(out, fresh)).toBe("stale");
  });

  test("a corpus whose STATES moved is `stale` — the sidecar cannot outlive its ruling", () => {
    const out = instanceRoot();
    writeQaResult(out, SIDECAR_STEM, resultFor(threeTier({ "low/a.md": "about mid and high\n" }), []));
    expect(directionSidecarState(out, resultFor(threeTier({ "low/b.md": "about mid and high\n" }), []))).toBe("stale");
  });

  test("a hand-edited CENSUS is still `current`, and that is the deliberate line", () => {
    // The counts are RECORDED so a reader can tell `audited clean` from `never
    // audited`; they are not GRADED because they move whenever anybody writes a
    // paragraph. Grading them would make a gate stale by default, which is what
    // `audit-coverage` already paid for. This test exists so that decision
    // cannot be reversed by accident.
    const corpus = threeTier({ "low/a.md": "about mid and high\n" });
    const out = instanceRoot();
    const fresh = resultFor(corpus, []);
    writeQaResult(out, SIDECAR_STEM, fresh);
    const p = qaResultPath(out, SIDECAR_STEM);
    const doc = JSON.parse(readFileSync(p, "utf-8")) as QaResult;
    (doc.families[CENSUS_FAMILY]!.entries[0] as Record<string, number>).wrongDirection = 999_999;
    writeFileSync(p, JSON.stringify(doc, null, 2) + "\n");
    expect(directionSidecarState(out, fresh)).toBe("current");
  });

  test("a producer that moved is `stale` — a result says what the code that wrote it found", () => {
    // `check:harness-state`'s rule for `health`: age is a proxy, the hash is
    // the fact. A result written by a producer that no longer exists states the
    // old code's answer.
    const corpus = threeTier({ "low/a.md": "about mid and high\n" });
    const out = instanceRoot();
    writeQaResult(out, SIDECAR_STEM, resultFor(corpus, []));
    const moved = { ...resultFor(corpus, []), producer: { script: "scripts/producer.ts", script_hash: "0123456789ab" } };
    expect(directionSidecarState(out, moved)).toBe("stale");
  });

  test("the timestamp alone never makes it stale", () => {
    const corpus = threeTier({ "low/a.md": "about mid and high\n" });
    const out = instanceRoot();
    writeQaResult(out, SIDECAR_STEM, resultFor(corpus, []));
    expect(directionSidecarState(out, resultFor(corpus, [], new Date("2030-12-31T23:59:59.000Z")))).toBe("current");
  });
});

// ── X1: a translation mirror is exempt by what the FILE declares ─

describe("X1 — a translation mirror is exempt by its own front matter, never by its path", () => {
  const mirror = (fm: string) => `---\n${fm}\n---\n\nabout high\n`;

  test("`lang:` other than en AND `translation_source:` is exempt, carrying the X1 reason", () => {
    const r = analyse(tree({ "low/fr/p.md": mirror("lang: fr\ntranslation_source: p.md") }));
    expect(r.classified.map((c) => c.verdict.verdict)).toEqual(["exempt"]);
    expect(JSON.stringify(r.classified[0]!.verdict)).toContain("X1, a TRANSLATION MIRROR");
  });

  test("`lang: en` with a `translation_source:` is still read — the English source is counted once", () => {
    expect(verdicts(tree({ "low/p.md": mirror("lang: en\ntranslation_source: p.md") }))).toEqual(["low/p.md wrong-direction"]);
  });

  test("a non-English `lang:` WITHOUT `translation_source:` is read — both halves are required", () => {
    expect(verdicts(tree({ "low/p.md": mirror("lang: fr") }))).toEqual(["low/p.md wrong-direction"]);
  });

  test("a page that merely MENTIONS the keys in its body cannot exempt itself", () => {
    const body = "# Translating\n\nlang: fr\ntranslation_source: x.md\n\nabout high\n";
    expect(verdicts(tree({ "low/p.md": body }))).toEqual(["low/p.md wrong-direction"]);
  });

  test("it is decided by the file, not the path: a locale directory alone exempts nothing", () => {
    expect(verdicts(tree({ "low/docs/fr/p.md": "about high\n" }))).toEqual(["low/docs/fr/p.md wrong-direction"]);
  });

  test("only Markdown is read for it — a JSON file with the same keys is not a mirror", () => {
    const root = tree({ "low/p.json": JSON.stringify({ lang: "fr", translation_source: "x", v: "high" }) });
    expect(declaresTranslationMirror(join(root, "low/p.json"))).toBe(false);
    expect(verdicts(root)).toEqual(["low/p.json wrong-direction"]);
  });

  test("it is consulted LAST: a line another exemption already covers keeps that exemption's reason", () => {
    const r = analyse(tree({ "low/fr/p.md": "---\nlang: fr\ntranslation_source: p.md\n---\n\nsee https://example.org/high\n" }));
    expect(r.classified).toHaveLength(1);
    expect(JSON.stringify(r.classified[0]!.verdict)).not.toContain("X1,");
  });

  test("the declared-exemption count includes it", () => {
    expect(EXEMPTIONS_DECLARED).toBeGreaterThan(0);
    const result = buildDirectionResult({
      report: analyse(tree({})),
      pending: [],
      exemptionsDeclared: EXEMPTIONS_DECLARED,
      script: "scripts/producer.ts",
      scriptAbsPath: "/does/not/exist.ts",
    });
    expect(result.families[CENSUS_FAMILY]!.summary).toContain(`${EXEMPTIONS_DECLARED} exemption(s) declared`);
  });
});

// ── A.10: every (file, target) pair is graded NEW against a baseline ─

/** Judge quietly, with the gate's own `failOnNew` list, against a baseline in `root`. */
function judgeNew(fresh: QaResult, baselineRoot: string) {
  const log = console.log;
  const err = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return judgeQaResult({
      gate: "check:reference-direction:check",
      fresh,
      failOnNew: [...CHECK_FAIL_ON_NEW],
      baseline: { root: baselineRoot, stem: SIDECAR_STEM, writer: "check:reference-direction" },
    });
  } finally {
    console.log = log;
    console.error = err;
  }
}

describe("A.10 — a wrong-direction pair NEW against the baseline fails `--check`, single or multi destination", () => {
  const baselineOf = (corpus: string): string => {
    const d = mkdtempSync(join(tmpdir(), "refdir-base-"));
    made.push(d);
    writeQaResult(d, SIDECAR_STEM, resultFor(corpus, []));
    expect(existsSync(qaResultPath(d, SIDECAR_STEM))).toBe(true);
    return d;
  };

  test("the family holds ONE entry per file and per instance above it", () => {
    const r = resultFor(threeTier({ "low/a.md": "about mid and high\n", "low/b.md": "about high\n" }), []);
    expect(r.families["wrong-direction"]!.entries).toEqual([
      { file: "low/a.md", target: "high" },
      { file: "low/a.md", target: "mid" },
      { file: "low/b.md", target: "high" },
    ]);
  });

  test("an unchanged tree is inherited, not new — exit 0", () => {
    const corpus = threeTier({ "low/a.md": "about high\n" });
    expect(judgeNew(resultFor(corpus, []), baselineOf(corpus)).exit).toBe(0);
  });

  test("a NEW file naming ONE instance above it fails — the single-destination half of A.10", () => {
    const base = baselineOf(threeTier({ "low/a.md": "about high\n" }));
    const v = judgeNew(resultFor(threeTier({ "low/a.md": "about high\n", "low/b.md": "about mid\n" }), []), base);
    expect(v.exit).toBe(1);
    expect(v.diff?.added["wrong-direction"]).toEqual([{ file: "low/b.md", target: "mid" }]);
  });

  test("a NEW file naming SEVERAL instances above it fails, one new entry per target", () => {
    const base = baselineOf(threeTier({ "low/a.md": "about high\n" }));
    const v = judgeNew(resultFor(threeTier({ "low/a.md": "about high\n", "low/c.md": "about mid and high\n" }), []), base);
    expect(v.exit).toBe(1);
    expect(v.diff?.added["wrong-direction"]).toEqual([
      { file: "low/c.md", target: "high" },
      { file: "low/c.md", target: "mid" },
    ]);
  });

  test("a KNOWN file naming a FURTHER instance fails on the added target only", () => {
    const base = baselineOf(threeTier({ "low/a.md": "about high\n" }));
    const v = judgeNew(resultFor(threeTier({ "low/a.md": "about high and mid\n" }), []), base);
    expect(v.exit).toBe(1);
    expect(v.diff?.added["wrong-direction"]).toEqual([{ file: "low/a.md", target: "mid" }]);
  });

  test("a FIXED pair is resolved, never a failure — the ratchet only tightens", () => {
    const base = baselineOf(threeTier({ "low/a.md": "about mid and high\n" }));
    const v = judgeNew(resultFor(threeTier({ "low/a.md": "about mid\n" }), []), base);
    expect(v.exit).toBe(0);
    expect(v.diff?.resolved).toBe(1);
  });

  test("a baseline that predates the family is UNKNOWN for it, never 'every pair is new'", () => {
    const corpus = threeTier({ "low/a.md": "about high\n" });
    const d = mkdtempSync(join(tmpdir(), "refdir-old-"));
    made.push(d);
    const old = resultFor(corpus, []);
    const { "wrong-direction": _dropped, ...families } = old.families;
    writeQaResult(d, SIDECAR_STEM, { ...old, families });
    const v = judgeNew(resultFor(threeTier({ "low/a.md": "about high\n", "low/b.md": "about mid\n" }), []), d);
    expect(v.exit).toBe(0);
    expect(v.unknowns.join(" ")).toContain("carries no `wrong-direction` family");
  });

  test("no baseline at all is UNKNOWN and not gated — not 'no new findings'", () => {
    const empty = mkdtempSync(join(tmpdir(), "refdir-none-"));
    made.push(empty);
    const v = judgeNew(resultFor(threeTier({ "low/b.md": "about mid\n" }), []), empty);
    expect(v.exit).toBe(0);
    expect(v.baseline.state).not.toBe("hit");
  });
});

// ── The falsifier, over the REAL tree ───────────────────────────
//
// The one test here that walks the real corpus, and it walks it ONCE: a scan
// takes 15-35 s in a contended container, so the generous timeout is the
// measured cost rather than slack. Every other test in this file stays
// synthetic for the reason the header gives.

describe("the real tree: a new doc naming two instances above it makes `--check` exit 1", () => {
  const REPO = join(import.meta.dir, "..", "..", "..");
  test(
    "planted under cat-harness/docs/, it is NEW in `wrong-direction` against a baseline of the same tree without it",
    () => {
      const rel = `cat-harness/docs/zz-refdir-falsifier-${process.pid}.md`;
      const abs = join(REPO, rel);
      writeFileSync(abs, "# Falsifier\n\nThis page relies on smart-base and on who-iris.\n");
      let report: ReturnType<typeof analyse>;
      try {
        report = analyse(REPO);
      } finally {
        rmSync(abs, { force: true });
      }
      const without = { ...report, classified: report.classified.filter((c) => c.occurrence.file !== rel) };
      const mk = (r: typeof report) =>
        buildDirectionResult({ report: r, pending: [], exemptionsDeclared: EXEMPTIONS_DECLARED, script: "s.ts", scriptAbsPath: "/no/such.ts" });
      const base = mkdtempSync(join(tmpdir(), "refdir-real-"));
      made.push(base);
      writeQaResult(base, SIDECAR_STEM, mk(without));
      // Vacuity guard: the same tree WITHOUT the planted file passes.
      expect(judgeNew(mk(without), base).exit).toBe(0);
      const v = judgeNew(mk(report), base);
      expect(v.exit).toBe(1);
      expect(v.diff?.added["wrong-direction"]).toEqual([
        { file: rel, target: "smart-base" },
        { file: rel, target: "who-iris" },
      ]);
    },
    180_000,
  );
});
