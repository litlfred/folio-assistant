import { describe, expect, it } from "bun:test";
import { parseArchimate } from "../schemas/archimate.ts";
import { fillOfType, layerClass, LAYER_FILL, TABLE_CSS } from "./figure-theme.ts";
import { noteItems, posterFits, renderPosterSvg, wrapWords } from "./render-poster.ts";
import { LAYER_FILL as VIEW_FILL, renderViewSvg } from "./render-view.ts";
import { bandColours, HANDBOOK } from "./figure-theme.ts";

/** Two bands (goals, components with a panel), a side column, a frame of two stacked bands. */
const XML = `<?xml version="1.0" encoding="UTF-8"?>
<archimate:model xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate" name="Poster &lt;test&gt;" id="id-m">
  <folder name="Motivation" id="f1" type="motivation">
    <element xsi:type="archimate:Goal" name="Trusted data" id="g1"><property key="figureNote" value="Capture once · use many times"/></element>
  </folder>
  <folder name="Application" id="f2" type="application">
    <element xsi:type="archimate:ApplicationComponent" name="Client Registry &lt;b&gt;" id="a1"><property key="figureNote" value="Unique ID · Record linkage"/><property key="star" value="true"/><property key="formerName" value="MPI"/></element>
    <element xsi:type="archimate:ApplicationComponent" name="Decision engine" id="a2"><property key="candidateMatch" value="CDS (id-x)"/></element>
    <element xsi:type="archimate:ApplicationComponent" name="Open standards" id="a3"><property key="figureNote" value="FHIR · IHE · openEHR · IPS · SNOMED CT · LOINC"/></element>
  </folder>
  <folder name="Technology" id="f3" type="technology">
    <element xsi:type="archimate:Node" name="Cloud" id="n1"/>
  </folder>
  <folder name="Other" id="f4" type="other">
    <element xsi:type="archimate:Grouping" name="Goals" id="lg"/>
    <element xsi:type="archimate:Grouping" name="Components" id="lc"/>
    <element xsi:type="archimate:Grouping" name="Clinical" id="dc"><property key="figureNote" value="At the point of care"/></element>
    <element xsi:type="archimate:Grouping" name="Platform layer" id="fr"/>
    <element xsi:type="archimate:Grouping" name="Shared" id="ls"/>
    <element xsi:type="archimate:Grouping" name="Tech" id="lt"/>
    <element xsi:type="archimate:Grouping" name="Interop" id="li"/>
  </folder>
  <folder name="Views" id="f5" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" name="Layers" id="v">
      <child xsi:type="archimate:DiagramObject" id="d-lg" archimateElement="lg"><bounds x="24" y="24" width="600" height="100"/>
        <child xsi:type="archimate:DiagramObject" id="d-g1" archimateElement="g1"><bounds x="10" y="30" width="170" height="55"/></child>
      </child>
      <child xsi:type="archimate:DiagramObject" id="d-lc" archimateElement="lc"><bounds x="24" y="140" width="600" height="150"/>
        <child xsi:type="archimate:DiagramObject" id="d-dc" archimateElement="dc"><bounds x="10" y="30" width="300" height="100"/>
          <child xsi:type="archimate:DiagramObject" id="d-a2" archimateElement="a2"><bounds x="10" y="30" width="170" height="55"/></child>
        </child>
      </child>
      <child xsi:type="archimate:DiagramObject" id="d-fr" archimateElement="fr"><bounds x="24" y="300" width="600" height="300"/>
        <child xsi:type="archimate:DiagramObject" id="d-ls" archimateElement="ls"><bounds x="10" y="30" width="500" height="100"/>
          <child xsi:type="archimate:DiagramObject" id="d-a1" archimateElement="a1"><bounds x="10" y="30" width="170" height="55"/></child>
        </child>
        <child xsi:type="archimate:DiagramObject" id="d-lt" archimateElement="lt"><bounds x="10" y="150" width="500" height="100"/>
          <child xsi:type="archimate:DiagramObject" id="d-n1" archimateElement="n1"><bounds x="10" y="30" width="170" height="55"/></child>
        </child>
      </child>
      <child xsi:type="archimate:DiagramObject" id="d-li" archimateElement="li"><bounds x="800" y="24" width="200" height="200"/>
        <child xsi:type="archimate:DiagramObject" id="d-a3" archimateElement="a3"><bounds x="10" y="30" width="170" height="55"/></child>
      </child>
    </element>
  </folder>
</archimate:model>`;

const m = parseArchimate(XML);
const view = m.views[0]!;

describe("figure theme", () => {
  it("is the one source of the layer colours, render-view's included", () => {
    expect(VIEW_FILL).toBe(LAYER_FILL);
    expect(fillOfType("Goal")).toBe("#ccccff");
    expect(fillOfType("Capability")).toBe("#f5deaa");
    expect(fillOfType("ApplicationComponent")).toBe("#b5ffff");
    expect(fillOfType("Node")).toBe("#c9e7b7");
  });
  it("tints a table cell by the layer of the type it names", () => {
    expect(layerClass("BusinessRole")).toBe("layer-Business");
    expect(layerClass("WorkPackage")).toBe("layer-ImplementationMigration");
    expect(TABLE_CSS).toContain("td.layer-Motivation{background:#ccccff");
  });
});

