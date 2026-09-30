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
import { siteDir } from "../../schemas/cat-harness.ts";
import { isDirectoryReadme } from "../../schemas/kg-node.ts";

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

test("a directory README is never a node, at any depth, and nothing else is", () => {
  expect(isDirectoryReadme("README.md")).toBe(true);
  expect(isDirectoryReadme("todos/README.md")).toBe(true);
  expect(isDirectoryReadme("todos/README.md.bak")).toBe(false);
  expect(isDirectoryReadme("todos/NOT-README.md")).toBe(false);
});

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

/**
 * The DECLARED governing process (`coverage.process`), and its three states.
 *
 * Fixture instances only. A prior test here walked the real corpus and pushed
 * a sibling past its timeout, and the three states below are all reachable in
 * a tree of a dozen files.
 */
const BPMN = (name: string, extra = "") => `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bootstrap.processes="https://litlfred.github.io/bootstrap/0.1.0/processes/ns#">
  <bpmn:process id="Process_${name}" name="${name} flow">
    <bpmn:startEvent id="StartEvent_Drop" name="A file lands in drop/" />
${extra}  </bpmn:process>
</bpmn:definitions>
`;

function processRepo(): string {
  const r = mkdtempSync(join(tmpdir(), "subgraph-process-"));
  const inst = join(r, "demo");
  mkdirSync(join(inst, "processes"), { recursive: true });
  mkdirSync(join(inst, "drop"), { recursive: true });
  mkdirSync(join(inst, "quiet"), { recursive: true });
  mkdirSync(join(inst, "claimed"), { recursive: true });
  mkdirSync(join(inst, "unrendered"), { recursive: true });
  // Where `render-bpmn` puts its output: `<instance>/<site>/assets/img/workflows/`.
  // The site root is asked for rather than spelled: it is one answer, and a
  // fixture that hardcoded it would keep passing after the answer moved.
  const workflows = join(inst, siteDir({ name: "demo", stub: "demo" }), "assets/img/workflows");
  mkdirSync(workflows, { recursive: true });
  writeFileSync(
    join(inst, "demo.json"),
    JSON.stringify({
      name: "demo",
      title: "Demo",
      directories: [
        { id: "processes", path: "processes/", graphKinds: ["processes"], dependents: "skip", title: "Processes", description: "The diagrams." },
        {
          id: "drop",
          path: "drop/",
          graphKinds: ["skills"],
          dependents: "skip",
          title: "Drop",
          description: "Where files land.",
          coverage: { process: "demo-flow" },
        },
        { id: "quiet", path: "quiet/", graphKinds: ["skills"], dependents: "skip", title: "Quiet", description: "Declares no process." },
        {
          id: "claimed",
          path: "claimed/",
          graphKinds: ["skills"],
          dependents: "skip",
          title: "Claimed",
          description: "Names a diagram that is not there.",
          coverage: { process: "no-such-diagram" },
        },
        {
          id: "unrendered",
          path: "unrendered/",
          graphKinds: ["skills"],
          dependents: "skip",
          title: "Unrendered",
          description: "Names a real diagram nobody rendered.",
          coverage: { process: "unrendered-flow" },
        },
      ],
    }),
  );
  writeFileSync(join(inst, "README.md"), "# demo\n");
  writeFileSync(
    join(inst, "processes", "demo-flow.bpmn"),
    BPMN(
      "demo-flow",
      `    <bpmn:callActivity id="CallActivity_One" name="First step&#10;[demo-skill]" calledElement="Process_demo-sub">
      <bpmn:extensionElements><bootstrap.processes:skill ref="demo-skill" /></bpmn:extensionElements>
    </bpmn:callActivity>
    <bpmn:callActivity id="CallActivity_Two" name="Second step" calledElement="Process_nowhere" />
`,
    ),
  );
  writeFileSync(join(inst, "processes", "demo-sub.bpmn"), BPMN("demo-sub"));
  writeFileSync(join(inst, "processes", "unrendered-flow.bpmn"), BPMN("unrendered-flow"));
  writeFileSync(join(workflows, "demo-flow.svg"), "<svg/>\n");
  writeFileSync(join(workflows, "demo-sub.svg"), "<svg/>\n");
  writeFileSync(join(inst, "drop", "a.txt"), "a\n");
  writeFileSync(join(inst, "quiet", "b.txt"), "b\n");
  writeFileSync(join(inst, "claimed", "c.txt"), "c\n");
  writeFileSync(join(inst, "unrendered", "d.txt"), "d\n");
  return r;
}

describe("coverage.process — declared, absent, and could-not-determine", async () => {
  const r = processRepo();
  const p = await plan(r, TEMPLATES);
  const inst = join(r, "demo");
  const at = (d: string) => p.writes.get(join(inst, d, "README.md"))!;

  test("a directory declaring a process embeds its rendered diagram", () => {
    const drop = at("drop");
    expect(drop).toContain("## Governing process — demo-flow flow");
    expect(drop).toContain(`![demo-flow flow](../${siteDir({ name: "demo", stub: "demo" })}/assets/img/workflows/demo-flow.svg)`);
    expect(drop).toContain("[`demo-flow.bpmn`](../processes/demo-flow.bpmn)");
    expect(drop).not.toContain("Could not determine");
  });

  test("the link is declared, and the page says so rather than implying a match", () => {
    expect(at("drop")).toContain("The link is **declared** in `coverage.process`, not inferred");
  });

  test("the diagram's boundary is read from the element TYPE, not from its wording", () => {
    const drop = at("drop");
    expect(drop).toContain("It begins at the start **event** “A file lands in drop/”");
    expect(drop).toContain("**outside** this diagram");
  });

  test("each call activity is a row, with its declared skill and its own diagram", () => {
    const drop = at("drop");
    expect(drop).toContain("2 of its steps are **call activities**");
    expect(drop).toContain("| First step [demo-skill] | `demo-skill` | [`demo-sub.bpmn`](../processes/demo-sub.bpmn) |");
    // Self-closing, and calling a process nothing declares: the row stays and
    // says what could not be resolved. A dropped row would understate the
    // diagram.
    expect(drop).toContain("| Second step |  | _could not determine — nothing declares `Process_nowhere`_ |");
  });

  test("a directory declaring NO process gets no section, and that is not a finding", () => {
    expect(at("quiet")).not.toContain("Governing process");
    expect(at("quiet")).not.toContain("Could not determine");
    expect(p.findings["unresolved-process"].map((f) => f.directory)).not.toContain("quiet");
  });

  test("a declared process with no diagram says COULD NOT DETERMINE, and is a finding", () => {
    const claimed = at("claimed");
    expect(claimed).toContain("## Governing process");
    expect(claimed).toContain("Could not determine: no diagram named `no-such-diagram.bpmn`");
    expect(p.findings["unresolved-process"].map((f) => f.directory)).toContain("claimed");
  });

  test("a diagram found but never rendered also says COULD NOT DETERMINE", () => {
    const un = at("unrendered");
    expect(un).toContain("Could not determine:");
    expect(un).toContain("run `bun run render:bpmn`");
    // The SOURCE still resolves, so this is not the unresolved-process finding:
    // a missing render is a stale checkout, a missing diagram is a wrong
    // declaration, and merging them would send a reader to the wrong repair.
    expect(p.findings["unresolved-process"].map((f) => f.directory)).not.toContain("unrendered");
  });

  test("the file table is headed only where a section precedes it", () => {
    expect(at("drop")).toContain("\n## Files\n");
    expect(at("quiet")).not.toContain("## Files");
    rmSync(r, { recursive: true, force: true });
  });
});
