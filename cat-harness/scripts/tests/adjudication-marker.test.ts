/**
 * `<folio:adjudication codes="…"/>` — the harness half of bean `5vo9`.
 *
 * @module scripts/tests/adjudication-marker
 * @graphNode none — a test
 *
 * The document contract lives in `folio-assistant-core/schemas/adjudication.ts`
 * and is tested there. This covers what the DIAGRAM declares, and every case
 * below is a refusal, because a marker that only added a word to a diagram
 * would check nothing.
 *
 * The one worth reading is §"a mechanical actor may not judge": the constraint
 * existed on `adjudication.bpmn`'s judge step as a `folio:fulfilment` and
 * nothing tied it to the judgement, so a NEW adjudication step could omit it
 * and no gate would notice.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadProcessModel } from "../../src/workflow/process-model.js";

/** One activity carrying whatever extension XML the case needs. */
function fixture(activityExt: string, type = "task"): string {
  const dir = mkdtempSync(join(tmpdir(), "adjudication-"));
  const p = join(dir, "p.bpmn");
  writeFileSync(
    p,
    `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:folio="https://litlfred.github.io/folio-assistant/bpmn"
                  targetNamespace="urn:t">
  <bpmn:process id="Process_T" name="T" isExecutable="false">
    <bpmn:startEvent id="Start_T" name="Start"/>
    <bpmn:${type} id="A_T" name="Judge it">
      <bpmn:extensionElements>${activityExt}</bpmn:extensionElements>
    </bpmn:${type}>
  </bpmn:process>
</bpmn:definitions>
`,
  );
  return p;
}

const JUDGE = '<folio:fulfilment kinds="person agent" reason="a judgement, never a program"/>';
const THREE = '<folio:adjudication codes="stands scope dispensation"/>';

describe("a mechanical actor may not judge", () => {
  test("REFUSES an adjudication whose step a `system` actor could perform", async () => {
    // The owner: "ONLY agentic human actor". `system` is this repository's
    // mechanical kind. If a program can decide it, it is computable and
    // belongs in a DMN table behind <folio:decision/>.
    await expect(
      loadProcessModel(
        fixture(
          `${THREE}<folio:fulfilment kinds="person agent system" reason="whoever is free"/>`,
        ),
      ),
    ).rejects.toThrow(/Only `person` and `agent` may judge/);
  });

  test("REFUSES `external` too — outside the instance is not a judge here", async () => {
    await expect(
      loadProcessModel(
        fixture(`${THREE}<folio:fulfilment kinds="person external" reason="anyone"/>`),
      ),
    ).rejects.toThrow(/Only `person` and `agent` may judge/);
  });

  test("REFUSES an adjudication with NO fulfilment, rather than defaulting one", async () => {
    // The case the marker exists for. A step that has not said who may judge
    // has not restricted anybody, and defaulting to person+agent would let
    // silence read as a deliberate restriction.
    await expect(loadProcessModel(fixture(THREE))).rejects.toThrow(/no <folio:fulfilment/);
  });

  test("accepts `person agent` — what adjudication.bpmn's judge step declares", async () => {
    const m = await loadProcessModel(fixture(`${THREE}${JUDGE}`));
    expect(m.nodes.get("A_T")!.adjudication).toEqual({
      codes: ["stands", "scope", "dispensation"],
    });
  });
});

describe("the codes are an enum, so a degenerate one is refused", () => {
  test("REFUSES a single permitted answer — assent is not judgement", async () => {
    await expect(
      loadProcessModel(fixture(`<folio:adjudication codes="approved"/>${JUDGE}`)),
    ).rejects.toThrow(/at least two permitted answers/);
  });

  test("REFUSES no codes at all", async () => {
    await expect(
      loadProcessModel(fixture(`<folio:adjudication codes=""/>${JUDGE}`)),
    ).rejects.toThrow(/at least two permitted answers/);
  });

  test("REFUSES a repeated code — the outcome could not say which was chosen", async () => {
    await expect(
      loadProcessModel(fixture(`<folio:adjudication codes="a b a"/>${JUDGE}`)),
    ).rejects.toThrow(/repeats a code/);
  });

  test("splits on any whitespace, so a newline-formatted list works", async () => {
    const m = await loadProcessModel(
      fixture(`<folio:adjudication codes="  stands\n   scope  "/>${JUDGE}`),
    );
    expect(m.nodes.get("A_T")!.adjudication!.codes).toEqual(["stands", "scope"]);
  });
});