describe("render-poster", () => {
  const svg = renderPosterSvg(m, view, { starLabel: "Core component", marks: true, elementHref: (id) => `../elements/${id}/` });
  it("colours every card by its ArchiMate layer, never by its band", () => {
    for (const f of ["#ccccff", "#b5ffff", "#c9e7b7"]) expect(svg).toContain(`fill="${f}"`);
  });
  it("draws bands in the view's order, a panel inside a band, and a frame round stacked bands", () => {
    const at = (s: string) => svg.indexOf(s);
    expect(at(">GOALS<")).toBeGreaterThan(0);
    expect(at(">GOALS<")).toBeLessThan(at(">COMPONENTS<"));
    expect(svg).toContain(">Clinical<");
    expect(svg).toContain("At the point of care");
    expect(svg).toContain(">PLATFORM LAYER<");
    expect(svg).toContain('stroke-width="2.2"');
  });
  it("puts a group to the right of the stack in a dashed side column, a list note as pills", () => {
    expect(svg).toContain(">INTEROP<");
    expect(svg).toContain('stroke-dasharray="8 5"');
    expect(svg).toContain('rx="9.5"');
    expect(svg).toContain(">openEHR<");
  });
  it("stars a starred card, marks renamed and new elements, and keys both", () => {
    expect(svg).toContain(">★<");
    expect(svg).toContain(">Core component<");
    expect(svg).toContain("renamed from MPI");
    expect(svg).toContain("new; may match CDS (id-x)");
    expect(svg).toContain("candidateMatch)");
  });
  it("escapes the model's text and links each card", () => {
    expect(svg).toContain("Client Registry &lt;b&gt;");
    expect(svg).not.toContain("<b>");
    expect(svg).toContain('href="../elements/a1/"');
    expect(svg).toContain("Poster &lt;test&gt;");
  });
  it("leaves the key out when nothing is starred or marked", () => {
    expect(renderPosterSvg(m, view)).not.toContain("candidateMatch)");
  });
});

describe("text helpers", () => {
  it("wraps at a width and keeps every word", () => {
    expect(wrapWords("one two three four", 9)).toEqual(["one two", "three", "four"]);
  });
  it("sets short note items on one line, unless told not to", () => {
    expect(noteItems("EMR · HIS · LIMS · Telemedicine clients")).toEqual(["EMR · HIS · LIMS", "Telemedicine clients"]);
    expect(noteItems("EMR · HIS", false)).toEqual(["EMR", "HIS"]);
  });
});

describe("poster theme on drawn views", () => {
  it("draws a banded view without lines as a poster", () => {
    expect(posterFits(m, view)).toBe(true);
    expect(posterFits(m, { ...view, connections: [{ id: "c", source: "d-g1", target: "d-a2", bendpoints: [] } as never] })).toBe(false);
  });
  it("gives render-view a title banner and tinted groupings by default, and keeps the plain look on request", () => {
    const poster = renderViewSvg(m, view);
    expect(poster).toContain("Drawn from the ArchiMate model");
    expect(poster).toContain(bandColours(LAYER_FILL.Motivation).header);
    const plain = renderViewSvg(m, view, { theme: "plain" });
    expect(plain).not.toContain("Drawn from the ArchiMate model");
    expect(plain).not.toContain(bandColours(LAYER_FILL.Motivation).header);
  });
  it("draws the handbook look on request: teal outlines, no layer fills, no colour key", () => {
    const hb = renderViewSvg(m, view, { theme: "handbook" });
    expect(hb).toContain(HANDBOOK.teal);
    expect(hb).toContain(HANDBOOK.page);
    expect(hb).not.toContain(`fill="${LAYER_FILL.Motivation}"`);
    expect(hb).not.toContain(bandColours(LAYER_FILL.Motivation).header);
    expect(hb).not.toContain("Colour: which part of the architecture");
    expect(hb).not.toContain('class="av-type"');
    expect(hb).toContain("Drawn from the ArchiMate model");
  });
});

