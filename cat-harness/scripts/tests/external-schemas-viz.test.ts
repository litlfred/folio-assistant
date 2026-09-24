/**
 * The external-schemas viewer — the declared users, and the page a reader gets.
 *
 * Bean `yunp`: `external-schema` was one of the declared kinds with no
 * published viewer, so the navbar listed it disabled and four records — an
 * authority, an edition, namespace IRIs, dependents and operative terms each —
 * were reachable only by opening the JSON.
 *
 * ## What is asserted, and what deliberately is not
 *
 * **Not the prose**, for the reason `methodologies-viz.test.ts` states: a test
 * that pinned the sentences fails every time somebody improves one.
 *
 * **The declared users** (bean `u63y`), read from the users rather than from a
 * hand-written list on the record; `spec-users.test.ts` tests the reader, and
 * this file asserts the page over the real corpus. `loadSpecs` already validates
 * every record and `undeclaredNamespaces` already reconciles the namespaces —
 * both are imported rather than restated, so this file asserts the join and
 * leaves their own tests to them.
 *
 * **The consumer property, over the real registry.** Every row in the summary
 * table links to `#<id>`, and the detail section below must carry that anchor —
 * `pb04`: a link that goes nowhere reads as a broken site. Checked against the
 * committed page as well as the freshly rendered one, so a stale commit fails
 * here rather than in a reader's browser.
 *
 * @module scripts/tests/external-schemas-viz.test
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor } from "../../schemas/cat-harness.js";
import { declaredUsers, page, pageRelPath } from "../gen-external-schemas-viz.js";
import { loadSpecs, namespacesInUse } from "../external-schemas.js";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const REPO = resolve(INSTANCE, "..");

describe("the page a reader gets — over the REAL registry", () => {
  const specs = loadSpecs();
  const used = declaredUsers(specs, REPO);

  it("the registry is found at all — an empty one is not a clean run", () => {
    expect(specs.length).toBeGreaterThan(0);
  });

  it("every specification has a declared user, and no declaration names a missing record", () => {
    // The 36 hand-written entries these replaced covered every record; losing
    // one in the move would read as a spec nothing depends on.
    const declared = new Set(used.uses.map((u) => u.spec));
    expect(specs.map((s) => s.id).filter((id) => !declared.has(id))).toEqual([]);
    expect(used.unknown).toEqual([]);
  });

  it("each declaration form is exercised by the real corpus", () => {
    // A form nothing uses is a reader that could be broken without a test failing.
    expect([...new Set(used.uses.map((u) => u.form))].sort()).toEqual(["front-matter", "kind", "tag", "xmlns"]);
  });

  it("every row's link resolves to an anchor ON THIS PAGE", () => {
    const rendered = page(specs, used, namespacesInUse());
    const committed = readFileSync(join(INSTANCE, siteDirFor(INSTANCE), pageRelPath(REPO)!), "utf-8");
    for (const text of [rendered, committed]) {
      // A target is a kramdown heading id (`### Title {#id}`), the form the
      // generator emits since bean `uknu`. A bare `<a id>` beside the heading
      // collided with kramdown's own slug ("HL7 FHIR" -> `hl7-fhir`, twice).
      const targets = new Set([...text.matchAll(/\{#([^}\s]+)\}/g)].map((m) => m[1]));
      const links = [...text.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]);
      expect(links.length).toBe(specs.length);
      // One element per id: no separate anchor may duplicate a heading's id.
      expect([...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1])).toEqual([]);
      expect(links.filter((l) => !targets.has(l))).toEqual([]);
    }
  });

  it("no cell breaks the table it sits in", () => {
    // `operative` is free prose across 53 terms. An unescaped pipe shifts every
    // column to its right, which renders as a table that is subtly WRONG rather
    // than one that is obviously broken.
    const body = page(specs, used, namespacesInUse()).split("\n");
    const columns = (l: string): number => l.split(/(?<!\\)\|/).length;
    let checked = 0;
    for (let i = 0; i < body.length; i++) {
      if (!body[i]!.startsWith("|") || !body[i + 1]?.startsWith("|---")) continue;
      const want = columns(body[i]!);
      for (let j = i + 2; j < body.length && body[j]!.startsWith("|"); j++) {
        expect({ at: body[j]!.slice(0, 36), columns: columns(body[j]!) }).toEqual({
          at: body[j]!.slice(0, 36),
          columns: want,
        });
        checked += 1;
      }
    }
    // A table scan that found nothing would pass silently — the `dh4f` shape
    // in a test rather than in a report.
    expect(checked).toBeGreaterThan(10);
  });

  it("a spec with NO operative terms says so, rather than showing an empty table", () => {
    // `omg-dd-1.0` conforms without branching on any DD element. That is a
    // determined zero and a different fact from a record nobody filled in.
    const empty = specs.filter((s) => s.terms.length === 0);
    const html = page(specs, used, namespacesInUse());
    if (empty.length > 0) expect(html).toContain("determined zero, not an unfilled field");
    for (const s of empty) expect(html).toContain(s.id);
  });

  it("the page is DECLARED, not composed — and under the docs tree", () => {
    const at = pageRelPath(REPO);
    expect(at).toBeDefined();
    expect(at!.startsWith("..")).toBe(false);
  });
});
