/**
 * An unmarked process leaves activity-log capture undetermined — pinned on
 * folio-assistant-sci's `authoring-a-paper.bpmn`, moved here from
 * `cat-harness/scripts/tests/log-writer.test.ts` (bean `ho66`): the diagram is
 * this instance's, so standing alone cat-harness has none to read.
 *
 * Bean `folio-assistant-7uff`.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { workflowFile } from "../../../cat-harness-tools/scripts/known-skills.js";
import { loadProcessModel } from "../../../cat-harness-tools/src/workflow/process-model.ts";
import { writeLogEntry } from "../../../cat-harness-tools/src/logging/log-writer.ts";
import { writeDeclaration } from "../../../cat-harness-tools/test/support/instance-fixture.js";

/** An instance whose declaration names a trashcan, so there is somewhere to log. */
function instance(): string {
  const root = mkdtempSync(join(tmpdir(), "log-writer-"));
  const directories = [{ id: "fsh-guts", path: "fsh-guts/", description: "trashcan", graphTypologies: ["fsh-guts"] }];
  for (const d of directories) mkdirSync(join(root, d.path), { recursive: true });
  writeDeclaration(root, JSON.stringify({ name: "t", stub: "t", directories }, null, 2));
  return root;
}

describe("the process says whether running it is logged", () => {
  // Diagrams by NAME through the declared `processes` graphs (placement PR3, bean `63wl`).
  const diagram = (name: string): string => workflowFile(join(import.meta.dir, "../.."), name);

  test("an unmarked process leaves capture UNDETERMINED, not off", async () => {
    // The whole reason the field is three-valued. `undefined` here resolves
    // to `unknown` in the writer — nobody decided — which is a different
    // claim from a process that declared `off`.
    const m = await loadProcessModel(diagram("authoring-a-paper.bpmn"));
    expect(m.logCapture).toBeUndefined();
    expect(writeLogEntry(instance(), { event: "message", summary: "x" }, m.logCapture).capture)
      .toBe("unknown");
  });
});
