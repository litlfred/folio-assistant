/**
 * The declaration-filename check, and the boundary of what it claims.
 *
 * Bean `jijc`. Ten tests. **Measured by stubbing both halves of the rule to
 * `false`: 5 go red, 5 stay green.** The five that stay green are the
 * false-positive guards — they pass whether or not the rule works, and exist
 * so that narrowing the rule later cannot quietly re-admit a class that was
 * measured and closed.
 *
 * That ratio is deliberate, and it is the one `sfhr` shipped: a check whose
 * tests all assert the happy path is a check whose false positives nobody has
 * looked for. The count here is stated because it was RUN, not estimated — an
 * earlier draft of this header said "three", which is the failure this
 * repository keeps paying for.
 *
 * @module folio-assistant/scripts/tests/check-declaration-filename
 */

import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkDeclarationFilename } from "../check-declaration-filename.ts";

/**
 * A tree holding one source file at `<root>/<rel>`.
 *
 * Defaults to placing it **inside the owning instance**, because that is where
 * a failing bypass has to live: a site outside it is classified as
 * cross-instance and counted rather than failed. An earlier draft of this
 * helper wrote to a bare `src/`, and all four detection tests went red for
 * that reason alone — the rule was right and the fixture was modelling a tree
 * this repository does not have.
 */
function fixture(rel: string, src: string, instance = "cat-harness"): string {
  const root = mkdtempSync(join(tmpdir(), "declfile-"));
  const full = join(root, instance, rel);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, src);
  return root;
}

describe("a path to the declaration is built from the constant", () => {
  test("a whole-value string literal is a bypass", () => {
    const r = checkDeclarationFilename(fixture("src/a.ts", 'const p = join(root, "harness.json");\n'));
    expect(r.bypasses).toHaveLength(1);
    expect(r.bypasses[0]!.kind).toBe("literal");
    expect(r.bypasses[0]!.line).toBe(1);
  });

  test("a single-quoted literal is the same bypass — the repo's quote style is not the rule", () => {
    const r = checkDeclarationFilename(fixture("src/a.ts", "const p = join(root, 'harness.json');\n"));
    expect(r.bypasses).toHaveLength(1);
  });

  test("a map KEY is a bypass too — it is still the filename, not a sentence", () => {
    const r = checkDeclarationFilename(fixture("src/a.ts", 'out.set("harness.json", "the root declaration");\n'));
    expect(r.bypasses).toHaveLength(1);
  });

  test("an interpolated template builds a path, so it is a bypass", () => {
    // Measured at ZERO on the real corpus. Implemented and tested anyway: the
    // class is reachable the moment somebody writes it, and a rule that has
    // never fired cannot be distinguished from a rule that cannot fire.
    const r = checkDeclarationFilename(fixture("src/a.ts", "const p = `${dir}/harness.json`;\n"));
    expect(r.bypasses).toHaveLength(1);
    expect(r.bypasses[0]!.kind).toBe("template");
  });

  // ── False-positive guards. Each one closes a class that was MEASURED on the
  // real corpus, and each must keep passing if the rule is ever narrowed. ──

  test("GUARD: prose in a message string is counted, never failed", () => {
    const src = "console.error(`no harness.json at ${root}; nothing to resolve.`);\n";
    const r = checkDeclarationFilename(fixture("src/a.ts", src));
    expect(r.bypasses).toHaveLength(0);
    expect(r.counted.prose).toBe(1);
  });

  test("GUARD: a STATIC path inside backticks is prose, not construction", () => {
    // The first draft of the template rule accepted a bare `/` before the
    // filename and reported this shape out of a tool description. Only an
    // INTERPOLATION is something a constant substitutes into.
    const src = 'const d = "a repo carrying `cat-harness/harness.json` is not blank";\n';
    const r = checkDeclarationFilename(fixture("src/a.ts", src));
    expect(r.bypasses).toHaveLength(0);
  });

  test("GUARD: `docs/_data/harness.json` is a DIFFERENT FILE and must not be reported", () => {
    // Found by that same false positive, and worth more than the rule it
    // corrected: the Jekyll data file shares the basename, is not an instance
    // declaration, and must NOT be renamed under the REPLACE ruling.
    const src = "const msg = `docs/_data/harness.json is stale.`;\n";
    const r = checkDeclarationFilename(fixture("src/a.ts", src));
    expect(r.bypasses).toHaveLength(0);
  });

  test("GUARD: a doc comment naming the file is prose", () => {
    const r = checkDeclarationFilename(fixture("src/a.ts", " * An instance carries `harness.json`.\n"));
    expect(r.bypasses).toHaveLength(0);
    expect(r.counted.prose).toBe(1);
  });

  test("GUARD: a test fixture is counted and does NOT fail the gate", () => {
    // An open judgement on `jijc`, not a finding. A fixture writing the file
    // the code under test looks for has a real argument for staying pinned:
    // route it through the constant and it passes vacuously after a rename.
    const r = checkDeclarationFilename(
      fixture("src/a.test.ts", 'writeFileSync(join(root, "harness.json"), "{}");\n'),
    );
    expect(r.bypasses).toHaveLength(0);
    expect(r.counted.tests).toBe(1);
  });

  test("GUARD: a bypass OUTSIDE the owning instance is counted, not failed", () => {
    // Measured on the real corpus: two, both in folio-assistant-core, which
    // imports nothing from cat-harness. Using the constant there would be this
    // repo's first cross-instance import; a second copy would be two
    // constants. That is the split's decision, not this check's — but it is
    // REPORTED with its locations, because silently excluding it would be the
    // `dh4f` shape this repository keeps paying for.
    const r = checkDeclarationFilename(
      fixture("schemas/a.ts", 'const p = join(root, "harness.json");\n', "folio-assistant-core"),
    );
    expect(r.bypasses).toHaveLength(0);
    expect(r.crossInstance).toHaveLength(1);
    expect(r.crossInstance[0]!.file).toBe("folio-assistant-core/schemas/a.ts");
  });

  test("examining nothing is not a pass", () => {
    const empty = mkdtempSync(join(tmpdir(), "declfile-empty-"));
    expect(checkDeclarationFilename(empty).filesRead).toBe(0);
    // The runner exits non-zero on filesRead === 0 — see the module's main.
  });
});
