/**
 * `subgraph-readmes` — one README per declared directory, from the declaration.
 *
 * @module scripts/tests/subgraph-readmes
 * @graphNode none — a test
 *
 * The writer's behaviour is tested on fixtures beside it, in
 * `bootstrap-tools/scripts/subgraph-readmes.test.ts`. Here: the harness's
 * side — the real tree, resolved with this harness's Extensions, and the
 * consumer-side question whether every link a generated README carries
 * resolves. Planning writes nothing.
 *
 * The `coverage.process` Extension is one this harness resolves, so it is
 * tested here — on FIXTURE instances in a temporary directory, never the real
 * corpus. A prior test here walked the corpus and pushed a sibling past its
 * timeout, and the three states below are all reachable in a tree of a dozen
 * files.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { BEGIN, END, plan, TEMPLATES } from "../../../bootstrap-tools/scripts/subgraph-readmes.ts";
import { harnessInstances, harnessPlan, subdirDescriptions } from "../subgraph-readmes.ts";
import { siteDir } from "../../schemas/cat-harness.ts";
import { isDirectoryReadme } from "../../schemas/kg-node.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");

test("a directory README is never a node, at any depth, and nothing else is", () => {
  expect(isDirectoryReadme("README.md")).toBe(true);
  expect(isDirectoryReadme("todos/README.md")).toBe(true);
  expect(isDirectoryReadme("todos/README.md.bak")).toBe(false);
  expect(isDirectoryReadme("todos/NOT-README.md")).toBe(false);
});

test("over the real tree, every link in every generated README resolves", async () => {
  const p = await harnessPlan(REPO);
  const broken: string[] = [];
  for (const [file, text] of p.writes) {
    const region = text.slice(text.indexOf(BEGIN), text.indexOf(END));
    for (const m of region.matchAll(/\]\(([^)]+)\)/g)) {
      const l = m[1]!;
      if (/^[a-z]+:/.test(l) || l.startsWith("#")) continue;
      // A destination is a URL-encoded path (`linkTarget`), so decode it
      // before asking the filesystem — a name with a space is a real file.
      if (!existsSync(join(dirname(file), decodeURIComponent(l.split("#")[0]!)))) broken.push(`${file}: ${l}`);
    }
  }
  expect(broken).toEqual([]);
}, 120_000);

/**
 * The DECLARED governing process (`coverage.process`), and its three states.
 *
 * Fixture instances only — `harnessInstances` resolves this harness's
 * Extensions over a temporary tree, and the writer plans from that.
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
        { id: "processes", path: "processes/", graphKinds: ["processes"], title: "Processes", description: "The diagrams." },
        {
          id: "drop",
          path: "drop/",
          graphKinds: ["skills"],
          title: "Drop",
          description: "Where files land.",
          coverage: { process: "demo-flow" },
        },
        { id: "quiet", path: "quiet/", graphKinds: ["skills"], title: "Quiet", description: "Declares no process." },
        {
          id: "claimed",
          path: "claimed/",
          graphKinds: ["skills"],
          title: "Claimed",
          description: "Names a diagram that is not there.",
          coverage: { process: "no-such-diagram" },
        },
        {
          id: "unrendered",
          path: "unrendered/",
          graphKinds: ["skills"],
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
  const p = await plan(r, harnessInstances(r), TEMPLATES);
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

test("a link destination is percent-encoded per segment, parentheses included", async () => {
  const { linkTarget } = await import("../../../bootstrap-tools/scripts/subgraph-readmes.ts");
  expect(linkTarget("PIIS2589750021000388 (2).pdf")).toBe("PIIS2589750021000388%20%282%29.pdf");
  expect(linkTarget("a b/c(d.md")).toBe("a%20b/c%28d.md");
  expect(linkTarget("plain.md")).toBe("plain.md");
  expect(decodeURIComponent(linkTarget("x (1) y.pdf"))).toBe("x (1) y.pdf");
});

/**
 * Subdirectory rows (`SubgraphInput.subdirs`): what a row says is read from
 * the directory's own declaration file — the one its kind names as
 * `declarationFile` — and only from entries that are NOT `subgraph: true`.
 * Anything undeclared keeps the file count: absent stays absent.
 */
