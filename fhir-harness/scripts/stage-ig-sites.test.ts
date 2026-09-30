/**
 * Which IGs get their own site is DATA: an instance's menu.json records the
 * repository and commit its menu was read from (bean `bamf`).
 */

import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeDeclaration } from "../../cat-harness/test/support/instance-fixture";
import { igsToBuild } from "./stage-ig-sites";

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
  mkdirSync(join(repo, "no-menu"), { recursive: true });
  writeDeclaration(join(repo, "no-menu"), { name: "no-menu", directories: [] });
});
afterAll(() => rmSync(repo, { recursive: true, force: true }));

test("an instance whose menu records a sushi-config source is built, from that commit", () => {
  const { build } = igsToBuild(repo);
  expect(build.map(({ instance, repo: r, ref }) => ({ instance, r, ref }))).toEqual([
    { instance: "with-source", r: "https://example.org/ig.git", ref: "abc123" },
  ]);
});

test("a menu with no source is skipped AND reported; no menu at all is simply not an IG", () => {
  const { skipped } = igsToBuild(repo);
  expect(skipped).toEqual(["no-source: menu.json records no sushi-config source repository and commit"]);
});
