/**
 * Scenario candidates reuse the guide's vocabulary, and refuse what it does not hold.
 *
 * Calibrated: letting `refusals` accept any process id makes "a typo is not a
 * new process" fail; dropping the generic fallback makes the generic-tier case
 * fail; emitting a `realises` edge for `could-not-determine` makes "warns and
 * draws no process" fail; adding `domain` to the user-scenario node's
 * properties makes "L2 node properties" fail.
 */
import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildScenarios,
  derivationOf,
  isCurrent,
  MappingSchema,
  readL1,
  RefusalError,
  refusals,
  unpinnedClasses,
  userStory,
  warningLine,
  type Inputs,
  type L1Rec,
  type Mapping,
} from "./l1-recommendation-scenarios.ts";
import { guideIdentity, htmlRows, markdownTable, readFshActors, sushiCanonical, VocabularySchema, type Vocabulary } from "./l1-scenario-vocabulary.ts";

const AT = "2026-10-10T00:00:00Z";
const SHA = "a".repeat(40);
const src = (path: string) => ({ path, sha256: "b".repeat(64) });

const guide: Vocabulary = VocabularySchema.parse({
  $schema: "l1-scenario-vocabulary/v1",
  tier: "guide",
  guide: "smart-test",
  namespace: "https://smart.who.int/test",
  source: { repository: "litlfred/smart-test", commit: SHA, paths: ["personas.md", "processes.md"] },
  personas: [{ id: "health-worker", title: "Health worker", source: { path: "personas.md", locator: "line 3" } }],
  processes: [{ id: "T.D", title: "Administer vaccine", source: { path: "processes.md", locator: "line 4" } }],
});
const generic: Vocabulary = VocabularySchema.parse({
  $schema: "l1-scenario-vocabulary/v1",
  tier: "generic",
  guide: "smart-base",
  namespace: "https://smart.who.int/base",
  source: { repository: "litlfred/smart-base", commit: SHA, paths: ["input/fsh/actors"] },
  personas: [{ id: "DAK.Persona.HealthcareProvider", title: "Healthcare Provider", source: { path: "input/fsh/actors/x.fsh", locator: "Instance: DAK.Persona.HealthcareProvider" } }],
  processes: [],
});
const recs: L1Rec[] = [
  { key: "R1", iri: "https://smart.who.int/kg/l1/publication/url-x/recommendation/R1", statement: "MCV1 should be administered at 9 months of age.", location: "p1" },
  { key: "C1", iri: "https://smart.who.int/kg/l1/publication/url-x/recommendation/C1", statement: "Vitamin A should be administered to all acute cases.", location: "p2" },
];
const why = { source: "inferred" as const, basis: "because" };
const mapping = (over: Partial<Mapping["entries"]> = {}): Mapping =>
  MappingSchema.parse({
    $schema: "l1-scenario-mapping/v1",
    guide: "smart-test",
    scenarioIdPrefix: "T.Measles",
    entries: {
      R1: { personas: [{ id: "health-worker", ...why }], process: { id: "T.D", ...why }, act: "give MCV1 at 9 months", outcome: "the infant is protected", domain: { code: "public-health", ...why } },
      C1: {
        personas: [{ id: "DAK.Persona.HealthcareProvider", ...why }, { candidate: "Case manager", ...why }],
        process: { id: "could-not-determine", ...why },
        act: "give vitamin A",
        outcome: "complications are reduced",
        domain: { code: "clinical", ...why },
      },
      ...over,
    },
  });
const inputs = (m: Mapping, rs = recs): Inputs => ({
  recs: rs, guide, generic, mapping: m,
  sources: { l1: src("l1.yaml"), vocabulary: src("guide.json"), generic: src("generic.json"), mapping: src("mapping.yaml") },
});

