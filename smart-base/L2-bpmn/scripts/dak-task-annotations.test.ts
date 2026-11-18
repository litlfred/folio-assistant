import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { extract } from "../schemas/extract-bpmn";
import { DakTaskAnnotationsSchema, sidecarPath, taskAnnotationsJsonSchema } from "../schemas/task-annotations";
import {
  activityCode,
  cleanLines,
  coverage,
  decodeXml,
  htmlText,
  main,
  parseIgPageAnnotations,
  reEscape,
  followsInSequence,
  matchAnnotations,
  parseAnnotationBlocks,
  readActivityLinks,
  readBpmnNodes,
} from "./dak-task-annotations";

// An annotations block as who-iris holds it: page numbers, a running head and the side tabs
// interleaved with the items, one item name over two lines, a bullet wrapped over two lines.
const HEAD = "Digital adaptation kit for immunizations";
const l1 = [
  ...Array(5).fill(HEAD),
  "B. PLAN SERVICE DELIVERY BUSINESS PROCESS NOTES AND ANNOTATIONS",
  "1.",
  "Review past vaccination records to",
  "estimate vaccines needed",
  "»",
  "The distribution of vaccines is commonly based",
  "on the total target population.",
  "37",
  "personas",
  "workflows",
  HEAD,
  "2.",
  "Record details on planning sheet",
  "»",
  "The health worker records the details.",
  "3.",
  "Sufficient stock in immediate location?",
  "»",
  "The health worker checks the stock.",
  "9.",
  "Not a step: out of sequence",
  "4. Order additional stock » Requested from the logistics system.",
  "Fig. 7. Workflow C: client registration",
].join("\n");

const bpmnB = `<?xml version="1.0"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:zeebe="http://camunda.org/schema/zeebe/1.0" id="Definitions_B" targetNamespace="http://smart.who.int/immunizations">
  <bpmn:collaboration id="C"><bpmn:participant id="P" name="Health worker" processRef="Process_B" /></bpmn:collaboration>
  <bpmn:process id="Process_B" isExecutable="false">
    <bpmn:startEvent id="Start" />
    <bpmn:userTask id="IMMZ.B1" name="1. Review past vaccination records to estimate vaccines needed" />
    <bpmn:task id="IMMZ.B.2" name="Record details on planning sheet" />
    <bpmn:exclusiveGateway id="IMMZ.B3" name="3. Sufficient stock in immediate location?" />
    <bpmn:businessRuleTask id="IMMZ.B5" name="5. Get needed stock">
      <bpmn:extensionElements><zeebe:calledDecision decisionId="IMMZ.B5.DT.Stock" /></bpmn:extensionElements>
    </bpmn:businessRuleTask>
    <bpmn:sequenceFlow id="F1" sourceRef="Start" targetRef="IMMZ.B1" />
  </bpmn:process>
</bpmn:definitions>`;

// TB-style: Modeler ids, the step number only in the label, lanes for personas.
const bpmnTb = `<?xml version="1.0"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_A" targetNamespace="http://smart.who.int/tb">
  <bpmn:process id="Process_A" name="A. Registration">
    <bpmn:laneSet id="LS"><bpmn:lane id="L1" name="Health worker"><bpmn:flowNodeRef>Activity_0abc</bpmn:flowNodeRef></bpmn:lane></bpmn:laneSet>
    <bpmn:task id="Activity_0abc" name="5. Search for the client record" />
    <bpmn:task id="Activity_0def" name="6. Unannotated step" />
  </bpmn:process>
</bpmn:definitions>`;

