/**
 * `subgraph-readmes` — one README per declared directory, from the declaration.
 *
 * @module scripts/tests/subgraph-readmes
 * @graphNode none — a test
 *
 * Fixture instances in a temporary directory for the behaviour; the real tree
 * only for the consumer-side question, whether every link a generated README
 * carries resolves. `plan()` writes nothing, so nothing here writes into the
 * repository.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { BEGIN, END, plan, splice, templatesDir } from "../subgraph-readmes.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const TEMPLATES = templatesDir(join(REPO, "cat-harness"));

function repo(): string {
  const r = mkdtempSync(join(tmpdir(), "subgraph-readmes-"));
  const inst = join(r, "demo");
  mkdirSync(join(inst, "skills", "pack"), { recursive: true });
  mkdirSync(join(inst, "notes"));
  mkdirSync(join(inst, "kept"));
  writeFileSync(
    join(inst, "demo.json"),
    JSON.stringify({
      name: "demo",
      title: "Demo",
      directories: [
        { id: "skills", path: "skills/", graphKinds: ["skills"], dependents: "skip", title: "Skills", description: "What to do." },
        { id: "notes", path: "notes/", graphKinds: ["skills"], dependents: "skip" },
        { id: "kept", path: "kept/", graphKinds: ["skills"], dependents: "skip", description: "Hand written." },
        { id: "gone", path: "gone/", graphKinds: ["skills"], dependents: "skip", description: "Not here." },
      ],
    }),
  );
  writeFileSync(join(inst, "README.md"), "# demo\n");
  writeFileSync(join(inst, "skills", "a.md"), "---\nname: a\ndescription: Does A. More.\n---\n");
  writeFileSync(join(inst, "skills", "pack", "b.md"), "---\nname: b\ndescription: B.\n---\n");
  writeFileSync(join(inst, "skills", "README.md"), `Intro above.\n\n${BEGIN}\nold\n${END}\n\nOutro below.\n`);
  writeFileSync(join(inst, "notes", "n.md"), "# A note\n");
  writeFileSync(join(inst, "kept", "README.md"), "# Somebody wrote this\n");
  return r;
}

describe("splice", () => {
  test("no README: a file holding only the region", () => {
    expect(splice(undefined, "x")).toBe(`${BEGIN}\nx\n${END}\n`);
  });
  test("markers: the region is replaced and the rest kept", () => {
    expect(splice(`a\n${BEGIN}\nold\n${END}\nb`, "new")).toBe(`a\n${BEGIN}\nnew\n${END}\nb`);
  });
  test("no markers: undefined, meaning leave it alone", () => {
    expect(splice("# written by a person\n", "x")).toBeUndefined();
  });
});

describe("plan, on a fixture", async () => {
  const r = repo();
  const p = await plan(r, TEMPLATES);
  const inst = join(r, "demo");
  const skills = p.writes.get(join(inst, "skills", "README.md"))!;

  test("heading and paragraph are the declared title and description", () => {
    expect(skills).toContain("# Skills");
    expect(skills).toContain("What to do.");
    expect(skills).toContain("Part of [Demo](../README.md), declared as `skills`, holding `skills`.");
  });

  test("the text around the markers survives", () => {
    expect(skills.startsWith("Intro above.")).toBe(true);
    expect(skills).toContain("Outro below.");
    expect(skills).not.toContain("\nold\n");
  });

  test("files are described from themselves; a subdirectory is one row with its count", () => {
    expect(skills).toContain("| [`a.md`](a.md) | Does A. |");
    expect(skills).toContain("| [`pack/`](pack/) | 1 file | |");
  });

  test("a missing README is created; the heading falls back to the id", () => {
    const notes = p.writes.get(join(inst, "notes", "README.md"))!;
    expect(notes.startsWith(BEGIN)).toBe(true);
    expect(notes).toContain("# notes");
    expect(notes).toContain("_No description is declared for `notes`._");
  });

  test("every gap is a finding, and a hand-written README is left untouched", () => {
    expect(p.writes.has(join(inst, "kept", "README.md"))).toBe(false);
    const ids = (k: keyof typeof p.findings) => p.findings[k].map((f) => f.directory).sort();
    expect(ids("no-title")).toEqual(["kept", "notes"]);
    expect(ids("no-description")).toEqual(["notes"]);
    expect(ids("absent-directory")).toEqual(["gone"]);
    expect(ids("unmarked-readme")).toEqual(["kept"]);
  });

  test("nothing was written by planning", () => {
    expect(readFileSync(join(inst, "skills", "README.md"), "utf-8")).toContain("\nold\n");
    expect(existsSync(join(inst, "notes", "README.md"))).toBe(false);
    rmSync(r, { recursive: true, force: true });
  });
});

test("over the real tree, every link in every generated README resolves", async () => {
  const p = await plan(REPO, TEMPLATES);
  const broken: string[] = [];
  for (const [file, text] of p.writes) {
    const region = text.slice(text.indexOf(BEGIN), text.indexOf(END));
    for (const m of region.matchAll(/\]\(([^)]+)\)/g)) {
      const l = m[1]!;
      if (/^[a-z]+:/.test(l) || l.startsWith("#")) continue;
      if (!existsSync(join(dirname(file), l.split("#")[0]!))) broken.push(`${file}: ${l}`);
    }
  }
  expect(broken).toEqual([]);
}, 120_000);
