import { describe, expect, test } from "bun:test";

import { checkSuggestion, judge, questionnaireItems, structureWarnings, wireframeLayouts } from "./check-wireframe-questionnaire.ts";

// A synthetic IG: this layer names no real one.
const SD = "http://example.org/ig/StructureDefinition/RegisterClient";
const q = (...items: object[]) => ({ resourceType: "Questionnaire", item: items });
const byDef = (linkId: string, el: string) => ({ linkId, type: "string", definition: `${SD}#${el}` });
const byCode = (linkId: string, code: string) => ({ linkId, type: "choice", code: [{ system: "x", code }] });

describe("the wireframe's fields are read in order, per layout", () => {
  test("one layout when no data-layout is given; comments and scripts are ignored", () => {
    const html = `<form><!-- <input data-element="X"> --><label>Name <input data-element="a"></label>
      <script>const s = '<input data-element="Y">'</script><select data-element="b"></select></form>`;
    expect(wireframeLayouts(html)).toEqual([{ name: "(whole document)", fields: ["a", "b"] }]);
  });
  test("separate web and mobile subtrees are separate layouts; a shared header goes to both", () => {
    const html = `<header><input data-element="h"></header>
      <div data-layout="web"><div><input data-element="a"><input data-element="b"></div></div>
      <div data-layout="mobile"><input data-element="b"><br><input data-element="a"></div>`;
    expect(wireframeLayouts(html)).toEqual([
      { name: "web", fields: ["h", "a", "b"] },
      { name: "mobile", fields: ["h", "b", "a"] },
    ]);
  });
});

describe("Questionnaire items name their data element by definition or code", () => {
  test("groups and displays are skipped, nested items are read depth first", () => {
    const items = questionnaireItems(
      q({ linkId: "g", type: "group", item: [byDef("1", "name"), { linkId: "d", type: "display" }] }, byCode("2", "DE7")),
    );
    expect(items).toEqual([
      { linkId: "1", ids: [`${SD}#name`, "name"] },
      { linkId: "2", ids: ["DE7"] },
    ]);
  });
});

describe("fidelity findings", () => {
  const html = `<input data-element="name"><input data-element="DE7">`;
  test("a faithful Questionnaire has no finding", () => {
    expect(judge(html, q(byDef("1", "name"), byCode("2", "DE7")))).toEqual([]);
  });
  test("a field with no item, and an item with no field", () => {
    const f = judge(html, q(byDef("1", "name"), byCode("3", "DE9"))).join("\n");
    expect(f).toContain('field "DE7" has no Questionnaire item');
    expect(f).toContain('item "3" (DE9) has no field');
  });
  test("an item that names no data element", () => {
    expect(judge(`<input data-element="name">`, q(byDef("1", "name"), { linkId: "x", type: "string" })).join()).toContain(
      'item "x" names no data element',
    );
  });
  test("a different order is reported once, at the first divergence", () => {
    const f = judge(html, q(byCode("2", "DE7"), byDef("1", "name")));
    expect(f).toHaveLength(1);
    expect(f[0]).toContain('order differs: field "DE7" follows "name"');
  });
  test("a data element twice in one layout", () => {
    expect(judge(`<input data-element="name"><input data-element="name">`, q(byDef("1", "name"))).join()).toContain(
      'data element "name" appears twice',
    );
  });
  test("each layout is judged on its own", () => {
    const two = `<div data-layout="web"><input data-element="name"><input data-element="DE7"></div>
      <div data-layout="mobile"><input data-element="DE7"><input data-element="name"></div>`;
    const f = judge(two, q(byDef("1", "name"), byCode("2", "DE7")));
    expect(f).toHaveLength(1);
    expect(f[0]).toStartWith("[mobile] order differs");
  });
});

describe("structure warnings", () => {
  test("a linkId used twice, and an enableWhen naming no item", () => {
    const w = structureWarnings(
      q({ linkId: "1", type: "string" }, { linkId: "1", type: "string" }, { linkId: "2", type: "string", enableWhen: [{ question: "9" }] }),
    );
    expect(w).toEqual(['linkId "1" is used by more than one item', 'item "2" has enableWhen on "9", which is no item\'s linkId']);
  });
  test("a nested enableWhen target is found", () => {
    expect(structureWarnings(q({ linkId: "g", type: "group", item: [{ linkId: "a", type: "boolean" }] }, { linkId: "b", type: "string", enableWhen: [{ question: "a" }] }))).toEqual([]);
  });
});

describe("checkSuggestion: the editor-checker shape", () => {
  const text = (...items: object[]) => JSON.stringify(q(...items));
  const before = text(byDef("1", "name"), byCode("2", "DE7"));
  test("errors are syntax only: not JSON, not a Questionnaire", () => {
    expect(checkSuggestion(before, "{").errors[0]).toStartWith("not JSON");
    expect(checkSuggestion(before, '{"resourceType":"Patient"}').errors).toEqual(["not a Questionnaire (resourceType Patient)"]);
  });
  test("only what the edit introduces is reported", () => {
    const dup = text(byDef("1", "name"), byDef("1", "name"));
    expect(checkSuggestion(dup, dup).warnings).toEqual([]);
    expect(checkSuggestion(before, dup).warnings).toEqual(['linkId "1" is used by more than one item']);
  });
  test("a wireframe in the context adds fidelity warnings; they never become errors", () => {
    const wireframe = `<input data-element="name"><input data-element="DE7">`;
    const r = checkSuggestion(before, text(byDef("1", "name")), { wireframe });
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual(['[(whole document)] field "DE7" has no Questionnaire item']);
  });
  test("an unreadable original still checks the suggestion", () => {
    expect(checkSuggestion("", text({ linkId: "x", type: "string", enableWhen: [{ question: "y" }] })).warnings).toHaveLength(1);
  });
});
