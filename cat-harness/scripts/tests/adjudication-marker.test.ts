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

describe("absence stays absence", () => {
  test("an activity with no marker has no adjudication, and still loads", async () => {
    // Most activities are not judgements. The marker must be opt-in, or every
    // existing diagram would need editing.
    const m = await loadProcessModel(fixture('<folio:skill ref="content-feedback"/>'));
    expect(m.nodes.get("A_T")!.adjudication).toBeUndefined();
  });

  test("the real corpus still loads — nothing existing declares one yet", async () => {
    // Inertness, checked rather than asserted. If this ever fails, a diagram
    // has taken up the marker and its refusals now apply to it.
    const { loadProcessModel: load } = await import("../../src/workflow/process-model.js");
    const { readdirSync } = await import("node:fs");
    const dir = join(import.meta.dir, "../../processes");
    const files = readdirSync(dir).filter((f) => f.endsWith(".bpmn"));
    expect(files.length, "no diagrams found — this assertion would be vacuous").toBeGreaterThan(5);
    for (const f of files) await load(join(dir, f));
  });
});