describe("dak-task-annotations reading the L1 text", () => {
  test("dropsPageNumbersTabsAndRunningHeads", () => {
    const lines = cleanLines(l1);
    expect(lines).not.toContain("37");
    expect(lines).not.toContain("personas");
    expect(lines).not.toContain(HEAD);
  });

  test("acceptsAnItemNumberOnlyInSequence", () => {
    expect(followsInSequence(undefined, "1")).toBe(true);
    expect(followsInSequence("3", "4")).toBe(true);
    expect(followsInSequence("3", "3.1")).toBe(true);
    expect(followsInSequence("3.1", "3.2")).toBe(true);
    expect(followsInSequence("3.2", "4")).toBe(true);
    expect(followsInSequence("3", "9")).toBe(false);
    expect(followsInSequence("3", "37")).toBe(false);
  });

  test("splitsABlockIntoNumberedItemsWithTheirBullets", () => {
    const [block] = parseAnnotationBlocks(l1);
    expect(block!.letter).toBe("B");
    expect(block!.items.map((i) => i.item)).toEqual(["1", "2", "3", "4"]);
    expect(block!.items[0]!.name).toBe("Review past vaccination records to estimate vaccines needed");
    expect(block!.items[0]!.bullets).toEqual(["The distribution of vaccines is commonly based on the total target population."]);
    expect(block!.items[2]!.bullets.join(" ")).toContain("checks the stock. 9. Not a step: out of sequence");
    expect(block!.items[3]).toEqual({ item: "4", name: "Order additional stock", bullets: ["Requested from the logistics system."] });
  });
});

// The TB DAK's layout: no process letter on the heading, item 1 printed before it (the heading
// sits in the right-hand column), an item number printed twice, the next figure's box labels and
// the next document section straight after the last item.
const tbL1 = [
  "1. Was the visit initiated by the client or by the provider?",
  "» Depending on the reasons that triggered the encounter.",
  "workflows",
  "REGISTRATION BUSINESS PROCESS NOTES AND ANNOTATIONS",
  "» Patient-initiated health-care pathway.",
  "2.",
  "2. Client arrives at facility",
  "» The client arrives at the health-care facility.",
  "3. Arrive at the client's location",
  "» The health worker arrives.",
  "2. Assess medical history",
  "5. Is referral",
  "Fig. 7 Workflow C: diagnosis business process",
  "SCREENING BUSINESS PROCESS NOTES AND ANNOTATIONS",
  "1. Provide pre-screening information",
  "» Information is given.",
  "2. Make an informed decision",
  "» The client decides.",
  "2.1 Not a section: a sub-step under item 2",
  "1.2 Principles of TB screening",
  "5.1 Simplified list of core data elements",
].join("\n");

describe("dak-task-annotations reading a TB-style layout", () => {
  test("lettersHeadingsInOrderAndStartsAtAnItem1PrintedBeforeTheHeading", () => {
    const [a, b] = parseAnnotationBlocks(tbL1);
    expect([a!.letter, b!.letter]).toEqual(["A", "B"]);
    expect(a!.items[0]).toEqual({
      item: "1",
      name: "Was the visit initiated by the client or by the provider?",
      bullets: ["Depending on the reasons that triggered the encounter.", "Patient-initiated health-care pathway."],
    });
  });

  test("readsANumberPrintedTwiceAsOneItem_andEndsWhereTheNumberingGoesBack", () => {
    const [a, b] = parseAnnotationBlocks(tbL1);
    expect(a!.items.map((i) => [i.item, i.name])).toEqual([
      ["1", "Was the visit initiated by the client or by the provider?"],
      ["2", "Client arrives at facility"],
      ["3", "Arrive at the client's location"],
    ]);
    // "2. Assess medical history" after item 3 is the next figure's box label: the block ends.
    expect(a!.items[2]!.bullets).toEqual(["The health worker arrives."]);
    // A dotted heading under the current item stays in its text; one that goes back ends the block.
    expect(b!.items.map((i) => i.item)).toEqual(["1", "2"]);
    expect(b!.items[1]!.bullets).toEqual(["The client decides. 2.1 Not a section: a sub-step under item 2"]);
  });
});

