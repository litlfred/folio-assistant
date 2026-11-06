/**
 * `check:journey-refs` over two fixture checkouts: one where every reference a
 * journey and a workshop name resolves, and the same checkout with one broken
 * reference of each sort. Every person in them is fictional.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { checkJourneyRefsAt } from "../journeys/check.ts";
import { clearDeclaredVisualisers } from "../viewer-declarations.ts";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

type Files = Record<string, string | object>;

const step = (id: string, extra: object = {}) => ({
  id,
  title: `Step ${id}`,
  lead: "kamal",
  experiences: [{ actor: "kamal", doing: `does ${id}`, emotion: 0 }, { actor: "reem", doing: "helps" }],
  ...extra,
});

/** A checkout of two instances: `base` holds actors, a catalogue beside its ArchiMate, a requirement and an example index; `demo` holds the journeys, the BPMN they name (instance-relative) and a workshop. */
function clean(): Files {
  return {
    "base/base.json": {
      name: "base",
      directories: [
        { id: "scenarios", path: "scenarios/", graphTypologies: ["scenarios"] },
        { id: "processes", path: "processes/", graphTypologies: ["processes"] },
        { id: "skills", path: "skills/", graphTypologies: ["skills"] },
        { id: "code-lists", path: "code-lists/", graphTypologies: ["code-list"] },
        { id: "archimate", path: "archimate/", graphTypologies: ["archimate"] },
        { id: "building-blocks", path: "archimate/building-blocks/", graphTypologies: ["building-blocks"] },
        { id: "fhir", path: "fhir/", graphTypologies: ["fhir-artifact-index"] },
      ],
    },
    "base/scenarios/actors/kamal.json": { id: "kamal", title: "Kamal (pilgrim)", meta: { persona: { name: "Kamal", initials: "KM", color: "#0f766e" } } },
    "base/scenarios/actors/reem.json": { id: "reem", title: "Reem (nurse)" },
    "base/scenarios/stories.json": { stories: [{ id: "pilgrim-1", role: { role: "pilgrim" }, want: "Show my summary abroad" }] },
    "base/archimate/building-blocks/blocks.json": {
      $schema: "building-blocks/0.1.0",
      layers: [{ id: "apps", label: "Apps" }],
      blocks: [{ id: "wallet", name: "Wallet", kind: "tool", layer: "apps", jurisdiction: "International", what: "Holds the summary." }],
    },
    "base/code-lists/trust.json": { $schema: "folio-code-list/v1", id: "trust", title: "T", description: "d", source: { note: "f" }, codes: [{ code: "signed", label: "Signed", definition: "d" }] },
    "demo/processes/care.bpmn": '<?xml version="1.0"?><bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Defs"><bpmn:process id="Process_Care"><bpmn:task id="Task_Scan" name="Scan"/></bpmn:process></bpmn:definitions>',
    "base/skills/requirements/req-001.json": { id: "req:stt-ver-001", title: "Verify" },
    "base/fhir/index.json": { artifacts: [{ key: "Bundle/kamal-ips", title: "Kamal's summary" }] },
    "demo/demo.json": {
      name: "demo",
      needs: ["base"],
      directories: [
        { id: "user-scenarios", path: "journeys/", graphTypologies: ["user-scenario"] },
        { id: "workshops", path: "workshops/", graphTypologies: ["workshop"] },
      ],
    },
    "demo/docs/images/p4.png": "\x89PNG fixture",
    "demo/journeys/p-all.json": { $schema: "user-scenario/0.2.0", id: "p-all", title: "The pilgrimage", description: "d", personas: ["kamal"], steps: [] },
    "demo/journeys/p3.json": { $schema: "user-scenario/0.1.0", id: "p3-ill", title: "P3", description: "d", personas: ["kamal", "reem"], steps: [step("P3")] },
    "demo/journeys/p4.json": {
      $schema: "user-scenario/0.2.0",
      id: "p4-scanned",
      title: "P4",
      description: "d",
      personas: ["kamal", "reem"],
      partOf: "p-all",
      follows: "p3-ill",
      trustLadder: "trust",
      illustrationStyle: { prompt: "Flat illustration, no readable text.", cast: [{ actor: "reem", description: "Saudi nurse, 30s, navy scrubs." }] },
      steps: [
        step("P4", {
          stories: ["pilgrim-1"],
          realisedBy: [{ process: "processes/care.bpmn", tasks: ["Task_Scan"] }],
          uses: [{ block: "wallet", role: "shows the QR" }],
          requirements: ["STT-VER-001"],
          preconditions: [{ title: "Keys shared", description: "d", requirements: ["req:stt-ver-001"] }],
          examples: ["Bundle/kamal-ips"],
          record: { state: "signed", description: "d", heldWhere: "phone" },
          handoff: { summary: "QR", from: "kamal", to: "reem" },
          illustration: { src: "docs/images/p4.png", alt: "Reem scans the code on Kamal's phone." },
        }),
      ],
    },
    "demo/workshops/w.json": {
      $schema: "workshop/0.1.0",
      id: "w",
      title: "W",
      description: "d",
      scenarios: ["p3-ill", "p4-scanned"],
      modules: [{ id: "M1", title: "M1" }],
      steps: [{ scenario: "p4-scanned", step: "P4", questions: [{ module: "M1", text: "Who signs?" }] }],
      discussion: [{ id: "q1", module: "M1", theme: "t", question: "q", steps: ["p3-ill#P3"] }],
      resources: [{ id: "r1", title: "R", kind: "job-aid", steps: ["p4-scanned#P4"] }],
    },
  };
}

