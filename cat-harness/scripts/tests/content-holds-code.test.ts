/**
 * `content-instance-holds-code` — watched failing before it is trusted
 * (kg-separation precondition 3: a boundary gate that has never failed on a
 * planted violation has not been shown to guard anything). Bean `eayu`.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { codeFiles, contentCodeFindings, contentInstanceCode } from "../content-holds-code.ts";
import { KG_CRITERIA_BY_ID } from "../../schemas/kg-qa.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");

/** A temp repository holding `name/` with its declaration, plus any siblings. */
function plant(decls: Record<string, Record<string, unknown>>): string {
  const repo = mkdtempSync(join(tmpdir(), "chc-"));
  for (const [name, extra] of Object.entries(decls)) {
    mkdirSync(join(repo, name), { recursive: true });
    writeFileSync(
      join(repo, name, `${name}.json`),
      JSON.stringify({ name, title: name, version: "0.1.0", directories: [], ...extra }),
    );
  }
  return repo;
}

/** A lister over a planted listing, instance-relative. */
const listing = (root: string, rel: string[]) => () => rel.map((r) => join(root, r));

describe("codeFiles", () => {
  test("keeps code extensions, drops content, sorts, and exempts folio directories", () => {
    const root = "/x/inst";
    const files = ["b.ts", "a.py", "notes.md", "data.json", "content/blocks/b1.ts", "run.sh", "x.d/y"].map((f) => `${root}/${f}`);
    expect(codeFiles(root, files, ["content"])).toEqual(["a.py", "b.ts", "run.sh"]);
  });
});

describe("contentInstanceCode — planted", () => {
  test("FAILS on a content instance holding code, naming each file", () => {
    const repo = plant({ inst: { separation: "content" } });
    const root = join(repo, "inst");
    const v = contentInstanceCode(root, listing(root, ["scripts/gen.ts", "README.md", "themes/t.ts"]));
    expect(v.state).toBe("judged");
    if (v.state !== "judged") return;
    expect(v.files).toEqual(["scripts/gen.ts", "themes/t.ts"]);
    const f = contentCodeFindings(v);
    expect(f.map((x) => x.where)).toEqual(["scripts/gen.ts", "themes/t.ts"]);
    expect(f[0]!.detail).toContain("FR-7");
  });

  test("passes on a content instance with no code", () => {
    const repo = plant({ inst: { separation: "content" } });
    const root = join(repo, "inst");
    const v = contentInstanceCode(root, listing(root, ["README.md", "catalogue/nodes/a.json"]));
    expect(v).toMatchObject({ state: "judged", files: [] });
  });

  test("is n/a on an instance that does not declare itself content", () => {
    const repo = plant({ inst: {} });
    const root = join(repo, "inst");
    expect(contentInstanceCode(root, listing(root, ["scripts/gen.ts"]))).toEqual({ state: "n/a" });
  });

  test("reads the content half from a tools instance's `supports`", () => {
    const repo = plant({ inst: {}, "inst-tools": { supports: { inst: [0] } } });
    const root = join(repo, "inst");
    const v = contentInstanceCode(root, listing(root, ["x.ts"]));
    expect(v.state).toBe("judged");
    if (v.state === "judged") expect(v.basis).toContain("inst-tools");
  });

  test("could-not-list is UNKNOWN, never a pass", () => {
    const repo = plant({ inst: { separation: "content" } });
    const v = contentInstanceCode(join(repo, "inst"), () => undefined);
    expect(v.state).toBe("unknown");
  });
});

describe("contentInstanceCode — this checkout", () => {
  // Owner ruling 2026-10-01: a QA WARNING, not a failure — but one that still
  // NAMES every file. Bean `eayu`.
  test("who-iris is a QA warning, naming its six IRIS-specific code files", () => {
    expect(KG_CRITERIA_BY_ID["content-instance-holds-code"]?.severity).toBe("minor");
    const v = contentInstanceCode(join(REPO, "who-iris"));
    expect(v.state).toBe("judged");
    if (v.state !== "judged") return;
    expect(v.files).toEqual([
      // The platform shim (issue #2228): the one file that names where the
      // platform lives, so the climbs out of who-iris are in one place.
      "platform.ts",
      "scripts/gen-iris-pages.ts",
      "scripts/tests/catalogue-links.test.ts",
      "scripts/tests/gen-iris-pages.test.ts",
      "themes/themes.test.ts",
      "themes/themes.ts",
    ]);
    expect(contentCodeFindings(v).map((f) => f.where)).toEqual(v.files);
    // The generic code left: none of the moved files may reappear here.
    expect(v.files.some((f) => /check-catalogue|gen-covers|lib\/bytes|lib\/local-path/.test(f))).toBe(false);
  });

  test("bootstrap — the content half of a real pair — passes", () => {
    const v = contentInstanceCode(join(REPO, "bootstrap"));
    expect(v).toMatchObject({ state: "judged", files: [] });
  });

  test("a platform instance that has not said is n/a", () => {
    expect(contentInstanceCode(join(REPO, "cat-harness")).state).toBe("n/a");
  });
});
