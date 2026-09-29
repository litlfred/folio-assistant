/**
 * `kg:processes` and `kg:files` — an instance's README sections drawn from its
 * own declaration.
 *
 * @module scripts/tests/readme-graph-sections
 * @graphNode none — a test
 *
 * Each test builds its own instance in a temporary directory rather than
 * reading bootstrap, so a change to bootstrap cannot make these pass or fail.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { filesSection, firstSentence, processesSection } from "../../content/pipeline/readme-graph-sections";

const bpmn = (id: string, name: string, body = "") =>
  `<?xml version="1.0"?><bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:x="urn:x">` +
  `<bpmn:process id="${id}" name="${name}">${body}</bpmn:process></bpmn:definitions>`;

function instance(withPictures: boolean): string {
  const root = mkdtempSync(join(tmpdir(), "readme-graph-"));
  writeFileSync(
    join(root, "demo.json"),
    JSON.stringify({
      name: "demo",
      title: "Demo",
      directories: [
        { id: "processes", path: "processes/", graphKinds: ["processes"], dependents: "skip", description: "The diagrams. More text." },
        { id: "skills", path: "skills/", graphKinds: ["skills"], dependents: "skip" },
        { id: "qa", path: "test/results/", graphKinds: ["qa"], dependents: "skip" },
      ],
      assets: [{ id: "readme", src: "README.md", role: "instance-readme", description: "Start here. Then read on." }],
    }),
  );
  writeFileSync(join(root, "README.md"), "# demo\n");
  mkdirSync(join(root, "processes"));
  mkdirSync(join(root, "skills"));
  mkdirSync(join(root, "test/results/kg-qa"), { recursive: true });
  writeFileSync(
    join(root, "processes/main.bpmn"),
    bpmn("P_Main", "Main", `<bpmn:callActivity id="C" calledElement="P_Sub"/><bpmn:task id="T"><x:skill ref="do-it"/></bpmn:task>`),
  );
  writeFileSync(join(root, "processes/sub.bpmn"), bpmn("P_Sub", "Sub"));
  if (withPictures) {
    writeFileSync(join(root, "processes/main.svg"), "<svg/>");
    writeFileSync(join(root, "processes/sub.svg"), "<svg/>");
  }
  writeFileSync(join(root, "skills/do-it.md"), "---\nname: do-it\ndescription: >\n  Does it. Carefully.\n---\n# Do it\n");
  writeFileSync(join(root, "test/results/kg-qa/a.json"), "{}");
  writeFileSync(join(root, "test/results/kg-qa/b.json"), "{}");
  return root;
}

const ctx = (root: string) => ({ root, cfg: {} as never, fetch: false });

describe("kg:processes", () => {
  test("entry process first, each with its picture and who starts it", () => {
    const root = instance(true);
    const md = processesSection.render(ctx(root)).markdown;
    expect(md.indexOf("**Main**")).toBeLessThan(md.indexOf("**Sub**"));
    expect(md).toContain("the one you start; it calls \"Sub\"");
    expect(md).toContain('started from "Main"');
    expect(md).toContain("![Main](processes/main.svg)");
    rmSync(root, { recursive: true, force: true });
  });

  test("a diagram with no picture leaves the region untouched, never a broken image", () => {
    const root = instance(false);
    const out = processesSection.render(ctx(root));
    expect(out.skip).toBe(true);
    expect(out.notes.join()).toContain("render:bpmn");
    rmSync(root, { recursive: true, force: true });
  });

  test("no declaration is undetermined, not 'no Processes'", () => {
    const root = mkdtempSync(join(tmpdir(), "readme-graph-empty-"));
    expect(processesSection.render(ctx(root)).skip).toBe(true);
    expect(filesSection.render(ctx(root)).skip).toBe(true);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("kg:files", () => {
  const root = instance(true);
  const md = filesSection.render(ctx(root)).markdown;

  test("assets and the declaration sit at the top", () => {
    expect(md).toContain("| [`README.md`](README.md) | Start here. |");
    expect(md).toContain("| [`demo.json`](demo.json) | Demo |");
  });

  test("each file described from itself; used-by only from a recorded relation", () => {
    expect(md).toContain("| [`skills/do-it.md`](skills/do-it.md) | Does it. | \"Main\" |");
    expect(md).toContain("| [`processes/sub.bpmn`](processes/sub.bpmn) | a Process: Sub | \"Main\" |");
    expect(md).toContain("| [`processes/main.bpmn`](processes/main.bpmn) | a Process: Main |  |");
    expect(md).toContain("the picture of `main.bpmn`, generated from it");
  });

  test("directory heading uses the first sentence of its description", () => {
    expect(md).toContain("**`processes/`**: The diagrams.");
  });

  test("a results tree collapses to one row with its count", () => {
    expect(md).toContain("| [`test/results/`](test/results/) | 2 files, in subdirectories | |");
    expect(md).not.toContain("kg-qa/a.json");
  });
});

test("firstSentence stops at the first sentence and drops bold", () => {
  expect(firstSentence("**Bold** start. Second.")).toBe("Bold start.");
});
