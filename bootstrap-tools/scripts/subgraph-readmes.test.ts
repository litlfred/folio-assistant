/**
 * `subgraph-readmes` — one README per declared directory, from the declaration.
 *
 * @module bootstrap-tools/scripts/subgraph-readmes.test
 * @graphNode none — a test
 *
 * Fixture instances in a temporary directory, resolved with bootstrap's plain
 * rule (`instancesIn`). `plan()` writes nothing. Whether every link a
 * generated README carries resolves over the REAL tree is cat-harness's test,
 * because the real tree is resolved with the harness's Extensions.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BEGIN, END, hrefFor, instancesIn, plan, splice } from "./subgraph-readmes.ts";

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
  const p = await plan(r, instancesIn(r));
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

describe("hrefFor — a link target survives the markdown parser", () => {
  test("parentheses are encoded — the `main`-reddening case", () => {
    // `uploads/PIIS2589750021000388 (2).pdf`. A markdown target ends at the
    // first `)`, so the raw name produced a target of `PIIS2589750021000388 (2`.
    expect(hrefFor("PIIS2589750021000388 (2).pdf")).toBe("PIIS2589750021000388%20%282%29.pdf");
  });

  test("spaces are encoded", () => {
    expect(hrefFor("Skills in OpenAI API.pdf")).toBe("Skills%20in%20OpenAI%20API.pdf");
  });

  test("`#` and `?` are encoded — else the target becomes a fragment or a query", () => {
    expect(hrefFor("a#b.md")).toBe("a%23b.md");
    expect(hrefFor("a?b.md")).toBe("a%3Fb.md");
  });

  test("SLASHES survive — this encodes a path, not an opaque string", () => {
    // `encodeURIComponent` would give `sub%2Ffile.md` and break every nested
    // link. The separator is structure, not content.
    expect(hrefFor("sub/dir/file.md")).toBe("sub/dir/file.md");
  });

  test("an ordinary name is unchanged, so the common row does not churn", () => {
    expect(hrefFor("README.md")).toBe("README.md");
  });

  test("it ROUND-TRIPS — decodeURIComponent recovers the path on disk", () => {
    // The property the link test depends on. Without it, encoding the target
    // would swap one lie for its opposite: every encoded link reported broken
    // while every one of them resolves.
    for (const n of ["PIIS2589750021000388 (2).pdf", "a#b.md", "a?b.md", "sub/dir/file.md", "README.md"]) {
      expect(decodeURIComponent(hrefFor(n))).toBe(n);
    }
  });
});

describe("the SUBDIRECTORY row's target is encoded too", () => {
  test("a directory name with a paren or a space survives the parser", () => {
    // The sibling of the file-row defect, one line below it in the template.
    // It has never fired only because no subdirectory in the corpus carries
    // such a name — which is not a guarantee, it is an absence.
    expect(hrefFor("Old Drafts (2024)")).toBe("Old%20Drafts%20%282024%29");
  });

  test("the two forms a subdir row can take are both encoded", () => {
    // With a README the target is `<name>/README.md`; without one it is
    // `<name>/`. Encoding one and not the other would leave half the rows
    // broken, which is the shape of a fix that looks complete.
    expect(`${hrefFor("a (b)")}/README.md`).toBe("a%20%28b%29/README.md");
    expect(`${hrefFor("a (b)")}/`).toBe("a%20%28b%29/");
  });
});
