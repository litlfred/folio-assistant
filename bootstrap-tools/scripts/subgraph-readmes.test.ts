/**
 * `subgraph-readmes` — one README per declared directory, from the declaration.
 *
 * @module bootstrap-tools/scripts/subgraph-readmes.test
 * @graphNode none — a test
 *
 * Fixture instances in a temporary directory, resolved with bootstrap's plain
 * rule (`instancesIn`). `plan()` writes nothing. Whether every link a
 * generated README carries resolves over the REAL tree is the hosting harness's test,
 * because the real tree is resolved with the harness's Extensions.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { generatedFrontMatter } from "./generated-by.ts";
import { BEGIN, END, SCRIPT, instancesIn, plan, splice } from "./subgraph-readmes.ts";

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
        { id: "skills", path: "skills/", graphTypologies: ["skills"], dependents: "skip", title: "Skills", description: "What to do." },
        { id: "notes", path: "notes/", graphTypologies: ["skills"], dependents: "skip" },
        { id: "kept", path: "kept/", graphTypologies: ["skills"], dependents: "skip", description: "Hand written." },
        { id: "gone", path: "gone/", graphTypologies: ["skills"], dependents: "skip", description: "Not here." },
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
    expect(splice(undefined, "x")).toBe(`${BEGIN}\nx\n\n${END}\n`);
  });
  test("markers: the region is replaced and the rest kept", () => {
    expect(splice(`a\n${BEGIN}\nold\n${END}\nb`, "new")).toBe(`a\n${BEGIN}\nnew\n\n${END}\nb`);
  });
  test("no markers: undefined, meaning leave it alone", () => {
    expect(splice("# written by a person\n", "x")).toBeUndefined();
  });
  test("a blank line stands before the end marker, so kramdown reads a closing table as a table", () => {
    // folio-assistant#2529: kramdown (Jekyll, github-pages) prints a table as
    // a paragraph of pipes when an HTML line follows its last row directly.
    const table = "| file | what it is |\n|---|---|\n| [`a.md`](a.md) | A |\n";
    expect(splice(undefined, table)).toContain(`| A |\n\n${END}`);
    expect(splice(`${BEGIN}\nold\n${END}\n`, table)).toContain(`| A |\n\n${END}`);
  });
  test("re-splicing is stable: the blank line is not doubled", () => {
    const once = splice(undefined, "| a |\n|---|\n| x |\n")!;
    expect(splice(once, "| a |\n|---|\n| x |\n")).toBe(once);
  });
  test("an empty region is the two markers around one blank line", () => {
    expect(splice(undefined, "")).toBe(`${BEGIN}\n\n${END}\n`);
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

  test("the generated table ends in a blank line before the end marker — folio-assistant#2529", () => {
    const lines = skills.split("\n");
    const end = lines.indexOf(END);
    expect(end).toBeGreaterThan(1);
    expect(lines[end - 1]).toBe("");
    expect(lines[end - 2].startsWith("|")).toBe(true);
  });

  test("files are described from themselves; a subdirectory is one row, with no count", () => {
    expect(skills).toContain("| [`a.md`](a.md) | Does A. |");
    expect(skills).toContain("| [`pack/`](pack/) | _nothing declares what this holds_ | |");
  });

  test("the counts the README no longer prints are in the plan — bean ba9e", () => {
    expect(p.counts.get(join(inst, "skills", "README.md"))).toEqual({ direct: 1, subdirs: { pack: 1 } });
  });

  test("a missing README is created; the heading falls back to the id", () => {
    const notes = p.writes.get(join(inst, "notes", "README.md"))!;
    expect(notes.startsWith(generatedFrontMatter(SCRIPT) + BEGIN)).toBe(true);
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

describe("a subdirectory row says what it IS when the caller resolved one", async () => {
  // Bean `kgho` / folio-assistant#1724. A file COUNT is re-derived from the
  // filesystem on every run, so two branches that each add a file compute two
  // different totals and NEITHER is right for the merge: one line of
  // `beans/README.md` conflicted three times in a single day (2026-10-01).
  // A declared description changes only when the declaration changes.
  //
  // The caller resolves it, not this writer. `declarationFileIn` recognises a
  // declaration by `name` matching its basename, and that is load-bearing:
  // `bootstrap-tools/` holds both `package.json` and `bootstrap-tools.json`,
  // BOTH satisfy `KnowledgeGraphDeclarationSchema`, and the function throws on
  // two — so a "whatever validates" rule would throw on this very repository.
  // Declarations that legitimately break the basename rule (`beans/beans.json`,
  // whose `name` says whose work plan it is) are their harness's to resolve.
  const r = repo();
  const withDesc = instancesIn(r).map((i) => ({
    ...i,
    dirs: i.dirs.map((d) => (d.id === "skills" ? { ...d, subdirs: { pack: "A bundle of related skills." } } : d)),
  }));
  const p = await plan(r, withDesc);
  const skills = p.writes.get(join(r, "demo", "skills", "README.md"))!;

  test("the description replaces the count", () => {
    expect(skills).toContain("| [`pack/`](pack/) | A bundle of related skills. | |");
  });

  test("and the count is GONE, not merely accompanied", () => {
    // The row carries one answer. Printing both would make a reader ask which
    // is the subject of the row, and reintroduce the drifting value this
    // change exists to remove.
    expect(skills).not.toContain("1 file");
  });

  test("a name with no description falls back to a value that does not count", () => {
    // Partial resolution is the normal case: a directory may declare some of
    // its children and not others. The unnamed ones must not go blank.
    const partial = instancesIn(r).map((i) => ({
      ...i,
      dirs: i.dirs.map((d) => (d.id === "skills" ? { ...d, subdirs: { nothing: "unrelated" } } : d)),
    }));
    return plan(r, partial).then((q) => {
      expect(q.writes.get(join(r, "demo", "skills", "README.md"))!).toContain("| [`pack/`](pack/) | _nothing declares what this holds_ | |");
    });
  });

  test("an empty string is not a description — it falls back", () => {
    // `""` is what the writer itself passes down for "nothing declared", so a
    // caller supplying it must behave the same way rather than emitting a
    // blank cell.
    const blank = instancesIn(r).map((i) => ({
      ...i,
      dirs: i.dirs.map((d) => (d.id === "skills" ? { ...d, subdirs: { pack: "" } } : d)),
    }));
    return plan(r, blank).then((q) => {
      expect(q.writes.get(join(r, "demo", "skills", "README.md"))!).toContain("| [`pack/`](pack/) | _nothing declares what this holds_ | |");
    });
  });
});

describe("a README is invariant under adding a file — bean ba9e", async () => {
  // 207 file counts across 54 committed READMEs changed on almost every
  // commit, so every merge conflicted on them. The README now carries nothing
  // that moves when a file is added below a subdirectory; the numbers are in
  // `Plan.counts` for a harness to publish where they cannot conflict.
  const r = repo();
  const before = (await plan(r, instancesIn(r))).writes.get(join(r, "demo", "skills", "README.md"));
  writeFileSync(join(r, "demo", "skills", "pack", "c.md"), "---\nname: c\ndescription: C.\n---\n");
  const after = await plan(r, instancesIn(r));

  test("adding a file under a subdirectory changes no README", () => {
    expect(after.writes.get(join(r, "demo", "skills", "README.md"))).toBe(before);
  });
  test("but the count in the plan moves", () => {
    expect(after.counts.get(join(r, "demo", "skills", "README.md"))!.subdirs.pack).toBe(2);
    rmSync(r, { recursive: true, force: true });
  });
});

describe("over the list limit, the summary names kinds, never numbers — bean ba9e", async () => {
  const r = repo();
  for (let i = 0; i < 151; i++) writeFileSync(join(r, "demo", "notes", `n${i}.${i % 2 ? "md" : "txt"}`), "x\n");
  const notes = (await plan(r, instancesIn(r))).writes.get(join(r, "demo", "notes", "README.md"))!;
  test("the kinds, in name order, and no count", () => {
    expect(notes).toContain("More than 150 files directly here, too many to list, of these kinds: .md, .txt.");
    expect(notes).not.toMatch(/\b151\b|\b7[56] \.(md|txt)\b/); // 151 files: 76 .txt, 75 .md
    rmSync(r, { recursive: true, force: true });
  });
});

describe("in a git work tree, only the committed tree is counted — bean ba9e, Train 6", async () => {
  // A transient an earlier step left in the worktree, untracked and not
  // ignored, moved a committed README and reddened its check for nobody's
  // fault. The answer is now the commit's; the untracked file is NAMED as a
  // finding, because a file the change under way just wrote is untracked
  // until staged and must not silently vanish either.
  const r = repo();
  const git = (...a: string[]) => Bun.spawnSync(["git", ...a], { cwd: r, env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
  git("init", "-q");
  git("add", "-A");
  git("commit", "-qm", "fixture");
  const clean = await plan(r, instancesIn(r));
  writeFileSync(join(r, "demo", "skills", "pack", "transient.md"), "left behind\n");
  writeFileSync(join(r, "demo", "skills", "stray.md"), "left behind\n");
  const dirty = await plan(r, instancesIn(r));
  const readme = join(r, "demo", "skills", "README.md");

  test("an untracked file changes neither the README nor the counts", () => {
    expect(dirty.writes.get(readme)).toBe(clean.writes.get(readme));
    expect(dirty.counts.get(readme)).toEqual(clean.counts.get(readme));
  });
  test("it is reported, by path", () => {
    const f = dirty.findings["untracked-not-counted"].find((x) => x.directory === "skills")!;
    expect(f.path).toContain("demo/skills/pack/transient.md");
    expect(f.path).toContain("demo/skills/stray.md");
  });
  test("staging it is what makes it count", () => {
    git("add", "demo/skills/pack/transient.md");
    return plan(r, instancesIn(r)).then((q) => {
      expect(q.counts.get(readme)!.subdirs.pack).toBe(2);
      rmSync(r, { recursive: true, force: true });
    });
  });
});

describe("a wholly generated README declares itself in front matter — owner decision 4a, 2026-10-16", async () => {
  // A checker telling generated pages from authored ones reads a `generated:`
  // key in the page's leading front matter (its regex: `^generated:\s*\S`),
  // not the banner's HTML comment.
  const r = repo();
  const inst = join(r, "demo");
  const at = (d: string) => join(inst, d, "README.md");
  const DECLARES = (t: string) => {
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(t.slice(0, 2000));
    return fm !== null && /^generated:\s*\S/m.test(fm[1]!);
  };
  const first = await plan(r, instancesIn(r));

  test("a README created from nothing opens with it, then the region", () => {
    const notes = first.writes.get(at("notes"))!;
    expect(DECLARES(notes)).toBe(true);
    expect(notes.split("\n").slice(0, 4)).toEqual(["---", expect.stringMatching(/^generated: ".*scripts\/subgraph-readmes\.ts.*"$/), "---", BEGIN]);
  });

  test("a partly authored README never claims to be generated", () => {
    expect(DECLARES(first.writes.get(at("skills"))!)).toBe(false);
  });

  test("regenerating is a fixed point: no second block, nothing stale", async () => {
    writeFileSync(at("notes"), first.writes.get(at("notes"))!);
    const again = (await plan(r, instancesIn(r))).writes.get(at("notes"))!;
    expect(again).toBe(first.writes.get(at("notes"))!);
    expect(again.match(/^---$/gm)!.length).toBe(2);
  });

  test("a page that gains authored text loses it", async () => {
    writeFileSync(at("notes"), `${first.writes.get(at("notes"))!}\nWritten by a person.\n`);
    const next = (await plan(r, instancesIn(r))).writes.get(at("notes"))!;
    expect(DECLARES(next)).toBe(false);
    expect(next.startsWith(BEGIN)).toBe(true);
    expect(next).toContain("This section was generated");
  });

  test("front matter somebody else wrote is kept as it is, and none is added", async () => {
    const authored = `---\ntitle: "Notes"\nnav_order: 3\n---\n${BEGIN}\n${END}\n`;
    writeFileSync(at("notes"), authored);
    const next = (await plan(r, instancesIn(r))).writes.get(at("notes"))!;
    expect(next.startsWith(`---\ntitle: "Notes"\nnav_order: 3\n---\n${BEGIN}`)).toBe(true);
    expect(next.match(/^---$/gm)!.length).toBe(2);
    expect(DECLARES(next)).toBe(false);
    rmSync(r, { recursive: true, force: true });
  });
});
