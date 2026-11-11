/**
 * The journeys viewer over a fixture checkout of two layers: `lower`, a
 * layer holding journeys of its own, and `top`, which needs it, holds a
 * journey group, a workshop, and declares the visualiser.
 *
 * What is asserted is what the owner asked the viewer to show (2026-11-05):
 * every journey in the checkout, each journey alone, journeys in sub-graphs
 * (per layer, and by `partOf` within one), and the didactic layer on top.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix } from "node:path";

import { readJourneyCorpus, unescapeXml } from "../journeys/read.ts";
import { bpmnFigure, orderByFollows, panelHead, renderJourneyPages, stepAnchor, type PageFile, type SiteLinks } from "../journeys/render.ts";
import { PANEL_CSS, PANEL_SCRIPT } from "../lib/task-panel.ts";
import { BARE_VHL, checkDakLinks, DAK_ATTR, pascal, personaArtifact } from "../journeys/dak-links.ts";
import { journeyFiles, journeysRoute } from "../gen-journeys-viz.ts";
import {
  chapterRoots,
  countryTones,
  countWord,
  fillPattern,
  fromSite,
  highlightJson,
  kramdownSlug,
  personaText,
  presentationOf,
  rangeLabel,
  rungOf,
  screenHref,
  screensFor,
  shortTitle,
  castOrder,
  mentioned,
  mentionedChips,
  siteRootFrom,
  viewBoxWidth,
} from "../journeys/present.ts";
import { blockUsage, feelingPoints, stepByRef } from "../journeys/present-views.ts";
import { NAVBAR_LINKED } from "../lib/harness-rail.ts";
import { NAVBAR_OPT_OUT } from "../viewer-page.ts";
import { clearDeclaredVisualisers, renderedByOf } from "../viewer-declarations.ts";

const REPO = mkdtempSync(join(tmpdir(), "journeys-viz-"));
afterAll(() => rmSync(REPO, { recursive: true, force: true }));

const put = (rel: string, body: string | object): void => {
  mkdirSync(join(REPO, dirname(rel)), { recursive: true });
  writeFileSync(join(REPO, rel), typeof body === "string" ? body : JSON.stringify(body, null, 2));
};

const step = (id: string, lead: string, extra: object = {}) => ({
  id,
  title: `Step ${id}`,
  lead,
  experiences: [{ actor: lead, doing: `does ${id}`, feeling: "“fine”", emotion: 1 }],
  ...extra,
});

// ── lower: a layer with two chained journeys, actors, stories, a catalogue, a BPMN drawing, a requirement ──
put("lower/lower.json", {
  name: "lower",
  title: "Lower layer",
  repository: "example/lower",
  directories: [
    { id: "scenarios", path: "scenarios/", graphTypologies: ["scenarios"] },
    { id: "user-scenarios", path: "scenarios/user-scenarios/", graphTypologies: ["user-scenario"] },
    { id: "processes", path: "processes/", graphTypologies: ["processes"] },
    { id: "skills", path: "skills/", graphTypologies: ["skills"] },
    { id: "code-lists", path: "code-lists/", graphTypologies: ["code-list"] },
    // The catalogue beside the ArchiMate model, in a directory declared inside it.
    { id: "archimate", path: "archimate/", graphTypologies: ["archimate"] },
    { id: "building-blocks", path: "archimate/building-blocks/", graphTypologies: ["building-blocks"] },
    { id: "fhir-artifact-index", path: "fhir-artifact-index/", graphTypologies: ["fhir-artifact-index"] },
  ],
});
put("lower/scenarios/actors/ana.json", { id: "ana", title: "Ana (pilgrim)", kind: "person", roles: ["traveller", "pilgrim"], meta: { persona: { name: "Ana", role: "Pilgrim", color: "#123456", needs: ["Her summary abroad"], frustrations: ["Paper gets lost"] } } });
put("lower/scenarios/actors/cleo.json", { id: "cleo", title: "Cleo (baby)", kind: "person", meta: { persona: { name: "Cleo", role: "Baby", icon: "baby" } } });
put("lower/scenarios/actors/ben.json", { id: "ben", title: "Ben (nurse)", kind: "person" });
put("lower/scenarios/stories.json", { name: "lower", stories: [{ id: "pilgrim-1", role: { role: "pilgrim" }, want: "Show my summary abroad", soThat: "I am treated safely" }] });
// A catalogue in a journeys directory is NOT read: the kind is declared, not the folder.
put("lower/scenarios/user-scenarios/stray-blocks.json", {
  $schema: "building-blocks/0.1.0",
  layers: [{ id: "apps", label: "Tools & apps" }],
  blocks: [{ id: "stray", name: "Stray", kind: "tool", layer: "apps", jurisdiction: "International", what: "Not declared." }],
});
put("lower/archimate/building-blocks/blocks.json", {
  $schema: "building-blocks/0.1.0",
  layers: [{ id: "apps", label: "Tools & apps" }],
  blocks: [{ id: "wallet", name: "Health wallet", kind: "tool", layer: "apps", jurisdiction: "International", what: "Holds the summary.", soWhat: "She carries it.", links: [{ label: "Spec", url: "https://example.org/wallet" }] }],
  ideas: [{ id: "carry", title: "Carry it yourself", text: "The record travels with the person.", blocks: ["wallet"] }],
});
// An artifact index with a local copy of one example, as fhir-harness builds it at publish.
put("lower/fhir-artifact-index/index.json", {
  artifacts: [
    { key: "Bundle/ana-ips", title: "Ana's IPS", profiles: ["http://example.org/StructureDefinition/ips-bundle"], materialization: { localPath: "output-ast/Bundle-ana-ips.json" } },
    // The role Ana plays, as the IG defines it: her name links here.
    { key: "ActorDefinition/Demo.Role.Pilgrim", title: "Pilgrim" },
    // The DAK assets step P2 uses: a data set, a decision table, an indicator.
    { key: "StructureDefinition/DdTreatment", title: "DD.P2 Treatment abroad", description: "What the clinic records." },
    { key: "PlanDefinition/DT01", title: "DT.01 Is the summary genuine?" },
    { key: "Measure/IND02", title: "IND.02 Summaries read abroad" },
  ],
});
put("lower/output-ast/Bundle-ana-ips.json", { resourceType: "Bundle", id: "ana-ips", type: "document", total: 1, entry: null });
put("lower/code-lists/trust.json", {
  $schema: "folio-code-list/v1",
  id: "trust",
  title: "Trust",
  description: "How far the record can be trusted.",
  source: { note: "fixture" },
  codes: [
    { code: "paper", label: "On paper", definition: "d" },
    { code: "shared", label: "Shared", definition: "d" },
  ],
});
put("lower/scenarios/user-scenarios/p2.json", {
  $schema: "user-scenario/0.3.0",
  id: "p2-treated",
  title: "P2 — Treated",
  description: "Ana is treated.",
  personas: ["ana", "ben", "cleo"],
  follows: "p1-checked",
  views: [{ model: "ra", view: "v-p2", label: "P2 on the RA" }],
  trustLadder: "trust",
  scene: [{ icon: "hospital", label: "A clinic" }, { icon: "qr", label: "A QR" }],
  references: [{ label: "User scenario in the IG", href: "journeys.html#p2", rel: "scenario" }],
  steps: [
    step("P2", "ben", {
      experiences: [
        { actor: "ben", doing: "reads the summary", emotion: 2 },
        { actor: "ana", doing: "waits", feeling: "“worried”", emotion: -1 },
        { actor: "cleo", doing: "sleeps" },
      ],
      record: { state: "shared", description: "read abroad", heldWhere: "home" },
      stories: ["pilgrim-1", "ghost-story"],
      realisedBy: [{ process: "processes/care.bpmn", tasks: ["Task_Read"] }],
      requirements: ["LOW-REQ-001", "LOW-REQ-404"],
      examples: ["Bundle/ana-ips"],
      // Out of order, one with no rel (its type says decision logic), one the index does not list.
      dak: [{ key: "Measure/IND02", rel: "measures" }, { key: "StructureDefinition/DdTreatment", rel: "data" }, { key: "PlanDefinition/DT01" }, { key: "Measure/IND99", rel: "measures" }],
      uses: [
        { block: "wallet", role: "shows the QR" },
        { block: "nowhere", role: "unknown block" },
      ],
      gaps: ["No transaction for this yet."],
      references: [
        { label: "The walkthrough", href: "vaxlink/", rel: "illustrates" },
        { label: "The spec", href: "https://example.org/spec" },
        { label: "This step", href: "#p2" },
      ],
      handoff: { summary: "The summary goes home", from: "Clinic EMR", to: "ana", offline: false },
      fhirChanges: [{ resource: "Bundle", change: "Read, not stored", why: "It is hers.", profile: "ips-bundle", profileOf: "Intl", examples: ["Bundle/ana-ips"] }],
      illustration: { src: "docs/images/p2.png", alt: "Ben reads the summary on a tablet." },
    }),
  ],
});
put("lower/scenarios/user-scenarios/p1.json", {
  $schema: "user-scenario/0.1.0",
  id: "p1-checked",
  title: "P1 — Checked",
  description: "Ana's health check.",
  personas: ["ana"],
  steps: [step("P1", "ana")],
});
put("lower/processes/care.bpmn", '<definitions><bpmn:process id="P" name="Read the patient&#x27;s summary"><bpmn:task id="Task_Read" name="Read the summary"/><bpmn:task id="Task_Other" name="Other"/></bpmn:process></definitions>');
put("lower/docs/images/p2.png", "\x89PNG fixture");
put(
  "lower/processes/care.svg",
  '<?xml version="1.0"?><!DOCTYPE svg><!-- generated --><svg xmlns="http://www.w3.org/2000/svg"><g class="djs-element djs-shape" data-element-id="Task_Read"><g class="djs-visual"><rect/><text class="djs-label"><tspan>Read the summary</tspan></text></g></g><g class="djs-element djs-shape" data-element-id="Task_Other"><g class="djs-visual"><rect/><text class="djs-label"><tspan>Other</tspan></text></g></g></svg>',
);
put("lower/skills/requirements/low-req-001.json", { id: "req:low-req-001", title: "Read the summary", statements: [{ requirement: "The reader SHALL show the summary." }] });

// ── top: a journey group, a sub-journey, a workshop, and the visualiser ──
put("top/top.json", {
  name: "top",
  title: "Top demonstrator",
  needs: ["lower"],
  directories: [
    { id: "user-scenarios", path: "journeys/", graphTypologies: ["user-scenario"] },
    { id: "workshops", path: "workshops/", graphTypologies: ["workshop"] },
  ],
  visualisers: [{ id: "journeys", renderedBy: "journeys-viewer", coversKinds: ["user-scenario", "workshop"], subgraphs: "instance" }],
});
put("top/journeys/group.json", { $schema: "user-scenario/0.2.0", id: "t-group", title: "T — The whole trip", description: "Groups the trip.", personas: ["ana"], steps: [] });
put("top/journeys/t2.json", { $schema: "user-scenario/0.2.0", id: "t2-home", title: "T2 — Home", description: "Back home.", personas: ["ana"], partOf: "t-group", follows: "t1-away", steps: [step("T2", "ana")] });
// The pilgrimage's P3 brief, with a fictional cast (image prompts, owner via the parallel session, 2026-11-05).
put("top/journeys/t1.json", {
  $schema: "user-scenario/0.2.0",
  id: "t1-away",
  title: "T1 — Away",
  description: "Away.",
  personas: ["ana"],
  partOf: "t-group",
  illustrationStyle: {
    prompt: "Warm, flat digital illustration with soft shading and clean outlines. Wide banner, 11:4. No readable text, no logos. All people are fictional.",
    cast: [{ actor: "ana", description: "Pilgrim, 61, slim, short grey hair, white ihram." }],
    notes: ["Keep medical signs text-free."],
  },
  steps: [
    step("T1", "ana", {
      title: "Taken ill in Mina",
      illustration: {
        alt: "Ana, dizzy in the midday heat, is helped toward a health facility.",
        prompt: "The white tent city of Mina at midday; Ana, in white ihram, looks dizzy and is helped toward a plain white health facility with no text on its sign.",
      },
    }),
  ],
});
put("top/journeys/broken.json", { $schema: "user-scenario/0.2.0", id: "broken", title: "Broken", description: "d", personas: ["ana"], steps: [step("B1", "zed")] });
put("top/workshops/policy.json", {
  $schema: "workshop/0.1.0",
  id: "policy",
  title: "Policy track",
  description: "Taught from the pilgrim's journey.",
  scenarios: ["p1-checked", "p2-treated"],
  modules: [
    { id: "M1", title: "Capabilities", carries: "What had to exist?", sheet: "s1", objectives: ["Name the capabilities"] },
    { id: "M2", title: "Rights", tables: ["rights"] },
  ],
  tables: [{ id: "rights", title: "Decision rights", rows: [{ id: "anchor", label: "Trust anchor", question: "Who signs?" }] }],
  steps: [
    {
      scenario: "p2-treated",
      step: "P2",
      askTheRoom: "Should the family be told?",
      questions: [{ module: "M1", text: "What must be true for Ben to trust it?" }, { module: "M2", text: "Who decides?" }],
      capabilities: [{ id: "viewer", label: "A viewer" }],
      tags: [{ table: "rights", row: "anchor", why: "a signature crosses" }],
    },
    { scenario: "p1-checked", step: "P1", questions: [{ module: "M1", text: "Where does it break?" }] },
  ],
  assessment: { scales: [{ id: "status", label: "Where we stand", options: [{ id: "yes", label: "Exists" }, { id: "no", label: "Absent" }] }] },
  sheets: [{ id: "s1", label: "Sheet 1", title: "Our journey", modules: ["M1"], assessmentStrip: true }],
  resources: [{ id: "card", title: "Facilitator card", kind: "job-aid", body: "1. Ask.", steps: ["p2-treated#P2"], modules: ["M1"] }],
  presentation: {
    ig: { href: "", processes: "business-processes.html" },
    closingQuestion: "What must countries agree on?",
    notes: { map: "Read across, then down." },
    deviceDemo: { href: "app/", screens: [{ id: "S2", title: "The nurse's tablet", device: "tablet", steps: ["P2"], try: "Flip the toggle" }] },
    name: "PilgrimLink",
    badge: "Interactive Spec",
    occasion: "Fixture vignette",
    scope: "here ⇄ there",
    story: "Ana is checked at home and treated abroad.",
    recordOf: "ana",
    presenterNote: "Lead with people.",
    about: { title: "This walkthrough is the demo of an IG" },
    links: [
      { label: "The IG", href: "https://example.org/ig/", frame: "FHIR IG" },
      { label: "Journeys", href: "https://example.org/ig/journeys.html" },
    ],
  },
});
clearDeclaredVisualisers();

const TOP = join(REPO, "top");
const corpus = readJourneyCorpus(TOP);
/**
 * Where the site puts a step's page and an ArchiMate view, as the generator
 * would say (`siteLinks`): site-relative, so a link must climb from the
 * page's own depth to reach them.
 */