describe("it belongs on an activity", () => {
  test("REFUSES the marker on a gateway — nobody performs a gateway", async () => {
    const dir = mkdtempSync(join(tmpdir(), "adjudication-gw-"));
    const p = join(dir, "p.bpmn");
    writeFileSync(
      p,
      `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:folio="https://litlfred.github.io/folio-assistant/bpmn"
                  targetNamespace="urn:t">
  <bpmn:process id="Process_T" name="T" isExecutable="false">
    <bpmn:startEvent id="Start_T" name="Start"/>
    <bpmn:exclusiveGateway id="GW_T" name="which?">
      <bpmn:extensionElements>${THREE}</bpmn:extensionElements>
    </bpmn:exclusiveGateway>
  </bpmn:process>
</bpmn:definitions>
`,
    );
    // `folio:judgement` is the gateway marker; this one says who PERFORMS a
    // judgement, and a gateway is not performed. Keeping them apart is what
    // stops the two becoming one vague annotation.
    await expect(loadProcessModel(p)).rejects.toThrow(/only meaningful on an activity/);
  });

  test("works on a userTask as well as a task", async () => {
    const m = await loadProcessModel(fixture(`${THREE}${JUDGE}`, "userTask"));
    expect(m.nodes.get("A_T")!.adjudication!.codes).toHaveLength(3);
  });
});

/** A judge feeding a gateway, with whatever codes each side declares. */
function branched(declared: string, branchCodes: (string | null)[]): string {
  const dir = mkdtempSync(join(tmpdir(), "adjudication-br-"));
  const p = join(dir, "p.bpmn");
  const flows = branchCodes
    .map((c, i) =>
      c === null
        ? `<bpmn:sequenceFlow id="F_b${i}" sourceRef="GW_T" targetRef="End_T"/>`
        : `<bpmn:sequenceFlow id="F_b${i}" sourceRef="GW_T" targetRef="End_T">` +
          `<bpmn:extensionElements><folio:adjudication code="${c}"/></bpmn:extensionElements>` +
          `</bpmn:sequenceFlow>`,
    )
    .join("\n    ");
  writeFileSync(
    p,
    `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:folio="https://litlfred.github.io/folio-assistant/bpmn"
                  targetNamespace="urn:t">
  <bpmn:process id="Process_T" name="T" isExecutable="false">
    <bpmn:startEvent id="Start_T" name="Start"/>
    <bpmn:task id="A_T" name="Judge it">
      <bpmn:extensionElements><folio:adjudication codes="${declared}"/>${JUDGE}</bpmn:extensionElements>
    </bpmn:task>
    <bpmn:exclusiveGateway id="GW_T" name="which?"/>
    <bpmn:endEvent id="End_T" name="done"/>
    <bpmn:sequenceFlow id="F_s" sourceRef="Start_T" targetRef="A_T"/>
    <bpmn:sequenceFlow id="F_j" sourceRef="A_T" targetRef="GW_T"/>
    ${flows}
  </bpmn:process>
</bpmn:definitions>
`,
  );
  return p;
}

