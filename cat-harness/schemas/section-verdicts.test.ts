import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { SECTION_VERDICTS_FILE, specimenSections } from "./section-verdicts";

describe("section verdicts (bean fnqn)", () => {
  test("an absent file is an empty answer", () => {
    expect(specimenSections(mkdtempSync(join(tmpdir(), "sv-")))).toEqual(new Set());
  });
  test("a present file that does not validate THROWS — never 'nothing is a specimen'", () => {
    const d = mkdtempSync(join(tmpdir(), "sv-"));
    writeFileSync(join(d, SECTION_VERDICTS_FILE), JSON.stringify({ $schema: "folio-section-verdicts/v1", verdicts: { e: { s: { role: "decorative" } } } }));
    expect(() => specimenSections(d)).toThrow();
  });
  test("the committed who-iris verdicts load, and name six WPRO pages", () => {
    const s = specimenSections(resolve(import.meta.dir, "../../who-iris/library"));
    expect(s.size).toBe(6);
    for (const p of ["014", "015", "028", "029", "030", "031"]) expect(s.has(`wpr-rdo-2020-003-eng/page-${p}`)).toBe(true);
    // pp. 20-22 were proposed and rejected: real guidance beside the samples
    for (const p of ["020", "021", "022"]) expect(s.has(`wpr-rdo-2020-003-eng/page-${p}`)).toBe(false);
  });
});