describe("a scenario per recommendation, in L2's own shape", () => {
  const r = buildScenarios(inputs(mapping()), AT);
  const scenario = r.document.nodes.find((n) => n.type === "user-scenario" && n.properties.id === "T.Measles.R1")!;

  it("writes the user story from persona, process, act and outcome", () => {
    expect(scenario.properties.description).toBe("As a Health worker, during T.D Administer vaccine, I give MCV1 at 9 months so that the infant is protected.");
    expect(userStory(["EPI Manager"], undefined, "plan.", "it works.")).toBe("As an EPI Manager, during [process not determined], I plan so that it works.");
  });

  it("joins with the three licensed edges, every one a candidate", () => {
    const preds = r.document.edges.filter((e) => e.target === scenario.id || e.source === scenario.id).map((e) => e.predicate).sort();
    expect(preds).toEqual(["implementedBy", "involves", "realises"]);
    expect(r.document.edges.every((e) => e.properties.reviewStatus === "candidate")).toBe(true);
  });

  it("keeps L2 node properties to those user-scenario declares; domain sits on the edge", () => {
    expect(Object.keys(scenario.properties).sort()).toEqual(["description", "id", "source", "title"]);
    const impl = r.document.edges.find((e) => e.predicate === "implementedBy" && e.target === scenario.id)!;
    expect(impl.properties).toMatchObject({ domain: "public-health", domainSource: "inferred" });
  });

  it("falls back to the generic persona, then a glossary candidate, and warns only for the candidate", () => {
    const c1 = r.document.edges.filter((e) => e.predicate === "involves" && e.source.endsWith("t-measles-c1"));
    expect(c1.map((e) => e.properties.tier)).toEqual(["generic", "glossary-candidate"]);
    expect(c1[0].target).toBe("https://smart.who.int/base/persona/healthcare-provider");
    expect(c1[1].properties.resolutionStatus).toBe("unresolved");
    expect(r.counts.byTier).toEqual({ guide: 1, generic: 1, "glossary-candidate": 1 });
  });

  it("warns and draws no process for could-not-determine", () => {
    expect(r.document.edges.some((e) => e.predicate === "realises" && e.target.endsWith("t-measles-c1"))).toBe(false);
    expect(r.warnings.map((w) => `${w.code} ${w.key}`).sort()).toEqual(["persona-glossary-candidate C1", "process-not-determined C1"]);
    expect(warningLine(r.warnings.find((w) => w.code === "process-not-determined")!)).toMatch(/^WARNING process-not-determined C1: .*catalogue absent/);
  });

  it("maps a link's source onto smart-kg derivation: declared is decided", () => {
    expect([derivationOf("declared"), derivationOf("context"), derivationOf("inferred")]).toEqual(["decided", "inferred", "inferred"]);
  });

  it("is current up to generatedAt", () => {
    const again = buildScenarios(inputs(mapping()), "2030-01-01T00:00:00Z").document;
    expect(isCurrent(JSON.stringify(r.document), again)).toBe(true);
  });
});

describe("refusals", () => {
  it("a typo is not a new process", () => {
    const m = mapping({ R1: { ...mapping().entries.R1, process: { id: "T.DD", ...why } } });
    expect(refusals(recs, m, guide, generic).join("\n")).toMatch(/process "T.DD" is not a smart-test process/);
    expect(() => buildScenarios(inputs(m), AT)).toThrow(RefusalError);
  });

  it("a persona id in neither vocabulary", () => {
    const m = mapping({ R1: { ...mapping().entries.R1, personas: [{ id: "nurse", ...why }] } });
    expect(refusals(recs, m, guide, generic).join("\n")).toMatch(/persona "nurse" is neither a smart-test persona nor a generic one/);
  });

  it("a recommendation with no entry, and an entry for no recommendation", () => {
    const extra: L1Rec = { ...recs[0], key: "R2", iri: recs[0].iri.replace("R1", "R2") };
    const m = mapping({ R9: mapping().entries.R1 });
    const p = refusals([...recs, extra], m, guide, generic);
    expect(p).toContain("R2: no mapping entry — coverage must be 100%");
    expect(p).toContain("R9: mapped, but the L1 source has no such recommendation");
  });

  it("a declared link that names nobody", () => {
    const raw = { ...mapping(), entries: { R1: { ...mapping().entries.R1, process: { id: "T.D", source: "declared", basis: "x" } } } };
    expect(MappingSchema.safeParse(raw).success).toBe(false);
  });
});