describe("the declared codes and the gateway's branches are ONE fact", () => {
  test("accepts the matching case", async () => {
    const m = await loadProcessModel(branched("a b", ["a", "b"]));
    expect(m.nodes.get("A_T")!.adjudication!.codes).toEqual(["a", "b"]);
  });

  test("REFUSES a branch naming a code the judge does not permit", async () => {
    // Otherwise a recorded outcome could name an answer the process cannot
    // take, and nothing would have said so.
    await expect(loadProcessModel(branched("a b", ["a", "c"]))).rejects.toThrow(
      /must be the same set/,
    );
  });

  test("REFUSES a declared code no branch acts on", async () => {
    await expect(loadProcessModel(branched("a b c", ["a", "b"]))).rejects.toThrow(
      /must be the same set/,
    );
  });

  test("REFUSES a PARTLY coded gateway — it reads as complete", async () => {
    // The dangerous shape: two branches coded, one not. The set comparison
    // alone would pass if the coded ones happened to match.
    await expect(loadProcessModel(branched("a b", ["a", "b", null]))).rejects.toThrow(
      /partly-coded gateway/,
    );
  });

  test("a gateway that codes NOTHING opts out rather than failing", async () => {
    // Inertness. Every gateway in the corpus predates the element, so an
    // all-uncoded gateway must stay legal or the marker could not be adopted
    // one diagram at a time.
    const m = await loadProcessModel(branched("a b", [null, null]));
    expect(m.nodes.get("A_T")!.adjudication!.codes).toEqual(["a", "b"]);
  });

  test("ORDER does not matter — a set, not a sequence", async () => {
    const m = await loadProcessModel(branched("b a", ["a", "b"]));
    expect(m.nodes.get("A_T")!.adjudication).toBeDefined();
  });
});

describe("absence stays absence", () => {
  test("an activity with no marker has no adjudication, and still loads", async () => {
    // Most activities are not judgements. The marker must be opt-in, or every
    // existing diagram would need editing.
    const m = await loadProcessModel(fixture('<folio:skill ref="content-feedback"/>'));
    expect(m.nodes.get("A_T")!.adjudication).toBeUndefined();
  });

  test("the real corpus still loads, adjudication.bpmn included", async () => {
    // adjudication.bpmn now DOES declare the marker — this is what proves the
    // contract expresses the diagram that motivated it, rather than only the
    // fixtures above.
    const { loadProcessModel: load } = await import("../../src/workflow/process-model.js");
    const { readdirSync } = await import("node:fs");
    const dir = join(import.meta.dir, "../../processes");
    const files = readdirSync(dir).filter((f) => f.endsWith(".bpmn"));
    expect(files.length, "no diagrams found — this assertion would be vacuous").toBeGreaterThan(5);
    for (const f of files) await load(join(dir, f));
  });
});

/**
 * A caller and the judge it calls — bean `bvuk`.
 *
 * Two files, because a `callActivity` resolves `calledElement` against the
 * SIBLING diagrams in its own directory, which is the mechanism these check.
 */
function caller(callerExt: string, judgeCodes = "a b"): string {
  const dir = mkdtempSync(join(tmpdir(), "adjudication-call-"));
  writeFileSync(
    join(dir, "child.bpmn"),
    `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:folio="https://litlfred.github.io/folio-assistant/bpmn"
                  targetNamespace="urn:t">
  <bpmn:process id="Process_Child" name="Child" isExecutable="false">
    <bpmn:startEvent id="Start_C" name="Start"/>
    ${
      judgeCodes === ""
        ? '<bpmn:task id="A_C" name="Not a judgement"/>'
        : `<bpmn:task id="A_C" name="Judge"><bpmn:extensionElements>` +
          `<folio:adjudication codes="${judgeCodes}"/>${JUDGE}</bpmn:extensionElements></bpmn:task>`
    }
  </bpmn:process>
</bpmn:definitions>
`,
  );
  const p = join(dir, "parent.bpmn");
  writeFileSync(
    p,
    `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:folio="https://litlfred.github.io/folio-assistant/bpmn"
                  targetNamespace="urn:t">
  <bpmn:process id="Process_Parent" name="Parent" isExecutable="false">
    <bpmn:startEvent id="Start_P" name="Start"/>
    <bpmn:callActivity id="Call_P" name="Ask" calledElement="Process_Child">
      <bpmn:extensionElements>${callerExt}</bpmn:extensionElements>
    </bpmn:callActivity>
  </bpmn:process>
</bpmn:definitions>
`,
  );
  return p;
}

