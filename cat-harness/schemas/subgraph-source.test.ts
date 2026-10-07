/**
 * A declared subgraph's content source — one union, one resolver (bean `l4ay`).
 *
 * @module schemas/subgraph-source.test
 *
 * The tests of this file that read the whole checkout (resolves every subgraph
 * every instance in the checkout declares) live in
 * `test/subgraph-source-checkout.test.ts` (bean `7zz1`): standing alone,
 * cat-harness has none of it.
 */
import { describe, expect, test } from "bun:test";

import { ContentDirectorySchema } from "./cat-harness";
import { HarnessConfigSchema } from "./harness-config";
import {
  SubgraphSourceSchema,
  contentIsOffCheckout,
  contentSourceJsonLd,
  forgeTreeUrl,
  resolveSubgraphSource,
} from "./subgraph-source";
const ENTRY = { id: "todos", path: "todos/", graphTypologies: ["todos"] };
const BRANCH = { kind: "branch", branch: "cat/cat-harness/todos", keyedBy: "tip" } as const;

describe("the union", () => {
  test("absent is the directory default", () => {
    expect(resolveSubgraphSource(ENTRY)).toEqual({ kind: "directory", id: "todos", path: "todos/", declaredIn: "default" });
  });
  test("a kind the union does not know is refused, not read as a directory", () => {
    expect(SubgraphSourceSchema.safeParse({ kind: "graph-db", endpoint: "x" }).success).toBe(false);
  });
  test("a branch source refuses a refs/ path and a `..`", () => {
    expect(SubgraphSourceSchema.safeParse({ ...BRANCH, branch: "refs/heads/x" }).success).toBe(false);
    expect(SubgraphSourceSchema.safeParse({ ...BRANCH, branch: "a/../b" }).success).toBe(false);
  });
  test("the declaration schema carries `source`", () => {
    const d = ContentDirectorySchema.parse({ ...ENTRY, source: BRANCH }) as { source?: unknown };
    expect(d.source).toEqual(BRANCH);
  });
  test("the instance config carries `subgraphSources`", () => {
    expect(HarnessConfigSchema.parse({ subgraphSources: { todos: BRANCH } }).subgraphSources).toEqual({ todos: BRANCH });
  });
});

describe("precedence — config, then source, then legacy storage, then directory", () => {
  test("the declaration's source", () => {
    const r = resolveSubgraphSource({ ...ENTRY, source: BRANCH });
    expect(r).toMatchObject({ kind: "branch", branch: BRANCH.branch, keyedBy: "tip", declaredIn: "declaration" });
  });
  test("#1764's storage maps to a branch source, and says so", () => {
    const r = resolveSubgraphSource({ ...ENTRY, storage: { branch: BRANCH.branch, keyedBy: "tip" } });
    expect(r).toMatchObject({ kind: "branch", branch: BRANCH.branch, keyedBy: "tip", declaredIn: "storage" });
  });
  test("the config overrides the declaration, matched on id", () => {
    const r = resolveSubgraphSource({ ...ENTRY, source: BRANCH }, { todos: { kind: "directory" } });
    expect(r).toEqual({ kind: "directory", id: "todos", path: "todos/", declaredIn: "config" });
  });
  test("an override for a different id does not apply", () => {
    expect(resolveSubgraphSource(ENTRY, { beans: BRANCH }).declaredIn).toBe("default");
  });
  test("both `source` and `storage` is refused — two answers to one question", () => {
    expect(() => resolveSubgraphSource({ ...ENTRY, source: BRANCH, storage: { branch: "x", keyedBy: "tip" } })).toThrow(/both/);
  });
  test("a qa subgraph keyed by tip is refused (#1937's rule, whichever field says it)", () => {
    expect(() => resolveSubgraphSource({ id: "qa", path: "qa/", graphTypologies: ["qa"], source: { ...BRANCH, branch: "cat/cat-harness/qa-reports" } })).toThrow(/qa/);
  });
});

describe("the presence checks ask one question of either spelling", () => {
  test("a branch source, or a legacy storage, is off the checkout; a directory source or none is not", () => {
    expect(contentIsOffCheckout({ source: BRANCH })).toBe(true);
    expect(contentIsOffCheckout({ storage: { branch: "x", keyedBy: "commit" } })).toBe(true);
    expect(contentIsOffCheckout({ source: { kind: "directory" } })).toBe(false);
    expect(contentIsOffCheckout({})).toBe(false);
  });
});