// An IG page that writes its annotations as an HTML list (smart-dak-chud's business-processes.md):
// no step numbers, and the list skips a step the BPMN draws (a gateway).
const igPage = `### Overview
#### Process A: Provision of epidemiological data
**Objective:** Routinely collect epidemiological data.
**Business process notes and annotations:**
<ol>
    <li>
        Evaluate the patient against clinical case definition
        <ul>
            <li>The healthcare worker evaluates the patient's symptoms.</li>
            <li><strong>Guidelines:</strong> <a href="https://www.who.int/x">DENGUE Guidelines.pdf</a></li>
        </ul>
    </li>
    <li>
        Correct fixable data quality issues
        <ul><li>Fixable issues are corrected &amp; resubmitted.</li></ul>
    </li>
</ol>
#### Process B: Provision of meteorological data
**Business process notes and annotations:**
<ol><li>Publish data<ul><li>Published on the node.</li></ul></li></ol>`;

const bpmnChud = `<?xml version="1.0"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" id="Definitions_A" targetNamespace="http://smart.who.int/chud">
  <bpmn:process id="Process_A" name="A. Provision of epidemiological data">
    <bpmn:task id="Activity_eval" name="2. Evaluate the patient against clinical case definition" />
    <bpmn:exclusiveGateway id="Gateway_q" name="7. Were data quality issues found?" />
    <bpmn:task id="Activity_fix" name="8. Correct fixable data quality issues" />
  </bpmn:process>
</bpmn:definitions>`;

describe("dak-task-annotations reading an IG page's HTML list", () => {
  test("readsStepsAndNotesFromTheHtmlList_unnumbered", () => {
    const [a, b] = parseIgPageAnnotations(igPage);
    expect(a).toMatchObject({ letter: "A", numbered: false });
    expect(a!.items).toEqual([
      { item: "1", name: "Evaluate the patient against clinical case definition", bullets: ["The healthcare worker evaluates the patient's symptoms.", "Guidelines: DENGUE Guidelines.pdf"] },
      { item: "2", name: "Correct fixable data quality issues", bullets: ["Fixable issues are corrected & resubmitted."] },
    ]);
    expect(b!.items.map((i) => i.name)).toEqual(["Publish data"]);
  });

  test("leavesNoMarkupInHtmlText", () => {
    expect(htmlText("<scr<script>ipt>alert(1)</script> done")).toBe("alert(1) done");
    // Escaped text keeps its words; the brackets it decodes to are removed.
    expect(htmlText("a &lt;b&gt; tag &amp; text")).toBe("a b tag & text");
    expect(htmlText("x &lt; y and y &gt; z")).toBe("x y and y z");
    expect(htmlText("&lt;script&gt;alert(1)&lt;/script&gt;")).toBe("scriptalert(1)/script");
  });

  test("matchesAnUnnumberedListByNameNeverByPosition", () => {
    const doc = matchAnnotations({ prefix: "CHUD", document: "page", bpmnPath: "CHUD_A.bpmn", xml: bpmnChud, blocks: parseIgPageAnnotations(igPage) })!;
    // List item 2 is step 8: by position it would have joined step 2, or the step-7 gateway.
    expect(doc.tasks.map((t) => [t.source.item, t.bpmnTask, t.activityId, t.matchedBy])).toEqual([
      ["1", "Activity_eval", "CHUD.A2", "name"],
      ["2", "Activity_fix", "CHUD.A8", "name"],
    ]);
    expect(doc.unannotated).toEqual([]);
  });
});