describe("a caller says what it can act on, and it is checked", () => {
  test("accepts the matching case, and the list is on the node", async () => {
    const m = await loadProcessModel(caller('<folio:adjudication accepts="a b"/>'));
    expect(m.nodes.get("Call_P")!.adjudicationAccepts).toEqual(["a", "b"]);
  });

  test("ORDER does not matter — a set, as on the judge side", async () => {
    const m = await loadProcessModel(caller('<folio:adjudication accepts="b a"/>'));
    expect(m.nodes.get("Call_P")!.adjudicationAccepts).toEqual(["b", "a"]);
  });

  test("REFUSES a caller accepting an answer the judge cannot give", async () => {
    await expect(
      loadProcessModel(caller('<folio:adjudication accepts="a c"/>')),
    ).rejects.toThrow(/accepts \(a, c\) but Process_Child's A_C may answer \(a, b\)/);
  });

  test("REFUSES a strict SUBSET — the unaccepted answers still arrive", async () => {
    // Not a subset check by oversight: a caller that handles two of three
    // answers receives the third and does something undefined with it.
    await expect(
      loadProcessModel(caller('<folio:adjudication accepts="a b"/>', "a b c")),
    ).rejects.toThrow(/may answer \(a, b, c\)/);
  });

  test("REFUSES `accepts` on a call into a process that judges nothing", async () => {
    await expect(
      loadProcessModel(caller('<folio:adjudication accepts="a b"/>', "")),
    ).rejects.toThrow(/contains no judgement/);
  });

  test("REFUSES `accepts` anywhere but a call activity", async () => {
    // It states what a CALLER can act on; a plain task calls nothing.
    await expect(
      loadProcessModel(fixture('<folio:adjudication accepts="a b"/>')),
    ).rejects.toThrow(/only meaningful on a call activity/);
  });

  test("REFUSES declaring both `codes` and `accepts` — it cannot be both", async () => {
    await expect(
      loadProcessModel(caller(`<folio:adjudication codes="a b" accepts="a b"/>`)),
    ).rejects.toThrow(/declares both/);
  });

  test("REFUSES a single accepted answer", async () => {
    await expect(
      loadProcessModel(caller('<folio:adjudication accepts="a"/>')),
    ).rejects.toThrow(/names 1 code/);
  });

  test("a caller declaring NOTHING loads — absence is reported, not refused", async () => {
    // Four of the six real callers are in this state and what each should
    // accept is undecided. Refusing here would force a guess that looks
    // checked; `check:workflow-refs` prints them instead.
    const m = await loadProcessModel(caller("<folio:skill ref=\"adjudication\"/>"));
    expect(m.nodes.get("Call_P")!.adjudicationAccepts).toBeUndefined();
    expect(m.children.get("Call_P")).toBeDefined();
  });
});

describe("a misspelled attribute is refused, not ignored", () => {
  test("REFUSES an attribute the engine does not read", async () => {
    // The `folio:bean action="create"` failure, one element over: every one of
    // this element's three attributes has a MEANINGFUL absence, so a typo
    // parses as a deliberate abstention.
    await expect(
      loadProcessModel(caller('<folio:adjudication accept="a b"/>')),
    ).rejects.toThrow(/carries "accept", which the engine does not read/);
  });

  test("REFUSES a judge whose codes are misspelled into nothing", async () => {
    await expect(loadProcessModel(fixture(`<folio:adjudication code="a b"/>${JUDGE}`)))
      .rejects.toThrow(/carries "code"/);
  });
});

describe("the two real callers that fit", () => {
  test("review-narrative and voice-review declare the three, and they match", async () => {
    // The diagram's own claim, now checked: "The three outcomes are the ones
    // `review-narrative` and `voice-review` already use". It was prose in a
    // documentation element and nothing compared it to anything.
    const dir = join(import.meta.dir, "../../processes");
    for (const [f, id] of [
      ["review-narrative.bpmn", "Task_AdjudicateVoice"],
      ["voice-review.bpmn", "Task_Adjudicate"],
    ] as const) {
      const m = await loadProcessModel(join(dir, f));
      expect(m.nodes.get(id)!.adjudicationAccepts, `${f} lost its accepts`).toEqual([
        "stands",
        "scope",
        "dispensation",
      ]);
    }
  });
});