describe("subdirectory rows — described from the declaration, or counted", async () => {
  const r = mkdtempSync(join(tmpdir(), "subgraph-subdirs-"));
  const inst = join(r, "demo");
  const work = join(inst, "work");
  for (const d of ["parts/deep", "promoted", "nodesc", "undeclared"]) mkdirSync(join(work, d), { recursive: true });
  for (const d of ["parts", "parts/deep", "promoted", "nodesc", "undeclared"]) writeFileSync(join(work, d, "x.txt"), "x\n");
  writeFileSync(
    join(inst, "demo.json"),
    JSON.stringify({
      name: "demo",
      title: "Demo",
      directories: [{ id: "work", path: "work/", graphKinds: ["beans"], title: "Work", description: "The work plan." }],
    }),
  );
  writeFileSync(join(inst, "README.md"), "# demo\n");
  writeFileSync(
    join(work, "beans.json"),
    JSON.stringify({
      name: "demo",
      directories: [
        { id: "parts", path: "parts", graphKinds: ["bean-defs"], description: "The parts of the plan." },
        { id: "deep", path: "parts/deep", graphKinds: ["bean-defs"], description: "Not a row of work/." },
        { id: "promoted", path: "promoted", graphKinds: ["beans"], subgraph: true, description: "Its own subgraph." },
        { id: "nodesc", path: "nodesc", graphKinds: ["bean-defs"] },
      ],
    }),
  );
  const instances = harnessInstances(r);
  const p = await plan(r, instances, TEMPLATES);
  const readme = p.writes.get(join(work, "README.md"))!;

  test("a declared part's row names it with its description", () => {
    expect(subdirDescriptions(work, ["beans"])).toEqual({ parts: "The parts of the plan." });
    expect(readme).toContain("| [`parts/`](parts/) | The parts of the plan. | |");
  });

  test("a promoted (`subgraph: true`) directory describes itself elsewhere; its row keeps the count", () => {
    expect(readme).toMatch(/\| \[`promoted\/`\]\([^)]*\) \| 1 file \|/);
    expect(readme).not.toContain("Its own subgraph.");
  });

  test("no description, or no declaration at all, stays a count — nothing is invented", () => {
    expect(readme).toContain("| [`nodesc/`](nodesc/) | 1 file | |");
    expect(readme).toContain("| [`undeclared/`](undeclared/) | 1 file | |");
    expect(readme).not.toContain("Not a row of work/.");
  });

  test("a directory whose kind names no declaration file supplies nothing", () => {
    expect(subdirDescriptions(work, ["no-such-kind"])).toEqual({});
    expect(subdirDescriptions(join(work, "undeclared"), ["beans"])).toEqual({});
    rmSync(r, { recursive: true, force: true });
  });
});

/**
 * A STORED directory is skipped — bean `f3bh`.
 *
 * Its record lives on a branch (`storage`, bean `16ei`) and the checkout holds
 * at most a working copy. A README planned from it, or a finding about it,
 * would differ between a contributor who ran `qa:fetch` and one who did not —
 * and from CI. The fixture is a real git work tree with the working copy
 * ignored, which is how every `qa` directory is configured here, because the
 * parent's file listing is git's answer.
 */
describe("a stored directory: the plan is the same with and without its working copy", async () => {
  const r = mkdtempSync(join(tmpdir(), "subgraph-stored-"));
  const inst = join(r, "demo");
  mkdirSync(join(inst, "tests"), { recursive: true });
  writeFileSync(
    join(inst, "demo.json"),
    JSON.stringify({
      name: "demo",
      title: "Demo",
      directories: [
        { id: "tests", path: "tests/", graphKinds: ["skills"], title: "Tests", description: "The tests." },
        {
          id: "qa",
          path: "tests/results/",
          graphKinds: ["qa"],
          title: "Results",
          description: "Derived QA.",
          storage: { branch: "qa-reports", keyedBy: "commit" },
        },
      ],
    }),
  );
  writeFileSync(join(inst, "README.md"), "# demo\n");
  writeFileSync(join(inst, "tests", "a.test.ts"), "// a\n");
  writeFileSync(join(r, ".gitignore"), "demo/tests/results/\n");
  spawnSync("git", ["init", "-q"], { cwd: r });

  const without = await plan(r, harnessInstances(r), TEMPLATES);
  mkdirSync(join(inst, "tests", "results", "kg-qa"), { recursive: true });
  writeFileSync(join(inst, "tests", "results", "kg-qa", "x.kg-qa.json"), "{}\n");
  writeFileSync(join(inst, "tests", "results", "summary.qa-results.json"), "{}\n");
  const withCopy = await plan(r, harnessInstances(r), TEMPLATES);

  test("the stored directory is not among the harness's directories", () => {
    const dirs = harnessInstances(r).flatMap((i) => i.dirs.map((d) => d.id));
    expect(dirs).toContain("tests");
    expect(dirs).not.toContain("qa");
  });

  test("every planned README is byte-identical, and none is written into the stored directory", () => {
    expect([...withCopy.writes.keys()].sort()).toEqual([...without.writes.keys()].sort());
    for (const [path, text] of without.writes) expect(withCopy.writes.get(path), path).toBe(text);
    expect([...withCopy.writes.keys()].some((p) => p.includes(join("tests", "results")))).toBe(false);
  });

  test("the findings are identical too, and the absent working copy is not `absent-directory`", () => {
    expect(withCopy.findings).toEqual(without.findings);
    expect(without.findings["absent-directory"]).toEqual([]);
    rmSync(r, { recursive: true, force: true });
  });
});