const LINKS: SiteLinks = {
  route: "en/top/journeys",
  title: "Top demonstrator",
  stepPage: (instance, bpmn, process, task) => `kg/${instance}/${bpmn.replace(/\.bpmn$/, "")}/${process}/node/${task}/`,
  archimateView: (instance, model, view) => ({ svg: `archimate/${model}/views/${view}.svg`, page: `en/${instance}/archimate/${model}/views/${view}/`, name: "P2 view" }),
  processPanel: (_instance, bpmn) => `en/kg/processes/${posix.basename(bpmn, ".bpmn")}.tasks.json`,
};
const files = renderJourneyPages(corpus, LINKS, "top");
const at = (path: string): string => {
  const f = files.find((x: PageFile) => x.path === path);
  if (!f) throw new Error(`no page ${path}; have ${files.map((x) => x.path).join(", ")}`);
  return String(f.content);
};

describe("the reader finds every journey the checkout's declarations hold", () => {
  test("both instances' journeys and workshops, by kind, each parsed", () => {
    expect(corpus.journeys.map((j) => `${j.instance}:${j.scenario.id}`).sort()).toEqual(
      ["lower:p1-checked", "lower:p2-treated", "top:t-group", "top:t1-away", "top:t2-home"].sort(),
    );
    expect(corpus.workshops.map((w) => w.workshop.id)).toEqual(["policy"]);
  });

  test("a file that does not parse is a finding with its reason, not a silent skip", () => {
    expect(corpus.problems.map((p) => `${p.instance}:${p.file}`)).toEqual(["top:journeys/broken.json"]);
    expect(corpus.problems[0]!.message).toContain('"zed"');
  });

  test("the edges' targets: actors, stories, blocks, ladders, requirements", () => {
    expect(corpus.actors.get("lower")?.get("ana")?.persona?.name).toBe("Ana");
    expect(corpus.stories.get("lower")?.has("pilgrim-1")).toBe(true);
    expect(corpus.blocks.get("lower")?.blocks.has("wallet")).toBe(true);
    // Only a directory declaring `building-blocks` is read for a catalogue.
    expect(corpus.blocks.get("lower")?.blocks.has("stray")).toBe(false);
    expect(corpus.ladders.get("lower")?.get("trust")?.map((c) => c.code)).toEqual(["paper", "shared"]);
    expect(corpus.requirements.get("LOW-REQ-001")?.title).toBe("Read the summary");
  });
});

