#!/usr/bin/env bun
/**
 * The node-kind index, written or checked — issue #2195, PR 1.
 *
 * @module scripts/check-node-kinds
 * @covers cat-harness, typologies — it resolves every declared family's validator and records which are node kinds
 *
 *   bun run node-kinds                       write cat-harness/docs/_data/node-kinds.json
 *   bun run node-kinds:check                 fail on a stale index, a NEW unkinded family, or an id collision
 *   bun run node-kinds --accept-unkinded     write, admitting new unkinded families to the baseline
 *
 * ## The index is derived; the baseline is not
 *
 * `kinds` is recomputed from the typologies every run (`nodeKindIndex`), so a
 * stale copy is only ever a regenerate. `unkinded` is different: it is the
 * list of families that predate node kinds, and the owner asked for a *"QA
 * check on new kinds"*. So a family that is unkinded NOW but was not in the
 * committed list is refused by BOTH modes — the writer will not quietly add it
 * to the baseline, which would make regenerating the fix for the very finding
 * the gate exists to raise. `--accept-unkinded` is the deliberate override, and
 * a reviewer sees it as a growing list in the diff.
 *
 * The baseline only shrinks on its own: a family that becomes a node kind
 * leaves the list at the next write, and `--check` fails until it is written,
 * so the improvement is recorded rather than lost.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { defaultGraphTypologies } from "../../cat-harness/schemas/cat-harness.js";
import { newUnkinded, nodeKindIndex, unkindedKey, type NodeKindIndex } from "../../cat-harness/schemas/node-kind-index.js";
import { HARNESS_ROOT, REPO_ROOT } from "./lib/roots.ts";

const repoRoot = REPO_ROOT ?? join(HARNESS_ROOT, "..");
export const INDEX_PATH = join(HARNESS_ROOT, "docs", "_data", "node-kinds.json");

/** What is committed: the index, under a schema tag a reader can check. */
export interface NodeKindIndexFile extends NodeKindIndex {
  $schema: "node-kind-index/1.0.0";
}

export function render(index: NodeKindIndex): string {
  const file: NodeKindIndexFile = { $schema: "node-kind-index/1.0.0", ...index };
  return JSON.stringify(file, null, 2) + "\n";
}

function committed(): NodeKindIndexFile | undefined {
  if (!existsSync(INDEX_PATH)) return undefined;
  try {
    return JSON.parse(readFileSync(INDEX_PATH, "utf-8")) as NodeKindIndexFile;
  } catch {
    return undefined;
  }
}

async function main(): Promise<number> {
  const check = process.argv.includes("--check");
  const accept = process.argv.includes("--accept-unkinded");
  const index = await nodeKindIndex(defaultGraphTypologies, HARNESS_ROOT, repoRoot);
  const prior = committed();
  const at = relative(repoRoot, INDEX_PATH);
  let failed = false;

  console.log(`${index.kinds.length} node kind(s) found through the typologies; ${index.unkinded.length} famil(ies) not yet a node kind`);
  for (const k of index.kinds) {
    const tree = [k.parents.length ? `extends ${k.parents.join(", ")}` : "", k.subclasses.length ? `subclasses ${k.subclasses.join(", ")}` : ""].filter(Boolean).join("; ");
    console.log(`  ✓ ${k.id}${k.declaredBy ? ` (${k.declaredBy})` : " (ancestor only)"}${tree ? ` — ${tree}` : ""}`);
  }

  for (const id of index.collisions) {
    console.log(`  ✗ two different node kinds are both named \`${id}\``);
    failed = true;
  }

  // Without a committed file there is no baseline to compare against: the
  // first write establishes it, which is the one time accepting is implied.
  const fresh = prior === undefined ? [] : newUnkinded(index, prior);
  if (fresh.length > 0 && !accept) {
    console.log(`\n✗ ${fresh.length} NEW famil(ies) with no node kind — declare a nodeKind() and point the family's validator node at it:`);
    for (const k of fresh) console.log(`    ${k}`);
    console.log(`  (or, deliberately, \`bun run node-kinds --accept-unkinded\` to baseline it)`);
    failed = true;
  }

  const want = render(index);
  if (check) {
    if (prior === undefined || readFileSync(INDEX_PATH, "utf-8") !== want) {
      const gone = prior ? prior.unkinded.length - index.unkinded.filter((u) => !fresh.includes(unkindedKey(u))).length : 0;
      console.log(`\n✗ ${at} is stale${gone > 0 ? ` — ${gone} baselined famil(ies) became node kinds` : ""}. Run \`bun run node-kinds\` and commit.`);
      failed = true;
    }
    if (!failed) console.log(`\n✓ ${at} is current, no new family is unkinded, and no id collides.`);
    return failed ? 1 : 0;
  }

  if (failed) return 1;
  mkdirSync(dirname(INDEX_PATH), { recursive: true });
  writeFileSync(INDEX_PATH, want);
  console.log(`\nwrote ${at}`);
  return 0;
}

if (import.meta.main) process.exit(await main());
