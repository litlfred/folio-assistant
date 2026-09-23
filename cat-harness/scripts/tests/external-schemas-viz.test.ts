/**
 * The external-schemas viewer — the `usedBy` join, and the page a reader gets.
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
 * **The `usedBy` classification**, which is the only judgement on the page and
 * the only thing here that nothing else checks. `loadSpecs` already validates
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
import { classifyUsedBy, page, pageRelPath, usedByRows } from "../gen-external-schemas-viz.js";
import { loadSpecs, namespacesInUse } from "../external-schemas.js";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const REPO = resolve(INSTANCE, "..");

describe("`usedBy` is a blast radius, and it is checked — three states", () => {
  it("a repo-relative path that exists RESOLVES", () => {
    expect(classifyUsedBy("cat-harness/scripts/external-schemas.ts", REPO, INSTANCE).state).toBe(
      "resolves",
    );
  });

  it("an INSTANCE-relative path resolves too — the corpus spells both", () => {
    // Trying one root only would report half the list missing, which is a wrong
    // answer wearing the shape of a finding.
    expect(classifyUsedBy("schemas/namespaces.ts", REPO, INSTANCE).state).toBe("resolves");
  });

  it("a glob is NOT A PATH, and that is not a defect", () => {
    // `omg-dd-1.0` writes `processes/*.bpmn — the BPMNDI layout every diagram
    // carries`: it names a set and then explains it, on purpose. Reporting that
    // as broken teaches a reader to ignore the column.
    expect(classifyUsedBy("processes/*.bpmn", REPO, INSTANCE).state).toBe("not-a-path");
    expect(
      classifyUsedBy("processes/*.bpmn — the BPMNDI layout every diagram carries", REPO, INSTANCE)
        .state,
    ).toBe("not-a-path");
  });

  it("a path spelled as a path and not there is MISSING", () => {
    expect(classifyUsedBy("cat-harness/scripts/gone.ts", REPO, INSTANCE).state).toBe("missing");
  });

  it("missing and not-a-path are different answers — `dh4f`", () => {
    // Collapsing them either way loses a fact: one direction hides the entries
    // that really are broken, the other cries wolf on the deliberate ones.
    const a = classifyUsedBy("cat-harness/scripts/gone.ts", REPO, INSTANCE).state;
    const b = classifyUsedBy("processes/*.bpmn", REPO, INSTANCE).state;
    expect(a).not.toBe(b);
  });
});

describe("the page a reader gets — over the REAL registry", () => {
  const specs = loadSpecs();
  const used = usedByRows(specs, REPO, INSTANCE);

  it("the registry is found at all — an empty one is not a clean run", () => {
    expect(specs.length).toBeGreaterThan(0);
    expect(used.size).toBe(specs.length);
  });

  it("every declared dependent in the corpus resolves or says why not", () => {
    // Not asserted as zero-missing: whether a record may name a path that has
    // gone is the maintainer's call, and a test that failed the build on it
    // would be a gate nobody asked for. What IS asserted is that every entry
    // got a verdict — an unclassified one would render as a blank cell.
    const flat = [...used.values()].flat();
    expect(flat.length).toBeGreaterThan(0);
    for (const r of flat) {
      expect(["resolves", "not-a-path", "missing"]).toContain(r.state);
    }
  });

  it("every row's link resolves to an anchor ON THIS PAGE", () => {
    const rendered = page(specs, used, namespacesInUse());
    const committed = readFileSync(join(INSTANCE, siteDirFor(INSTANCE), pageRelPath(REPO)!), "utf-8");
    for (const text of [rendered, committed]) {
      const targets = new Set([...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]));
      const links = [...text.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]);
      expect(links.length).toBe(specs.length);
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
