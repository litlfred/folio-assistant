/**
 * `subgraph-readmes` — one README per declared directory, from the declaration.
 *
 * @module scripts/tests/subgraph-readmes
 * @graphNode none — a test
 *
 * The writer's behaviour is tested on fixtures beside it, in
 * `bootstrap-tools/scripts/subgraph-readmes.test.ts`. Here: the harness's
 * side — the real tree, resolved with this harness's Extensions, and the
 * consumer-side question whether every link a generated README carries
 * resolves. Planning writes nothing.
 */
import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { BEGIN, END } from "../../../bootstrap-tools/scripts/subgraph-readmes.ts";
import { harnessPlan } from "../subgraph-readmes.ts";
import { isDirectoryReadme } from "../../schemas/kg-node.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");

test("a directory README is never a node, at any depth, and nothing else is", () => {
  expect(isDirectoryReadme("README.md")).toBe(true);
  expect(isDirectoryReadme("todos/README.md")).toBe(true);
  expect(isDirectoryReadme("todos/README.md.bak")).toBe(false);
  expect(isDirectoryReadme("todos/NOT-README.md")).toBe(false);
});

test("over the real tree, every link in every generated README resolves", async () => {
  const p = await harnessPlan(REPO);
  const broken: string[] = [];
  for (const [file, text] of p.writes) {
    const region = text.slice(text.indexOf(BEGIN), text.indexOf(END));
    for (const m of region.matchAll(/\]\(([^)]+)\)/g)) {
      const l = m[1]!;
      if (/^[a-z]+:/.test(l) || l.startsWith("#")) continue;
      if (!existsSync(join(dirname(file), l.split("#")[0]!))) broken.push(`${file}: ${l}`);
    }
  }
  expect(broken).toEqual([]);
}, 120_000);