describe("dak-task-annotations matching to BPMN", () => {
  test("normalisesActivityIds", () => {
    expect(activityCode("IMMZ.B.1", "IMMZ")).toBe("IMMZ.B1");
    expect(activityCode("IMMZ.C4.Create client record", "IMMZ")).toBe("IMMZ.C4");
    expect(activityCode("IMMZ.D2.DT.BCG", "IMMZ")).toBe("IMMZ.D2");
    expect(activityCode("Activity_0abc", "IMMZ")).toBeNull();
  });

  test("refusesAPrefixThatIsNotADakIdPrefix", () => {
    // The prefix becomes part of a regular expression: it is checked, then escaped.
    expect(() => activityCode("IMMZ.B1", "I.*")).toThrow(/not a DAK id prefix/);
    expect(() => activityCode("IMMZ.B1", "IMMZ\\")).toThrow(/not a DAK id prefix/);
    expect(reEscape("a.b\\c(d)")).toBe("a\\.b\\\\c\\(d\\)");
    expect(main(["--prefix", "(.*)+$", "--document", "d", "--l1", "x.md", "--bpmn", "."])).toBe(2);
  });

  test("decodesXmlAttributeTextOnce", () => {
    expect(decodeXml("Check &amp;lt;stock&amp;gt;")).toBe("Check &lt;stock&gt;");
    expect(decodeXml("A &lt;b&gt; &amp; &quot;c&quot;&#10;d")).toBe('A <b> & "c" d');
  });

  test("readsEveryActivityKindWithLaneOrPoolAndCalledDecision", () => {
    const nodes = readBpmnNodes(bpmnB);
    expect(nodes.map((n) => n.kind)).toEqual(["userTask", "task", "exclusiveGateway", "businessRuleTask"]);
    expect(nodes[0]!.lane).toBe("Health worker");
    expect(nodes[3]!.calledDecisions).toEqual(["IMMZ.B5.DT.Stock"]);
    expect(readBpmnNodes(bpmnTb)[0]!.lane).toBe("Health worker");
  });

  test("matchesById_enrichesFromWorkbooks_andListsTheRest", () => {
    const links = readActivityLinks(
      [
        { name: "Functional", rows: [["Requirement ID", "Activity ID and name", "As a…"], ["IMMZ.FXNREQ.018", "IMMZ.B1.Review past records", "Health worker"]] },
        { name: "IMMZ.B", rows: [["Activity ID", "Data element ID", "Data element label"], ["IMMZ.B2.Record details\nOR\nIMMZ.B1.Review", "IMMZ.B.DE.1", "Session date"]] },
        { name: "Stock", rows: [["", "Decision ID", "IMMZ.B5.DT.Stock"], ["", "Trigger", "IMMZ.B1 Review past records"]] },
      ],
      "IMMZ",
    );
    const doc = matchAnnotations({ prefix: "IMMZ", document: "9789240099456-eng", bpmnPath: "IMMZ.B.bpmn", xml: bpmnB, blocks: parseAnnotationBlocks(l1), links })!;
    expect(doc.process).toBe("IMMZ.B");
    const b1 = doc.tasks.find((t) => t.activityId === "IMMZ.B1")!;
    expect(b1).toMatchObject({
      bpmnTask: "IMMZ.B1",
      matchedBy: "id",
      personas: ["Health worker"],
      requirements: ["IMMZ.FXNREQ.018"],
      dataElements: ["IMMZ.B.DE.1"],
      decisionTables: ["IMMZ.B5.DT.Stock"],
      source: { document: "9789240099456-eng", item: "1" },
    });
    expect(b1.description).toBe("- The distribution of vaccines is commonly based on the total target population.");
    expect(doc.tasks.find((t) => t.activityId === "IMMZ.B2")!.bpmnTask).toBe("IMMZ.B.2");
    expect(doc.tasks.find((t) => t.activityId === "IMMZ.B3")!.bpmnTask).toBe("IMMZ.B3");
    // Item 4 has no node; IMMZ.B5 has no item. Neither is guessed.
    expect(doc.unmatched).toEqual([{ item: "4", name: "Order additional stock", reason: "no BPMN node has id IMMZ.B4, label step 4, or this name" }]);
    expect(doc.unannotated).toEqual(["IMMZ.B5"]);
    expect(DakTaskAnnotationsSchema.safeParse(doc).success).toBe(true);
  });

  test("matchesModelerIdsByStepNumberAndFileLetter", () => {
    const blocks = parseAnnotationBlocks("A. REGISTRATION BUSINESS PROCESS NOTES AND ANNOTATIONS\n5.\nSearch for the client record\n»\nSearch first.");
    const doc = matchAnnotations({ prefix: "TB", document: "tb-dak", bpmnPath: "a-registration.bpmn", xml: bpmnTb, blocks })!;
    expect(doc.tasks).toHaveLength(0);
    // Item 5 cannot be first in a list: the sequence starts at 1. A real block does.
    const full = parseAnnotationBlocks(
      "A. REGISTRATION BUSINESS PROCESS NOTES AND ANNOTATIONS\n" + [1, 2, 3, 4].map((n) => `${n}.\nStep ${n}\n»\nText.`).join("\n") + "\n5.\nSearch for the client record\n»\nSearch first.",
    );
    const tb = matchAnnotations({ prefix: "TB", document: "tb-dak", bpmnPath: "a-registration.bpmn", xml: bpmnTb, blocks: full })!;
    expect(tb.tasks).toEqual([expect.objectContaining({ bpmnTask: "Activity_0abc", activityId: "TB.A5", matchedBy: "step-number", personas: ["Health worker"] })]);
    expect(tb.unannotated).toEqual(["Activity_0def"]);
    expect(tb.unmatched.map((u) => u.item)).toEqual(["1", "2", "3", "4"]);
  });

  test("keepsAnAdjudicatedMatchOnReRun", () => {
    const blocks = parseAnnotationBlocks(l1);
    const first = matchAnnotations({ prefix: "IMMZ", document: "d", bpmnPath: "IMMZ.B.bpmn", xml: bpmnB, blocks })!;
    const previous = { ...first, tasks: [...first.tasks, { ...first.tasks[0]!, bpmnTask: "IMMZ.B5", activityId: "IMMZ.B4", name: "Order additional stock", matchedBy: "adjudicated" as const, source: { document: "d", item: "4" } }] };
    const again = matchAnnotations({ prefix: "IMMZ", document: "d", bpmnPath: "IMMZ.B.bpmn", xml: bpmnB, blocks, previous })!;
    expect(again.tasks.find((t) => t.source.item === "4")).toMatchObject({ bpmnTask: "IMMZ.B5", matchedBy: "adjudicated" });
    expect(again.unmatched).toEqual([]);
    expect(again.unannotated).toEqual([]);
  });
});

