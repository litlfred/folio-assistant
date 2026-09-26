/**
 * `export-json` must export a folio that has no bibliography.
 *
 * `references` and `referenceMap` are Proxies over an injected registry, so
 * *touching* either throws when a folio has not configured one. `export-json`
 * touched both — once per chapter for the bibliography, and once for the
 * paper-level `references` field, which is assembled last. So the export did
 * all its work and then died on the final field, on any folio without a
 * bibliography. `folio_init` scaffolds none, and a new folio has no references
 * yet, so that is the normal case rather than an edge one.
 *
 * `validate.ts` already had the right shape: ask `referenceRegistryConfigured()`
 * rather than catch, so "this folio has no bibliography" stays distinguishable
 * from "the lookup failed".
 */
import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

const SRC = join(import.meta.dir, "../../content/pipeline/export-json.ts");

describe("export-json guards every registry touch", () => {
  const src = readFileSync(SRC, "utf-8");

  test("asks whether a registry is configured rather than catching", () => {
    expect(src).toContain("referenceRegistryConfigured");
    // A try/catch around the Proxy would also "work" and would lose the
    // distinction the predicate exists to preserve.
    expect(src).not.toMatch(/catch[\s\S]{0,80}referenceMap/);
  });

  test("the paper-level `references` field is guarded", () => {
    expect(src).toMatch(/references:\s*referenceRegistryConfigured\(\)\s*\?\s*references\s*:\s*\[\]/);
  });

  test("the per-chapter bibliography is guarded too", () => {
    // Both touches matter: guarding only the field that threw first would move
    // the crash to the other one on any folio whose blocks carry `cites[]`.
    const bibBlock = src.slice(src.indexOf("const bibliography"), src.indexOf("chapters.push"));
    expect(bibBlock).toContain("referenceRegistryConfigured()");
    expect(bibBlock).toContain("referenceMap.get");
  });

  test("says so in the output rather than exporting an empty list silently", () => {
    expect(src).toContain("no reference registry configured");
    expect(src).toContain("cites[] were NOT resolved");
  });
});
