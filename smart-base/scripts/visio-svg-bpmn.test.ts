import { describe, expect, test } from "bun:test";
import { BpmnModdle } from "bpmn-moddle";

import type { SwimlaneMap } from "./dak-swimlanes";
import { objectivesFrom, parseTransform, pascal, pathPoints, readFigure, toBpmn } from "./visio-svg-bpmn";

const map: SwimlaneMap = {
  $schema: "dak-swimlanes/v1",
  annexOf: "10665/380303",
  label: "Web Annex B",
  section: "dak#generic-business-processes-and-workflows",
  personas: { "Health worker (HW)": ["Health worker", "HW"], Client: [] },
  notPersonas: { "Vaccination location": "a pool", PCPOSS: "a system, not a persona" },
};

// A Visio export in miniature: the page group, a cross-functional container,
// two lanes, and BPMN-stencil shapes placed with `translate`, as Visio writes them.
const cp = (k: string, v: string) => `<v:cp v:nameU="${k}" v:val="VT4(${v})" />`;
const shape = (title: string, x: number, y: number, body: string, props = "", label = "") =>
  `<g transform="translate(${x},${y})" v:mID="${Math.round(x * 1000 + y)}" v:groupContext="group"><title>${title}</title>` +
  (props ? `<v:custProps>${props}</v:custProps>` : "") + body + (label ? `<text>${label}</text>` : "") + `</g>`;
const task = (title: string, x: number, y: number, label: string, props = "", w = 60, h = 40) => shape(title, x, y, `<rect x="0" y="0" width="${w}" height="${h}" />`, props, label);
const circle = (title: string, x: number, y: number, label = "", props = "") => shape(title, x, y, `<circle cx="10" cy="10" r="10" />`, props, label);
const diamond = (x: number, y: number, label: string) => shape("Gateway.143", x, y, `<path d="M 0,20 20,0 40,20 20,40 Z" />`, "", label);
const conn = (x: number, y: number, d: string, label = "") =>
  `<g transform="translate(${x},${y})" v:mID="${9000 + x + y}" v:groupContext="shape" v:layerMember="1"><title>Dynamic connector.${x}</title><path d="${d}" />${label ? `<text>${label}</text>` : ""}</g>`;

const figure = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:v="http://schemas.microsoft.com/visio/2003/SVGExtensions/">
<g v:groupContext="foregroundPage"><title>Page</title>
  <g v:mID="4" v:groupContext="group"><title>CFF Container</title><g v:groupContext="shape"><title>Sheet.6</title><text>C. Client registration</text></g></g>
  <g v:mID="12" v:groupContext="group"><title>Swimlane.12</title><rect x="0" y="0" width="1000" height="100" /><g transform="rotate(-90,10,50)"><text>Client</text></g></g>
  <g v:mID="13" v:groupContext="group"><title>Swimlane.1024</title><rect x="0" y="100" width="1000" height="300" /><text>Vaccination location<tspan dy="1.2em">Health worker</tspan></text></g>
  ${circle("Start Event", 40, 40, "Start")}
  ${task("Task.1000", 100, 30, "1. Arrive")}
  ${task("Task.1329", 90, 120, "2. Query client record", "", 160, 80)}
  ${task("Task.1027", 100, 150, "2.1. Gather details")}
  ${diamond(200, 150, "2.2. Match found?")}
  ${task("Task.758", 400, 120, "5. Validate client details", "", 170, 80)}
  ${circle("Start Event.1206", 420, 160)}
  ${task("Task.1012.1146", 450, 150, "5.1. Review data", cp("BpmnTaskType", "Business Rule") + cp("BpmnLoopType", "Standard"))}
  ${circle("Intermediate Event.1191", 530, 160)}
  ${circle("Intermediate Event.1268", 700, 160, "D. Administer vaccine", cp("BpmnTriggerOrResult", "Link"))}
  ${conn(60, 50, "M 0,0 H 40")}
  ${conn(130, 70, "M 0,0 V 80")}
  ${conn(160, 170, "M 0,0 H 40")}
  ${conn(240, 170, "M 0,0 h 160", "Yes")}
  ${conn(440, 170, "M 0,0 H 10")}
  ${conn(510, 170, "M 0,0 H 20")}
  ${conn(570, 170, "M 0,0 H 130")}
  ${conn(220, 190, "M 0,0 v 100", "No")}