describe("dak-task-annotations coverage report", () => {
  test("reportsGapsDanglingIdsAndUndeclaredLinks_withoutFailing", () => {
    const dir = mkdtempSync(join(tmpdir(), "dak-task-annotations-report-"));
    const path = join(dir, "IMMZ.B.bpmn");
    writeFileSync(path, bpmnB);
    const links = readActivityLinks(
      [
        { name: "F", rows: [["Requirement ID", "Activity ID and name"], ["IMMZ.FXNREQ.018", "IMMZ.B1.Review"]] },
        { name: "READ ME", rows: [["Decision ID", "The decision ID should correspond to the number in the overview table"]] },
      ],
      "IMMZ",
    );
    expect([...links.declared]).toEqual(["IMMZ.FXNREQ.018"]);
    const doc = matchAnnotations({ prefix: "IMMZ", document: "d", bpmnPath: path, xml: bpmnB, blocks: parseAnnotationBlocks(l1), links })!;
    // A person's edit names a node the BPMN does not hold, and a requirement no workbook declares.
    doc.tasks.push({ ...doc.tasks[0]!, bpmnTask: "IMMZ.B9", activityId: "IMMZ.B9", requirements: ["IMMZ.FXNREQ.999"], source: { document: "d", item: "9" } });
    writeFileSync(sidecarPath(path), JSON.stringify(doc));
    const [row] = coverage([sidecarPath(path)], links);
    expect(row).toMatchObject({ process: "IMMZ.B", annotated: 4, unannotated: 1, unmatched: 1, dangling: ["IMMZ.B9"] });
    // Only linked ids count: IMMZ.B5's calledDecision belongs to no annotation, so it is not listed.
    expect(row!.unresolved).toEqual(["IMMZ.FXNREQ.999"]);
  });
});

