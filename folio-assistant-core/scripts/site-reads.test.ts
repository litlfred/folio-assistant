/**
 * What each document-site builder says it reads (bean `ehh6`). smart-ra#26's
 * second run declared `beans/` and `todos/`: the site renders todos and never
 * beans, so the builders, not the declaration, are asked.
 */
import { afterAll, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { siteReads as nodeKindPages } from "../../cat-harness/scripts/gen-node-kind-pages.ts";
import { siteReads as documentSite } from "./build-document-site.ts";
import { siteReads as publicCommentSite } from "./public-comment-site.ts";

const R = mkdtempSync(join(tmpdir(), "site-reads-"));
afterAll(() => rmSync(R, { recursive: true, force: true }));
for (const d of ["folio/doc", "review/public-comment", "todos/items", "beans"]) mkdirSync(join(R, d), { recursive: true });
writeFileSync(
  join(R, "x.json"),
  JSON.stringify({
    name: "x",
    directories: [
      { id: "folio", path: "folio/", graphTypologies: ["folio"] },
      { id: "public-comments", path: "review/public-comment/", graphTypologies: ["todo-items", "public-comments"] },
      { id: "todos", path: "todos/", graphTypologies: ["todo-items"] },
      { id: "beans", path: "beans/", graphTypologies: ["bean-defs"] },
    ],
  }),
);

test("build-document-site reads the folio", () => {
  expect(documentSite(R, ["--out", "_site"])).toEqual(["folio"]);
});

test("public-comment-site reads the comment store, or the one --store names, and the folio", () => {
  expect(publicCommentSite(R, ["--out", "_site"])).toEqual(["review/public-comment", "folio"]);
  expect(publicCommentSite(R, ["--store", "other/store"])).toEqual(["other/store", "folio"]);
});

test("gen-node-kind-pages reads the directories of the typologies holding a kind it renders: todos, never beans", async () => {
  const got = await nodeKindPages(R, ["--root", "."]);
  expect(got).toContain("todos");
  expect(got).toContain("review/public-comment");
  expect(got.some((d) => d.startsWith("beans"))).toBe(false);
});