function checkout(files: Files) {
  const root = mkdtempSync(join(tmpdir(), "journey-refs-"));
  made.push(root);
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(root, dirname(rel)), { recursive: true });
    writeFileSync(join(root, rel), typeof body === "string" ? body : JSON.stringify(body, null, 2));
  }
  clearDeclaredVisualisers();
  return join(root, "demo");
}

/** Edit a JSON file of a fixture in place: a fixture is free-form JSON, typed loosely on purpose. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function edit(files: Files, rel: string, f: (x: any) => void): void {
  const x = JSON.parse(JSON.stringify(files[rel]));
  f(x);
  files[rel] = x;
}

describe("a checkout whose every reference resolves", () => {
  const report = checkJourneyRefsAt(checkout(clean()));
  test("passes, having examined every sort of reference", () => {
    expect(report.findings).toEqual([]);
    expect(report.couldNotDetermine).toEqual([]);
    expect(report.undetermined).toBeUndefined();
    expect(report.journeys).toBe(3);
    expect(report.workshops).toBe(1);
    // personas 1+2+2, step actors, stories, process + task, block, two requirements,
    // example, record state, illustration, cast, handoff 2, follows, partOf, ladder, workshop refs.
    expect(report.references).toBeGreaterThanOrEqual(25);
  });
});

describe("the negative fixture: one broken reference of each sort", () => {
  const files = clean();
  edit(files, "demo/journeys/p4.json", (j) => {
    j.personas.push("ghost");
    j.follows = "p2-missing";
    j.partOf = "no-group";
    j.trustLadder = "trust";
    j.views = [{ model: "0.1.0", view: "no-such-view" }];
    j.illustrationStyle.cast.push({ actor: "nobody", description: "x" });
    const s = j.steps[0];
    s.experiences.push({ actor: "ghost", doing: "haunts" });
    s.stories.push("ghost-story");
    s.realisedBy.push({ process: "processes/care.bpmn", tasks: ["Task_Missing"] }, { process: "processes/absent.bpmn" });
    s.uses.push({ block: "nowhere", role: "r" });
    s.requirements.push("STT-VER-404");
    s.examples.push("Bundle/missing");
    s.record.state = "unknown-state";
    s.handoff.to = "stranger";
    // An end in words is a place or a system, not an actor reference.
    s.handoff.from = "Thai hospital";
    s.fhirChanges = [{ resource: "Bundle", change: "c", examples: ["Bundle/also-missing"] }];
    s.illustration.src = "docs/images/missing.png";
  });
  edit(files, "demo/workshops/w.json", (w) => {
    w.scenarios.push("no-journey");
    w.steps.push({ scenario: "p4-scanned", step: "P9" }, { scenario: "nope", step: "P1" });
    w.discussion[0].steps.push("p3-ill#P0", "not-a-ref");
    w.presentation = { recordOf: "nobody", deviceDemo: { href: "app/", screens: [{ id: "S9", title: "t", steps: ["P99"] }] } };
  });
  // A catalogue left in a journeys directory is not a catalogue: the block it holds does not resolve.
  files["demo/journeys/blocks.json"] = {
    $schema: "building-blocks/0.1.0",
    layers: [{ id: "apps", label: "Apps" }],
    blocks: [{ id: "nowhere", name: "N", kind: "tool", layer: "apps", jurisdiction: "International", what: "w" }],
  };
  files["demo/journeys/broken.json"] = { $schema: "user-scenario/0.2.0", id: "broken", title: "B", description: "d", personas: ["kamal"], steps: [step("B1")] };
  const report = checkJourneyRefsAt(checkout(files));
  const messages = report.findings.map((f) => `${f.file} · ${f.at}: ${f.message}`);
  const has = (re: RegExp) => expect(messages.some((m) => re.test(m)), `${re} in\n${messages.join("\n")}`).toBe(true);

  test("each broken reference is a finding naming its file and step", () => {
    has(/journeys\/p4\.json · \(root\): persona "ghost" is no actor/);
    has(/follows "p2-missing"/);
    has(/partOf "no-group"/);
    has(/illustrationStyle\.cast actor "nobody"/);
    has(/view "no-such-view" of model "0\.1\.0"/);
    has(/step P4: experience actor "ghost"/);
    has(/step P4: story "ghost-story"/);
    has(/step P4: realisedBy task "Task_Missing" is no element of processes\/care\.bpmn/);
    has(/step P4: realisedBy process "processes\/absent\.bpmn" is no file/);
    has(/step P4: uses block "nowhere"/);
    has(/step P4: requirement "STT-VER-404"/);
    has(/step P4: FHIR example "Bundle\/missing"/);
    has(/step P4: record\.state "unknown-state"/);
    has(/step P4: handoff\.to "stranger"/);
    has(/step P4: illustration\.src "docs\/images\/missing\.png"/);
  });
  test("a workshop's step refs must name a journey and a step of it", () => {
    has(/workshops\/w\.json · scenarios\[2\]: scenario "no-journey"/);
    has(/steps\[1\]: step "P9" is no step of journey p4-scanned/);
    has(/steps\[2\]: scenario "nope"/);
    has(/discussion q1: step "P0" is no step of journey p3-ill/);
    has(/discussion q1: step ref "not-a-ref" is not <scenario>#<step>/);
    has(/presentation: recordOf "nobody" is no actor/);
    has(/presentation\.deviceDemo S9: step "P99" is no step of a journey the workshop teaches/);
  });
  test("a FHIR change's examples resolve as the step's do; a hand-off end in words is not an actor", () => {
    has(/step P4: FHIR example "Bundle\/also-missing"/);
    expect(messages.some((m) => m.includes("Thai hospital"))).toBe(false);
  });
  test("a file that does not parse is a finding, not a skip", () => {
    has(/journeys\/broken\.json · \(root\): does not parse/);
  });
  test("nothing that resolves is reported", () => {
    expect(messages.some((m) => !m.includes("does not parse") && /"kamal"|"reem"|"wallet"|"Task_Scan"|"pilgrim-1"/.test(m))).toBe(false);
  });
});

describe("an artifact index built at publish", () => {
  test("absent from the checkout: an example it would hold is could-not-determine, never missing", () => {
    const files = clean();
    delete files["base/fhir/index.json"];
    const report = checkJourneyRefsAt(checkout(files));
    expect(report.findings).toEqual([]);
    expect(report.couldNotDetermine.map((f) => `${f.file} · ${f.at}`)).toEqual(["journeys/p4.json · step P4"]);
    expect(report.couldNotDetermine[0]!.message).toContain('"Bundle/kamal-ips"');
    expect(report.couldNotDetermine[0]!.message).toContain("built at publish");
  });

  test("present without the key: the example is missing, a finding", () => {
    const files = clean();
    edit(files, "demo/journeys/p4.json", (j) => {
      j.steps[0].examples = ["Bundle/missing"];
    });
    const report = checkJourneyRefsAt(checkout(files));
    expect(report.couldNotDetermine).toEqual([]);
    expect(report.findings.map((f) => f.message)).toEqual(['FHIR example "Bundle/missing" is in no declared fhir-artifact-index']);
  });
});

describe("the command", () => {
  test("exits 2, not 0 or 1, when the only open reference is in an index built at publish", () => {
    const files = clean();
    delete files["base/fhir/index.json"];
    const run = spawnSync("bun", [join(import.meta.dir, "..", "check-journey-refs.ts"), "--root", checkout(files)], { encoding: "utf8" });
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("could not be determined");
  });

  const SCRIPT = join(import.meta.dir, "..", "check-journey-refs.ts");
  test("exits 0 on the clean checkout and 1 on a broken one, naming the finding", () => {
    const ok = spawnSync("bun", [SCRIPT, "--root", checkout(clean())], { encoding: "utf8" });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain("✓ journey-refs:");
    const files = clean();
    edit(files, "demo/journeys/p4.json", (j) => {
      j.steps[0].stories = ["ghost-story"];
    });
    const bad = spawnSync("bun", [SCRIPT, "--root", checkout(files)], { encoding: "utf8" });
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain('story "ghost-story"');
  });
});