describe("the JSON-LD form", () => {
  test("a branch on GitHub dereferences to its tree; a directory is a blank node", () => {
    expect(contentSourceJsonLd(resolveSubgraphSource({ ...ENTRY, source: BRANCH }), "litlfred/folio-assistant")).toEqual({
      "@id": "https://github.com/litlfred/folio-assistant/tree/cat/cat-harness/todos",
      kind: "branch",
      branch: BRANCH.branch,
      keyedBy: "tip",
      declaredIn: "declaration",
    });
    expect(contentSourceJsonLd(resolveSubgraphSource(ENTRY), "litlfred/folio-assistant")).toEqual({ kind: "directory", declaredIn: "default" });
  });
  test("an unknown forge gets no @id rather than a guessed one", () => {
    expect(forgeTreeUrl("https://example.org/a/b", "x")).toBeUndefined();
    expect(forgeTreeUrl(undefined, "x")).toBeUndefined();
  });
});

describe("a branch FAMILY (bean lehh)", () => {
  const FAMILY_ENTRY = { id: "ig-ast", path: "ig-ast/", graphTypologies: ["ig-ast"] };
  test("the storage spelling resolves to kind family, never to one branch", () => {
    const r = resolveSubgraphSource(
      { ...FAMILY_ENTRY, storage: { branchPrefix: "cat/fhir-harness/fhir-ast/", keyedBy: "family", keyFrom: "the IG's package id" } },
    );
    expect(r).toMatchObject({ kind: "family", branchPrefix: "cat/fhir-harness/fhir-ast/", keyFrom: "the IG's package id", declaredIn: "storage" });
  });
  test("the source spelling resolves the same way", () => {
    const r = resolveSubgraphSource({ ...FAMILY_ENTRY, source: { kind: "family", branchPrefix: "cat/x/y/", keyFrom: "k" } });
    expect(r).toMatchObject({ kind: "family", declaredIn: "declaration" });
  });
  test("a prefix must end in /, and a family keying names no single branch", () => {
    expect(SubgraphSourceSchema.safeParse({ kind: "family", branchPrefix: "cat/x/y", keyFrom: "k" }).success).toBe(false);
    expect(() => resolveSubgraphSource({ ...FAMILY_ENTRY, storage: { branch: "cat/x/y", keyedBy: "family", keyFrom: "k" } })).toThrow();
  });
  test("a qa subgraph cannot be a family", () => {
    expect(() =>
      resolveSubgraphSource({ id: "qa", path: "test/results/", graphTypologies: ["qa"], source: { kind: "family", branchPrefix: "cat/x/", keyFrom: "k" } }),
    ).toThrow(/qa/);
  });
  test("is off the checkout, and its JSON-LD names the prefix and the key", () => {
    expect(contentIsOffCheckout({ storage: { branchPrefix: "cat/x/", keyedBy: "family", keyFrom: "k" } })).toBe(true);
    const r = resolveSubgraphSource({ ...FAMILY_ENTRY, source: { kind: "family", branchPrefix: "cat/x/", keyFrom: "k" } });
    expect(contentSourceJsonLd(r)).toEqual({ kind: "family", branch: "cat/x/", keyFrom: "k", declaredIn: "declaration" });
  });
});

describe("a branch FAMILY's repository (owner: read remote, or materialise locally)", () => {
  const E = { id: "ig-ast", path: "fhir-ast/", graphTypologies: ["ig-ast"] };
  test("absent means this repository; present names the remote, through both spellings and the JSON-LD", () => {
    const local = resolveSubgraphSource({ ...E, storage: { branchPrefix: "cat/x/", keyedBy: "family", keyFrom: "k" } });
    expect(local.kind === "family" && local.repository).toBe(undefined);
    const remote = resolveSubgraphSource(
      { ...E, storage: { branchPrefix: "cat/x/", keyedBy: "family", keyFrom: "k", repository: "litlfred/smart-trust" } },
    );
    expect(remote).toMatchObject({ kind: "family", repository: "litlfred/smart-trust" });
    expect(contentSourceJsonLd(remote)).toMatchObject({ familyRepository: "litlfred/smart-trust" });
  });
  test("a repository is owner/repo, not a URL", () => {
    expect(SubgraphSourceSchema.safeParse({ kind: "family", branchPrefix: "cat/x/", keyFrom: "k", repository: "https://github.com/a/b" }).success).toBe(false);
  });
});
