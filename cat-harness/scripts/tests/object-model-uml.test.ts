/**
 * The harness schemas UML draws every arrow from the dependent to the general
 * node, and every class reaches its glossary definition (#1168, plan C).
 */
import { describe, expect, test } from "bun:test";

import { assertTerms, glossaryLinksMd, schemasViewPuml } from "../gen-object-model-uml.js";

const puml = schemasViewPuml("test");
const edges = puml.split("\n").filter((l) => /^\w+ (-->|\.\.>|\.\.\|>)/.test(l));
const classes = puml.split("\n").filter((l) => /^\s+class "/.test(l));

describe("arrows run from the dependent to the general node", () => {
  test("a Task realises the Skill it implements", () => {
    expect(edges.some((l) => /^Task \.\.\|> "1" Skill : implements/.test(l))).toBe(true);
  });

  test("a Voice and a User Story point at their Role, and the Role names neither", () => {
    expect(edges.some((l) => l.startsWith("Voice --> ") && l.includes(" Role : written for"))).toBe(true);
    expect(edges.some((l) => l.startsWith("UserStory --> ") && l.includes(" Role : as a"))).toBe(true);
    expect(edges.filter((l) => l.startsWith("Role ") && /(Voice|UserStory)\b/.test(l))).toEqual([]);
  });

  test("a Skill points at its input and output schemas, and a Test Run at the ones its cases meet", () => {
    expect(edges.filter((l) => l.startsWith("Skill ..> ") && l.includes("JsonSchema")).length).toBe(2);
    expect(edges.some((l) => l.startsWith("TestRun --> ") && l.includes("JsonSchema"))).toBe(true);
  });
});

describe("every class links to its glossary definition", () => {
  test("in the PlantUML", () => {
    expect(classes.length).toBeGreaterThan(0);
    expect(classes.filter((l) => !/\[\[\.\.\/\.\.\/\.\.\/glossary\/#[\w-]+\]\]/.test(l))).toEqual([]);
  });

  test("and on the page, since the SVG is shown as an image", () => {
    const md = glossaryLinksMd();
    expect(md.match(/\]\(/g)?.length).toBe(classes.length);
  });

  test("a class whose term the page lacks is reported, and no page is could-not-determine", () => {
    const c = [{ id: "Task", term: "bootstrap--terms--task" }];
    expect(assertTerms(c, new Set(["bootstrap--terms--task"]))).toEqual([]);
    expect(assertTerms(c, new Set())).toEqual(["Task: no glossary entry bootstrap--terms--task"]);
    expect(assertTerms(c, null)[0]).toMatch(/^could not determine/);
  });
});