</g></svg>`;

describe("visio-svg-bpmn geometry", () => {
  test("transforms compose, rotation included", () => {
    const m = parseTransform("translate(10,20) rotate(90,0,0)");
    expect(m.map((n) => Math.round(n))).toEqual([0, 1, -1, 0, 10, 20]);
  });
  test("path points follow relative and absolute commands", () => {
    expect(pathPoints("m 0,595.28 v 21.26 h 180.71 v -29.92").map(([x, y]) => [Math.round(x), Math.round(y)])).toEqual([[0, 595], [0, 617], [181, 617], [181, 587]]);
    expect(pathPoints("M 0,20 20,0 40,20 Z")).toEqual([[0, 20], [20, 0], [40, 20], [0, 20]]);
  });
  test("a persona becomes a computable name", () => {
    expect(pascal("Health worker (HW)")).toBe("HealthWorker");
    expect(pascal("EPI Manager")).toBe("EPIManager");
  });
});

describe("visio-svg-bpmn reading a figure", () => {
  const fig = readFigure(figure);
  const byLabel = (l: string) => fig.nodes.find((n) => n.label === l);

  test("title, lanes and node kinds come from the Visio masters and the BPMN stencil's properties", () => {
    expect(fig.title).toBe("C. Client registration");
    expect(fig.lanes.map((l) => l.label)).toEqual(["Client", "Vaccination location Health worker"]);
    expect(byLabel("2.2. Match found?")?.kind).toBe("exclusiveGateway");
    // `Task.1012.1146`: a copied master's second suffix is still a Task.
    expect(byLabel("5.1. Review data")).toMatchObject({ kind: "businessRuleTask", loop: true });
    expect(byLabel("D. Administer vaccine")).toMatchObject({ kind: "intermediateThrowEvent", link: true });
  });

  test("a box the flows cross is a group; a box they only meet is an expanded sub-process", () => {
    expect(fig.groups.map((g) => g.label)).toEqual(["2. Query client record"]);
    expect(byLabel("2. Query client record")).toBeUndefined();
    expect(byLabel("5. Validate client details")).toMatchObject({ kind: "subProcess", expanded: true });
    expect(byLabel("5.1. Review data")?.parent).toBe(byLabel("5. Validate client details")?.vid);
  });

  test("each connector end belongs to the smallest node it touches", () => {
    const edge = (from: string, to: string) => fig.flows.find((f) => f.from === byLabel(from)?.vid && f.to === byLabel(to)?.vid);
    expect(edge("1. Arrive", "2.1. Gather details")).toBeDefined();
    expect(edge("2.2. Match found?", "5. Validate client details")?.label).toBe("Yes");
    // The `No` connector ends in empty space.
    expect(fig.flows.find((f) => f.label === "No")?.to).toBeUndefined();
  });
});

describe("visio-svg-bpmn writing BPMN", () => {
  const { xml, problems } = toBpmn(readFigure(figure), "IMMZ", "C", map, "Create and/or update the client's record");

  test("each process carries the objective its page states", () => {
    const page = ["####  B.  Plan  ", "Objective: Ensure supply", '<img src="b.svg" />', "####  C.  Register", '<img src="images/c.svg" />', "Objective: Create the record"].join("\n");
    expect([...objectivesFrom(page)]).toEqual([["b.svg", "Ensure supply"], ["c.svg", "Create the record"]]);
    expect(xml).toMatch(/<bpmn:process [^>]*>\s*<bpmn:documentation>Create and\/or update the client's record<\/bpmn:documentation>/);
  });

  test("an undocumented process or lane is reported", () => {
    const bare = toBpmn(readFigure(figure), "IMMZ", "C").problems;
    expect(bare).toContainEqual(expect.stringContaining("has no objective"));
    expect(bare).toContainEqual(expect.stringContaining("IMMZ.Lane.Client (Client) has no documentation"));
  });

  test("an end that touches nothing is reported, never guessed", () => {
    expect(problems).toEqual([expect.stringContaining("(No): its end touches no node")]);
  });

  test("the BPMN imports cleanly and keeps lanes, nesting, groups and links", async () => {
    const { rootElement, warnings } = await new BpmnModdle().fromXML(xml);
    expect(warnings).toEqual([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proc = rootElement.rootElements.find((e: any) => e.$type === "bpmn:Process");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lanes = proc.laneSets[0].lanes.map((l: any) => [l.id, l.documentation?.[0]?.text]);
    expect(lanes).toEqual([
      ["IMMZ.Lane.Client", "Personas: Client (IMMZ.Persona.Client)"],
      ["IMMZ.Lane.HealthWorker", "Personas: Health worker (HW) (IMMZ.Persona.HealthWorker)"],
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sub = proc.flowElements.find((e: any) => e.id === "IMMZ.C.5");
    expect(sub.$type).toBe("bpmn:SubProcess");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sub.flowElements.map((e: any) => e.$type)).toContain("bpmn:BusinessRuleTask");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(proc.artifacts.map((a: any) => a.$type)).toEqual(["bpmn:Group"]);
    expect(xml).toContain(`<bpmn:linkEventDefinition id="IMMZ.C.Event_2.Link" name="D. Administer vaccine" />`);
    // A sub-process's children answer to a lane too.
    expect(xml).toContain("<bpmn:flowNodeRef>IMMZ.C.5.1</bpmn:flowNodeRef>");
    // Every flow joins two different nodes.
    expect([...xml.matchAll(/sourceRef="([^"]+)" targetRef="([^"]+)"/g)].filter((m) => m[1] === m[2])).toEqual([]);
  });
});
