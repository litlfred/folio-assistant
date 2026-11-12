/**
 * @module bootstrap-tools/scripts/export-graph.test
 * @graphNode none — a test
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { GraphExportSchema } from "../schemas/graph-export.ts";
import { COLLECTED_KINDS, exportGraph, firstSentence, parseXml } from "./export-graph.ts";
import { GENERATED_BY } from "./generated-by.ts";

const BOOTSTRAP = join(import.meta.dir, "..", "..", "bootstrap");
const DOC = "https://example.org/site/bootstrap/bootstrap.jsonld";
const BASE = "https://example.org/site/bootstrap/";
const build = (provenance = false) => exportGraph(BOOTSTRAP, { docIri: DOC, provenance });
type Node = { "@id": string; "@type": string; [k: string]: unknown };
const nodes = () => (build()["@graph"] as Node[]).filter((n) => n["@type"] !== undefined);

describe("bootstrap's graph, from bootstrap's files, in standard terms", () => {
  test("parses against its schema, with and without provenance", () => {
    for (const d of [build(), build(true)]) {
      const r = GraphExportSchema.safeParse(d);
      expect(r.success ? [] : r.error.issues).toEqual([]);
    }
  });

  test("pure: two builds are byte-identical, and nothing absolute from this machine appears", () => {
    expect(JSON.stringify(build())).toBe(JSON.stringify(build()));
    expect(JSON.stringify(build())).not.toContain(BOOTSTRAP);
  });

  test("names nothing above bootstrap — no harness prefix, no harness property", () => {
    const text = JSON.stringify({ ...build(), "@id": "", "@graph": nodes().map((n) => ({ ...n, "@id": "" })) });
    expect(text).not.toContain("cat-harness");
    expect(text).not.toContain("folio-assistant");
  });

  test("every skill bootstrap holds is a node, at the id a harness links to", () => {
    const onDisk = readdirSync(join(BOOTSTRAP, "skills"))
      .filter((f) => f.endsWith(".md") && f !== "README.md")
      .map((f) => /^name:\s*(.+)$/m.exec(readFileSync(join(BOOTSTRAP, "skills", f), "utf-8"))?.[1]?.trim() ?? f.slice(0, -3))
      .sort();
    const inGraph = nodes().filter((n) => n["@type"] === "bootstrap:Skill").map((n) => n["@id"].split("/skill/")[1]).sort();
    expect(inGraph).toEqual(onDisk);
  });

  test("every link inside the graph lands on a node of it", () => {
    const ids = new Set([DOC, ...nodes().map((n) => n["@id"])]);
    const dangling: string[] = [];
    for (const n of nodes()) {
      for (const k of ["isPartOf", "sourceRef", "targetRef", "calledElement", "requires"]) {
        for (const v of ([] as unknown[]).concat(n[k] ?? [])) if (typeof v === "string" && !ids.has(v)) dangling.push(`${n["@id"]} ${k} → ${v}`);
      }
      for (const v of (n["flowNodeRef"] as string[] | undefined) ?? []) if (!ids.has(v)) dangling.push(`${n["@id"]} flowNodeRef → ${v}`);
    }
    expect(dangling).toEqual([]);
  });

  test("a subgraph says what it holds with bootstrap's own graph-typology individuals", () => {
    const declared = new Set((JSON.parse(readFileSync(join(BOOTSTRAP, "bootstrap.json"), "utf-8")) as { directories: { graphTypologies: string[] }[] }).directories.flatMap((d) => d.graphTypologies));
    for (const n of nodes().filter((x) => x["@type"] === "bootstrap:Subgraph")) {
      for (const t of n["type"] as string[]) expect(declared.has(t.replace("bootstrap:graphTypology/", ""))).toBe(true);
    }
  });

  test("provenance only when asked, and never on a node", () => {
    expect("generatedAtTime" in build()).toBe(false);
    const p = build(true);
    expect("generatedAtTime" in p).toBe(true);
    expect(JSON.stringify(p["@graph"])).not.toContain("generatedAtTime");
  });

  test("the document says it is generated, and by what", () => {
    expect(String(build()["comment"])).toContain(GENERATED_BY);
  });

  test("nothing the build could not read is dropped silently", () => {
    expect(build()["problems"]).toEqual([]);
  });

  test("a declared subgraph whose contents were not read is named, not left empty", () => {
    const g = build();
    const graph = g["@graph"] as { "@type": string; label: string; type: string[] }[];
    const unread = graph
      .filter((n) => n["@type"] === "bootstrap:Subgraph")
      .filter((n) => !n.type.some((k) => COLLECTED_KINDS.some((c) => k.endsWith(`/${c}`))))
      .map((n) => n.label)
      .sort();
    expect(unread.length).toBeGreaterThan(0);
    expect(g["omitted"]).toEqual(unread);
  });

  test("nodes are sorted by @id, by code unit", () => {
    const ids = (build()["@graph"] as { "@id": string }[]).map((n) => n["@id"]);
    expect(ids).toEqual([...ids].sort());
  });
});

describe("a process says what it is for, what it calls, and where it is drawn", () => {
  const processes = () => nodes().filter((n) => n["@type"] === "bootstrap:Process");

  test("every bootstrap process carries its diagram's documentation: the whole as description, the first sentence as summary", () => {
    expect(processes().length).toBe(readdirSync(join(BOOTSTRAP, "processes")).filter((f) => f.endsWith(".bpmn")).length);
    for (const p of processes()) {
      expect(typeof p["description"], p["@id"]).toBe("string");
      expect(p["summary"], p["@id"]).toBe(firstSentence(String(p["description"])));
    }
  });

  test("the processes a process calls are its call activities' calledElement, each a Process node", () => {
    const init = processes().find((p) => p["@id"].endsWith("/process/Process_InitializeHarness"))!;
    expect(init["requires"]).toEqual(
      ["Process_CompleteInitialization", "Process_Discussion", "Process_LogMessage"].map((x) => `${BASE}process/${x}`),
    );
    const calls = nodes().filter((n) => n["type"] === "bpmn:callActivity");
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(String(c["calledElement"])).toContain("/process/");
  });

  test("a process is depicted by the SVG drawn beside its .bpmn", () => {
    for (const p of processes()) expect(p["depiction"]).toBe(String(p["source"]).replace(/\.bpmn$/, ".svg"));
  });

  test("the process's own documentation, never a task's; a call to a process no diagram defines is a problem, and no link is written", () => {
    const root = mkdtempSync(join(tmpdir(), "export-graph-"));
    mkdirSync(join(root, "processes"));
    writeFileSync(join(root, "demo.json"), JSON.stringify({ name: "demo", needs: ["bootstrap"], directories: [{ id: "p", path: "processes/", graphTypologies: ["processes"] }] }));
    writeFileSync(
      join(root, "processes", "a.bpmn"),
      '<bpmn:definitions xmlns:bpmn="x"><bpmn:process id="P_A" name="A"><bpmn:task id="T"><bpmn:documentation>A task, not the process.</bpmn:documentation></bpmn:task><bpmn:documentation>Does A. Then more.</bpmn:documentation><bpmn:callActivity id="C" calledElement="P_Missing"/></bpmn:process></bpmn:definitions>',
    );
    const g = exportGraph(root, { docIri: DOC, bootstrapRoot: BOOTSTRAP });
    const graph = g["@graph"] as Node[];
    const a = graph.find((n) => n["@type"] === "bootstrap:Process")!;
    expect(a["summary"]).toBe("Does A.");
    expect(a["description"]).toBe("Does A. Then more.");
    expect("requires" in a).toBe(false);
    expect("calledElement" in graph.find((n) => n["@id"].endsWith("/node/C"))!).toBe(false);
    expect(g["problems"]).toEqual(["process/P_A: calls process/P_Missing, which no diagram here defines", "process/P_A/node/C: calls process/P_Missing, which no diagram here defines"]);
  });

  test("a global task is a Task that requires its Skill, and a call to it by bare id resolves to it from another file", () => {
    // Owner, 2026-10-20, "a1 b1 c1": one shared .bpmn per layer that holds
    // no process; a call activity names a global task by bare id.
    const root = mkdtempSync(join(tmpdir(), "export-graph-"));
    mkdirSync(join(root, "processes"));
    mkdirSync(join(root, "skills"));
    writeFileSync(
      join(root, "demo.json"),
      JSON.stringify({ name: "demo", needs: ["bootstrap"], directories: [{ id: "p", path: "processes/", graphTypologies: ["processes"] }, { id: "k", path: "skills/", graphTypologies: ["skills"] }] }),
    );
    writeFileSync(join(root, "skills", "seed.md"), "---\nname: seed\ndescription: Seed it.\n---\n# Seed\n");
    writeFileSync(
      join(root, "processes", "global-tasks.bpmn"),
      '<bpmn:definitions xmlns:bpmn="x" xmlns:bootstrap.processes="y"><bpmn:globalUserTask id="GT_Seed" name="Seed the plan"><bpmn:documentation>Seed it.</bpmn:documentation>' +
        '<bpmn:extensionElements><bootstrap.processes:skill ref="seed"/></bpmn:extensionElements></bpmn:globalUserTask><bpmn:globalTask id="GT_Bare"/></bpmn:definitions>',
    );
    for (const p of ["A", "B"]) {
      writeFileSync(
        join(root, "processes", `${p}.bpmn`),
        `<bpmn:definitions xmlns:bpmn="x"><bpmn:process id="P_${p}"><bpmn:callActivity id="C" name="Seed" calledElement="GT_Seed"/><bpmn:callActivity id="D" calledElement="GT_Missing"/></bpmn:process></bpmn:definitions>`,
      );
    }
    const g = exportGraph(root, { docIri: DOC, bootstrapRoot: BOOTSTRAP });
    const graph = g["@graph"] as Node[];
    const gt = graph.find((n) => n["@id"] === `${BASE}globalTask/GT_Seed`)!;
    expect(gt["@type"]).toBe("bootstrap:Task");
    expect(gt["type"]).toBe("bpmn:globalUserTask");
    expect(gt["label"]).toBe("Seed the plan");
    expect(gt["description"]).toBe("Seed it.");
    expect(gt["requires"]).toBe(`${BASE}skill/seed`);
    expect(graph.find((n) => n["@id"] === `${BASE}globalTask/GT_Bare`)!["type"]).toBe("bpmn:globalTask");
    for (const p of ["A", "B"]) {
      expect(graph.find((n) => n["@id"] === `${BASE}process/P_${p}/node/C`)!["calledElement"]).toBe(`${BASE}globalTask/GT_Seed`);
      expect(graph.find((n) => n["@id"] === `${BASE}process/P_${p}`)!["requires"]).toEqual([`${BASE}globalTask/GT_Seed`]);
    }
    // No Process node for the file that holds no process, and a call to
    // neither a process nor a global task is still a problem.
    expect(graph.filter((n) => n["@type"] === "bootstrap:Process").map((n) => n["@id"])).toEqual([`${BASE}process/P_A`, `${BASE}process/P_B`]);
    expect((g["problems"] as string[]).filter((p) => p.includes("GT_Missing")).length).toBe(4);
    expect(GraphExportSchema.safeParse(g).success).toBe(true);
  });

  test("a lane NAMES its Role with partitionElementRef; the retired role ref still binds, with a problem", () => {
    // Owner, 2026-10-16: "Lane names Role, not Actor" — and a lane is not the
    // Role. The name is BPMN's own: partitionElementRef → a bpmn:resource.
    const root = mkdtempSync(join(tmpdir(), "export-graph-"));
    mkdirSync(join(root, "processes"));
    mkdirSync(join(root, "scenarios"));
    writeFileSync(
      join(root, "demo.json"),
      JSON.stringify({ name: "demo", needs: ["bootstrap"], directories: [{ id: "p", path: "processes/", graphTypologies: ["processes"] }, { id: "s", path: "scenarios/", graphTypologies: ["scenarios"] }] }),
    );
    writeFileSync(join(root, "scenarios", "roles.json"), JSON.stringify({ name: "demo", roles: [{ id: "r-new", title: "New" }, { id: "r-old", title: "Old" }] }));
    writeFileSync(
      join(root, "processes", "a.bpmn"),
      '<bpmn:definitions xmlns:bpmn="x" xmlns:bootstrap.processes="y"><bpmn:resource id="r-new" name="New"/><bpmn:process id="P_A"><bpmn:laneSet>' +
        '<bpmn:lane id="L_New" partitionElementRef="r-new"><bpmn:flowNodeRef>T1</bpmn:flowNodeRef></bpmn:lane>' +
        '<bpmn:lane id="L_Old"><bpmn:extensionElements><bootstrap.processes:role ref="r-old"/></bpmn:extensionElements><bpmn:flowNodeRef>T2</bpmn:flowNodeRef></bpmn:lane>' +
        '<bpmn:lane id="L_Dangling" partitionElementRef="r-old"><bpmn:flowNodeRef>T3</bpmn:flowNodeRef></bpmn:lane>' +
        '</bpmn:laneSet><bpmn:task id="T1"/><bpmn:task id="T2"/><bpmn:task id="T3"/></bpmn:process></bpmn:definitions>',
    );
    const g = exportGraph(root, { docIri: DOC, bootstrapRoot: BOOTSTRAP });
    const role = (r: string) => (g["@graph"] as Node[]).find((n) => n["@id"] === `${BASE}role/${r}`)!;
    expect(role("r-new")["flowNodeRef"]).toEqual([`${BASE}process/P_A/node/T1`]);
    expect(role("r-old")["flowNodeRef"]).toEqual([`${BASE}process/P_A/node/T2`, `${BASE}process/P_A/node/T3`]);
    expect(g["problems"]).toEqual([
      'processes/a.bpmn#L_Old: names Role "r-old" with the retired <processes:role ref>; use partitionElementRef',
      'processes/a.bpmn#L_Dangling: partitionElementRef "r-old" names no <bpmn:resource> in this file',
    ]);
  });

  test("a task REQUIRES its Skill (dcterms:requires); the Skill names no task", () => {
    const tasks = nodes().filter((n) => n["@type"] === "bootstrap:ProcessNode" && String(n["requires"] ?? "").includes("/skill/"));
    expect(tasks.length).toBeGreaterThan(0);
    expect(nodes().some((n) => "skill" in n)).toBe(false);
    expect((build()["@context"] as Record<string, unknown>)["requires"]).toEqual({ "@id": "dcterms:requires", "@type": "@id" });
  });

  test("another instance's graph is written in bootstrap's classes, whatever it declares", () => {
    const tools = exportGraph(join(import.meta.dir, ".."), { docIri: DOC });
    const ctx = tools["@context"] as Record<string, unknown>;
    expect(ctx["bootstrap"]).toBe((build()["@context"] as Record<string, unknown>)["bootstrap"]);
    expect(tools["problems"]).toEqual([]);
    expect((tools["@graph"] as Node[]).filter((n) => n["@type"] === "bootstrap:Process").map((n) => n["summary"] !== undefined)).toEqual([true]);
  });

  test("the first sentence", () => {
    expect(firstSentence("One.  Two.")).toBe("One.");
    expect(firstSentence("A file.bpmn is\n read. Then")).toBe("A file.bpmn is read.");
    expect(firstSentence("No stop")).toBe("No stop");
    expect(firstSentence("Ends here.")).toBe("Ends here.");
  });
});

describe("the XML reader is enough for authored BPMN", () => {
  test("elements, attributes, nesting, text and entities", () => {
    const x = parseXml('<?xml version="1.0"?><!-- c --><a:r x="1"><a:c y=\'2\'/><a:t>a &amp; b</a:t></a:r>');
    const r = x.children[0]!;
    expect(r.name).toBe("a:r");
    expect(r.attrs).toEqual({ x: "1" });
    expect(r.children.map((c) => c.name)).toEqual(["a:c", "a:t"]);
    expect(r.children[1]!.text).toBe("a & b");
  });
});
