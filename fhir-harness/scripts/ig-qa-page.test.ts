import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readQaRecords, renderQaPage } from "./ig-qa-page.ts";

function dirWith(files: Record<string, string>): string {
  const d = mkdtempSync(join(tmpdir(), "ig-qa-"));
  for (const [f, s] of Object.entries(files)) writeFileSync(join(d, f), s);
  return d;
}

const RECORD = {
  $schema: "qa-results/v1",
  producer: { script: "x/check.ts" },
  subject: { kind: "fhir-ig", id: "an-ig" },
  families: {
    "lane-gap": { summary: "a lane with | a pipe", count: 2, entries: [{ persona: "A" }, { persona: "B", note: "{{ not liquid }}" }] },
    clean: { summary: "nothing", count: 0, entries: [] },
  },
  total: 2,
};

describe("ig-qa-page", () => {
  test("reads qa-results/v1 and reports anything else as unreadable, never drops it", () => {
    const d = dirWith({
      "good.qa-results.json": JSON.stringify(RECORD),
      "other.qa-results.json": JSON.stringify({ $schema: "something/v2" }),
      "broken.qa-results.json": "{",
      "ignored.json": "{}",
    });
    const rs = readQaRecords([d]);
    expect(rs.map((r) => r.file.split("/").pop())).toEqual(["broken.qa-results.json", "good.qa-results.json", "other.qa-results.json"]);
    expect(rs.filter((r) => r.unreadable).length).toBe(2);
  });

  test("renders families, entries and the record link inside raw", () => {
    const d = dirWith({ "swim.qa-results.json": JSON.stringify(RECORD) });
    const page = renderQaPage(readQaRecords([d]), "Quality checks");
    expect(page).toContain("{% raw %}");
    expect(page).toContain("**2 finding(s).**");
    expect(page).toContain("(assets/ig-qa/swim.qa-results.json)");
    expect(page).toContain("a lane with \\| a pipe");
    expect(page).toContain("| persona | note |");
    expect(page).toContain("| B | {{ not liquid }} |");
    expect(page).not.toContain("### `clean`");
  });

  test("says so when the directory holds no record", () => {
    expect(renderQaPage([], "QA")).toContain("no check has written a record");
  });
});
