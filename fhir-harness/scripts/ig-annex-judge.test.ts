/**
 * The judge `check:artifact-index` runs over every `ig-annex` declaration:
 * what an `annexes.json` says, not only its shape (folio-assistant#2681).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { judgeIgAnnexDir, judgeInstanceAnnexes } from "./ig-annex-judge";

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** An IG instance with `annexes/` declared ig-annex and a sibling `tables/` holding `t.json`. */
function ig(opts: { pages?: boolean; declareAbsent?: boolean } = {}): string {
  const root = mkdtempSync(join(tmpdir(), "ig-annex-judge-"));
  made.push(root);
  const at = join(root, "an-ig");
  mkdirSync(join(at, "annexes"), { recursive: true });
  mkdirSync(join(at, "tables"), { recursive: true });
  writeFileSync(join(at, "tables", "t.json"), JSON.stringify({ title: "T", sheets: [] }));
  if (opts.pages) {
    mkdirSync(join(at, "input", "pagecontent"), { recursive: true });
    writeFileSync(join(at, "input", "pagecontent", "dictionary.md"), "The dictionary.\n");
  }
  const directories = [
    { id: "an-ig-annexes", path: "annexes/", graphTypologies: ["ig-annex"] },
    { id: "an-ig-tables", path: "tables/", graphTypologies: ["docs"] },
    ...(opts.declareAbsent ? [{ id: "an-ig-gone", path: "gone/", graphTypologies: ["ig-annex"] }] : []),
  ];
  writeFileSync(join(at, "an-ig.json"), JSON.stringify({ name: "an-ig", version: "0.1.0", directories }, null, 2));
  return at;
}

const writeAnnexes = (at: string, body: unknown): void => writeFileSync(join(at, "annexes", "annexes.json"), JSON.stringify(body));
const record = (r: Record<string, unknown>) => ({ $schema: "ig-annexes/v1", annexes: [r] });

describe("judgeIgAnnexDir", () => {
  test("a declaration whose file is held judges clean, and its page is said unverified without input/pagecontent/", () => {
    const at = ig();
    writeAnnexes(at, record({ page: "dictionary.md", file: "../tables/t.json", columns: ["a", "b"] }));
    const j = judgeIgAnnexDir(at, join(at, "annexes"));
    expect(j.findings).toEqual([]);
    expect(j.records).toBe(1);
    expect(j.pagesUnverified).toEqual(["dictionary.md"]);
  });

  test("with input/pagecontent/ the page is judged: held passes, missing is a finding", () => {
    const at = ig({ pages: true });
    writeAnnexes(at, record({ page: "dictionary.md", file: "../tables/t.json" }));
    expect(judgeIgAnnexDir(at, join(at, "annexes"))).toMatchObject({ findings: [], pagesUnverified: [] });
    writeAnnexes(at, record({ page: "nope.md", file: "../tables/t.json" }));
    expect(judgeIgAnnexDir(at, join(at, "annexes")).findings).toEqual([
      "annex ../tables/t.json on nope.md: nope.md is not a page under input/pagecontent/",
    ]);
  });

  test("no annexes.json is a finding, never an empty pass", () => {
    const at = ig();
    expect(judgeIgAnnexDir(at, join(at, "annexes")).findings[0]).toMatch(/holds no annexes\.json/);
  });

  test("the bare array and an unknown field do not validate as ig-annexes/v1", () => {
    const at = ig();
    writeAnnexes(at, [{ page: "dictionary.md", file: "../tables/t.json" }]);
    expect(judgeIgAnnexDir(at, join(at, "annexes")).findings[0]).toMatch(/does not validate as ig-annexes\/v1/);
    writeAnnexes(at, record({ page: "dictionary.md", file: "../tables/t.json", extra: true }));
    expect(judgeIgAnnexDir(at, join(at, "annexes")).findings[0]).toMatch(/does not validate as ig-annexes\/v1/);
  });

  test("a file not held, a file outside the instance, a record twice and a column twice are findings", () => {
    const at = ig();
    writeFileSync(join(at, "..", "outside.json"), "{}");
    writeAnnexes(at, {
      $schema: "ig-annexes/v1",
      annexes: [
        { page: "dictionary.md", file: "../tables/gone.json" },
        { page: "dictionary.md", file: "../../outside.json" },
        { page: "dictionary.md", file: "../tables/t.json", columns: ["a", "a"] },
        { page: "dictionary.md", file: "../tables/t.json" },
      ],
    });
    expect(judgeIgAnnexDir(at, join(at, "annexes")).findings).toEqual([
      "annex ../tables/gone.json on dictionary.md names a file that is not held",
      "annex ../../outside.json on dictionary.md names a file outside its instance (../outside.json), which an index mounting it does not carry",
      'annex ../tables/t.json on dictionary.md shows column(s) twice: "a"',
      "annex ../tables/t.json on dictionary.md is declared twice",
    ]);
  });
});

describe("judgeInstanceAnnexes", () => {
  test("judges each declared ig-annex directory, and says one absent from the checkout rather than reading it as empty", () => {
    const at = ig({ declareAbsent: true });
    writeAnnexes(at, record({ page: "dictionary.md", file: "../tables/t.json" }));
    const r = judgeInstanceAnnexes(at);
    expect(r.judged.map((j) => j.findings)).toEqual([[]]);
    expect(r.absent).toEqual([join(at, "gone/")]);
  });

  test("a directory of another kind holding an annexes.json is not read", () => {
    const at = ig();
    writeAnnexes(at, record({ page: "dictionary.md", file: "../tables/t.json" }));
    writeFileSync(join(at, "tables", "annexes.json"), JSON.stringify(record({ page: "x.md", file: "nope.json" })));
    expect(judgeInstanceAnnexes(at).judged.map((j) => j.declaration)).toEqual([join(at, "annexes", "annexes.json")]);
  });
});
