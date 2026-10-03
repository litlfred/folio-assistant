/**
 * The workflow page's process table — the view logic and the data it reads.
 *
 * Bean `ax6r`: the "Every workflow in the repo" table was hand-written and
 * drifted from the diagrams. It is now drawn by `assets/js/process-index.js`
 * from `assets/processes/index.json`. These pin the parts that are not a
 * browser's to judge: the grouping and link rules (evaluated from the SHIPPED
 * bytes, not a copy), that the committed projection validates and covers
 * every declared diagram, and that a row carries no work-plan chatter.
 *
 * @module scripts/tests/process-index
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { collectProcessIndex, concernGroup, declaredDiagrams, firstSentence, processDocumentation, processHead } from "../lib/process-index.ts";
import { ProcessIndexSchema } from "../../schemas/site-indexes.ts";
import { repoRootFor, siteDirFor } from "../../schemas/cat-harness.ts";

const HARNESS = resolve(import.meta.dir, "../..");
const REPO = repoRootFor(HARNESS);
const SITE = join(HARNESS, siteDirFor(HARNESS));
const VIEWER = readFileSync(join(SITE, "assets", "js", "process-index.js"), "utf-8");

interface Row { id: string; name: string; path: string; group: string; instance: string; svg?: string; source?: string; summary?: string }
type Api = {
  groupRows: (rows: Row[], key: string) => Array<{ label: string; rows: Row[] }>;
  rowLinks: (row: Partial<Row>, siteRoot: string) => { svg: string; source: string };
  GROUP_NONE: string;
};

/** The shipped script, evaluated with no document — so it exposes its pure half and mounts nothing. */
function viewerApi(): Api {
  const win: { faProcessIndex?: Api } = {};
  new Function("window", "document", VIEWER)(win, undefined);
  return win.faProcessIndex!;
}

const row = (over: Partial<Row>): Row => ({ id: "P", name: "n", path: "p.bpmn", group: "", instance: "i", ...over });

describe("grouping", () => {
  const api = viewerApi();
  const rows = [
    row({ id: "B", name: "beta", group: "sdlc", instance: "cat-harness", path: "b" }),
    row({ id: "A", name: "alpha", group: "content", instance: "smart-base", path: "a" }),
    row({ id: "C", name: "gamma", group: "content", instance: "cat-harness", path: "c" }),
    row({ id: "D", name: "delta", group: "", instance: "bootstrap", path: "d" }),
  ];
  test("by concern group: groups in order, the ungrouped remainder last, rows by instance then name", () => {
    const g = api.groupRows(rows, "group");
    expect(g.map((x) => x.label)).toEqual(["content", "sdlc", api.GROUP_NONE]);
    expect(g[0]!.rows.map((r) => r.id)).toEqual(["C", "A"]);
  });
  test("by instance: rows ordered by concern group inside each instance", () => {
    const g = api.groupRows(rows, "instance");
    expect(g.map((x) => x.label)).toEqual(["bootstrap", "cat-harness", "smart-base"]);
    expect(g[1]!.rows.map((r) => r.id)).toEqual(["C", "B"]);
  });
  test("every row lands in exactly one group", () => {
    for (const key of ["group", "instance"]) {
      expect(api.groupRows(rows, key).flatMap((x) => x.rows).length).toBe(rows.length);
    }
  });
  test("an empty or absent list is no groups, not an error", () => {
    expect(api.groupRows([], "group")).toEqual([]);
    expect(api.groupRows(undefined as unknown as Row[], "group")).toEqual([]);
  });
});

describe("links", () => {
  const api = viewerApi();
  test("an SVG is a site-root path composed against the site root", () => {
    expect(api.rowLinks({ svg: "/assets/img/workflows/x.svg" }, "/folio-assistant/").svg).toBe("/folio-assistant/assets/img/workflows/x.svg");
    expect(api.rowLinks({ svg: "/assets/img/workflows/x.svg" }, "/folio-assistant").svg).toBe("/folio-assistant/assets/img/workflows/x.svg");
  });
  test("a protocol-relative or scripted URL is dropped rather than linked", () => {
    expect(api.rowLinks({ svg: "//evil.example/x.svg" }, "/").svg).toBe("");
    expect(api.rowLinks({ source: "javascript:alert(1)" }, "/").source).toBe("");
    expect(api.rowLinks({ source: "https://github.com/x/y/blob/main/a.bpmn" }, "/").source).toBe("https://github.com/x/y/blob/main/a.bpmn");
  });
});

describe("extraction", () => {
  test("the process's own documentation, never a lane's", () => {
    const own = `<bpmn:process id="P" name="N &amp; M"><bpmn:documentation>Own. More.</bpmn:documentation><bpmn:laneSet/></bpmn:process>`;
    const lane = `<bpmn:process id="P"><bpmn:laneSet><bpmn:lane id="L"><bpmn:documentation>Lane.</bpmn:documentation></bpmn:lane></bpmn:laneSet></bpmn:process>`;
    expect(processDocumentation(own)).toBe("Own. More.");
    expect(processDocumentation(lane)).toBeUndefined();
    expect(processHead(own)).toEqual({ id: "P", name: "N & M" });
    expect(firstSentence("Own. More.")).toBe("Own.");
  });
  test("the concern group is the path between processes/ and the file", () => {
    expect(concernGroup("cat-harness/processes/sdlc/merge-base.bpmn")).toBe("sdlc");
    expect(concernGroup("bootstrap/processes/log-message.bpmn")).toBe("");
    expect(concernGroup("smart-base/methodologies/processes/diig-investment-path.bpmn")).toBe("");
  });
});

describe("the committed projection", () => {
  const committed = JSON.parse(readFileSync(join(SITE, "assets", "processes", "index.json"), "utf-8"));
  test("validates against its $schema family", () => {
    expect(ProcessIndexSchema.safeParse(committed).success).toBe(true);
  });
  test("is what the generator writes now", () => {
    expect(committed).toEqual(collectProcessIndex(REPO, HARNESS));
  });
  test("has a row for every declared diagram, and none for anything else", () => {
    expect(committed.processes.map((p: Row) => p.path).sort()).toEqual(declaredDiagrams(REPO));
  });
  test("every row has documentation, and no row carries work-plan or issue chatter", () => {
    // The page's rule, enforced where it can drift: a row is what the diagram
    // IS, not who asked for it or where the work got to.
    const chatter = /#\d{2,}|\b[Bb]eans? `[a-z0-9]{4}`|\b[Bb]ean [a-z0-9]{4}[,.;:)]|\b[Oo]wner,? 20\d\d|\b20\d\d-\d\d-\d\d\b/;
    for (const p of committed.processes as Row[]) {
      expect({ path: p.path, summary: typeof p.summary }).toEqual({ path: p.path, summary: "string" });
      expect({ path: p.path, chatter: chatter.test(p.summary!) }).toEqual({ path: p.path, chatter: false });
    }
  });
});
