import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readQaRecords } from "../../cat-harness-tools/scripts/kg-qa-report.ts";
import { fhirQaMarkdown, readFhirQa, renderQaPage } from "./ig-qa-page.ts";

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

const MANIFEST = {
  generatedAt: "2026-11-05T17:28:37Z",
  authority: "cache",
  provisional: ["indices", "versions"],
  provisionalUntil: "a full IG Publisher run",
  toolchain: { publisher: "3.0.0", core: "7.0.1" },
  resources: [{}, {}],
};

describe("ig-qa-page", () => {
  test("fhirQaSummaryFromAst", () => {
    const ast = dirWith({ "qa.json": JSON.stringify({ errs: 3, warnings: 7, hints: 0, tool: "2.0.15", version: "5.0.0", date: "Wed, 05 Nov 2026" }), "manifest.json": JSON.stringify(MANIFEST) });
    const md = fhirQaMarkdown(readFhirQa(ast), { up: "" }).join("\n");
    expect(md).toContain("(IG Publisher 2.0.15, FHIR 5.0.0, on Wed, 05 Nov 2026)");
    expect(md).toContain("| errors | 3 |");
    expect(md).toContain("| hints | 0 |");
    expect(md).not.toContain("suppressed");
    expect(md).toContain("(assets/fhir-qa/qa.json)");
    expect(md).toContain("| generated | `2026-11-05T17:28:37Z` |");
    expect(md).toContain("| provisional | `indices`, `versions`, until a full IG Publisher run |");
  });

  test("fhirQaWithoutSummarySaysSo", () => {
    const ast = dirWith({ "manifest.json": JSON.stringify(MANIFEST) });
    const validity = join(dirWith({ "v.json": JSON.stringify({ verdict: "stale", detail: { verdict: "stale", why: "the inputs changed" }, recorded: { inputDigest: "a" }, current: { inputDigest: "b" } }) }), "v.json");
    const md = fhirQaMarkdown(readFhirQa(ast, validity)).join("\n");
    expect(md).toContain("holds no Publisher QA summary");
    expect(md).not.toContain("| errors |");
    expect(md).toContain("**Validity for this checkout:** `stale`. the inputs changed");
    expect(md).toContain("| inputDigest | `a` | `b` |");
  });

  test("pageRawHalvesKgRecords", () => {
    const d = dirWith({ "swim.qa-results.json": JSON.stringify(RECORD) });
    const page = renderQaPage({ title: "QA Report", fhir: {}, kg: { view: "en/h/qa/", instances: [{ instance: "an-ig", dirs: [d], records: readQaRecords([d]), page: "en/h/qa/an-ig/" }] } });
    expect(page.startsWith("---\ntitle: \"QA Report\"\nnav_exclude: true\n")).toBe(true);
    expect(page).toContain("{% raw %}");
    expect(page.indexOf("## FHIR QA")).toBeLessThan(page.indexOf("## Knowledge-graph QA"));
    expect(page).toContain("[Every instance's QA](en/h/qa/)");
    expect(page).toContain("2 finding(s), written by `x/check.ts`");
    expect(page).toContain("(assets/kg-qa/an-ig/swim.qa-results.json)");
    expect(page).toContain("a lane with \\| a pipe");
    expect(page).toContain("| B | {{ not liquid }} |");
    expect(page.trimEnd().endsWith("{% endraw %}")).toBe(true);
  });
});