describe("the declared route", () => {
  test("is the instance's visualiser renderedBy journeys-viewer, under the locale", () => {
    expect(journeysRoute(TOP)).toBe("en/top/journeys");
    expect(journeysRoute(join(REPO, "lower"))).toBeUndefined();
    expect(journeyFiles(join(REPO, "lower"))).toBeUndefined();
    expect(journeyFiles(TOP)!.files.every((f) => f.path.startsWith("en/top/journeys/"))).toBe(true);
  });
});

describe("the index: all journeys, by instance, by partOf, along follows", () => {
  const index = at("index.html");
  test("names every instance's journeys, the declaring instance first", () => {
    expect(index.indexOf('id="top"')).toBeLessThan(index.indexOf('id="lower"'));
    for (const t of ["P1 — Checked", "P2 — Treated", "T — The whole trip", "T1 — Away", "T2 — Home"]) expect(index).toContain(t);
  });
  test("a sub-journey sits inside its parent, and siblings follow their chain", () => {
    const group = index.slice(index.indexOf("T — The whole trip"));
    expect(group).toContain('class="jv-tree jv-tree-sub"');
    expect(group.indexOf("T1 — Away")).toBeLessThan(group.indexOf("T2 — Home"));
    expect(index.indexOf("P1 — Checked")).toBeLessThan(index.indexOf("P2 — Treated"));
  });
  test("each instance is a sub-graph page", () => {
    expect(at("lower/index.html")).toContain("Lower layer");
    expect(at("top/index.html")).toContain("journeys/broken.json");
  });
  test("every page says which Tool drew it", () => {
    for (const f of files.filter((x) => x.path.endsWith(".html"))) expect(renderedByOf(String(f.content))).toBe("journeys-viewer");
  });
});

describe("a journey page", () => {
  const p2 = at("lower/p2-treated/index.html");
  test("a lane per person present, and the feeling curve", () => {
    expect(p2).toContain('class="jv-row jv-lane"');
    expect((p2.match(/class="jv-curve"/g) ?? []).length).toBe(2);
    expect(p2).toContain("--c:#123456");
  });
  test("each step: its anchor, its trust state from the ladder, gaps", () => {
    expect(p2).toContain(`id="${stepAnchor("P2")}"`);
    expect(p2).toContain("<b>Shared</b>");
    expect(p2).toContain("No transaction for this yet.");
  });
  test("the BPMN drawing, inlined in the common block, with the step's flow nodes named for the task panel to highlight", () => {
    expect(p2).toMatch(/<figure class="bpmn-figure pt-diagram jv-bpmn" id="jv-fig-\d+" data-panel="[^"]+" data-pt-highlight="Task_Read">/);
    expect(p2).not.toContain("data-jv-hl");
    expect(p2).not.toContain("<?xml");
    // The scroll box takes keyboard focus; the client and its styles are the common ones.
    expect(p2).toContain('<div class="jv-bpmn-scroll" tabindex="0" role="group"');
    expect(p2).toContain('<link rel="stylesheet" href="../../assets/task-panel.css">');
    expect(p2).toContain('<script src="../../assets/task-panel.js" defer></script>');
  });
  test("stories, requirements, examples and blocks resolve, and what does not is drawn as unresolved", () => {
    expect(p2).toContain("Show my summary abroad".charAt(0).toLowerCase() + "how my summary abroad");
    expect(p2).toContain("https://github.com/example/lower/blob/HEAD/skills/requirements/low-req-001.json");
    expect(p2).toMatch(/jv-unresolved"><span class="jv-code">ghost-story/);
    expect(p2).toMatch(/LOW-REQ-404<\/span> no <code>req:<\/code> node/);
    expect(p2).toContain("Health wallet");
    expect(p2).toContain("not in a catalogue");
  });
  test("the workshop layer of another instance shows under the step it names", () => {
    expect(p2).toContain("Should the family be told?");
    expect(p2).toContain('href="../../top/workshops/policy/m1/"');
    expect(p2).toContain('data-jv-store');
    expect(p2).toContain("a signature crosses");
  });
  test("a reference's href resolves from the site's root, as the workshop pages resolve it", () => {
    // The journey page sits at <route>/<instance>/<id>/: two up to the route root, three more out of `en/top/journeys`.
    const toSite = "../../../../../";
    expect(p2).toContain(`href="${toSite}journeys.html#p2">User scenario in the IG</a>`);
    expect(p2).toContain(`href="${toSite}vaxlink/">The walkthrough</a>`);
    expect(p2).toContain('href="https://example.org/spec">The spec</a>');
    expect(p2).toContain('href="#p2">This step</a>');
    expect(p2).not.toContain('href="journeys.html#p2"');
    expect(p2).not.toContain('href="vaxlink/"');
  });
  test("the journey page and the workshop pages reach the same file for one relative href", () => {
    const fromJourney = posix.join("en/top/journeys/lower/p2-treated/", "../../../../../journeys.html");
    const ws = at("top/workshops/policy/walkthrough/P2/index.html");
    const href = /href="([^"]*journeys\.html)#p2"/.exec(ws)?.[1];
    expect(href).toBeDefined();
    expect(posix.join("en/top/journeys/top/workshops/policy/walkthrough/P2/", href!)).toBe(fromJourney);
  });
  test("follows and partOf are links", () => {
    expect(p2).toContain('href="../../lower/p1-checked/" rel="prev"');
    expect(at("top/t1-away/index.html")).toContain('href="../../top/t-group/" rel="up"');
  });
});

describe("illustrations: the picture carries no text, the page does", () => {
  test("a resolved src is copied beside the page, with the step title above and the alt below as page text", () => {
    const p2 = at("lower/p2-treated/index.html");
    const fig = p2.slice(p2.indexOf('<figure class="jv-illus">'));
    expect(fig).toContain(`<img src="img/${stepAnchor("P2")}.png" alt="Ben reads the summary on a tablet."`);
    expect(fig.indexOf("Step P2")).toBeLessThan(fig.indexOf("<img"));
    expect(fig.indexOf("<figcaption>")).toBeGreaterThan(fig.indexOf("<img"));
    const img = files.find((f) => f.path === `lower/p2-treated/img/${stepAnchor("P2")}.png`);
    expect(img && String(img.content)).toContain("PNG fixture");
  });
  test("without a picture, the journey page carries the brief: style, cast and the step's prompt", () => {
    const t1 = at("top/t1-away/index.html");
    expect(t1).toContain('<details class="jv-brief"><summary>Illustration brief');
    expect(t1).toContain("The white tent city of Mina at midday");
    expect(t1).toContain("Warm, flat digital illustration");
    expect(t1).toContain("Pilgrim, 61, slim");
    expect(t1).toContain("Keep medical signs text-free.");
    expect(t1).not.toContain('class="jv-illus"');
  });
});

