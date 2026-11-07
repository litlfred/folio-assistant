/**
 * The untainted round-trip report (bean folio-assistant-ktt2) is derived from
 * the agents' rulings and the catalogues as they are now. The rulings are
 * judgements and live in the `attestations` graph
 * (`test/attestations/translation-qa/`, owner 2026-11-03, bean
 * folio-assistant-7mwa); the report is derived and is published to the
 * qa-reports store, not committed. These tests keep the joins it relies on.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { buildReport, parsePo, readRoundtrip } from "../translation-roundtrip-report.ts";

const INSTANCE = join(import.meta.dir, "..", "..");
const LOCALES = ["ar", "es", "fr", "ru", "zh"];
const CATALOGUES = ["site/iris-site.po", "glossary/who-iris--who-terms.po"];

describe("translation round-trip report", () => {
  test("buildsFromAttestations", () => {
    const r = buildReport() as { $schema: string; totals: Record<string, Record<string, number>> };
    expect(r.$schema).toBe("qa-results/v1");
    expect(Object.keys(r.totals).sort()).toEqual(LOCALES);
  });

  test("backTranslatorsUseReadWriteOnly", () => {
    for (const [locale, f] of Object.entries(buildReport().families as Record<string, { summary: string }>)) {
      expect(f.summary, locale).toContain("Back-translator tools: Read,Write.");
    }
  });

  test("parsePoJoinsLinesSkipsHeader", () => {
    const po = 'msgid ""\nmsgstr ""\n"Language: fr\\n"\n\n#. note\nmsgid "a "\n"b"\nmsgstr "c"\n';
    expect(parsePo(po, "x.po")).toEqual([{ catalogue: "x.po", msgid: "a b", msgstr: "c" }]);
  });
});

describe("the agents' rulings are attestations", () => {
  test("attestationPerCatalogueAndLocale", () => {
    for (const locale of LOCALES) {
      for (const cat of CATALOGUES) {
        const path = join(INSTANCE, "test", "attestations", "translation-qa", `${cat}.${locale}.attestations.json`);
        expect(existsSync(path), path).toBe(true);
        const file = JSON.parse(readFileSync(path, "utf-8"));
        expect(file.$schema).toBe("qa-attestations/v1");
        expect(file.family).toBe("translation-qa");
        expect(file.locale).toBe(locale);
        expect(file.subject).toEqual({ kind: "translation-catalogue", id: cat, path: `translations/${locale}/${cat}` });
        const strings = parsePo(readFileSync(join(INSTANCE, "translations", locale, cat), "utf-8"), cat);
        const { run, entries } = readRoundtrip(cat, locale);
        expect(entries.map((e) => e.index)).toEqual(strings.map((_, i) => i));
        // A script entry is derived and may not sit in the attestation store.
        for (const e of [run, ...entries]) expect((e as { reviewer?: { kind?: string } }).reviewer?.kind).toBe("agent");
        expect(run.back_translation_trailer.TOOLS_USED).toBe("Read,Write");
      }
    }
  });

  test("derivedReportNotCommitted", () => {
    const tracked = Bun.spawnSync(["git", "ls-files", "test/results"], { cwd: INSTANCE }).stdout.toString().trim();
    expect(tracked).toBe("");
  });
});
