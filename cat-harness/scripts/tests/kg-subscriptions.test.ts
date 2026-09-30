/**
 * `subscriptions` (issue #1719, epic bean `fnx4`): an external Knowledge Graph
 * this instance CONSUMES, and which of its parts it chose to hold. The schema
 * holds the choice and the pin; state lives on each part's materialisation
 * record. These pin the shapes that would blur that.
 */
import { describe, expect, test } from "bun:test";

import { CatHarnessDeclarationSchema } from "../../schemas/cat-harness.ts";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const WHO_IRIS = {
  id: "who-iris",
  repository: "litlfred/who-iris",
  ref: SHA,
  subgraphs: ["catalogue"],
  assets: { policy: "on-demand" },
  harnesses: ["who-iris"],
};

function decl(over: Record<string, unknown> = {}): unknown {
  return { name: "example", directories: [], remoteGraphs: [], ...over };
}
function failedPaths(value: unknown): string[] {
  const r = CatHarnessDeclarationSchema.safeParse(value);
  return r.success ? [] : r.error.issues.map((i) => i.path.join(".")).sort();
}

describe("subscriptions: the schema", () => {
  test("absent is legal, and stays absent (not defaulted to [])", () => {
    const r = CatHarnessDeclarationSchema.safeParse(decl());
    expect(r.success).toBe(true);
    expect(r.success && r.data.subscriptions).toBeUndefined();
  });

  test("a well-formed entry parses", () => {
    expect(failedPaths(decl({ subscriptions: [WHO_IRIS] }))).toEqual([]);
  });

  test("the minimum is id + repository + ref: choosing nothing is a legal subscription (all referenced)", () => {
    expect(failedPaths(decl({ subscriptions: [{ id: "ihris", repository: "litlfred/ihris", ref: SHA }] }))).toEqual([]);
  });

  test("`ref` must be a FULL SHA — a branch, a tag or an abbreviation is refused", () => {
    for (const ref of ["main", "v1.0.0", SHA.slice(0, 11), SHA.toUpperCase()]) {
      expect(failedPaths(decl({ subscriptions: [{ ...WHO_IRIS, ref }] }))).toEqual(["subscriptions.0.ref"]);
    }
  });

  test("`repository` is owner/repo, not a URL", () => {
    expect(failedPaths(decl({ subscriptions: [{ ...WHO_IRIS, repository: "https://github.com/litlfred/who-iris" }] }))).toEqual([
      "subscriptions.0.repository",
    ]);
  });

  test("an unknown key is refused (strict): a misspelt `subgraph` must not vanish", () => {
    expect(failedPaths(decl({ subscriptions: [{ ...WHO_IRIS, subgraph: ["x"] }] }))).toEqual(["subscriptions.0"]);
  });

  test("an unknown asset policy is refused", () => {
    expect(failedPaths(decl({ subscriptions: [{ ...WHO_IRIS, assets: { policy: "some" } }] }))).toEqual([
      "subscriptions.0.assets.policy",
    ]);
  });

  test("a subgraph or harness chosen twice is refused", () => {
    expect(failedPaths(decl({ subscriptions: [{ ...WHO_IRIS, subgraphs: ["a", "a"] }] }))).toEqual(["subscriptions.0.subgraphs"]);
    expect(failedPaths(decl({ subscriptions: [{ ...WHO_IRIS, harnesses: ["h", "h"] }] }))).toEqual(["subscriptions.0.harnesses"]);
  });

  test("the same id twice is refused", () => {
    expect(failedPaths(decl({ subscriptions: [WHO_IRIS, WHO_IRIS] }))).toEqual(["subscriptions"]);
  });

  test("an id also in `needs` is refused: a subscription is consumed part by part, not loaded", () => {
    expect(failedPaths(decl({ needs: ["who-iris"], subscriptions: [WHO_IRIS] }))).toEqual(["subscriptions.0.id"]);
  });

  test("an id also in `associatedHarnesses` is refused: one relation per remote thing", () => {
    const associated = { name: "who-iris", url: "https://litlfred.github.io/who-iris/" };
    expect(failedPaths(decl({ associatedHarnesses: [associated], subscriptions: [WHO_IRIS] }))).toEqual(["subscriptions.0.id"]);
  });
});