describe("the workshop layer", () => {
  test("a module page lists its questions along the journey, linking each step", () => {
    const m1 = at("top/workshops/policy/m1/index.html");
    expect(m1.indexOf("Where does it break?")).toBeLessThan(m1.indexOf("What must be true for Ben to trust it?"));
    expect(m1).toContain(`href="../../../../lower/p2-treated/#${stepAnchor("P2")}"`);
    expect(m1).toContain("Name the capabilities");
    expect(m1).toContain("Facilitator card");
  });
  test("a module's tables are drawn on its page", () => {
    expect(at("top/workshops/policy/m2/index.html")).toContain("Trust anchor");
  });
  test("the sheets page carries one sheet per declared sheet, with its assessment strip", () => {
    const sheets = at("top/workshops/policy/sheets/index.html");
    expect((sheets.match(/class="jv-sheet /g) ?? []).length).toBe(1);
    expect(sheets).toContain('class="jv-strip"');
    expect(sheets).toContain("A viewer");
  });
});

describe("the presentation pages: a workshop told in a room, with no site chrome", () => {
  const base = "top/workshops/policy";
  const overview = at(`${base}/overview/index.html`);
  const p1 = at(`${base}/walkthrough/P1/index.html`);
  const p2 = at(`${base}/walkthrough/P2/index.html`);
  test("an overview and one page per step, in the workshop's teaching order", () => {
    expect(files.filter((f) => f.path.startsWith(`${base}/walkthrough/`)).map((f) => f.path)).toEqual([`${base}/walkthrough/P1/index.html`, `${base}/walkthrough/P2/index.html`]);
    expect(files.some((f) => f.path === "assets/present.css")).toBe(true);
    expect(files.some((f) => f.path === "assets/present.js")).toBe(true);
  });
  test("they decline the harness rail and draw their own frame from the workshop's presentation", () => {
    for (const page of [overview, p1, p2]) {
      expect(page).toContain(NAVBAR_OPT_OUT);
      expect(page).not.toContain(NAVBAR_LINKED);
      expect(page).toContain('<span class="jp-name">PilgrimLink</span>');
      expect(page).toContain("P1 → P2 (here ⇄ there)");
      expect(renderedByOf(page)).toBe("journeys-viewer");
    }
    expect(overview).toContain('href="https://example.org/ig/" target="_blank" rel="noopener noreferrer"><svg');
    expect(overview).toContain("<span>FHIR IG</span>");
  });
  test("the overview: the story, a card per chapter opening its first step, the cast, the ladder", () => {
    expect(overview).toContain("Ana is checked at home and treated abroad.");
    expect(overview).toContain("Two moments that matter");
    expect(overview).toContain('<a class="jp-card jp-moment" href="../walkthrough/P1/">');
    expect(overview).toContain('<span class="jp-moment-title">Checked</span>');
    expect(overview).toContain("Appears in 2 of 2 steps");
    expect(overview).toContain('<a href="../walkthrough/P2/">P2</a>');
    expect(overview).toContain("Lead with people.");
  });
  test("a step: prev and next for the keys, the last one going on to the discussion", () => {
    expect(p1).toContain('<link rel="prev" href="../../overview/"><link rel="next" href="../P2/">');
    expect(p2).toContain('<link rel="prev" href="../P1/">');
    expect(p2).toContain("<span>Discuss</span>");
  });
  test("a step: its record on the ladder, whose record it is, and that it moved up", () => {
    expect(p2).toContain("Ana’s record");
    expect(p2).toContain('<div class="jp-state">Shared</div>');
    expect(p2).toContain("▲ Moved up");
  });
  test("a step: the room's question, the questions by module, the tables it touches, the gap strip", () => {
    expect(p2).toContain("Should the family be told?");
    expect(p2).toContain('<a class="jp-mod" href="../../m1/"');
    expect(p2).toContain("Trust anchor ★");
    expect(p2).toContain("— a signature crosses");
    expect(p2).toContain('name="policy:viewer:status"');
  });
  test("a step: the people, each with the avatar in the card's header (never inside a sentence), and under the hood", () => {
    expect(p2).toContain('class="jp-who" style="--c:#123456"');
    expect(p2).toContain('<span class="jp-named">Ben (nurse)</span>: reads the summary');
    expect(p2).not.toMatch(/<span class="jp-named">[^<]*<span class="jp-av/);
    expect(p2).toContain('<b>Health wallet</b><span>shows the QR</span>');
    expect(p2).toContain('data-pt-highlight="Task_Read"');
    expect(p2).toContain('data-jp-hood');
  });
  test("the workshop page links to the presentation, and its discussion has an anchor", () => {
    expect(at(`${base}/index.html`)).toContain('href="overview/"');
  });
});

describe("the presentation views: map, persona lens, how it works, discussion, sheets, device demo", () => {
  const base = "top/workshops/policy";
  const map = at(`${base}/map/index.html`);
  const how = at(`${base}/how/index.html`);
  const wallet = at(`${base}/how/wallet/index.html`);
  const discuss = at(`${base}/discuss/index.html`);
  const p2 = at(`${base}/walkthrough/P2/index.html`);
  test("every view has a page, in the frame, and the tabs link them", () => {
    for (const path of ["map", "personas", "personas/ana", "personas/cleo", "how", "how/wallet", "discuss", "sheets", "demo", "demo/S2"]) {
      const page = at(`${base}/${path}/index.html`);
      expect(page).toContain(NAVBAR_OPT_OUT);
      expect(page).toContain('<span class="jp-name">PilgrimLink</span>');
    }
    expect(p2).toContain('href="../../map/"');
    expect(p2).toContain('href="../../personas/"');
    expect(p2).toContain('href="../../how/"');
    expect(p2).toContain('href="../../discuss/"');
    expect(p2).not.toContain("jp-tab-off");
    expect(files.some((f) => f.path === `${base}/map/bpmn/processes-care.svg`)).toBe(true);
  });
  test("the map: a lane per person to focus on, the two toggles, a column per step, the technical layer, the per-view note", () => {
    expect(map).toContain('data-jp-focus="ana"');
    expect(map).toContain('data-jp-show="pain"');
    expect(map).toContain('data-jp-show="tech"');
    expect(map).toContain('data-row="lane" data-actor="cleo"');
    expect(map).toContain('href="../how/wallet/"');
    // A hand-off end that is somebody of the cast wears their avatar.
    expect(map).toMatch(/<b>Clinic EMR → <span class="jp-av jp-av-sm"[^>]*>A<\/span>Ana<\/b>/);
    expect(map).toContain('data-jp-panel="1" hidden');
    expect(map).toContain("Open screen S2");
    expect(map).toContain("Read across, then down.");
  });
  test("the persona lens: needs, frustrations, the curve's points linking to steps, the touchpoints; a glyph for an icon", () => {
    const ana = at(`${base}/personas/ana/index.html`);
    expect(ana).toContain("Her summary abroad");
    expect(ana).toContain("Paper gets lost");
    expect(ana).toContain('<a href="../../walkthrough/P2/"><title>P2 Step P2: Worried</title>');
    expect(ana).toContain("Ana’s touchpoints (2)");
    expect(at(`${base}/personas/index.html`)).toContain('href="ana/"');
    // One chip style for everyone, the baby too: initials, never a glyph among them (owner, 2026-11-06).
    expect(at(`${base}/personas/cleo/index.html`)).toMatch(/class="jp-av jp-av-lg"[^>]*title="Cleo"[^>]*>C<\/span>/);
    expect(map).not.toMatch(/class="jp-av[^"]*"[^>]*><svg/);
  });
  test("how it works: the big ideas, the grid, a block's detail with the moments that use it", () => {
    expect(how).toContain("Carry it yourself");
    expect(how).toContain('<a class="jp-bchip jp-layer-teal" href="wallet/">Health wallet</a>');
    expect(how).toContain("Select a building block");
    expect(wallet).toContain("So what for the journey");
    expect(wallet).toContain('href="https://example.org/wallet"');
    expect(wallet).toContain("<small>shows the QR</small>");
    expect(wallet).toContain("Read the patient&#39;s summary");
  });
  test("the discussion: the closing question, the moments to revisit, the tables with what forces each row, the gap report", () => {
    expect(discuss).toContain("What must countries agree on?");
    // The gap report's model: the gap strip's own storage names, the moment's link, its first module.
    const model = JSON.parse(/<script type="application\/json" data-jp-gapreport-model>([\s\S]*?)<\/script>/.exec(discuss)![1]!);
    expect(model.items).toEqual([{ name: { status: "policy:viewer:status" }, capability: { id: "viewer", label: "A viewer" }, step: { id: "P2", title: "Step P2", href: "../walkthrough/P2/" }, module: "M1" }]);
    expect(model.status.options.map((o: { id: string }) => o.id)).toEqual(["yes", "no"]);
    expect(model.urgency).toBeUndefined();
    expect(discuss).toContain('<script src="../../../../assets/gap-report.js" defer></script>');
    expect(discuss).toContain("data-jp-report-print");
    expect(discuss).toContain("data-jp-report-csv");
    expect(files.some((f) => f.path === "assets/gap-report.js")).toBe(true);
    expect(discuss).toContain("Forced by:");
    expect(discuss).toContain('href="../walkthrough/P2/"');
  });
  test("a step: its screen, its FHIR change with Inspect JSON, the payload drawer, the IG's process and scenario pages", () => {
    expect(p2).toContain('href="../../demo/S2/"');
    expect(p2).toContain("<small>(screen S2)</small>");
    expect(p2).toContain('data-jp-inspect="Bundle/ana-ips"');
    expect(p2).toContain('<span class="jp-j-key">&quot;resourceType&quot;</span>');
    expect(p2).toContain("Read, not stored");
    expect(p2).toContain("Intl profile");
    expect(p2).toContain('href="../../../../../../../../business-processes.html#read-the-patients-summary"');
    expect(p2).toContain('href="../../../../../../../../journeys.html#p2"');
    expect(p2).toContain('class="jp-scene');
  });
  test("the device demo frames the app's screen and links back to its moments", () => {
    const s2 = at(`${base}/demo/S2/index.html`);
    expect(s2).toContain('<iframe class="jp-device jp-device-tablet" src="../../../../../../../../app/#/demo/S2"');
    expect(s2).toContain('href="../../walkthrough/P2/"');
    expect(s2).toContain("Screen S2 — Flip the toggle");
  });
  test("the font is vendored and copied as bytes, with its licence", () => {
    const woff = files.find((f) => f.path === "assets/fonts/PlusJakartaSans-Bold.woff2");
    expect(woff?.content).toBeInstanceOf(Uint8Array);
    expect(files.some((f) => f.path === "assets/fonts/OFL.txt")).toBe(true);
    expect(at("assets/present.css")).toContain('src: url("fonts/PlusJakartaSans-Bold.woff2") format("woff2")');
  });
});

describe("a workshop with none of the optional data still presents", () => {
  test("no device demo, no IG, no catalogue, no index: the views draw what there is", () => {
    const bare = renderJourneyPages(
      { ...corpus, blocks: new Map(), examples: new Map(), workshops: corpus.workshops.map((w) => ({ ...w, workshop: { ...w.workshop, presentation: undefined } })) } as never,
      { route: "en/top/journeys", title: "Top" },
      "top",
    );
    const page = (p: string) => String(bare.find((f) => f.path === `top/workshops/policy/${p}`)!.content);
    expect(page("walkthrough/P2/index.html")).not.toContain("jp-drawer");
    expect(page("walkthrough/P2/index.html")).toContain('aria-disabled="true" title="No device screen shows a step of this workshop"');
    expect(page("how/index.html")).toContain("No building-block catalogue is declared");
    expect(bare.some((f) => f.path.includes("/demo/"))).toBe(false);
  });
});

describe("presentation helpers", () => {
  test("shortTitle drops a step code and its dash, and nothing else", () => {
    expect(shortTitle("J1 — Born abroad")).toBe("Born abroad");
    expect(shortTitle("J4.0 — Crossing back: one family")).toBe("Crossing back: one family");
    expect(shortTitle("T — The whole trip")).toBe("The whole trip");
    expect(shortTitle("P0 · Before the season")).toBe("Before the season");
    expect(shortTitle("Born abroad")).toBe("Born abroad");
    expect(shortTitle("Ministry of Health — the track")).toBe("Ministry of Health — the track");
  });
  test("chapterRoots: one level below what every taught journey shares", () => {
    const j = (id: string) => corpus.journeys.find((x) => x.scenario.id === id)!;
    // Both part of t-group: each is its own chapter.
    expect(chapterRoots(corpus, [j("t1-away"), j("t2-home")]).map((x) => x.scenario.id)).toEqual(["t1-away", "t2-home"]);
    // With a journey outside the group, the group is the chapter.
    expect(chapterRoots(corpus, [j("p1-checked"), j("t1-away"), j("t2-home")]).map((x) => x.scenario.id)).toEqual(["p1-checked", "t-group", "t-group"]);
  });
  test("presentationOf: chapters, keys and the cast in order of first appearance", () => {
    const p = presentationOf(corpus, corpus.workshops[0]!);
    expect(p.chapters.map((c) => c.title)).toEqual(["Checked", "Treated"]);
    expect(p.steps.map((s) => `${s.key}@${s.chapter}`)).toEqual(["P1@0", "P2@1"]);
    expect(p.cast.map((c) => c.id)).toEqual(["ana", "ben", "cleo"]);
    expect(p.steps[1]!.ws?.askTheRoom).toBe("Should the family be told?");
  });
  test("an overview card: the picture first, the strip (labelled, VaxLink's size) and the people at its foot", () => {
    const ov = at("top/workshops/policy/overview/index.html");
    const card2 = [...ov.matchAll(/<a class="jp-card jp-moment"[\s\S]*?<\/a>/g)].map((m) => m[0]).find((c) => c.includes("jp-pic"))!;
    expect(card2.indexOf('class="jp-pic"')).toBeLessThan(card2.indexOf('class="jp-moment-title"'));
    expect(card2.indexOf('class="jp-moment-sum"')).toBeLessThan(card2.indexOf('class="jp-moment-foot"'));
    expect(card2).toContain('jp-scene jp-scene-md');
    expect(card2).toContain('<span class="jp-scene-l">A clinic</span>');
  });
  test("presentation.cast orders the cast everywhere; presentation.chapterTitles names a chapter", () => {
    const w0 = corpus.workshops[0]!;
    const w = { ...w0, workshop: { ...w0.workshop, presentation: { ...w0.workshop.presentation, cast: ["cleo", "ghost", "ana"], chapterTitles: { "p2-treated": "Crossing back" } } } };
    const p = presentationOf(corpus, w);
    // Declared first (an id no step names is dropped), then the rest in order of first appearance.
    expect(p.cast.map((c) => c.id)).toEqual(["cleo", "ana", "ben"]);
    expect(p.chapters.map((c) => c.title)).toEqual(["Checked", "Crossing back"]);
    expect(castOrder(["a", "b", "c"], undefined)).toEqual(["a", "b", "c"]);
    expect(castOrder(["a", "b", "c"], ["c", "c", "x"])).toEqual(["c", "a", "b"]);
  });
  test("personaText marks whole-word names, longest first, puts no avatar in the sentence, and escapes the rest", () => {
    const people = [
      { id: "a", name: "Anan", initials: "AN", color: "#000000" },
      { id: "d", name: "Dr. Anan", initials: "DA", color: "#111111" },
    ];
    const out = personaText("Dr. Anan meets Ananda <b>", people);
    expect(out).toBe('<span class="jp-named">Dr. Anan</span> meets Ananda &lt;b&gt;');
  });
  test("mentioned: the people a sentence names, in the cast's order, without the card's own person; their chips go in the header", () => {
    const people = [
      { id: "s", name: "Somsack", initials: "SS", color: "#65a30d" },
      { id: "k", name: "Khamla", initials: "KS", color: "#f43f5e" },
      { id: "v", name: "Vilay", initials: "VI", color: "#14b8a6" },
    ];
    expect(mentioned("Tells Vilay about Somsack, then Vilay again", people).map((p) => p.id)).toEqual(["s", "v"]);
    expect(mentioned("Khamla brings Somsack", people, "k").map((p) => p.id)).toEqual(["s"]);
    expect(mentionedChips("waits", people)).toBe("");
    expect(mentionedChips("Tells Vilay", people)).toContain('<span class="jp-mentions" title="With Vilay"><span class="jp-av jp-av-sm" style="--c:#14b8a6" title="Vilay" aria-hidden="true">VI</span></span>');
  });
  test("links out: kramdown anchors, page patterns, the site's root, JSON colouring", () => {
    expect(kramdownSlug("J1 — Born abroad (Thailand, birth day)")).toBe("j1--born-abroad-thailand-birth-day");
    expect(kramdownSlug("J1 Issue the newborn's birth-dose DVCs in Country A")).toBe("j1-issue-the-newborns-birth-dose-dvcs-in-country-a");
    expect(fillPattern("artifact/{type}-{id}.html", { type: "Immunization", id: "X" })).toBe("artifact/Immunization-X.html");
    expect(fromSite("vaxlink/", "../../")).toBe("../../vaxlink/");
    expect(fromSite("https://x.org/", "../../")).toBe("https://x.org/");
    expect(fromSite("/abs/", "../../")).toBe("/abs/");
    expect(siteRootFrom("../../", { route: "en/h/journeys", title: "" })).toBe("../../../../../");
    expect(highlightJson('{"a": "b<", "n": -1.5e3, "t": true, "z": null}')).toBe(
      '<span class="jp-j-pun">{</span><span class="jp-j-key">&quot;a&quot;</span>: <span class="jp-j-str">&quot;b&lt;&quot;</span><span class="jp-j-pun">,</span> <span class="jp-j-key">&quot;n&quot;</span>: <span class="jp-j-num">-1.5e3</span><span class="jp-j-pun">,</span> <span class="jp-j-key">&quot;t&quot;</span>: <span class="jp-j-lit">true</span><span class="jp-j-pun">,</span> <span class="jp-j-key">&quot;z&quot;</span>: <span class="jp-j-lit">null</span><span class="jp-j-pun">}</span>',
    );
    // An escaped quote stays inside its string.
    expect(highlightJson(JSON.stringify({ q: 'say "hi"' }))).toContain('<span class="jp-j-str">&quot;say \\&quot;hi\\&quot;&quot;</span>');
  });
  test("unescapeXml resolves each entity once: an escaped ampersand is not unescaped again", () => {
    expect(unescapeXml("&amp;lt;")).toBe("&lt;");
    expect(unescapeXml("newborn&#x27;s &#39;dose&#39; &lt;b&gt; &quot;x&quot; &apos;y&apos; &amp;")).toBe(`newborn's 'dose' <b> "x" 'y' &`);
    expect(unescapeXml("&unknown; & alone")).toBe("&unknown; & alone");
  });
  test("the views' pure helpers: feeling points, block usage, step refs, screens", () => {
    const p = presentationOf(corpus, corpus.workshops[0]!);
    expect(feelingPoints(p, "ana")).toEqual([{ index: 0, emotion: 1 }, { index: 1, emotion: -1 }]);
    expect(feelingPoints(p, "cleo")).toEqual([]);
    expect(blockUsage(p, "wallet").map((u) => `${u.s.step.id}:${u.role}`)).toEqual(["P2:shows the QR"]);
    expect(stepByRef(corpus, p, "p2-treated#P2")?.key).toBe("P2");
    expect(stepByRef(corpus, p, "P1")?.key).toBe("P1");
    expect(stepByRef(corpus, p, "t1-away#T1")).toBeUndefined();
    // No device-screen node shows a step here, so the workshop's own app is framed.
    expect(p.demo).toBe("frame");
    expect(screensFor(p, stepByRef(corpus, p, "P2")!).map((x) => x.id)).toEqual(["S2"]);
    expect(screenHref(p.w.workshop.presentation!, "S2", "../")).toBe("../app/#/demo/S2");
  });
  test("small ones", () => {
    expect(countWord(4)).toBe("Four");
    expect(countWord(40)).toBe("40");
    expect(rangeLabel([{ step: { id: "J1" } }, { step: { id: "J4.1" } }], "A ⇄ B")).toBe("J1 → J4.1 (A ⇄ B)");
    expect(rangeLabel([{ step: { id: "J1" } }])).toBe("J1");
    expect([...countryTones(["Thailand", "Lao PDR", "Thailand", undefined, "Cross-Border"])]).toEqual([["Thailand", "amber"], ["Lao PDR", "sky"], ["Cross-Border", "indigo"]]);
    const ladder = [{ code: "a", label: "A" }, { code: "b", label: "B" }];
    expect(rungOf(ladder, { record: { state: "b" } } as never)).toBe(1);
    expect(rungOf(ladder, {} as never)).toBe(-1);
    expect(viewBoxWidth('<svg width="100%" viewBox="95 55 1580 690">')).toBe(1580);
    expect(viewBoxWidth('<svg width="640px">')).toBe(640);
    expect(viewBoxWidth("<g/>")).toBeUndefined();
  });
});

describe("helpers", () => {
  test("orderByFollows walks each chain from its start", () => {
    const j = (id: string, follows?: string) => ({ instance: "x", file: "", scenario: { id, follows } }) as never;
    expect(orderByFollows([j("c", "b"), j("a"), j("b", "a"), j("z", "elsewhere")]).map((x: { scenario: { id: string } }) => x.scenario.id)).toEqual(["a", "b", "c", "z"]);
  });
  test("bpmnFigure never assembles a comment opener from a drawing's pieces", () => {
    // A one-pass strip turned this into an unclosed `<!--` that hid the rest of the page.
    const svg = '<svg><!<!---->--<g data-element-id="A"></g></svg>';
    const out = bpmnFigure(svg, ["A"], "c");
    expect(out).toContain("<!<!---->--<g");
    expect(out).not.toMatch(/<!--(?!--)<g/);
    expect(out).toContain('data-pt-highlight="A"');
    expect(out).toContain("<figcaption>c</figcaption>");
  });
  test("bpmnFigure leaves a drawing alone: no task named, no highlight; no sidecar, no panel", () => {
    const out = bpmnFigure('<svg><g data-element-id="A"></g></svg>', undefined, "c");
    expect(out).toContain('<g data-element-id="A"></g>');
    expect(out).not.toContain("data-pt-highlight");
    expect(out).not.toContain("data-panel");
    expect(bpmnFigure("<svg></svg>", ["A", "B", "A"], "c", "../x.tasks.json")).toContain('data-panel="../x.tasks.json" data-pt-highlight="A B"');
  });
  test("the common task panel's client and styles are written with the assets, and only a page with a drawing loads them", () => {
    expect(at("assets/task-panel.js")).toBe(`${PANEL_SCRIPT}\n`);
    expect(at("assets/task-panel.css")).toBe(`${PANEL_CSS}\n`);
    expect(at("index.html")).not.toContain("task-panel");
    expect(panelHead("<p>no drawing</p>", "../")).toBe("");
  });
});

// ── DAK links: diagrams clickable as the KG site renders them, assets linked into the IG ──

/** Where `href`, written on the page at site path `page`, lands: a site path, or the absolute URL as it is. */
const landsAt = (page: string, href: string): string => (/^[a-z][a-z0-9+.-]*:/i.test(href) ? href : posix.normalize(posix.join(posix.dirname(page), href.replace(/[?#].*$/, ""))));
const sitePath = (path: string): string => `${LINKS.route}/${path}`;
const hrefsOf = (html: string, marker: string): string[] => [...html.matchAll(/<(?:a|object)\b[^>]*>/g)].map((m) => m[0]).filter((t) => t.includes(marker)).map((t) => /\s(?:href|data)="([^"]*)"/.exec(t)![1]!.replace(/&amp;/g, "&"));

describe("the drawings are clickable the way the KG site renders them", () => {
  const journey = sitePath("lower/p2-treated/index.html");
  const walk = sitePath("top/workshops/policy/walkthrough/P2/index.html");
  test("a BPMN step's TITLE links to its page (linkSteps), from the journey page's depth and the walkthrough's", () => {
    for (const [page, html] of [[journey, at("lower/p2-treated/index.html")], [walk, at("top/workshops/policy/walkthrough/P2/index.html")]] as const) {
      const titles = hrefsOf(html, 'class="fa-task-link"');
      expect(titles.length).toBe(2);
      expect(titles.map((h) => landsAt(page, h))).toEqual(["kg/lower/processes/care/P/node/Task_Read/", "kg/lower/processes/care/P/node/Task_Other/"]);
      // On the title alone, with its accessible name, and the highlight kept.
      expect(html).toMatch(/<a class="fa-task-link" href="[^"]+" target="_top" aria-label="Open step: Read the summary"><title>Open step: Read the summary<\/title><text class="djs-label">/);
      expect(html).toContain('data-pt-highlight="Task_Read"');
      // The ⓘ panel's sidecar, from the page's own depth, where the processes viewer writes it.
      expect(landsAt(page, /data-panel="([^"]+)"/.exec(html)![1]!)).toBe("en/kg/processes/care.tasks.json");
    }
  });
  test("an absolute step page (a subject IRI) is linked as it is", () => {
    const abs = renderJourneyPages(corpus, { ...LINKS, stepPage: (_i, _b, p, t) => `https://example.org/kg/process/${p}/node/${t}` }, "top");
    const html = String(abs.find((f) => f.path === "lower/p2-treated/index.html")!.content);
    expect(hrefsOf(html, 'class="fa-task-link"')).toContain("https://example.org/kg/process/P/node/Task_Read");
  });
  test("where no step page is published (a downstream site), a title links the process's section in the IG instead", () => {
    const none = renderJourneyPages(corpus, { ...LINKS, stepPage: () => undefined }, "top");
    for (const [path, page] of [["lower/p2-treated/index.html", sitePath("lower/p2-treated/index.html")], ["top/workshops/policy/walkthrough/P2/index.html", sitePath("top/workshops/policy/walkthrough/P2/index.html")]] as const) {
      const html = String(none.find((f) => f.path === path)!.content);
      const titles = hrefsOf(html, 'class="fa-task-link"');
      expect(titles.length).toBe(2);
      // `landsAt` drops the anchor: the page, then the anchor itself.
      expect(new Set(titles.map((h) => landsAt(page, h)))).toEqual(new Set(["business-processes.html"]));
      expect(titles.every((h) => h.endsWith("business-processes.html#read-the-patients-summary"))).toBe(true);
    }
  });
  test("an ArchiMate view is an <object>, so the elements in it open their pages; its data and caption resolve from the page", () => {
    const html = at("lower/p2-treated/index.html");
    expect(html).not.toMatch(/<img[^>]*archimate/);
    const obj = /<object type="image\/svg\+xml" data="([^"]+)" aria-label="P2 on the RA">/.exec(html);
    expect(obj).not.toBeNull();
    expect(landsAt(journey, obj![1]!)).toBe("archimate/ra/views/v-p2.svg");
    expect(hrefsOf(html, DAK_ATTR).map((h) => landsAt(journey, h))).toContain("en/lower/archimate/ra/views/v-p2/");
  });
});

describe("personas and other DAK assets link to their pages in the IG", () => {
  test("a persona plays a role the IG defines: its name links to that ActorDefinition; one with none stays text", () => {
    expect(pascal("birth-clinic-vaccinator")).toBe("BirthClinicVaccinator");
    expect(personaArtifact(corpus, "lower", "ana")).toBe("ActorDefinition/Demo.Role.Pilgrim");
    expect(personaArtifact(corpus, "lower", "ben")).toBeUndefined();
    const walk = at("top/workshops/policy/walkthrough/P2/index.html");
    const pages = [sitePath("top/workshops/policy/walkthrough/P2/index.html"), sitePath("lower/p2-treated/index.html"), sitePath("top/workshops/policy/overview/index.html")];
    const htmls = [walk, at("lower/p2-treated/index.html"), at("top/workshops/policy/overview/index.html")];
    htmls.forEach((html, i) => expect(hrefsOf(html, DAK_ATTR).map((h) => landsAt(pages[i]!, h))).toContain("ActorDefinition-Demo.Role.Pilgrim.html"));
    expect(walk).toContain("<b>Ben (nurse)</b>");
    // A name inside the prose is marked, linked the same way when its persona has a page, with no avatar in the sentence.
    const people = [{ id: "ana", name: "Ana", initials: "A", color: "#123456", artifact: "ActorDefinition/Demo.Role.Pilgrim" }, { id: "ben", name: "Ben", initials: "B", color: "#654321" }];
    const chips = personaText("Ana waits; Ben reads.", people, (x) => (x.artifact ? `../${x.artifact.replace("/", "-")}.html` : undefined));
    expect(chips).toMatch(/^<a class="jp-named" href="\.\.\/ActorDefinition-Demo\.Role\.Pilgrim\.html" data-jv-dak>Ana<\/a>/);
    expect(chips).toContain('<span class="jp-named">Ben</span>');
    expect(chips).not.toContain("jp-av");
  });
  test("a FHIR example links to its IG page, in the hood and in the payload drawer; a profile the index does not list stays text", () => {
    const page = sitePath("top/workshops/policy/walkthrough/P2/index.html");
    const walk = at("top/workshops/policy/walkthrough/P2/index.html");
    expect(hrefsOf(walk, DAK_ATTR).map((h) => landsAt(page, h))).toContain("Bundle-ana-ips.html");
    expect(walk).toMatch(/<p class="jp-pane-link"><a class="jp-ext" href="[^"]*Bundle-ana-ips\.html" data-jv-dak/);
    expect(walk).toContain('<span class="jp-prof" title="ips-bundle">Intl profile</span>');
  });
});

describe("a step's DAK assets: one row, grouped by what each is to the step, linked into the IG", () => {
  const dakPages = ["StructureDefinition-DdTreatment.html", "PlanDefinition-DT01.html", "Measure-IND02.html"];
  test("the walkthrough's hood draws Data, Decision logic, Indicators in that order, each asset linked; one the index does not list stays text", () => {
    const page = sitePath("top/workshops/policy/walkthrough/P2/index.html");
    const walk = at("top/workshops/policy/walkthrough/P2/index.html");
    const row = /<div class="jp-dak" data-jp-dak>[\s\S]*?<\/span><\/div><\/div>/.exec(walk)?.[0] ?? "";
    expect([...row.matchAll(/data-jp-dak-rel="([a-z]+)"/g)].map((m) => m[1])).toEqual(["data", "decides", "measures"]);
    expect([...row.matchAll(/<span class="jp-dak-l">.*?<\/svg>([^<]+)<\/span>/g)].map((m) => m[1])).toEqual(["Data", "Decision logic", "Indicators"]);
    expect(hrefsOf(row, DAK_ATTR).map((h) => landsAt(page, h))).toEqual(dakPages);
    expect(row).toContain('title="StructureDefinition/DdTreatment — What the clinic records.">DD.P2 Treatment abroad</a>');
    expect(row).toContain('<span class="jp-dak-a jp-dak-text" title="Measure/IND99">IND99</span>');
  });
  test("the journey page's step lists the same assets under DAK assets", () => {
    const page = sitePath("lower/p2-treated/index.html");
    const html = at("lower/p2-treated/index.html");
    const dl = /<h4>DAK assets<\/h4><dl class="jv-dl jv-dak">[\s\S]*?<\/dl>/.exec(html)?.[0] ?? "";
    expect([...dl.matchAll(/<dt>([^<]+)<\/dt>/g)].map((m) => m[1])).toEqual(["Data", "Decision logic", "Indicators"]);
    expect(hrefsOf(dl, DAK_ATTR).map((h) => landsAt(page, h))).toEqual(dakPages);
    expect(dl).toContain('<span class="jv-code" title="Measure/IND99">IND99</span>');
  });
  test("a step that names none draws no row", () => {
    expect(at("top/workshops/policy/walkthrough/P1/index.html")).not.toContain("data-jp-dak");
  });
});

describe("the check over a staged site: every DAK link resolves to a file", () => {
  const site = mkdtempSync(join(tmpdir(), "journeys-site-"));
  afterAll(() => rmSync(site, { recursive: true, force: true }));
  const write = (rel: string, body: string | Uint8Array): void => {
    mkdirSync(join(site, dirname(rel)), { recursive: true });
    writeFileSync(join(site, rel), body);
  };
  for (const f of files) write(sitePath(f.path), f.content);
  // What the rest of the site publishes: the IG's pages, the step pages, the ArchiMate view and the element it links.
  // Each target page, with an element for every anchor a link names on it.
  const anchors = new Map<string, Set<string>>();
  for (const f of files) if (f.path.endsWith(".html")) for (const h of hrefsOf(String(f.content), DAK_ATTR).concat(hrefsOf(String(f.content), 'class="fa-task-link"'))) {
    const t = landsAt(sitePath(f.path), h);
    if (/^[a-z]+:/.test(t)) continue;
    const ids = anchors.get(t) ?? new Set<string>();
    const id = /#(.+)$/.exec(h)?.[1];
    if (id) ids.add(id);
    anchors.set(t, ids);
  }
  const targets = new Set(anchors.keys());
  for (const [t, ids] of anchors) if (!t.endsWith(".svg")) write(t.endsWith("/") ? `${t}index.html` : t, `<!doctype html>${[...ids].map((id) => `<h3 id="${id}">x</h3>`).join("")}`);
  write("archimate/ra/views/v-p2.svg", '<svg xmlns="http://www.w3.org/2000/svg"><a href="../../../en/lower/archimate/ra/elements/wallet/" target="_top"><rect/></a></svg>');
  write("en/lower/archimate/ra/elements/wallet/index.html", "<!doctype html>");
  test("every rendered DAK link names a page the IG and the KG publish", () => {
    expect([...targets]).toEqual(expect.arrayContaining(["ActorDefinition-Demo.Role.Pilgrim.html", "Bundle-ana-ips.html", "PlanDefinition-DT01.html", "Measure-IND02.html", "StructureDefinition-DdTreatment.html", "kg/lower/processes/care/P/node/Task_Read/"]));
    const r = checkDakLinks(site, LINKS.route);
    expect(r.findings).toEqual([]);
    expect(r.checked).toBeGreaterThan(10);
  });
  test("a page that is not there, an element link inside a drawing that is not there, and the bare IHE VHL root are findings", () => {
    rmSync(join(site, "ActorDefinition-Demo.Role.Pilgrim.html"));
    rmSync(join(site, "en/lower/archimate/ra/elements/wallet/index.html"));
    write(sitePath("vhl/index.html"), '<a href="https://profiles.ihe.net/ITI/VHL/">VHL</a> <a href="https://profiles.ihe.net/ITI/VHL/volume-1.html">VHL</a>');
    const why = checkDakLinks(site, LINKS.route).findings.map((f) => `${f.page} ${f.why}`);
    expect(why.some((w) => w.includes("no file at ActorDefinition-Demo.Role.Pilgrim.html"))).toBe(true);
    expect(why.some((w) => w.startsWith("archimate/ra/views/v-p2.svg no file at en/lower/archimate/ra/elements/wallet/index.html"))).toBe(true);
    expect(why.filter((w) => w.includes("bare IHE VHL root"))).toHaveLength(1);
    // A page that is there, with an anchor that is not.
    write(sitePath("anchor/index.html"), '<a data-jv-dak href="../../../../Bundle-ana-ips.html#nowhere">x</a>');
    expect(checkDakLinks(site, LINKS.route).findings.some((f) => f.why === 'no id "nowhere" in Bundle-ana-ips.html')).toBe(true);
    expect(BARE_VHL.test("https://profiles.ihe.net/ITI/VHL")).toBe(true);
    expect(BARE_VHL.test("https://profiles.ihe.net/ITI/VHL/volume-1.html")).toBe(false);
  });
});

describe("composition (user-scenario 0.4.0): a parent's parts, in its order, and a step that is a journey", () => {
  // A checkout of its own: one layer, every journey of it 0.4.0. The
  // layer sits one level down, as `lower` and `top` do: a layer at
  // the temporary directory's top would make the system temporary directory
  // its checkout, read with every other test's fixtures in it.
  const ROOT = mkdtempSync(join(tmpdir(), "journeys-compose-"));
  afterAll(() => rmSync(ROOT, { recursive: true, force: true }));
  const putc = (rel: string, body: object): void => {
    mkdirSync(join(ROOT, dirname(rel)), { recursive: true });
    writeFileSync(join(ROOT, rel), JSON.stringify(body, null, 2));
  };
  putc("compose/compose.json", {
    name: "compose",
    directories: [
      { id: "scenarios", path: "scenarios/", graphTypologies: ["scenarios"] },
      { id: "user-scenarios", path: "journeys/", graphTypologies: ["user-scenario"] },
    ],
  });
  putc("compose/scenarios/actors/ana.json", { id: "ana", title: "Ana", roles: ["traveller"], meta: { persona: { name: "Ana" } } });
  putc("compose/scenarios/roles.json", { roles: [{ id: "traveller", title: "Traveller" }] });
  const v04 = (id: string, title: string, extra: object) => ({ $schema: "user-scenario/0.4.0", id, title, description: "d", ...extra });
  putc("compose/journeys/trip.json", v04("trip", "C — The trip", { parts: [{ scenario: "home" }, { scenario: "away", optional: true, repeats: true }] }));
  putc("compose/journeys/away.json", v04("away", "C2 — Away", { personas: ["ana"], steps: [step("C2", "ana")] }));
  putc("compose/journeys/home.json", v04("home", "C1 — Home", { personas: ["traveller"], steps: [step("C1", "ana", { includes: "away" })] }));
  clearDeclaredVisualisers();
  const c = readJourneyCorpus(join(ROOT, "compose"));
  const pages = renderJourneyPages(c, { ...LINKS, route: "en/compose/journeys" }, "compose");
  const page = (path: string) => String(pages.find((x) => x.path === path)!.content);

  test("the parent's page lists its parts in its order, marking an optional or repeating one", () => {
    const trip = page("compose/trip/index.html");
    const parts = trip.slice(trip.indexOf("Parts, in story order"));
    expect(parts.indexOf("C1 — Home")).toBeGreaterThan(0);
    expect(parts.indexOf("C1 — Home")).toBeLessThan(parts.indexOf("C2 — Away"));
    const away = parts.slice(parts.indexOf("C2 — Away"), parts.indexOf("</a>", parts.indexOf("C2 — Away")));
    expect(away).toContain('class="jv-part-mark" title="The story may skip it">optional</span>');
    expect(away).toContain(">repeats</span>");
    // Its people are its parts', derived.
    expect(c.journeys.find((j) => j.scenario.id === "trip")!.scenario.personas).toEqual(["ana"]);
  });
  test("the index nests the parts in that order; a part's neighbours are its parent's", () => {
    const index = page("index.html");
    const trip = index.slice(index.indexOf("C — The trip"));
    expect(trip).toContain("2 parts");
    expect(trip.indexOf("C1 — Home")).toBeLessThan(trip.indexOf("C2 — Away"));
    const home = page("compose/home/index.html");
    expect(home).toContain('href="../../compose/trip/" rel="up"');
    expect(home).toContain('href="../../compose/away/" rel="next"');
  });
  test("a step that includes a journey links to it", () => {
    expect(page("compose/home/index.html")).toContain('<p class="jv-includes">This step is the journey <a href="../../compose/away/"><b>C2 — Away</b></a>.</p>');
  });
});