/** One frame round the whole stack, with two bands side by side in its last row (DTH SC Fig. 14). */
const FRAMED = `<?xml version="1.0" encoding="UTF-8"?>
<archimate:model xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:archimate="http://www.archimatetool.com/archimate" name="Framed" id="id-m">
  <folder name="Application" id="f2" type="application">
    <element xsi:type="archimate:ApplicationComponent" name="Gateway" id="a1"/>
    <element xsi:type="archimate:ApplicationComponent" name="Orders" id="a2"/>
    <element xsi:type="archimate:ApplicationComponent" name="Stock" id="a3"/>
    <element xsi:type="archimate:ApplicationComponent" name="Product Registry" id="a4"/>
    <element xsi:type="archimate:ApplicationComponent" name="Data Warehouse" id="a5"/>
    <element xsi:type="archimate:ApplicationComponent" name="Regulators" id="a6"/>
  </folder>
  <folder name="Other" id="f4" type="other">
    <element xsi:type="archimate:Grouping" name="Enterprise" id="ge"/>
    <element xsi:type="archimate:Grouping" name="Interop" id="gi"/>
    <element xsi:type="archimate:Grouping" name="Systems" id="gs"/>
    <element xsi:type="archimate:Grouping" name="Shared" id="gh"/>
    <element xsi:type="archimate:Grouping" name="Foundational" id="gf"/>
    <element xsi:type="archimate:Grouping" name="Data" id="gd"/>
    <element xsi:type="archimate:Grouping" name="Outside" id="go"/>
    <element xsi:type="archimate:Grouping" name="Ecosystem" id="gx"/>
  </folder>
  <folder name="Views" id="f5" type="diagrams">
    <element xsi:type="archimate:ArchimateDiagramModel" name="Framed" id="v">
      <child xsi:type="archimate:DiagramObject" id="d-ge" archimateElement="ge"><bounds x="24" y="24" width="800" height="500"/>
        <child xsi:type="archimate:DiagramObject" id="d-gi" archimateElement="gi"><bounds x="12" y="40" width="700" height="100"/>
          <child xsi:type="archimate:DiagramObject" id="d-a1" archimateElement="a1"><bounds x="12" y="40" width="170" height="55"/></child>
        </child>
        <child xsi:type="archimate:DiagramObject" id="d-gs" archimateElement="gs"><bounds x="12" y="160" width="700" height="160"/>
          <child xsi:type="archimate:DiagramObject" id="d-a2" archimateElement="a2"><bounds x="12" y="40" width="170" height="55"/></child>
          <child xsi:type="archimate:DiagramObject" id="d-a3" archimateElement="a3"><bounds x="12" y="100" width="170" height="55"/></child>
        </child>
        <child xsi:type="archimate:DiagramObject" id="d-gh" archimateElement="gh"><bounds x="12" y="340" width="200" height="150"/>
          <child xsi:type="archimate:DiagramObject" id="d-gf" archimateElement="gf"><bounds x="12" y="40" width="180" height="100"/>
            <child xsi:type="archimate:DiagramObject" id="d-a4" archimateElement="a4"><bounds x="5" y="40" width="170" height="55"/></child>
          </child>
        </child>
        <child xsi:type="archimate:DiagramObject" id="d-gd" archimateElement="gd"><bounds x="230" y="340" width="400" height="150"/>
          <child xsi:type="archimate:DiagramObject" id="d-a5" archimateElement="a5"><bounds x="12" y="40" width="170" height="55"/></child>
        </child>
      </child>
      <child xsi:type="archimate:DiagramObject" id="d-go" archimateElement="go"><bounds x="900" y="24" width="200" height="100"/></child>
      <child xsi:type="archimate:DiagramObject" id="d-gx" archimateElement="gx"><bounds x="1120" y="24" width="200" height="100"/>
        <child xsi:type="archimate:DiagramObject" id="d-a6" archimateElement="a6"><bounds x="12" y="40" width="170" height="55"/></child>
      </child>
    </element>
  </folder>
</archimate:model>`;

describe("render-poster, one frame round the stack", () => {
  const fm = parseArchimate(FRAMED);
  const fv = fm.views[0]!;
  const svg = renderPosterSvg(fm, fv);
  const xOf = (name: string) => Number(new RegExp(`<text x="([0-9.]+)"[^>]*>${name}</text>`).exec(svg)?.[1]);
  const yOf = (name: string) => Number(new RegExp(`<text x="[0-9.]+" y="([0-9.]+)"[^>]*>${name}</text>`).exec(svg)?.[1]);
  it("fits when the frame holds three or more groupings", () => {
    expect(posterFits(fm, fv)).toBe(true);
  });
  it("puts bands that share a row in the view side by side", () => {
    expect(yOf("SHARED")).toBe(yOf("DATA"));
    expect(xOf("DATA")).toBeGreaterThan(xOf("SHARED"));
    expect(yOf("SYSTEMS")).toBeGreaterThan(yOf("INTEROP"));
  });
  it("keeps the view's own row breaks for cards", () => {
    expect(yOf("Stock")).toBeGreaterThan(yOf("Orders"));
    expect(xOf("Stock")).toBe(xOf("Orders"));
  });
  it("names every side-column grouping, the later ones in dark type", () => {
    expect(svg).toMatch(/fill="#ffffff"[^>]*>OUTSIDE</);
    expect(svg).toMatch(/>ECOSYSTEM</);
    expect(svg).not.toMatch(/fill="#ffffff"[^>]*>ECOSYSTEM</);
  });
});
