/**
 * A call activity whose target is hosted by another instance in the repository
 * resolves as a pass, not unknown.
 *
 * @module scripts/tests/kg-audit-call-activity-parent
 * @covers folio-assistant-t5j5
 */
import { describe, expect, test } from "bun:test";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "../../..");

describe("kg-audit: call-activity-resolves across repository instances (bean `t5j5`)", () => {
  test("a call activity whose target resolves from the parent root is a PASS with hosting instance evidence", async () => {
    const p = Bun.spawn(
      ["bun", "run", "cat-harness/scripts/kg-audit.ts", "--instance", "./folio-assistant-core", "--check", "--json"],
      { cwd: REPO, stdout: "pipe", stderr: "pipe" },
    );
    const out = await new Response(p.stdout).text();
    await p.exited;

    const data = JSON.parse(out);
    const reports = data.reports as { subject: { id: string }; criteria: Record<string, { result: string; findings: { where: string; detail: string }[] }> }[];
    const ingestion = reports.find((r) => r.subject.id === "Process_L1DocumentIngestion");
    expect(ingestion).toBeDefined();

    const car = ingestion!.criteria["call-activity-resolves"];
    expect(car.result).toBe("pass");
    expect(car.findings.length).toBe(2);
    expect(car.findings.some((f) => f.detail === 'calls "Process_Ingestion", hosted by instance "cat-harness".')).toBe(true);
    expect(car.findings.some((f) => f.detail === 'calls "Process_IngestTheme", hosted by instance "cat-harness".')).toBe(true);
  }, 30_000);

  test("a call activity whose targets are all local resolves as a PASS with empty findings", async () => {
    const p = Bun.spawn(
      ["bun", "run", "cat-harness/scripts/kg-audit.ts", "--instance", "./folio-assistant-core", "--check", "--json"],
      { cwd: REPO, stdout: "pipe", stderr: "pipe" },
    );
    const out = await new Response(p.stdout).text();
    await p.exited;

    const data = JSON.parse(out);
    const reports = data.reports as { subject: { id: string }; criteria: Record<string, { result: string; findings: unknown[] }> }[];
    const lifecycle = reports.find((r) => r.subject.id === "Process_Lifecycle");
    expect(lifecycle).toBeDefined();

    const car = lifecycle!.criteria["call-activity-resolves"];
    expect(car.result).toBe("pass");
    expect(car.findings).toEqual([]);
  }, 30_000);

  test("a call activity whose target resolves nowhere is a FAIL naming the missing process", async () => {
    const testBpmn = join(REPO, "folio-assistant-core/processes/test-t5j5-dangling.bpmn");
    const bpmnContent = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             id="Def_TestT5j5Dangling"
             targetNamespace="http://example.org/bpmn">
  <process id="Process_TestT5j5Dangling" name="Test Dangling" isExecutable="true">
    <startEvent id="Start_1"/>
    <sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Call_Dangling"/>
    <callActivity id="Call_Dangling" name="Dangling Step" calledElement="Process_TypoNonExistent999"/>
    <sequenceFlow id="Flow_2" sourceRef="Call_Dangling" targetRef="End_1"/>
    <endEvent id="End_1"/>
  </process>
</definitions>`;

    try {
      writeFileSync(testBpmn, bpmnContent);
      const p = Bun.spawn(
        ["bun", "run", "cat-harness/scripts/kg-audit.ts", "--instance", "./folio-assistant-core", "--check", "--json"],
        { cwd: REPO, stdout: "pipe", stderr: "pipe" },
      );
      const out = await new Response(p.stdout).text();
      await p.exited;

      const data = JSON.parse(out);
      const reports = data.reports as { subject: { id: string }; criteria: Record<string, { result: string; findings: { where: string; detail: string }[] }> }[];
      const rep = reports.find((r) => r.subject.id === "Process_TestT5j5Dangling");
      expect(rep).toBeDefined();

      const car = rep!.criteria["call-activity-resolves"];
      expect(car.result).toBe("fail");
      expect(car.findings.some((f) => f.detail === 'calls "Process_TypoNonExistent999", which is the id of no process this instance or any other instance in the repository can load.')).toBe(true);
    } finally {
      if (existsSync(testBpmn)) rmSync(testBpmn);
    }
  }, 30_000);

  test("a diagram that cannot load leaves criteria as UNKNOWN", async () => {
    const testBpmn = join(REPO, "folio-assistant-core/processes/test-t5j5-malformed.bpmn");
    try {
      writeFileSync(testBpmn, "<not-valid-xml");
      const p = Bun.spawn(
        ["bun", "run", "cat-harness/scripts/kg-audit.ts", "--instance", "./folio-assistant-core", "--check", "--json"],
        { cwd: REPO, stdout: "pipe", stderr: "pipe" },
      );
      const out = await new Response(p.stdout).text();
      await p.exited;

      const data = JSON.parse(out);
      const reports = data.reports as { subject: { id: string }; criteria: Record<string, { result: string }> }[];
      const rep = reports.find((r) => r.subject.id === "test-t5j5-malformed");
      expect(rep).toBeDefined();
      expect(rep!.criteria["call-activity-resolves"].result).toBe("unknown");
    } finally {
      if (existsSync(testBpmn)) rmSync(testBpmn);
    }
  }, 30_000);
});
