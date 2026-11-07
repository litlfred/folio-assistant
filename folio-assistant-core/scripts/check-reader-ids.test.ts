/**
 * check-reader-ids — machine ids shown to the reader in DTH prose (Q-IDS-1 A).
 */
import { describe, expect, it } from "bun:test";

import { ALLOW_MARKER, scan } from "./check-reader-ids";

const kinds = (md: string) => scan(md).map((f) => `${f.kind} ${f.text}`);

describe("check-reader-ids", () => {
  it("passes a linked title, whatever the link target holds", () => {
    expect(kinds("See [Health worker](#pers:health-worker) and [the process](processes/BP-01.bpmn).")).toEqual([]);
  });
  it("flags a block label written out", () => {
    expect(kinds("The persona pers:health-worker uses freq:FR-ID-01.")).toEqual([
      "label pers:health-worker",
      "label freq:FR-ID-01",
    ]);
  });
  it("flags BPMN and DMN ids, paths and hit policies", () => {
    expect(kinds("Lane `Lane_BP01_Dev` runs Rule_DT02_01 from decisions/DT-02.dmn (hit policy FIRST).")).toEqual([
      "model-id Lane_BP01_Dev",
      "model-id Rule_DT02_01",
      "path decisions/DT-02.dmn",
      "tool-note hit policy",
    ]);
  });
  it("leaves requirement and role codes, which tables show as data", () => {
    expect(kinds("| FR-ID-01 | HRH-R-3 | `active` |")).toEqual([]);
  });
  it("does not read a URL scheme or a time as a label", () => {
    expect(kinds("Visit https://who.int at 10:30.")).toEqual([]);
  });
  it("skips a block marked as documenting the model", () => {
    expect(kinds(`${ALLOW_MARKER}\nTask_1 is the first step.`)).toEqual([]);
  });
  it("reports the line", () => {
    expect(scan("ok\nsee pers:x", "a.md")).toEqual([{ file: "a.md", line: 2, kind: "label", text: "pers:x" }]);
  });
  it("ignores single-line and multiline HTML comments while keeping line numbers", () => {
    expect(scan("<!-- pers:hidden -->\n<!--\nTask_1_Hidden\n-->\nsee pers:visible", "a.md")).toEqual([
      { file: "a.md", line: 5, kind: "label", text: "pers:visible" },
    ]);
  });
});