describe("dak-task-annotations in the knowledge graph", () => {
  test("sidecarBecomesDakTasksThatDescribeBpmnTasks", () => {
    const dir = mkdtempSync(join(tmpdir(), "dak-task-annotations-"));
    const path = join(dir, "IMMZ.B.bpmn");
    writeFileSync(path, bpmnB);
    const ann = matchAnnotations({
      prefix: "IMMZ",
      document: "9789240099456-eng",
      bpmnPath: path,
      xml: bpmnB,
      blocks: parseAnnotationBlocks(l1),
      links: readActivityLinks([{ name: "F", rows: [["Requirement ID", "Activity ID and name"], ["IMMZ.FXNREQ.018", "IMMZ.B1.Review"]] }], "IMMZ"),
    })!;
    writeFileSync(sidecarPath(path), JSON.stringify(ann));
    const { doc } = extract(bpmnB, path, new Map(), ann);
    const tasks = doc.nodes.filter((n) => n.type === "dak-task");
    expect(tasks.map((n) => n.properties.activityId)).toEqual(["IMMZ.B1", "IMMZ.B2", "IMMZ.B3"]);
    const b1 = tasks[0]!;
    expect(b1.id).toBe("https://smart.who.int/immunizations/dak-task/immz-b1");
    const from = (p: string) => doc.edges.filter((e) => e.source === b1.id && e.predicate === p).map((e) => e.target);
    expect(from("describes")).toEqual(["https://smart.who.int/immunizations/artifact/Definitions_B#IMMZ.B1"]);
    expect(from("specifiedBy")).toEqual(["https://smart.who.int/immunizations/requirement/immz-fxnreq-018"]);
    expect(from("performedBy")).toEqual(["https://smart.who.int/immunizations/persona/health-worker"]);
    // Every activity type is read, so the business-rule task and the gateway are in the graph.
    expect(doc.nodes.find((n) => n.id.endsWith("#IMMZ.B5"))!.properties.taskType).toBe("businessRuleTask");
    expect(doc.nodes.find((n) => n.id.endsWith("#IMMZ.B3"))!.type).toBe("bpmn-gateway");
    expect(doc.wasDerivedFrom?.map((s) => s.path)).toEqual([path, sidecarPath(path)]);
  });

  test("aStepNumberMatchIsInferredWithEvidence_andAnAdHocSubProcessIsATask", () => {
    const dir = mkdtempSync(join(tmpdir(), "dak-task-annotations-tb-"));
    const xml = bpmnTb.replace(
      '<bpmn:task id="Activity_0def"',
      '<bpmn:adHocSubProcess id="Activity_adhoc" name="Clinical evaluation"><bpmn:task id="Activity_in" name="4. Inside" /></bpmn:adHocSubProcess><bpmn:task id="Activity_0def"',
    );
    const path = join(dir, "a-registration.bpmn");
    writeFileSync(path, xml);
    const blocks = parseAnnotationBlocks("A. REGISTRATION BUSINESS PROCESS NOTES AND ANNOTATIONS\n" + [1, 2, 3, 4, 5].map((n) => `${n}.\nStep ${n}\n»\nText.`).join("\n"));
    const ann = matchAnnotations({ prefix: "TB", document: "tb", bpmnPath: path, xml, blocks })!;
    const { doc } = extract(xml, path, new Map(), ann);
    const describes = doc.edges.filter((e) => e.predicate === "describes");
    expect(describes.length).toBe(2);
    for (const e of describes) {
      expect(e.derivation).toBe("inferred");
      expect(e.evidence?.location).toBe(sidecarPath(path));
    }
    const adhoc = doc.nodes.find((n) => n.id.endsWith("#Activity_adhoc"))!;
    expect(adhoc.properties).toMatchObject({ taskType: "adHocSubProcess", isSubProcess: true });
    expect(doc.nodes.find((n) => n.id.endsWith("#Activity_in"))!.properties.parent).toBe(adhoc.id);
  });

  test("publishesAJsonSchema", () => {
    const s = taskAnnotationsJsonSchema();
    expect(s.$id).toBe("https://litlfred.github.io/smart-base/schemas/dak-task-annotations/v1");
    expect((s.properties as Record<string, unknown>).tasks).toBeDefined();
  });
});
