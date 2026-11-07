/**
 * Which IGs get their own site is DATA: an instance's menu.json records the
 * repository and commit its menu was read from (bean `bamf`).
 */

import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeDeclaration } from "../../cat-harness-tools/test/support/instance-fixture";
import { igsToBuild, igSiteAt, servedPathsFor } from "./stage-ig-sites";

let repo: string;
const menu = (source?: object) => JSON.stringify({ $schema: "folio-ig-menu/v1", groups: [], ...(source ? { source } : {}) });

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), "stage-ig-"));
  for (const [name, m] of [
    ["with-source", menu({ kind: "sushi-config", of: "https://example.org/ig.git", ref: "abc123" })],
    ["no-source", menu()],
  ] as const) {
    mkdirSync(join(repo, name, "fhir-artifact-index"), { recursive: true });
    writeFileSync(join(repo, name, "fhir-artifact-index", "menu.json"), m);
    writeDeclaration(join(repo, name), { name, directories: [] });
  }
  // An instance that declares its source in its instance declaration (bean `bamf`)
  mkdirSync(join(repo, "declared-source", "fhir-artifact-index"), { recursive: true });
  writeFileSync(join(repo, "declared-source", "fhir-artifact-index", "menu.json"), menu());
  writeDeclaration(join(repo, "declared-source"), {
    name: "declared-source",
    source: { kind: "git", repository: "https://example.org/declared-ig.git", ref: "def456" },
    directories: [],
  });

  mkdirSync(join(repo, "no-menu"), { recursive: true });
  writeDeclaration(join(repo, "no-menu"), { name: "no-menu", directories: [] });
});
afterAll(() => rmSync(repo, { recursive: true, force: true }));

test("an instance whose declaration records a git source is built from that declared source", () => {
  const { build } = igsToBuild(repo);
  const declared = build.find((b) => b.instance === "declared-source");
  expect(declared).toBeDefined();
  expect(declared?.repo).toBe("https://example.org/declared-ig.git");
  expect(declared?.ref).toBe("def456");
});

test("an instance whose menu records a sushi-config source is built, from that commit", () => {
  const { build } = igsToBuild(repo);
  const withSource = build.find((b) => b.instance === "with-source");
  expect(withSource).toBeDefined();
  expect(withSource?.repo).toBe("https://example.org/ig.git");
  expect(withSource?.ref).toBe("abc123");
});

test("a menu with no source is skipped AND reported; no menu at all is simply not an IG", () => {
  const { skipped } = igsToBuild(repo);
  expect(skipped).toEqual(["no-source: neither the instance declaration nor menu.json records a source repository and commit"]);
});

test("an igSite instance reserves each served directory's path, so its IG's input/images copy does not take that route", () => {
  const root = join(repo, "served-ig");
  mkdirSync(join(root, "docs"), { recursive: true });
  writeDeclaration(root, {
    name: "served-ig",
    directories: [
      { id: "served-ig-docs", path: "docs/", graphTypologies: ["docs"], igSite: true },
      { id: "served-ig-openapi", path: "openapi/", graphTypologies: ["openapi"], served: true },
      { id: "served-ig-notes", path: "notes/", graphTypologies: ["docs"] },
    ],
  });
  expect(servedPathsFor(root)).toEqual([{ prefix: "openapi/", by: "served directory served-ig-openapi" }]);
});

test("a served directory the checkout holds reserves each of its files, not the whole route", () => {
  const root = join(repo, "served-files");
  mkdirSync(join(root, "docs"), { recursive: true });
  mkdirSync(join(root, "openapi", "sub"), { recursive: true });
  writeFileSync(join(root, "openapi", "api.openapi.json"), "{}");
  writeFileSync(join(root, "openapi", "sub", "op.json"), "{}");
  writeDeclaration(root, {
    name: "served-files",
    directories: [
      { id: "served-files-docs", path: "docs/", graphTypologies: ["docs"], igSite: true },
      { id: "served-files-openapi", path: "openapi/", graphTypologies: ["openapi"], served: true },
    ],
  });
  expect(servedPathsFor(root)).toEqual([
    { prefix: "openapi/api.openapi.json", by: "served directory served-files-openapi" },
    { prefix: "openapi/sub/op.json", by: "served directory served-files-openapi" },
  ]);
});

test("an IG site at /<instance>/ig/ reserves nothing: no served route can meet it", () => {
  const root = join(repo, "served-no-igsite");
  mkdirSync(root, { recursive: true });
  writeDeclaration(root, {
    name: "served-no-igsite",
    directories: [
      { id: "served-no-igsite-docs", path: "docs/", graphTypologies: ["docs"] },
      { id: "served-no-igsite-openapi", path: "openapi/", graphTypologies: ["openapi"], served: true },
    ],
  });
  expect(igSiteAt(root)).toBe("ig");
  expect(servedPathsFor(root)).toEqual([]);
});

// folio-assistant#2738: smart-immunizations declares no docs, so nothing else
// answers /<instance>/. Its IG was staged under an `/ig` base but composed at
// the instance root, and every menu link was dead.
test("an instance with no pages of its own gets its IG at /<instance>/, and reserves its served routes", () => {
  const root = join(repo, "served-no-docs");
  mkdirSync(root, { recursive: true });
  writeDeclaration(root, {
    name: "served-no-docs",
    directories: [{ id: "served-no-docs-openapi", path: "openapi/", graphTypologies: ["openapi"], served: true }],
  });
  expect(igSiteAt(root)).toBe(".");
  expect(servedPathsFor(root)).toEqual([{ prefix: "openapi/", by: "served directory served-no-docs-openapi" }]);
});