describe("inputs", () => {
  const dir = mkdtempSync(join(tmpdir(), "l1-scenarios-"));

  it("reads an L1 3.0 graph document's recommendation nodes", () => {
    const p = join(dir, "l1.json");
    writeFileSync(p, JSON.stringify({ "@context": "http://smart.who.int/kg/l1.context.jsonld", nodes: [
      { id: "https://smart.who.int/kg/l1/publication/isbn-1/recommendation/A.1.1", type: "recommendation", evidence: { location: "p15" }, properties: { identifier: "A.1.1", statement: "S." } },
      { id: "https://smart.who.int/kg/l1/publication/isbn-1", type: "publication" },
    ] }));
    expect(readL1(p)).toEqual([{ key: "A.1.1", iri: "https://smart.who.int/kg/l1/publication/isbn-1/recommendation/A.1.1", statement: "S.", location: "p15" }]);
  });

  it("reads the measles YAML shape, minting a url-identified publication", () => {
    const p = join(dir, "l1.yaml");
    writeFileSync(p, "publication:\n  url: https://www.who.int/x/measles\nrecommendations:\n  - {key: R01, page: '220', statement: S.}\n");
    expect(readL1(p)[0]).toEqual({ key: "R01", iri: "https://smart.who.int/kg/l1/publication/url-who-int-x-measles/recommendation/R01", statement: "S.", location: "p220" });
  });

  it("reads a markdown process table and HTML persona rows", () => {
    const md = "| # | Process Name | Process ID | Personas | Objectives |\n|---|---|---|---|---|\n| D | Administer vaccine | IMMZ.D | Health worker | To give |\n";
    expect(markdownTable(md, ["Process ID"])[0].cells["Process ID"]).toBe("IMMZ.D");
    expect(htmlRows("<tr>\n<td>Caregiver</td>\n<td>A parent</td>\n</tr>")[0].cells).toEqual(["Caregiver", "A parent"]);
  });

  it("reads generic personas from FSH ActorDefinitions", () => {
    const actors = join(dir, "actors");
    mkdirSync(actors);
    writeFileSync(join(actors, "DAK.Persona.X.fsh"), 'Instance: DAK.Persona.X\n* title = "X Person"\n* type = #person\n* description = """\nDoes x.\n\n**ISCO-08**: 1342 (Managers).\n"""\n');
    expect(readFshActors(actors, (p) => p)[0]).toMatchObject({ id: "DAK.Persona.X", title: "X Person", description: "Does x.", iscoCode: ["1342"], personaType: "person" });
  });

  it("takes a guide's identity from the checkout's own declarations, naming no guide", () => {
    expect(sushiCanonical("id: x\ncanonical: http://smart.who.int/x # c\nname: X\n")).toBe("http://smart.who.int/x");
    const bare = mkdtempSync(join(tmpdir(), "guide-"));
    writeFileSync(join(bare, "sushi-config.yaml"), "id: smart.who.int.x\ncanonical: http://smart.who.int/x\n");
    expect(guideIdentity(bare, () => "owner/smart-x")).toEqual({ guide: "smart-x", namespace: "https://smart.who.int/x", repository: "owner/smart-x" });
    mkdirSync(join(bare, "inst"));
    writeFileSync(join(bare, "inst", "smart-y.json"), JSON.stringify({ $schema: "cat-harness-declaration/1.0.0", name: "smart-y", repository: "owner/smart-y" }));
    expect(guideIdentity(bare, () => "owner/smart-x")).toEqual({ guide: "smart-y", namespace: "https://smart.who.int/x", repository: "owner/smart-y" });
    const none = mkdtempSync(join(tmpdir(), "guide-"));
    expect(() => guideIdentity(none, () => "o/r")).toThrow(/guide checkout/);
  });

  it("emits only classes the KG class lists hold", () => {
    expect(unpinnedClasses()).toEqual([]);
  });
});
