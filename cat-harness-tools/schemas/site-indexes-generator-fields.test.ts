/**
 * Fields cat-harness-tools' generators write into two site indexes, which these
 * strict schemas did not know: the translation drawer's `files` and
 * `officiality` (bean `cat-tools-bbnd`), and the schema page's `sources`
 * (bean `folio-assistant-1nu0`). Each failed `check:kind-validators` once the
 * built-at-publish pages were validated (folio-assistant#2611).
 */
import { describe, expect, test } from "bun:test";
import { SchemaGraphIndexSchema, TranslationStatusSchema } from "./ui/site-indexes.ts";

const counts = { entries: 4, translated: 3, fuzzy: 0, untranslated: 1 };

const status = (locale: Record<string, unknown>) => ({
  $schema: "folio-translation-status/v1",
  changedAt: "2026-10-20",
  scope: "translations",
  locales: [{ locale: "fr", templates: 2, catalogues: 1, ...counts, unreadable: [], ...locale }],
});

describe("folio-translation-status/v1 carries the drawer's fields", () => {
  test("per-catalogue rows and officiality parse", () => {
    const r = TranslationStatusSchema.safeParse(
      status({
        files: [{ path: "site/x.po", official: "no", ...counts }],
        officiality: { state: "unofficial", officialCatalogues: 0, findings: 0 },
      }),
    );
    expect(r.error?.issues ?? []).toEqual([]);
  });

  test("the status page the drawer links parses", () => {
    const r = TranslationStatusSchema.safeParse({ ...status({}), page: "en/cat-harness/translation-status/index.md" });
    expect(r.error?.issues ?? []).toEqual([]);
  });

  test("an index written before the fields existed still parses", () => {
    expect(TranslationStatusSchema.safeParse(status({})).success).toBe(true);
  });

  test("an officiality state outside the four is refused", () => {
    const r = TranslationStatusSchema.safeParse(
      status({ officiality: { state: "signed", officialCatalogues: 0, findings: 0 } }),
    );
    expect(r.success).toBe(false);
  });
});

describe("folio-schema-graph/v1 carries the source-descriptor rows", () => {
  const index = (extra: Record<string, unknown>) => ({
    $schema: "folio-schema-graph/v1",
    roots: [],
    modules: [],
    decls: [],
    edges: [],
    ...extra,
  });

  test("a row with every optional field parses", () => {
    const r = SchemaGraphIndexSchema.safeParse(
      index({
        sources: [
          {
            id: "iris",
            file: "who-iris/sources/iris.json",
            instance: "who-iris",
            title: "WHO IRIS",
            identifiers: [{ name: "handle", authoritative: true, example: "10665/1" }],
            enumeration: { method: "oai-pmh", pageSize: 100 },
            character: { remote: true, large: true, volatility: "low", availability: "high", hasOwnSearch: true },
          },
        ],
      }),
    );
    expect(r.error?.issues ?? []).toEqual([]);
  });

  test("an unknown key on a row is still refused", () => {
    const r = SchemaGraphIndexSchema.safeParse(index({ sources: [{ id: "a", file: "f", instance: "i", extra: 1 }] }));
    expect(r.success).toBe(false);
  });
});
