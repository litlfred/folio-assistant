/**
 * The EARLY licence verdict (bean 7bg9): read from the upload alone, three
 * outcomes, and undetermined is never reported as cleared.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { earlyLicence } from "../ingest-document.ts";

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});
function upload(files: Record<string, string> = {}): string {
  const d = mkdtempSync(join(tmpdir(), "7bg9-"));
  made.push(d);
  writeFileSync(join(d, "doc.pdf"), "%PDF-1.4");
  for (const [f, text] of Object.entries(files)) writeFileSync(join(d, f), text);
  return join(d, "doc.pdf");
}
const intake = (licence?: unknown) =>
  JSON.stringify({
    $schema: "folio-intake/v1",
    doc_id: "doc",
    title: "A test document",
    source: { upstream: "https://example.org/doc", capturedAt: "2026-09-30T00:00:00Z", capturedBy: "test" },
    files: [],
    ...(licence === undefined ? {} : { licence }),
  });

describe("earlyLicence (bean 7bg9)", () => {
  test("a stated licence in intake.json is reported with its basis", () => {
    const v = earlyLicence(upload({ "intake.json": intake({ status: "stated", id: "CC-BY-4.0", basis: "the PDF's copyright page" }) }));
    expect(v.verdict).toBe("stated");
    expect(v.detail).toContain("CC-BY-4.0");
  });
  test("unknown — somebody looked — is reported as unknown, not cleared", () => {
    const v = earlyLicence(upload({ "intake.json": intake({ status: "unknown", searched: [{ where: "publisher page", result: "no licence stated" }] }) }));
    expect(v.verdict).toBe("unknown");
  });
  test("nothing recorded is UNDETERMINED, never stated", () => {
    expect(earlyLicence(upload()).verdict).toBe("undetermined");
    expect(earlyLicence(upload({ "intake.json": intake() })).verdict).toBe("undetermined");
  });
  test("a LICENSE file beside the upload is named, but a person states it — still undetermined", () => {
    const v = earlyLicence(upload({ LICENSE: "MIT License" }));
    expect(v.verdict).toBe("undetermined");
    expect(v.detail).toContain("LICENSE");
  });
  test("a malformed licence record is not read as 'no licence' — it says it could not validate", () => {
    const v = earlyLicence(upload({ "intake.json": intake({ status: "stated", id: "CC-BY-4.0" }) }));
    expect(v.verdict).toBe("undetermined");
    expect(v.detail).toContain("does not validate");
  });
});
